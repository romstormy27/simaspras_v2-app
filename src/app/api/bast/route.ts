import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NotificationService } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Harap login terlebih dahulu' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q')?.trim() || '';

    // If pemohon, only show their own BASTs
    const isPemohon = ['Dosen', 'Taruna', 'BPSDM', 'Kementerian', 'Alumni'].includes(session.role);

    const bastList = await prisma.bASTDigital.findMany({
      where: {
        AND: [
          isPemohon ? { peminjaman: { id_pemohon: session.id_user } } : {},
          search
            ? {
                OR: [
                  { nomor_bast: { contains: search } },
                  { peminjaman: { kode_transaksi: { contains: search } } },
                  { peminjaman: { sarpras: { nama_sarpras: { contains: search } } } },
                  { peminjaman: { pemohon: { nama_lengkap: { contains: search } } } },
                ],
              }
            : {},
        ],
      },
      include: {
        kasubag: {
          select: {
            id_user: true,
            nama_lengkap: true,
            email: true,
            role: true,
          },
        },
        peminjaman: {
          include: {
            sarpras: true,
            pemohon: {
              select: {
                id_user: true,
                nama_lengkap: true,
                email: true,
                no_hp: true,
                role: true,
                pemohon_detail: true,
              },
            },
            verifikasi_fisik: {
              include: {
                staf: {
                  select: {
                    nama_lengkap: true,
                    email: true,
                  },
                },
              },
              orderBy: { created_at: 'desc' },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: bastList,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengambil data BAST Digital';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Harap login terlebih dahulu' }, { status: 401 });
    }

    // Only Kasubag and Admin can issue BAST
    if (session.role !== 'Kasubag' && session.role !== 'Admin') {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Hanya Kasubag Umum yang berwenang menandatangani BAST Digital.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id_peminjaman, catatan_penutupan } = body;

    if (!id_peminjaman) {
      return NextResponse.json(
        { success: false, message: 'ID transaksi peminjaman wajib disertakan' },
        { status: 400 }
      );
    }

    // 1. Fetch booking with current relations
    const booking = await prisma.peminjaman.findUnique({
      where: { id_peminjaman },
      include: {
        sarpras: true,
        pemohon: true,
        tiket_digital: true,
        verifikasi_fisik: {
          orderBy: { created_at: 'desc' },
        },
        bast_digital: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Transaksi peminjaman tidak ditemukan' },
        { status: 404 }
      );
    }

    if (booking.bast_digital) {
      return NextResponse.json(
        {
          success: false,
          message: `Dokumen BAST Digital telah terbit sebelumnya (${booking.bast_digital.nomor_bast}).`,
        },
        { status: 400 }
      );
    }

    if (booking.status_transaksi !== 'Disetujui') {
      return NextResponse.json(
        {
          success: false,
          message: `Hanya transaksi berstatus 'Disetujui' yang dapat diterbitkan BAST (status saat ini: ${booking.status_transaksi}).`,
        },
        { status: 400 }
      );
    }

    // 2. Business Rule: Pasca-Pengembalian inspection by Staf is required (PRD UC-07 / TASK-6.1)
    const hasReturnInspection = booking.verifikasi_fisik.some(
      (v) => v.jenis_pemeriksaan === 'Pasca_Pengembalian'
    );

    if (!hasReturnInspection) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Inspeksi pasca-pengembalian oleh Staf Bagian Umum belum diinput. BAST hanya dapat diterbitkan setelah fisik sarpras diperiksa.',
        },
        { status: 400 }
      );
    }

    // 3. Generate Sequential BAST Number: BAST/SARPRAS/YYYY/MM/XXXX
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    // Count how many BASTs exist in this year and month
    const startOfMonth = new Date(year, now.getMonth(), 1);
    const endOfMonth = new Date(year, now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthlyCount = await prisma.bASTDigital.count({
      where: {
        created_at: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const sequence = String(monthlyCount + 1).padStart(4, '0');
    const nomorBast = `BAST/SARPRAS/${year}/${month}/${sequence}`;

    // 4. Generate QR Signature Token
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const qrSignatureToken = `SIG-KASUBAG-${year}${month}-${sequence}-${randomSuffix}`;

    // 5. Execute Atomic Transaction:
    //    - Create BAST
    //    - Update Peminjaman -> Selesai
    //    - Update Sarpras -> Tersedia
    //    - Create Audit Log
    const result = await prisma.$transaction(async (tx) => {
      const newBast = await tx.bASTDigital.create({
        data: {
          nomor_bast: nomorBast,
          id_peminjaman: booking.id_peminjaman,
          id_kasubag: session.id_user,
          qr_signature: qrSignatureToken,
        },
        include: {
          kasubag: true,
          peminjaman: {
            include: {
              pemohon: true,
              sarpras: true,
            },
          },
        },
      });

      await tx.peminjaman.update({
        where: { id_peminjaman: booking.id_peminjaman },
        data: {
          status_transaksi: 'Selesai',
        },
      });

      // Restore sarpras status to 'Tersedia' (unless manually set to Maintenance/Rusak)
      if (booking.sarpras.status_operasional !== 'Maintenance' && booking.sarpras.status_operasional !== 'Rusak') {
        await tx.sarpras.update({
          where: { id_sarpras: booking.id_sarpras },
          data: {
            status_operasional: 'Tersedia',
          },
        });
      }

      // If ticket exists, mark it as 'Digunakan'
      if (booking.tiket_digital && booking.tiket_digital.status_tiket === 'Aktif') {
        await tx.tiketDigital.update({
          where: { id_tiket: booking.tiket_digital.id_tiket },
          data: { status_tiket: 'Digunakan' },
        });
      }

      await tx.auditLog.create({
        data: {
          id_user: session.id_user,
          aktivitas: `Penerbitan BAST Digital ${nomorBast} untuk transaksi ${booking.kode_transaksi} oleh Kasubag ${session.nama_lengkap}${catatan_penutupan ? ` (Catatan: ${catatan_penutupan})` : ''}`,
          ip_address: req.headers.get('x-forwarded-for') || '127.0.0.1',
        },
      });

      return newBast;
    });

    // 6. Asynchronous Notification (Email & In-App) to Pemohon (Skenario 8 PRD §14)
    await NotificationService.notifyBastIssued({
      id_pemohon: booking.id_pemohon,
      id_peminjaman: booking.id_peminjaman,
      nomor_bast: result.nomor_bast,
      kode_transaksi: booking.kode_transaksi,
      pemohon_email: booking.pemohon.email,
      pemohon_nama: booking.pemohon.nama_lengkap,
      kasubag_nama: session.nama_lengkap,
    });

    return NextResponse.json({
      success: true,
      message: `BAST Digital ${nomorBast} resmi berhasil diterbitkan. Transaksi tuntas berstatus Selesai.`,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menerbitkan BAST Digital';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
