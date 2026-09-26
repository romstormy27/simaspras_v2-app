import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { KategoriSarpras, StatusOperasional, Prisma } from '@prisma/client';

const sarprasSchema = z.object({
  kode_aset: z.string().min(2, 'Kode aset wajib diisi (minimal 2 karakter)'),
  nama_sarpras: z.string().min(3, 'Nama sarpras wajib diisi (minimal 3 karakter)'),
  kategori: z.enum(['Ruangan', 'Mobil_Operasional', 'Perangkat_Kerja']),
  spesifikasi: z.string().optional().nullable(),
  lokasi_plat: z.string().min(2, 'Lokasi atau nomor plat wajib diisi'),
  status_operasional: z
    .enum(['Tersedia', 'Maintenance', 'Rusak', 'Non_Aktif'])
    .default('Tersedia'),
});

// GET /api/sarpras - Daftar katalog sarpras dengan filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const kategori = searchParams.get('kategori');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const includeInactive = searchParams.get('include_inactive') === 'true';

    const where: Prisma.SarprasWhereInput = {};

    if (!includeInactive) {
      where.status_operasional = { not: 'Non_Aktif' };
    }

    if (kategori && ['Ruangan', 'Mobil_Operasional', 'Perangkat_Kerja'].includes(kategori)) {
      where.kategori = kategori as KategoriSarpras;
    }

    if (status && ['Tersedia', 'Maintenance', 'Rusak', 'Non_Aktif'].includes(status)) {
      where.status_operasional = status as StatusOperasional;
    }

    if (search) {
      where.OR = [
        { nama_sarpras: { contains: search } },
        { kode_aset: { contains: search } },
        { lokasi_plat: { contains: search } },
        { spesifikasi: { contains: search } },
      ];
    }

    const items = await prisma.sarpras.findMany({
      where,
      orderBy: { nama_sarpras: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error('Fetch sarpras error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data sarpras' },
      { status: 500 }
    );
  }
}

// POST /api/sarpras - Tambah master data sarpras baru (Admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user || user.role !== 'Admin') {
      return NextResponse.json({ success: false, message: 'Akses ditolak: Hanya Administrator' }, { status: 403 });
    }

    const body = await request.json();
    const result = sarprasSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: 'Validasi gagal', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // Cek keunikan kode_aset
    const existing = await prisma.sarpras.findUnique({
      where: { kode_aset: data.kode_aset },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: `Kode aset '${data.kode_aset}' sudah terdaftar dalam sistem` },
        { status: 400 }
      );
    }

    const newItem = await prisma.sarpras.create({
      data: {
        kode_aset: data.kode_aset,
        nama_sarpras: data.nama_sarpras,
        kategori: data.kategori as KategoriSarpras,
        spesifikasi: data.spesifikasi || null,
        lokasi_plat: data.lokasi_plat,
        status_operasional: data.status_operasional as StatusOperasional,
      },
    });

    await logAudit({
      id_user: user.id_user,
      aktivitas: `Admin menambah sarpras baru: ${newItem.nama_sarpras} (${newItem.kode_aset})`,
      ip_address: ip,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Master data sarpras berhasil ditambahkan',
        data: newItem,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create sarpras error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menambahkan master data sarpras' },
      { status: 500 }
    );
  }
}
