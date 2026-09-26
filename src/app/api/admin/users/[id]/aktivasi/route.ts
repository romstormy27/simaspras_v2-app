import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { sendEmail } from '@/lib/email';
import { StatusAktivasi } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getSession();
    if (!admin || admin.role !== 'Admin') {
      return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { decision, reason } = body; // 'Setujui' | 'Tolak'

    if (!['Setujui', 'Tolak'].includes(decision)) {
      return NextResponse.json(
        { success: false, message: 'Keputusan harus berupa "Setujui" atau "Tolak"' },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id_user: id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const newStatus = decision === 'Setujui' ? StatusAktivasi.Aktif : StatusAktivasi.Ditolak;

    const updated = await prisma.user.update({
      where: { id_user: id },
      data: { status_aktivasi: newStatus },
    });

    await logAudit({
      id_user: admin.id_user,
      aktivitas: `Admin ${decision === 'Setujui' ? 'menyetujui aktivasi' : 'menolak'} akun ${targetUser.email} (${targetUser.role})`,
      ip_address: ip,
    });

    // Kirim Notifikasi Email
    if (decision === 'Setujui') {
      await sendEmail({
        to: targetUser.email,
        subject: 'Selamat! Akun SIMASPRAS Poltekimipas Anda Telah Diaktifkan',
        html: `
          <h2>Aktivasi Akun Berhasil</h2>
          <p>Halo <strong>${targetUser.nama_lengkap}</strong>,</p>
          <p>Akun SIMASPRAS Anda telah disetujui dan diaktifkan oleh Administrator.</p>
          <p>Anda sekarang dapat masuk ke sistem untuk melihat ketersediaan sarpras dan mengajukan peminjaman secara mandiri.</p>
          <br/>
          <p><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login" style="padding:10px 16px;background:#034275;color:#fff;text-decoration:none;border-radius:6px;">Masuk ke Aplikasi</a></p>
          <br/>
          <p>Salam hangat,<br/>Bagian Keuangan dan Umum Poltekimipas</p>
        `,
      });
    } else {
      await sendEmail({
        to: targetUser.email,
        subject: 'Pemberitahuan Pendaftaran Akun SIMASPRAS Poltekimipas',
        html: `
          <h2>Pendaftaran Akun Belum Disetujui</h2>
          <p>Halo <strong>${targetUser.nama_lengkap}</strong>,</p>
          <p>Mohon maaf, pendaftaran akun SIMASPRAS Anda belum dapat disetujui oleh Administrator dengan alasan:</p>
          <blockquote style="background:#f1f5f9;padding:12px;border-left:4px solid #ef4444;">
            ${reason || 'Data identitas belum memenuhi ketentuan verifikasi institusi.'}
          </blockquote>
          <p>Silakan hubungi Bagian Umum jika Anda membutuhkan bantuan lebih lanjut.</p>
          <br/>
          <p>Salam hangat,<br/>Bagian Keuangan dan Umum Poltekimipas</p>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Aktivasi akun berhasil diperbarui menjadi ${newStatus}`,
      data: updated,
    });
  } catch (error) {
    console.error('Update activation error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui status aktivasi pengguna' },
      { status: 500 }
    );
  }
}
