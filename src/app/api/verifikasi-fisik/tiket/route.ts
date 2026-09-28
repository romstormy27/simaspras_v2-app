import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { generateQrDataUrl } from '@/lib/qrcode';
import { formatDateTime } from '@/lib/utils';
import { NotificationService } from '@/lib/notifications';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Silakan login terlebih dahulu' }, { status: 401 });
    }

    // Role check: Only staff, kasubag, or admin can scan & verify any ticket
    const isStaffOrAdmin = ['Staf', 'Kasubag', 'Kabag', 'Admin'].includes(session.role);
    if (!isStaffOrAdmin) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak: Hanya Staf atau Administrator yang berwenang memverifikasi tiket' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const kode = searchParams.get('kode')?.trim();

    if (!kode) {
      return NextResponse.json({ success: false, message: 'Kode tiket atau kode transaksi wajib diisi' }, { status: 400 });
    }

    // Search by tiket.kode_qr OR peminjaman.kode_transaksi
    const booking = await prisma.peminjaman.findFirst({
      where: {
        OR: [
          { kode_transaksi: kode },
          { tiket_digital: { kode_qr: kode } },
        ],
      },
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
        approver: {
          select: {
            nama_lengkap: true,
            email: true,
          },
        },
        tiket_digital: true,
        verifikasi_fisik: {
          include: {
            staf: { select: { nama_lengkap: true } },
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: `Tiket atau transaksi dengan kode "${kode}" tidak ditemukan di sistem.`,
        },
        { status: 404 }
      );
    }

    if (!booking.tiket_digital) {
      return NextResponse.json(
        {
          success: false,
          message: `Transaksi [${booking.kode_transaksi}] ditemukan tetapi belum memiliki Tiket Digital resmi (status saat ini: ${booking.status_transaksi}).`,
        },
        { status: 400 }
      );
    }

    const qrDataUrl = await generateQrDataUrl(booking.tiket_digital.kode_qr);

    return NextResponse.json({
      success: true,
      message: 'Tiket berhasil diverifikasi',
      data: {
        booking,
        tiket: booking.tiket_digital,
        qr_image: qrDataUrl,
      },
    });
  } catch (error: any) {
    console.error('Error verifying ticket:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memverifikasi tiket', error: error?.message },
      { status: 500 }
    );
  }
}

const useTicketSchema = z.object({
  id_tiket: z.string().min(1, { message: 'ID Tiket wajib diisi' }),
  catatan_serah_terima: z.string().optional().default(''),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Silakan login terlebih dahulu' }, { status: 401 });
    }

    if (session.role !== 'Staf' && session.role !== 'Admin') {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak: Hanya Staf atau Administrator yang berwenang memvalidasi penyerahan fasilitas' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parseResult = useTicketSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, message: 'Validasi data gagal', errors: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { id_tiket, catatan_serah_terima } = parseResult.data;

    const tiket = await prisma.tiketDigital.findUnique({
      where: { id_tiket },
      include: {
        peminjaman: {
          include: {
            sarpras: true,
            pemohon: true,
          },
        },
      },
    });

    if (!tiket) {
      return NextResponse.json({ success: false, message: 'Tiket tidak ditemukan' }, { status: 404 });
    }

    if (tiket.status_tiket === 'Digunakan') {
      return NextResponse.json(
        { success: false, message: 'Tiket ini telah digunakan sebelumnya untuk serah terima fasilitas.' },
        { status: 400 }
      );
    }

    if (tiket.status_tiket === 'Kadaluarsa') {
      return NextResponse.json(
        { success: false, message: 'Tiket ini telah kadaluarsa atau transaksi telah dibatalkan.' },
        { status: 400 }
      );
    }

    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    const now = new Date();

    const updatedTiket = await prisma.$transaction(async (tx) => {
      const res = await tx.tiketDigital.update({
        where: { id_tiket },
        data: {
          status_tiket: 'Digunakan',
        },
      });

      const catatan = catatan_serah_terima.trim()
        ? ` (Catatan Staf: ${catatan_serah_terima.trim()})`
        : '';

      await tx.auditLog.create({
        data: {
          id_user: session.id_user,
          aktivitas: `Serah Terima Sarpras: Staf ${session.nama_lengkap} memvalidasi tiket [${tiket.kode_qr}] untuk aset "${tiket.peminjaman.sarpras.nama_sarpras}" kepada ${tiket.peminjaman.pemohon.nama_lengkap}${catatan}`,
          ip_address: ip,
        },
      });

      return res;
    });

    // Kirim notifikasi in-app ke pemohon bahwa serah terima fasilitas telah sukses
    await NotificationService.notifyAssetHandedOver({
      id_pemohon: tiket.peminjaman.id_pemohon,
      kode_transaksi: tiket.peminjaman.kode_transaksi,
      sarpras_nama: tiket.peminjaman.sarpras.nama_sarpras,
      staf_nama: session.nama_lengkap,
    });

    return NextResponse.json({
      success: true,
      message: `Fasilitas "${tiket.peminjaman.sarpras.nama_sarpras}" berhasil diserahterimakan kepada ${tiket.peminjaman.pemohon.nama_lengkap}. Tiket resmi ditandai DIGUNAKAN pada ${formatDateTime(now)}.`,
      data: updatedTiket,
    });
  } catch (error: any) {
    console.error('Error marking ticket as used:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat memvalidasi serah terima tiket', error: error?.message },
      { status: 500 }
    );
  }
}
