import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { NotificationService } from '@/lib/notifications';
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

    // Kirim Notifikasi Terpusat (Email & In-App)
    await NotificationService.notifyActivationDecision(
      { id_user: targetUser.id_user, email: targetUser.email, nama_lengkap: targetUser.nama_lengkap },
      decision,
      reason
    );

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
