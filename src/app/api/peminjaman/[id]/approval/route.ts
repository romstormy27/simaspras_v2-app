import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { z } from 'zod';
import { sendEmail } from '@/lib/email';
import { NotificationService } from '@/lib/notifications';
import { formatDateTime } from '@/lib/utils';

const approvalSchema = z.object({
  decision: z.enum(['Setujui', 'Tolak']),
  alasan_penolakan: z.string().optional().default(''),
  catatan_approver: z.string().optional().default(''),
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

    // Role check: Kasubag or Admin
    if (session.role !== 'Kasubag' && session.role !== 'Admin') {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak: Hanya Kasubag Bagian Umum atau Administrator yang berwenang memberikan persetujuan' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const parseResult = approvalSchema.safeParse(body);

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

    const { decision, alasan_penolakan, catatan_approver } = parseResult.data;

    if (decision === 'Tolak' && (!alasan_penolakan || alasan_penolakan.trim().length < 5)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Alasan penolakan wajib diisi minimal 5 karakter jika permohonan ditolak.',
        },
        { status: 400 }
      );
    }

    const booking = await prisma.peminjaman.findUnique({
      where: { id_peminjaman: id },
      include: {
        sarpras: true,
        pemohon: true,
        verifikasi_fisik: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Transaksi peminjaman tidak ditemukan' },
        { status: 404 }
      );
    }

    if (booking.status_transaksi !== 'Pending') {
      return NextResponse.json(
        {
          success: false,
          message: `Keputusan persetujuan tidak dapat diproses karena transaksi berstatus "${booking.status_transaksi}".`,
        },
        { status: 400 }
      );
    }

    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    const now = new Date();

    if (decision === 'Setujui') {
      // Approval: update status to 'Disetujui', generate digital ticket QR token, record audit
      const qrToken = `TIKET-${booking.kode_transaksi}-${Date.now().toString(36).toUpperCase()}`;

      let updatedAgenda = booking.maksud_kegiatan;
      if (catatan_approver && catatan_approver.trim()) {
        updatedAgenda += `\n\n[DISETUJUI oleh Kasubag Umum ${session.nama_lengkap} pada ${formatDateTime(now)}: ${catatan_approver.trim()}]`;
      }

      const updated = await prisma.$transaction(async (tx) => {
        const resBooking = await tx.peminjaman.update({
          where: { id_peminjaman: id },
          data: {
            status_transaksi: 'Disetujui',
            id_approver: session.id_user,
            maksud_kegiatan: updatedAgenda,
          },
        });

        const tiket = await tx.tiketDigital.create({
          data: {
            id_peminjaman: id,
            kode_qr: qrToken,
            status_tiket: 'Aktif',
          },
        });

        await tx.auditLog.create({
          data: {
            id_user: session.id_user,
            aktivitas: `Persetujuan Peminjaman (Approval) [${booking.kode_transaksi}] untuk aset "${booking.sarpras.nama_sarpras}". Tiket Digital diterbitkan: ${qrToken}`,
            ip_address: ip,
          },
        });

        return { booking: resBooking, tiket };
      });

      // Send email to Pemohon (Skenario 5 PRD §14)
      await NotificationService.notifyBookingApproved({
        kode_transaksi: booking.kode_transaksi,
        sarpras_nama: booking.sarpras.nama_sarpras,
        pemohon_email: booking.pemohon.email,
        pemohon_nama: booking.pemohon.nama_lengkap,
        kode_qr: qrToken,
        tgl_mulai: booking.tgl_mulai,
        tgl_selesai: booking.tgl_selesai,
      });

      return NextResponse.json({
        success: true,
        message: 'Permohonan berhasil disetujui. Tiket Digital QR Code telah diterbitkan untuk pemohon.',
        data: updated,
      });
    } else {
      // Rejection: update status to 'Ditolak', automatically free calendar slot, record audit
      const updatedAgenda = `${booking.maksud_kegiatan}\n\n[DITOLAK oleh Kasubag Umum ${session.nama_lengkap} pada ${formatDateTime(now)}. Alasan: ${alasan_penolakan.trim()}]`;

      const updated = await prisma.$transaction(async (tx) => {
        const resBooking = await tx.peminjaman.update({
          where: { id_peminjaman: id },
          data: {
            status_transaksi: 'Ditolak',
            id_approver: session.id_user,
            maksud_kegiatan: updatedAgenda,
          },
        });

        await tx.auditLog.create({
          data: {
            id_user: session.id_user,
            aktivitas: `Penolakan Peminjaman (Reject) [${booking.kode_transaksi}] untuk aset "${booking.sarpras.nama_sarpras}". Alasan: ${alasan_penolakan.trim()}`,
            ip_address: ip,
          },
        });

        return resBooking;
      });

      // Send rejection notification email to Pemohon (Skenario 6 PRD §14)
      await NotificationService.notifyBookingRejected({
        kode_transaksi: booking.kode_transaksi,
        sarpras_nama: booking.sarpras.nama_sarpras,
        pemohon_email: booking.pemohon.email,
        pemohon_nama: booking.pemohon.nama_lengkap,
        alasan: alasan_penolakan.trim(),
      });

      return NextResponse.json({
        success: true,
        message: 'Permohonan peminjaman telah ditolak dan slot kalender telah dibuka kembali secara otomatis.',
        data: updated,
      });
    }
  } catch (error: any) {
    console.error('Error processing approval:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem saat memproses persetujuan', error: error?.message },
      { status: 500 }
    );
  }
}
