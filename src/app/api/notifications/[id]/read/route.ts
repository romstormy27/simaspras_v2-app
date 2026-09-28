import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/notifications/[id]/read
 * Menandai satu notifikasi tertentu sebagai telah dibaca
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Autentikasi diperlukan' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Pastikan notifikasi ada dan milik pengguna yang sedang login
    const notification = await prisma.notifikasi.findUnique({
      where: { id_notifikasi: id },
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, message: 'Notifikasi tidak ditemukan' },
        { status: 404 }
      );
    }

    if (notification.id_user !== session.id_user) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak: Notifikasi milik akun lain' },
        { status: 403 }
      );
    }

    const updated = await prisma.notifikasi.update({
      where: { id_notifikasi: id },
      data: { is_read: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Notifikasi berhasil ditandai telah dibaca',
      data: updated,
    });
  } catch (error: any) {
    console.error('PATCH /api/notifications/[id]/read error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui status notifikasi' },
      { status: 500 }
    );
  }
}
