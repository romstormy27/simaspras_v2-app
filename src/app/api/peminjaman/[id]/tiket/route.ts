import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { generateQrDataUrl } from '@/lib/qrcode';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Silakan login terlebih dahulu' }, { status: 401 });
    }

    const { id } = params;

    const booking = await prisma.peminjaman.findUnique({
      where: { id_peminjaman: id },
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
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, message: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    // Authorization: owner or staff/kasubag/admin
    const isOwner = booking.id_pemohon === session.id_user;
    const isStaff = ['Kasubag', 'Staf', 'Kabag', 'Admin'].includes(session.role);
    if (!isOwner && !isStaff) {
      return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
    }

    if (!booking.tiket_digital) {
      return NextResponse.json(
        { success: false, message: 'Tiket digital belum diterbitkan untuk transaksi ini (status belum disetujui)' },
        { status: 400 }
      );
    }

    // Generate high-resolution Base64 PNG QR code from the token
    const qrDataUrl = await generateQrDataUrl(booking.tiket_digital.kode_qr);

    return NextResponse.json({
      success: true,
      data: {
        ...booking.tiket_digital,
        qr_image: qrDataUrl,
        peminjaman: {
          kode_transaksi: booking.kode_transaksi,
          tgl_mulai: booking.tgl_mulai,
          tgl_selesai: booking.tgl_selesai,
          maksud_kegiatan: booking.maksud_kegiatan,
          sarpras: booking.sarpras,
          pemohon: booking.pemohon,
          approver: booking.approver,
        },
      },
    });
  } catch (error: any) {
    console.error('Error getting digital ticket:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat tiket digital', error: error?.message },
      { status: 500 }
    );
  }
}
