import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications
 * Mengambil daftar notifikasi milik pengguna terotentikasi dan menghitung unread_count
 * Query params: unread_only=true|false, limit=number
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Autentikasi diperlukan' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '25', 10), 1), 100);

    const whereClause: { id_user: string; is_read?: boolean } = {
      id_user: session.id_user,
    };

    if (unreadOnly) {
      whereClause.is_read = false;
    }

    const [notifications, unreadCount, totalCount] = await Promise.all([
      prisma.notifikasi.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        take: limit,
      }),
      prisma.notifikasi.count({
        where: {
          id_user: session.id_user,
          is_read: false,
        },
      }),
      prisma.notifikasi.count({
        where: { id_user: session.id_user },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unread_count: unreadCount,
        total: totalCount,
      },
    });
  } catch (error: any) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat notifikasi' },
      { status: 500 }
    );
  }
}
