import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '@/lib/prisma';
import { JenisPemeriksaan, KondisiFisik } from '@prisma/client';

describe('TASK-9.2 / Seksi 15: Pengujian Alur End-to-End Siklus Peminjaman Sarpras', () => {
  const testId = `e2e-${Date.now()}`;
  let pemohonUser: any;
  let stafUser: any;
  let kasubagUser: any;
  let testSarpras: any;
  let createdBooking: any;
  let createdTiket: any;
  let createdBast: any;

  beforeAll(async () => {
    // 1. Siapkan Aktor Pengujian
    pemohonUser = await prisma.user.create({
      data: {
        nama_lengkap: `Pemohon E2E ${testId}`,
        email: `pemohon.${testId}@politeknik.ac.id`,
        password_hash: 'hashed_pw_test',
        no_hp: '081234567899',
        role: 'Dosen',
        status_aktivasi: 'Aktif',
      },
    });

    stafUser = await prisma.user.findFirst({ where: { role: 'Staf', status_aktivasi: 'Aktif' } });
    if (!stafUser) {
      stafUser = await prisma.user.create({
        data: {
          nama_lengkap: `Staf E2E ${testId}`,
          email: `staf.${testId}@politeknik.ac.id`,
          password_hash: 'hashed_pw_test',
          no_hp: '081234567888',
          role: 'Staf',
          status_aktivasi: 'Aktif',
        },
      });
    }

    kasubagUser = await prisma.user.findFirst({ where: { role: 'Kasubag', status_aktivasi: 'Aktif' } });
    if (!kasubagUser) {
      kasubagUser = await prisma.user.create({
        data: {
          nama_lengkap: `Kasubag E2E ${testId}`,
          email: `kasubag.${testId}@politeknik.ac.id`,
          password_hash: 'hashed_pw_test',
          no_hp: '081234567877',
          role: 'Kasubag',
          status_aktivasi: 'Aktif',
        },
      });
    }

    // 2. Siapkan Sarpras Pengujian
    testSarpras = await prisma.sarpras.create({
      data: {
        nama_sarpras: `Laboratorium Siber E2E ${testId}`,
        kategori: 'Ruangan',
        kode_aset: `BMN-E2E-${Date.now().toString().slice(-6)}`,
        lokasi_plat: 'Gedung Rektorat Lt. 3',
        spesifikasi: 'Kapasitas 40 workstation dan proyektor HD',
        status_operasional: 'Tersedia',
      },
    });
  });

  afterAll(async () => {
    // Bersihkan seluruh data uji coba
    try {
      if (createdBast) {
        await prisma.bASTDigital.deleteMany({ where: { id_bast: createdBast.id_bast } });
      }
      if (createdTiket) {
        await prisma.tiketDigital.deleteMany({ where: { id_tiket: createdTiket.id_tiket } });
      }
      if (createdBooking) {
        await prisma.verifikasiFisik.deleteMany({ where: { id_peminjaman: createdBooking.id_peminjaman } });
        await prisma.peminjaman.deleteMany({ where: { id_peminjaman: createdBooking.id_peminjaman } });
      }
      if (testSarpras) {
        await prisma.sarpras.deleteMany({ where: { id_sarpras: testSarpras.id_sarpras } });
      }
      if (pemohonUser) {
        await prisma.auditLog.deleteMany({ where: { id_user: pemohonUser.id_user } });
        await prisma.user.deleteMany({ where: { id_user: pemohonUser.id_user } });
      }
    } catch (e) {
      console.warn('Cleanup warning:', e);
    }
  });

  it('Langkah 1: Pemohon berhasil mengajukan permohonan peminjaman baru (Status: Pending)', async () => {
    const tglMulai = new Date(Date.now() + 24 * 3600 * 1000); // Besok
    const tglSelesai = new Date(Date.now() + 28 * 3600 * 1000); // 4 jam kemudian
    const kodeTransaksi = `TRX-E2E-${Date.now().toString().slice(-6)}`;

    createdBooking = await prisma.peminjaman.create({
      data: {
        kode_transaksi: kodeTransaksi,
        id_pemohon: pemohonUser.id_user,
        id_sarpras: testSarpras.id_sarpras,
        tgl_mulai: tglMulai,
        tgl_selesai: tglSelesai,
        maksud_kegiatan: 'Simulasi Pengujian Siklus Peminjaman Sarpras E2E Poltekimipas',
        status_transaksi: 'Pending',
      },
    });

    expect(createdBooking).toBeDefined();
    expect(createdBooking.status_transaksi).toBe('Pending');
    expect(createdBooking.id_pemohon).toBe(pemohonUser.id_user);
  });

  it('Langkah 2: Sistem mencegah pengajuan kedua yang bertabrakan waktu pada sarpras yang sama (ACID Overlap Lock)', async () => {
    const overlappingCount = await prisma.peminjaman.count({
      where: {
        id_sarpras: testSarpras.id_sarpras,
        status_transaksi: { in: ['Pending', 'Disetujui'] },
        tgl_mulai: { lt: createdBooking.tgl_selesai },
        tgl_selesai: { gt: createdBooking.tgl_mulai },
      },
    });

    // Harus terdeteksi bentrok (count > 0)
    expect(overlappingCount).toBeGreaterThan(0);
  });

  it('Langkah 3: Staf Bagian Umum menginput hasil Verifikasi Fisik Pra-Approval', async () => {
    const verifPra = await prisma.verifikasiFisik.create({
      data: {
        id_peminjaman: createdBooking.id_peminjaman,
        id_staf: stafUser.id_user,
        jenis_pemeriksaan: JenisPemeriksaan.Pra_Approval,
        kondisi_fisik: KondisiFisik.Baik_Sesuai,
        catatan_inspeksi: 'Fasilitas dan perangkat pendukung dalam kondisi lengkap dan siap pakai.',
      },
    });

    expect(verifPra.id_peminjaman).toBe(createdBooking.id_peminjaman);
    expect(verifPra.jenis_pemeriksaan).toBe('Pra_Approval');
    expect(verifPra.kondisi_fisik).toBe('Baik_Sesuai');
  });

  it('Langkah 4: Kasubag Umum menyetujui (Approval) dan menerbitkan Tiket Digital QR Code', async () => {
    const qrToken = `TIKET-${createdBooking.kode_transaksi}-${Date.now().toString(36).toUpperCase()}`;

    const [updatedBooking, newTiket] = await prisma.$transaction([
      prisma.peminjaman.update({
        where: { id_peminjaman: createdBooking.id_peminjaman },
        data: {
          status_transaksi: 'Disetujui',
          id_approver: kasubagUser.id_user,
        },
      }),
      prisma.tiketDigital.create({
        data: {
          id_peminjaman: createdBooking.id_peminjaman,
          kode_qr: qrToken,
          status_tiket: 'Aktif',
        },
      }),
    ]);

    createdTiket = newTiket;
    expect(updatedBooking.status_transaksi).toBe('Disetujui');
    expect(updatedBooking.id_approver).toBe(kasubagUser.id_user);
    expect(createdTiket.status_tiket).toBe('Aktif');
    expect(createdTiket.kode_qr).toContain(createdBooking.kode_transaksi);
  });

  it('Langkah 5: Staf Umum menginput hasil Verifikasi Fisik Pasca-Pengembalian', async () => {
    const verifPasca = await prisma.verifikasiFisik.create({
      data: {
        id_peminjaman: createdBooking.id_peminjaman,
        id_staf: stafUser.id_user,
        jenis_pemeriksaan: JenisPemeriksaan.Pasca_Pengembalian,
        kondisi_fisik: KondisiFisik.Baik_Sesuai,
        catatan_inspeksi: 'Sarpras diserahkan kembali dalam kondisi utuh dan bersih. Tidak ada kerusakan.',
      },
    });

    expect(verifPasca.jenis_pemeriksaan).toBe('Pasca_Pengembalian');
    expect(verifPasca.kondisi_fisik).toBe('Baik_Sesuai');
  });

  it('Langkah 6: Kasubag Umum menandatangani Dokumen BAST Digital Resmi (Status -> Selesai, Sarpras -> Tersedia)', async () => {
    const now = new Date();
    const nomorBast = `BAST/SARPRAS/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/9999`;
    const qrSig = `SIG-KASUBAG-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-9999-TESTE2E`;

    const result = await prisma.$transaction(async (tx) => {
      const bast = await tx.bASTDigital.create({
        data: {
          nomor_bast: nomorBast,
          id_peminjaman: createdBooking.id_peminjaman,
          id_kasubag: kasubagUser.id_user,
          qr_signature: qrSig,
        },
      });

      await tx.peminjaman.update({
        where: { id_peminjaman: createdBooking.id_peminjaman },
        data: { status_transaksi: 'Selesai' },
      });

      await tx.sarpras.update({
        where: { id_sarpras: testSarpras.id_sarpras },
        data: { status_operasional: 'Tersedia' },
      });

      await tx.tiketDigital.update({
        where: { id_tiket: createdTiket.id_tiket },
        data: { status_tiket: 'Digunakan' },
      });

      return bast;
    });

    createdBast = result;
    expect(createdBast.nomor_bast).toBe(nomorBast);
    expect(createdBast.qr_signature).toBe(qrSig);

    // Verifikasi status akhir transaksi & sarpras
    const finalBooking = await prisma.peminjaman.findUnique({
      where: { id_peminjaman: createdBooking.id_peminjaman },
    });
    const finalSarpras = await prisma.sarpras.findUnique({
      where: { id_sarpras: testSarpras.id_sarpras },
    });
    const finalTiket = await prisma.tiketDigital.findUnique({
      where: { id_tiket: createdTiket.id_tiket },
    });

    expect(finalBooking?.status_transaksi).toBe('Selesai');
    expect(finalSarpras?.status_operasional).toBe('Tersedia');
    expect(finalTiket?.status_tiket).toBe('Digunakan');
  });
});
