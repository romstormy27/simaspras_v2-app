#!/usr/bin/env node
/**
 * SIMASPRAS - Politeknik Imigrasi dan Pemasyarakatan Indonesia
 * Skrip Pemeliharaan Terjadwal (cPanel Cron Jobs)
 * FASE 10: TASK-10.3
 * 
 * Fungsi Utama:
 * 1. Membersihkan / membatalkan otomatis pengajuan sarpras (status: 'Diajukan') yang waktu mulainya telah lewat
 * 2. Mengidentifikasi transaksi peminjaman aktif H-1 sebelum tanggal selesai untuk notifikasi pengembalian
 * 3. Menghasilkan ringkasan kesehatan status transaksi dan aset
 * 
 * Penggunaan via CLI / cPanel Cron:
 *   node scripts/cron-maintenance.js
 *   node scripts/cron-maintenance.js --dry-run
 */

const fs = require('fs');
const path = require('path');

// Muat variabel lingkungan dari .env jika belum dimuat oleh shell
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const isDryRun = process.argv.includes('--dry-run');

async function runMaintenance() {
  const startTime = new Date();
  console.log('======================================================================');
  console.log(`[SIMASPRAS CRON] Memulai Pemeliharaan Sistem: ${startTime.toISOString()}`);
  if (isDryRun) {
    console.log('[SIMASPRAS CRON] MODE DRY-RUN: Tidak ada perubahan data yang disimpan.');
  }
  console.log('======================================================================');

  let expiredCancelledCount = 0;
  let reminderCount = 0;

  try {
    // 1. CARI & BATALKAN PENGAJUAN KADALUARSA (Expired Pending Requests)
    // Pengajuan masih 'Pending', tetapi tgl_mulai telah lewat
    const now = new Date();
    const expiredPending = await prisma.peminjaman.findMany({
      where: {
        status_transaksi: 'Pending',
        tgl_mulai: {
          lt: now,
        },
      },
      include: {
        sarpras: { select: { nama_sarpras: true, kode_aset: true } },
        pemohon: { select: { nama_lengkap: true, email: true } },
      },
    });

    console.log(`[1] Pemeriksaan Pengajuan Kadaluarsa: Ditemukan ${expiredPending.length} transaksi.`);

    for (const item of expiredPending) {
      console.log(`  -> Membatalkan transaksi kadaluarsa: ${item.kode_transaksi} (${item.sarpras.nama_sarpras}) - Pemohon: ${item.pemohon.nama_lengkap}`);
      
      if (!isDryRun) {
        await prisma.$transaction(async (tx) => {
          await tx.peminjaman.update({
            where: { id_peminjaman: item.id_peminjaman },
            data: {
              status_transaksi: 'Ditolak',
            },
          });

          await tx.auditLog.create({
            data: {
              id_user: item.id_pemohon,
              aktivitas: `CRON: Pembatalan otomatis sistem karena jadwal mulai (${item.tgl_mulai.toISOString()}) telah lewat.`,
              ip_address: '127.0.0.1 (cron)',
            },
          });

          await tx.notifikasi.create({
            data: {
              id_user: item.id_pemohon,
              judul: `Peminjaman Dibatalkan Otomatis: ${item.kode_transaksi}`,
              pesan: `Pengajuan peminjaman untuk fasilitas ${item.sarpras.nama_sarpras} telah dibatalkan otomatis oleh sistem karena jadwal mulai telah terlewati tanpa verifikasi lengkap.`,
              tipe: 'Peringatan',
              tautan: '/peminjaman/riwayat',
            },
          });
        });
      }
      expiredCancelledCount++;
    }

    // 2. PEMERIKSAAN JADWAL H-1 PENGEMBALIAN (Reminder H-1)
    // Transaksi status 'Disetujui', di mana tgl_selesai berada di rentang 24 s/d 48 jam ke depan
    const h1Start = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const h1End = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const upcomingReturns = await prisma.peminjaman.findMany({
      where: {
        status_transaksi: 'Disetujui',
        tgl_selesai: {
          gte: h1Start,
          lte: h1End,
        },
      },
      include: {
        sarpras: { select: { nama_sarpras: true, lokasi_plat: true } },
        pemohon: { select: { nama_lengkap: true, email: true } },
      },
    });

    console.log(`[2] Pemeriksaan Pengingat H-1 Selesai: Ditemukan ${upcomingReturns.length} transaksi.`);
    for (const ret of upcomingReturns) {
      console.log(`  -> Pengingat H-1: ${ret.kode_transaksi} | ${ret.sarpras.nama_sarpras} | Pemohon: ${ret.pemohon.nama_lengkap} (${ret.pemohon.email}) | Selesai: ${ret.tgl_selesai.toISOString()}`);
      reminderCount++;
    }

    // 3. STATISTIK SISTEM REAL-TIME
    const totalSarpras = await prisma.sarpras.count();
    const totalUsers = await prisma.user.count();
    const totalActiveBookings = await prisma.peminjaman.count({
      where: { status_transaksi: 'Disetujui' },
    });
    const totalPendingApproval = await prisma.peminjaman.count({
      where: { status_transaksi: 'Pending' },
    });

    console.log('\n----------------------------------------------------------------------');
    console.log('RINGKASAN STATUS SIMASPRAS SAAT INI:');
    console.log(` - Total Sarpras Terdaftar    : ${totalSarpras}`);
    console.log(` - Total Pengguna Terdaftar   : ${totalUsers}`);
    console.log(` - Peminjaman Aktif/Disetujui : ${totalActiveBookings}`);
    console.log(` - Antrean Menunggu Kasubag   : ${totalPendingApproval}`);
    console.log(` - Transaksi Kadaluarsa Dibatalkan : ${expiredCancelledCount}`);
    console.log(` - Transaksi Siap Diingatkan (H-1) : ${reminderCount}`);
    console.log('----------------------------------------------------------------------');

    const duration = Date.now() - startTime.getTime();
    console.log(`[SIMASPRAS CRON] Pemeliharaan selesai sukses dalam ${duration}ms.\n`);

    return {
      success: true,
      timestamp: startTime.toISOString(),
      durationMs: duration,
      expiredCancelledCount,
      reminderCount,
      stats: {
        totalSarpras,
        totalUsers,
        totalActiveBookings,
        totalPendingApproval,
      },
    };
  } catch (error) {
    console.error('[SIMASPRAS CRON ERROR] Gagal menjalankan pemeliharaan:', error);
    process.exitCode = 1;
    return {
      success: false,
      error: error.message,
    };
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runMaintenance()
    .then(() => {
      process.exit(process.exitCode || 0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runMaintenance };
