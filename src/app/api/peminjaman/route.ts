import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { z } from 'zod';
import { NotificationService } from '@/lib/notifications';
import { formatDateTime } from '@/lib/utils';

const createBookingSchema = z.object({
  id_sarpras: z.string().min(1, { message: 'ID Sarpras tidak valid' }).max(36),
  tgl_mulai: z.string().min(1, { message: 'Tanggal & jam mulai wajib diisi' }),
  tgl_selesai: z.string().min(1, { message: 'Tanggal & jam selesai wajib diisi' }),
  maksud_kegiatan: z.string().min(5, { message: 'Maksud/agenda kegiatan minimal 5 karakter' }),
  jumlah_unit: z.number().int().positive().optional().default(1),
  catatan_teknis: z.string().optional().default(''),
  pakta_integritas: z.boolean().refine((val) => val === true, {
    message: 'Persetujuan Pakta Integritas Peminjaman Digital wajib dicentang',
  }),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Silakan login terlebih dahulu' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = createBookingSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validasi gagal',
          errors: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { id_sarpras, tgl_mulai, tgl_selesai, maksud_kegiatan, jumlah_unit, catatan_teknis } = parseResult.data;

    const start = new Date(tgl_mulai);
    const end = new Date(tgl_selesai);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Format tanggal & waktu tidak valid' },
        { status: 400 }
      );
    }

    if (start >= end) {
      return NextResponse.json(
        { success: false, message: 'Waktu selesai peminjaman harus lebih lambat dari waktu mulai' },
        { status: 400 }
      );
    }

    // Minimum buffer: allow up to 10 minutes in the past for network/form latency
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    if (start < tenMinutesAgo) {
      return NextResponse.json(
        { success: false, message: 'Waktu mulai peminjaman tidak boleh di masa lampau' },
        { status: 400 }
      );
    }

    // Check sarpras existence and operational status
    const sarpras = await prisma.sarpras.findUnique({
      where: { id_sarpras },
    });

    if (!sarpras) {
      return NextResponse.json({ success: false, message: 'Sarpras tidak ditemukan' }, { status: 404 });
    }

    if (sarpras.status_operasional !== 'Tersedia') {
      return NextResponse.json(
        {
          success: false,
          message: `Fasilitas ini sedang berstatus "${sarpras.status_operasional}" dan tidak dapat dipinjam saat ini.`,
        },
        { status: 400 }
      );
    }

    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    // ACID Transaction for schedule lock & overlap prevention (PRD UC-03 & §9.6)
    const result = await prisma.$transaction(async (tx) => {
      // Overlap condition: (tgl_mulai < existing.tgl_selesai) AND (tgl_selesai > existing.tgl_mulai)
      // for status_transaksi IN ('Pending', 'Disetujui')
      const conflicts = await tx.peminjaman.findMany({
        where: {
          id_sarpras,
          status_transaksi: { in: ['Pending', 'Disetujui'] },
          tgl_mulai: { lt: end },
          tgl_selesai: { gt: start },
        },
        include: {
          pemohon: { select: { nama_lengkap: true } },
        },
      });

      if (conflicts.length > 0) {
        // Find alternative sarpras with the same category that are available during [start, end]
        const sameCategorySarpras = await tx.sarpras.findMany({
          where: {
            kategori: sarpras.kategori,
            status_operasional: 'Tersedia',
            id_sarpras: { not: sarpras.id_sarpras },
          },
        });

        const alternatives = [];
        for (const alt of sameCategorySarpras) {
          const altConflicts = await tx.peminjaman.count({
            where: {
              id_sarpras: alt.id_sarpras,
              status_transaksi: { in: ['Pending', 'Disetujui'] },
              tgl_mulai: { lt: end },
              tgl_selesai: { gt: start },
            },
          });

          if (altConflicts === 0) {
            alternatives.push({
              id_sarpras: alt.id_sarpras,
              kode_aset: alt.kode_aset,
              nama_sarpras: alt.nama_sarpras,
              lokasi_plat: alt.lokasi_plat,
              spesifikasi: alt.spesifikasi,
            });
          }
        }

        return {
          conflict: true,
          conflicts,
          alternatives,
        };
      }

      // Generate unique transaction code: TRX-YYYYMMDD-XXXX
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const prefix = `TRX-${yyyy}${mm}${dd}-`;

      const todayBookingsCount = await tx.peminjaman.count({
        where: {
          kode_transaksi: { startsWith: prefix },
        },
      });

      const sequence = String(todayBookingsCount + 1).padStart(4, '0');
      let kodeTransaksi = `${prefix}${sequence}`;

      // Guarantee uniqueness if counter collides
      const existingKode = await tx.peminjaman.findUnique({
        where: { kode_transaksi: kodeTransaksi },
      });
      if (existingKode) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        kodeTransaksi = `${prefix}${rand}`;
      }

      let agendaLengkap = maksud_kegiatan.trim();
      if (jumlah_unit && jumlah_unit > 1) {
        agendaLengkap += `\n[Jumlah Unit: ${jumlah_unit}]`;
      }
      if (catatan_teknis && catatan_teknis.trim()) {
        agendaLengkap += `\n[Catatan Teknis: ${catatan_teknis.trim()}]`;
      }

      const newBooking = await tx.peminjaman.create({
        data: {
          kode_transaksi: kodeTransaksi,
          id_pemohon: session.id_user,
          id_sarpras,
          tgl_mulai: start,
          tgl_selesai: end,
          maksud_kegiatan: agendaLengkap,
          status_transaksi: 'Pending',
        },
        include: {
          sarpras: true,
          pemohon: {
            select: { id_user: true, nama_lengkap: true, email: true, no_hp: true },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          id_user: session.id_user,
          aktivitas: `Pengajuan Peminjaman Baru [${kodeTransaksi}] untuk fasilitas "${sarpras.nama_sarpras}" (${formatDateTime(start)} s/d ${formatDateTime(end)})`,
          ip_address: ip,
        },
      });

      return {
        conflict: false,
        booking: newBooking,
      };
    });

    if (result.conflict) {
      return NextResponse.json(
        {
          success: false,
          error: 'JADWAL_BENTROK',
          message: 'Jadwal Bentrok: Fasilitas telah terisi atau dipesan pada slot waktu tersebut.',
          conflicts: result.conflicts?.map((c) => ({
            kode_transaksi: c.kode_transaksi,
            tgl_mulai: c.tgl_mulai,
            tgl_selesai: c.tgl_selesai,
            status_transaksi: c.status_transaksi,
          })),
          saran_alternatif: result.alternatives,
        },
        { status: 409 }
      );
    }

    // Trigger notification to Kasubag & Staf (Skenario 3 PRD §14)
    const booking = result.booking!;
    await NotificationService.notifyBookingCreated({
      kode_transaksi: booking.kode_transaksi,
      sarpras_nama: booking.sarpras.nama_sarpras,
      pemohon_nama: session.nama_lengkap,
      pemohon_role: session.role,
      tgl_mulai: booking.tgl_mulai,
      tgl_selesai: booking.tgl_selesai,
      maksud_kegiatan: booking.maksud_kegiatan,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Pengajuan peminjaman berhasil dikirim. Menunggu verifikasi teknis staf dan persetujuan Kasubag Umum.',
        data: booking,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error submitting booking:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan sistem saat memproses peminjaman', error: error?.message },
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
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const pemohonId = searchParams.get('pemohon_id');

    const isInternalStaff = ['Kasubag', 'Staf', 'Kabag', 'Admin'].includes(session.role);

    const where: any = {};

    // Restrict regular applicants to their own bookings
    if (!isInternalStaff) {
      where.id_pemohon = session.id_user;
    } else if (pemohonId) {
      where.id_pemohon = pemohonId;
    }

    if (status && status !== 'Semua') {
      where.status_transaksi = status;
    }

    if (search) {
      where.OR = [
        { kode_transaksi: { contains: search } },
        { maksud_kegiatan: { contains: search } },
        { sarpras: { nama_sarpras: { contains: search } } },
        { sarpras: { lokasi_plat: { contains: search } } },
      ];
    }

    const bookings = await prisma.peminjaman.findMany({
      where,
      include: {
        sarpras: true,
        pemohon: {
          select: {
            id_user: true,
            nama_lengkap: true,
            email: true,
            no_hp: true,
            role: true,
            pemohon_detail: true,
          },
        },
        approver: {
          select: {
            id_user: true,
            nama_lengkap: true,
            email: true,
          },
        },
        tiket_digital: true,
        bast_digital: true,
        verifikasi_fisik: {
          include: {
            staf: {
              select: { nama_lengkap: true },
            },
          },
          orderBy: { created_at: 'desc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: bookings,
      total: bookings.length,
    });
  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data peminjaman', error: error?.message },
      { status: 500 }
    );
  }
}
