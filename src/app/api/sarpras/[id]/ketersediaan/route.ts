import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/sarpras/:id/ketersediaan - Kalender ketersediaan real-time per aset (UC-02 / SD-02)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);

    // Filter rentang tanggal opsional (default: dari hari ini hingga 60 hari ke depan)
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const startDate = startDateParam ? new Date(startDateParam) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = endDateParam
      ? new Date(endDateParam)
      : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    const sarpras = await prisma.sarpras.findUnique({
      where: { id_sarpras: id },
    });

    if (!sarpras) {
      return NextResponse.json({ success: false, message: 'Fasilitas sarpras tidak ditemukan' }, { status: 404 });
    }

    // Ambil seluruh transaksi yang mengunci jadwal: 'Pending' (Reserved) dan 'Disetujui' (In Use)
    const activeBookings = await prisma.peminjaman.findMany({
      where: {
        id_sarpras: id,
        status_transaksi: { in: ['Pending', 'Disetujui'] },
        OR: [
          {
            tgl_mulai: { lte: endDate },
            tgl_selesai: { gte: startDate },
          },
        ],
      },
      include: {
        pemohon: {
          select: {
            nama_lengkap: true,
            role: true,
          },
        },
      },
      orderBy: { tgl_mulai: 'asc' },
    });

    const bookedSlots = activeBookings.map((b) => ({
      id_peminjaman: b.id_peminjaman,
      kode_transaksi: b.kode_transaksi,
      tgl_mulai: b.tgl_mulai,
      tgl_selesai: b.tgl_selesai,
      status_slot: b.status_transaksi === 'Disetujui' ? 'In Use' : 'Reserved',
      status_transaksi: b.status_transaksi,
      maksud_kegiatan: b.maksud_kegiatan,
      pemohon_kategori: b.pemohon.role,
      pemohon_nama: b.pemohon.nama_lengkap,
    }));

    return NextResponse.json({
      success: true,
      data: {
        sarpras: {
          id_sarpras: sarpras.id_sarpras,
          kode_aset: sarpras.kode_aset,
          nama_sarpras: sarpras.nama_sarpras,
          kategori: sarpras.kategori,
          status_operasional: sarpras.status_operasional,
          lokasi_plat: sarpras.lokasi_plat,
          is_available: sarpras.status_operasional === 'Tersedia',
        },
        rentang_cek: {
          startDate,
          endDate,
        },
        total_terisi: bookedSlots.length,
        jadwal_terisi: bookedSlots,
      },
    });
  } catch (error) {
    console.error('Check availability error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat kalender ketersediaan sarpras' },
      { status: 500 }
    );
  }
}
