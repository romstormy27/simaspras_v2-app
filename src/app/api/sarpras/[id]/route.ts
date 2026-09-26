import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { KategoriSarpras, StatusOperasional } from '@prisma/client';

const updateSchema = z.object({
  kode_aset: z.string().min(2, 'Kode aset minimal 2 karakter').optional(),
  nama_sarpras: z.string().min(3, 'Nama sarpras minimal 3 karakter').optional(),
  kategori: z.enum(['Ruangan', 'Mobil_Operasional', 'Perangkat_Kerja']).optional(),
  spesifikasi: z.string().optional().nullable(),
  lokasi_plat: z.string().min(2, 'Lokasi atau nomor plat minimal 2 karakter').optional(),
  status_operasional: z
    .enum(['Tersedia', 'Maintenance', 'Rusak', 'Non_Aktif'])
    .optional(),
});

// GET /api/sarpras/:id - Detail sarpras
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = await prisma.sarpras.findUnique({
      where: { id_sarpras: params.id },
      include: {
        daftar_peminjaman: {
          where: {
            status_transaksi: { in: ['Pending', 'Disetujui'] },
          },
          select: {
            id_peminjaman: true,
            kode_transaksi: true,
            tgl_mulai: true,
            tgl_selesai: true,
            status_transaksi: true,
            maksud_kegiatan: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ success: false, message: 'Data sarpras tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Get sarpras detail error:', error);
    return NextResponse.json({ success: false, message: 'Gagal memuat detail sarpras' }, { status: 500 });
  }
}

// PUT /api/sarpras/:id - Edit master data sarpras (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSession();
    if (!user || user.role !== 'Admin') {
      return NextResponse.json({ success: false, message: 'Akses ditolak: Hanya Administrator' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const result = updateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: 'Validasi gagal', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const target = await prisma.sarpras.findUnique({
      where: { id_sarpras: id },
    });

    if (!target) {
      return NextResponse.json({ success: false, message: 'Sarpras tidak ditemukan' }, { status: 404 });
    }

    const data = result.data;
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // Cek keunikan kode_aset jika diubah
    if (data.kode_aset && data.kode_aset !== target.kode_aset) {
      const existing = await prisma.sarpras.findUnique({
        where: { kode_aset: data.kode_aset },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, message: `Kode aset '${data.kode_aset}' sudah digunakan oleh fasilitas lain` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.sarpras.update({
      where: { id_sarpras: id },
      data: {
        ...(data.kode_aset && { kode_aset: data.kode_aset }),
        ...(data.nama_sarpras && { nama_sarpras: data.nama_sarpras }),
        ...(data.kategori && { kategori: data.kategori as KategoriSarpras }),
        ...(data.spesifikasi !== undefined && { spesifikasi: data.spesifikasi }),
        ...(data.lokasi_plat && { lokasi_plat: data.lokasi_plat }),
        ...(data.status_operasional && { status_operasional: data.status_operasional as StatusOperasional }),
      },
    });

    const isMaintenanceToggle = data.status_operasional === 'Maintenance' && target.status_operasional !== 'Maintenance';
    const auditActivity = isMaintenanceToggle
      ? `Admin menyetel status Maintenance untuk ${target.nama_sarpras} (${target.kode_aset})`
      : `Admin memperbarui data sarpras ${target.nama_sarpras} (${target.kode_aset})`;

    await logAudit({
      id_user: user.id_user,
      aktivitas: auditActivity,
      ip_address: ip,
    });

    return NextResponse.json({
      success: true,
      message: 'Data sarpras berhasil diperbarui',
      data: updated,
    });
  } catch (error) {
    console.error('Update sarpras error:', error);
    return NextResponse.json({ success: false, message: 'Gagal memperbarui data sarpras' }, { status: 500 });
  }
}

// DELETE /api/sarpras/:id - Hapus / Soft Delete sarpras (Admin only, PRD UC-09 & SD-09)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSession();
    if (!user || user.role !== 'Admin') {
      return NextResponse.json({ success: false, message: 'Akses ditolak: Hanya Administrator' }, { status: 403 });
    }

    const { id } = params;
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    const target = await prisma.sarpras.findUnique({
      where: { id_sarpras: id },
      include: {
        daftar_peminjaman: {
          where: {
            status_transaksi: { in: ['Pending', 'Disetujui'] },
          },
        },
      },
    });

    if (!target) {
      return NextResponse.json({ success: false, message: 'Sarpras tidak ditemukan' }, { status: 404 });
    }

    const hasActiveTransactions = target.daftar_peminjaman.length > 0;

    if (hasActiveTransactions) {
      // Sesuai aturan PRD UC-09 & SD-09:
      // "Sistem memeriksa keterikatan transaksi aktif — jika ada, aset diubah menjadi Non-Aktif (Soft Delete)"
      const softDeleted = await prisma.sarpras.update({
        where: { id_sarpras: id },
        data: { status_operasional: StatusOperasional.Non_Aktif },
      });

      await logAudit({
        id_user: user.id_user,
        aktivitas: `Admin menonaktifkan (Soft Delete) sarpras ${target.nama_sarpras} (${target.kode_aset}) karena masih memiliki ${target.daftar_peminjaman.length} transaksi aktif`,
        ip_address: ip,
      });

      return NextResponse.json({
        success: true,
        message: `Fasilitas ini memiliki ${target.daftar_peminjaman.length} transaksi aktif, status aset diubah menjadi 'Non-Aktif' (Soft Delete) dan disembunyikan dari katalog peminjaman.`,
        data: softDeleted,
      });
    }

    // Jika tidak ada transaksi sama sekali, hapus permanen
    const totalTransactions = await prisma.peminjaman.count({
      where: { id_sarpras: id },
    });

    if (totalTransactions === 0) {
      await prisma.sarpras.delete({
        where: { id_sarpras: id },
      });

      await logAudit({
        id_user: user.id_user,
        aktivitas: `Admin menghapus permanen sarpras ${target.nama_sarpras} (${target.kode_aset})`,
        ip_address: ip,
      });

      return NextResponse.json({
        success: true,
        message: 'Master data sarpras berhasil dihapus permanen',
      });
    } else {
      // Ada riwayat transaksi historis yang sudah selesai/dibatalkan/ditolak -> Soft Delete demi referential integrity
      const softDeleted = await prisma.sarpras.update({
        where: { id_sarpras: id },
        data: { status_operasional: StatusOperasional.Non_Aktif },
      });

      await logAudit({
        id_user: user.id_user,
        aktivitas: `Admin menonaktifkan sarpras ${target.nama_sarpras} (${target.kode_aset}) untuk menjaga integritas riwayat transaksi historis`,
        ip_address: ip,
      });

      return NextResponse.json({
        success: true,
        message: 'Fasilitas memiliki riwayat transaksi historis, status aset diubah menjadi "Non-Aktif" (Soft Delete).',
        data: softDeleted,
      });
    }
  } catch (error) {
    console.error('Delete sarpras error:', error);
    return NextResponse.json({ success: false, message: 'Gagal memproses penghapusan data sarpras' }, { status: 500 });
  }
}
