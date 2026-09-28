import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/notifications/read-all
 * Menandai seluruh notifikasi belum dibaca milik pengguna yang login sebagai telah dibaca
 */
export async function PATCH(_req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Autentikasi diperlukan' },
        { status: 401 }
      );
    }

    const result = await prisma.notifikasi.updateMany({
      where: {
        id_user: session.id_user,
        is_read: false,
      },
      data: {
        is_read: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Seluruh notifikasi berhasil ditandai telah dibaca',
      data: {
        count: result.count,
      },
    });
  } catch (error: any) {
    console.error('PATCH /api/notifications/read-all error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui notifikasi' },
      { status: 500 }
    );
  }
}
