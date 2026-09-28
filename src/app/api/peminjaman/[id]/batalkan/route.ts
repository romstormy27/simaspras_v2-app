import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { z } from 'zod';
import { NotificationService } from '@/lib/notifications';
import { formatDateTime } from '@/lib/utils';

const cancelSchema = z.object({
  alasan_pembatalan: z.string().min(5, { message: 'Alasan pembatalan wajib diisi minimal 5 karakter' }),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Silakan login terlebih dahulu' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID Peminjaman tidak valid' }, { status: 400 });
    }

    const body = await request.json();
    const parseResult = cancelSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validasi gagal',
          errors: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { alasan_pembatalan } = parseResult.data;

    // Fetch existing booking with relations
    const booking = await prisma.peminjaman.findUnique({
      where: { id_peminjaman: id },
      include: {
        sarpras: true,
        pemohon: true,
        tiket_digital: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Data peminjaman tidak ditemukan' },
        { status: 404 }
      );
    }

    // Authorization: only the applicant or Admin can cancel
    const isOwner = booking.id_pemohon === session.id_user;
    const isAdmin = session.role === 'Admin';
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Anda tidak memiliki wewenang untuk membatalkan transaksi ini' },
        { status: 403 }
      );
    }

    // Business rule check (PRD UC-04 & SD-04)
    if (!['Pending', 'Disetujui'].includes(booking.status_transaksi)) {
      return NextResponse.json(
        {
          success: false,
          message: `Pembatalan tidak dapat dilakukan untuk transaksi dengan status "${booking.status_transaksi}".`,
        },
        { status: 400 }
      );
    }

    // Schedule check: now < tgl_mulai
    const now = new Date();
    if (now >= new Date(booking.tgl_mulai)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Pembatalan Gagal: Peminjaman Sedang Berjalan. Pembatalan Mandiri Tidak Dapat Dilakukan.',
        },
        { status: 400 }
      );
    }

    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    // Atomic cancellation transaction: updates status, updates ticket if any, logs audit
    await prisma.$transaction(async (tx) => {
      // Note: Updating status to 'Dibatalkan' automatically frees the schedule slot
      // because slot locking queries only filter by status IN ('Pending', 'Disetujui')
      await tx.peminjaman.update({
        where: { id_peminjaman: id },
        data: {
          status_transaksi: 'Dibatalkan',
          maksud_kegiatan: `${booking.maksud_kegiatan}\n\n[DIBATALKAN oleh ${session.nama_lengkap} pada ${formatDateTime(now)}: ${alasan_pembatalan.trim()}]`,
        },
      });

      if (booking.tiket_digital) {
        await tx.tiketDigital.update({
          where: { id_peminjaman: id },
          data: {
            status_tiket: 'Kadaluarsa',
          },
        });
      }

      await tx.auditLog.create({
        data: {
          id_user: session.id_user,
          aktivitas: `Pembatalan Mandiri Peminjaman [${booking.kode_transaksi}] untuk fasilitas "${booking.sarpras.nama_sarpras}". Alasan: ${alasan_pembatalan.trim()}`,
          ip_address: ip,
        },
      });
    });

    // Notify applicant and Kasubag / Staf (Skenario 4 PRD §14)
    await NotificationService.notifyBookingCancelled({
      kode_transaksi: booking.kode_transaksi,
      sarpras_nama: booking.sarpras.nama_sarpras,
      pemohon_email: booking.pemohon.email,
      pemohon_nama: booking.pemohon.nama_lengkap,
      alasan: alasan_pembatalan.trim(),
    });

    return NextResponse.json({
      success: true,
      message: 'Peminjaman berhasil dibatalkan dan slot jadwal telah dibuka kembali secara otomatis.',
    });
  } catch (error: any) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem saat membatalkan peminjaman', error: error?.message },
      { status: 500 }
    );
  }
}
