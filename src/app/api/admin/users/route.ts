import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { Prisma, StatusAktivasi } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user || user.role !== 'Admin') {
      return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const whereClause: Prisma.UserWhereInput = {};
    if (status && status !== 'all' && ['Pending', 'Aktif', 'Ditolak'].includes(status)) {
      whereClause.status_aktivasi = status as StatusAktivasi;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        pemohon_detail: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const formatted = users.map((u) => ({
      id_user: u.id_user,
      nama_lengkap: u.nama_lengkap,
      email: u.email,
      no_hp: u.no_hp,
      role: u.role,
      status_aktivasi: u.status_aktivasi,
      created_at: u.created_at,
      nomor_identitas: u.pemohon_detail?.nomor_identitas || '-',
      instansi_kategori: u.pemohon_detail?.instansi_kategori || '-',
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error('Fetch admin users error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data pengguna' },
      { status: 500 }
    );
  }
}
