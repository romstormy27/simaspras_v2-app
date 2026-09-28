import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET/POST /api/cron/maintenance
 * Proteksi: Header Authorization Bearer <CRON_SECRET>
 * Membantu eksekusi cron maintenance dari cPanel Web Cron / External HTTP trigger
 */
export async function GET(req: NextRequest) {
  return handleCronMaintenance(req);
}

export async function POST(req: NextRequest) {
  return handleCronMaintenance(req);
}

async function handleCronMaintenance(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'simaspras-cron-secret-2026';

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Invalid CRON_SECRET token' },
      { status: 401 }
    );
  }

  const startTime = new Date();
  let expiredCancelledCount = 0;
  let reminderCount = 0;

  try {
    const now = new Date();

    // 1. Batalkan pengajuan pending yang tgl_mulai telah lewat
    const expiredPending = await prisma.peminjaman.findMany({
      where: {
        status_transaksi: 'Pending',
        tgl_mulai: { lt: now },
      },
      include: {
        sarpras: { select: { nama_sarpras: true } },
        pemohon: { select: { nama_lengkap: true } },
      },
    });

    for (const item of expiredPending) {
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
            ip_address: '127.0.0.1 (web-cron)',
          },
        });
      });
      expiredCancelledCount++;
    }

    // 2. Transaksi H-1
    const h1Start = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const h1End = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const upcomingReturns = await prisma.peminjaman.findMany({
      where: {
        status_transaksi: 'Disetujui',
        tgl_selesai: { gte: h1Start, lte: h1End },
      },
    });
    reminderCount = upcomingReturns.length;

    // 3. Ringkasan
    const [totalSarpras, totalUsers, totalActive, totalPending] = await Promise.all([
      prisma.sarpras.count(),
      prisma.user.count(),
      prisma.peminjaman.count({ where: { status_transaksi: 'Disetujui' } }),
      prisma.peminjaman.count({ where: { status_transaksi: 'Pending' } }),
    ]);

    const durationMs = Date.now() - startTime.getTime();

    return NextResponse.json({
      success: true,
      message: 'Pemeliharaan sistem terjadwal berhasil dieksekusi.',
      timestamp: startTime.toISOString(),
      durationMs,
      expiredCancelledCount,
      reminderCount,
      stats: {
        totalSarpras,
        totalUsers,
        totalActiveBookings: totalActive,
        totalPendingApproval: totalPending,
      },
    });
  } catch (error: any) {
    console.error('[API CRON ERROR]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
