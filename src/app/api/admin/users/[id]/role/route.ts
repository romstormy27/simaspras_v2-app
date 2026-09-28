import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { NotificationService } from '@/lib/notifications';
import { Role } from '@prisma/client';

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
    const { newRole } = body;

    const validRoles = ['Dosen', 'Taruna', 'BPSDM', 'Kementerian', 'Alumni', 'Kabag', 'Kasubag', 'Staf', 'Admin'];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({ success: false, message: 'Role tidak valid' }, { status: 400 });
    }

    // Hindari admin mencabut hak admin dirinya sendiri jika hanya tersisa 1 admin
    if (admin.id_user === id && newRole !== 'Admin') {
      const adminCount = await prisma.user.count({
        where: { role: 'Admin', status_aktivasi: 'Aktif' },
      });
      if (adminCount <= 1) {
        await NotificationService.notifySecurityEvent({
          jenis_kejadian: 'Percobaan Pencabutan Role Admin Tunggal Dicegah',
          deskripsi: `Pengguna ${admin.nama_lengkap} (${admin.email}) mencoba mencabut peran Admin dirinya sendiri padahal merupakan satu-satunya Admin aktif di sistem.`,
          ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
        });
        return NextResponse.json(
          { success: false, message: 'Tidak dapat mencabut role Admin tunggal pada sistem' },
          { status: 400 }
        );
      }
    }

    const targetUser = await prisma.user.findUnique({
      where: { id_user: id },
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, message: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    const oldRole = targetUser.role;
    const updated = await prisma.user.update({
      where: { id_user: id },
      data: { role: newRole as Role },
    });

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    await logAudit({
      id_user: admin.id_user,
      aktivitas: `Admin mengubah role ${targetUser.email} dari ${oldRole} menjadi ${newRole}`,
      ip_address: ip,
    });

    // Kirim notifikasi in-app ke pengguna terkait
    await NotificationService.notifyRoleChanged({
      id_user: id,
      role_lama: oldRole,
      role_baru: newRole,
      admin_nama: admin.nama_lengkap,
    });

    return NextResponse.json({
      success: true,
      message: `Role pengguna berhasil diubah menjadi ${newRole}`,
      data: updated,
    });
  } catch (error) {
    console.error('Update role error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui role pengguna' },
      { status: 500 }
    );
  }
}
