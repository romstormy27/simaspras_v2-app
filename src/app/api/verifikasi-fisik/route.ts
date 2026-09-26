import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { z } from 'zod';
import { sendEmail } from '@/lib/email';
import { NotificationService } from '@/lib/notifications';
import { formatDateTime } from '@/lib/utils';
import { JenisPemeriksaan, KondisiFisik } from '@prisma/client';

const verifikasiSchema = z.object({
  id_peminjaman: z.string().min(1, { message: 'ID Peminjaman wajib diisi' }),
  jenis_pemeriksaan: z.enum(['Pra_Approval', 'Pasca_Pengembalian', 'Pra-Approval', 'Pasca-Pengembalian']),
  kondisi_fisik: z.enum(['Baik_Sesuai', 'Ada_Catatan_Khusus', 'Baik/Sesuai', 'Ada Catatan Khusus']),
  catatan_inspeksi: z.string().optional().default(''),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Silakan login terlebih dahulu' }, { status: 401 });
    }

    // Role check: Only Staf and Admin
    if (session.role !== 'Staf' && session.role !== 'Admin') {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak: Hanya Staf Bagian Umum atau Administrator yang berwenang melakukan verifikasi' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parseResult = verifikasiSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validasi data gagal',
          errors: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { id_peminjaman, catatan_inspeksi } = parseResult.data;

    // Normalize enum values
    const jenis: JenisPemeriksaan =
      parseResult.data.jenis_pemeriksaan === 'Pasca-Pengembalian' || parseResult.data.jenis_pemeriksaan === 'Pasca_Pengembalian'
        ? JenisPemeriksaan.Pasca_Pengembalian
        : JenisPemeriksaan.Pra_Approval;

    const kondisi: KondisiFisik =
      parseResult.data.kondisi_fisik === 'Ada Catatan Khusus' || parseResult.data.kondisi_fisik === 'Ada_Catatan_Khusus'
        ? KondisiFisik.Ada_Catatan_Khusus
        : KondisiFisik.Baik_Sesuai;

    if (kondisi === KondisiFisik.Ada_Catatan_Khusus && (!catatan_inspeksi || catatan_inspeksi.trim().length < 5)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Catatan inspeksi wajib diisi minimal 5 karakter jika kondisi fisik berstatus "Ada Catatan Khusus".',
        },
        { status: 400 }
      );
    }

    // Check booking existence
    const booking = await prisma.peminjaman.findUnique({
      where: { id_peminjaman },
      include: {
        sarpras: true,
        pemohon: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, message: 'Transaksi peminjaman tidak ditemukan' }, { status: 404 });
    }

    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    // Save verification and write audit log atomically
    const newVerifikasi = await prisma.$transaction(async (tx) => {
      const verifikasi = await tx.verifikasiFisik.create({
        data: {
          id_peminjaman,
          id_staf: session.id_user,
          jenis_pemeriksaan: jenis,
          kondisi_fisik: kondisi,
          catatan_inspeksi: catatan_inspeksi.trim() || null,
        },
        include: {
          staf: {
            select: {
              nama_lengkap: true,
              email: true,
            },
          },
        },
      });

      const jenisLabel = jenis === JenisPemeriksaan.Pra_Approval ? 'Pra-Approval' : 'Pasca-Pengembalian';
      const kondisiLabel = kondisi === KondisiFisik.Baik_Sesuai ? 'Baik/Sesuai' : 'Ada Catatan Khusus';

      await tx.auditLog.create({
        data: {
          id_user: session.id_user,
          aktivitas: `Verifikasi Teknis [${jenisLabel}] untuk transaksi ${booking.kode_transaksi} (${booking.sarpras.nama_sarpras}): ${kondisiLabel}`,
          ip_address: ip,
        },
      });

      return verifikasi;
    });

    // Notify Kasubag Umum (Skenario 7 PRD §14)
    await NotificationService.notifyInspectionCompleted({
      kode_transaksi: booking.kode_transaksi,
      sarpras_nama: booking.sarpras.nama_sarpras,
      jenis: jenis,
      kondisi: kondisi,
      catatan: catatan_inspeksi.trim() || null,
      staf_nama: session.nama_lengkap,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Hasil pemeriksaan fisik lapangan berhasil disimpan dan rekomendasi telah diteruskan ke Kasubag Umum.',
        data: newVerifikasi,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error submitting verification:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem saat menyimpan verifikasi', error: error?.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Silakan login terlebih dahulu' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idPeminjaman = searchParams.get('id_peminjaman');
    const jenis = searchParams.get('jenis');

    const where: any = {};
    if (idPeminjaman) where.id_peminjaman = idPeminjaman;
    if (jenis) {
      if (jenis === 'Pra-Approval' || jenis === 'Pra_Approval') where.jenis_pemeriksaan = JenisPemeriksaan.Pra_Approval;
      if (jenis === 'Pasca-Pengembalian' || jenis === 'Pasca_Pengembalian') where.jenis_pemeriksaan = JenisPemeriksaan.Pasca_Pengembalian;
    }

    const verifikasiList = await prisma.verifikasiFisik.findMany({
      where,
      include: {
        staf: {
          select: {
            id_user: true,
            nama_lengkap: true,
            email: true,
          },
        },
        peminjaman: {
          include: {
            sarpras: true,
            pemohon: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: verifikasiList,
      total: verifikasiList.length,
    });
  } catch (error: any) {
    console.error('Error fetching verifications:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data verifikasi', error: error?.message },
      { status: 500 }
    );
  }
}
