import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const admin = await getSession();
    if (!admin || admin.role !== 'Admin') {
      return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);

    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            nama_lengkap: true,
            email: true,
            role: true,
          },
        },
      },
    });

    const serialized = logs.map((l) => ({
      id_log: l.id_log.toString(),
      id_user: l.id_user,
      aktivitas: l.aktivitas,
      ip_address: l.ip_address,
      timestamp: l.timestamp,
      user_nama: l.user?.nama_lengkap || 'Sistem / Anonim',
      user_email: l.user?.email || '-',
      user_role: l.user?.role || '-',
    }));

    return NextResponse.json({
      success: true,
      data: serialized,
    });
  } catch (error) {
    console.error('Fetch audit log error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil log audit' },
      { status: 500 }
    );
  }
}
