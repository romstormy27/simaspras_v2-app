import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ExecutiveReportDocument, ExecutiveReportPdfData } from '@/lib/pdf/executive-report';
import { generateExecutiveExcelBuffer } from '@/lib/excel/generate-executive-excel';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Harap login terlebih dahulu' }, { status: 401 });
    }

    const allowedRoles = ['Kabag', 'Kasubag', 'Admin'];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Hanya Pimpinan yang dapat mengekspor laporan eksekutif.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const format = (searchParams.get('format') || 'pdf').toLowerCase();
    const periode = searchParams.get('periode') || 'semua';
    const kategori = searchParams.get('kategori') || 'Semua';

    // 1. Calculate Date Range
    const now = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    let periodeLabel = 'Semua Riwayat Operasional';

    if (periode === 'bulan_ini') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      periodeLabel = `Bulan ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    } else if (periode === 'semester_ini') {
      const isSecondSemester = now.getMonth() >= 6;
      startDate = new Date(now.getFullYear(), isSecondSemester ? 6 : 0, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), isSecondSemester ? 11 : 5, isSecondSemester ? 31 : 30, 23, 59, 59, 999);
      periodeLabel = `Semester ${isSecondSemester ? 'II' : 'I'} Tahun ${now.getFullYear()}`;
    } else if (periode === 'tahun_ini') {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      periodeLabel = `Tahun Anggaran ${now.getFullYear()}`;
    }

    const bookingWhere: any = {};
    if (startDate && endDate) {
      bookingWhere.tgl_mulai = { gte: startDate, lte: endDate };
    }
    if (kategori !== 'Semua') {
      bookingWhere.sarpras = { kategori };
    }

    // 2. Fetch Data
    const [
      totalRuangan,
      totalMobil,
      totalPerangkat,
      allSarpras,
      bookings,
    ] = await Promise.all([
      prisma.sarpras.count({ where: { kategori: 'Ruangan', status_operasional: { not: 'Non_Aktif' } } }),
      prisma.sarpras.count({ where: { kategori: 'Mobil_Operasional', status_operasional: { not: 'Non_Aktif' } } }),
      prisma.sarpras.count({ where: { kategori: 'Perangkat_Kerja', status_operasional: { not: 'Non_Aktif' } } }),
      prisma.sarpras.findMany({ where: { status_operasional: { not: 'Non_Aktif' } } }),
      prisma.peminjaman.findMany({
        where: bookingWhere,
        include: {
          sarpras: true,
          pemohon: true,
          bast_digital: true,
        },
        orderBy: { tgl_mulai: 'desc' },
      }),
    ]);

    const totalSarpras = totalRuangan + totalMobil + totalPerangkat;
    const totalPeminjaman = bookings.length;
    const countPending = bookings.filter((b) => b.status_transaksi === 'Pending').length;
    const countDisetujui = bookings.filter((b) => b.status_transaksi === 'Disetujui').length;
    const countSelesai = bookings.filter((b) => b.status_transaksi === 'Selesai').length;
    const countDibatalkan = bookings.filter((b) => b.status_transaksi === 'Dibatalkan').length;
    const countDitolak = bookings.filter((b) => b.status_transaksi === 'Ditolak').length;

    const effectiveBookings = bookings.filter((b) => ['Disetujui', 'Selesai'].includes(b.status_transaksi));

    // Ruangan hours
    let roomHoursUsed = 0;
    effectiveBookings.filter((b) => b.sarpras.kategori === 'Ruangan').forEach((b) => {
      const diff = new Date(b.tgl_selesai).getTime() - new Date(b.tgl_mulai).getTime();
      roomHoursUsed += Math.max(1, diff / (1000 * 60 * 60));
    });
    const operationalHoursPerUnit = periode === 'bulan_ini' ? 176 : periode === 'semester_ini' ? 1056 : 2112;
    const totalPotentialHours = Math.max(1, totalRuangan * operationalHoursPerUnit);
    const roomOccupancyRate = Math.min(100, Math.round((roomHoursUsed / totalPotentialHours) * 100));

    // Car rate
    const carBookings = effectiveBookings.filter((b) => b.sarpras.kategori === 'Mobil_Operasional');
    const uniqueCars = new Set(carBookings.map((b) => b.id_sarpras)).size;
    const carUtilizationRate = totalMobil > 0 ? Math.min(100, Math.round((uniqueCars / totalMobil) * 100)) : 0;

    // Device turnover
    const devBookings = effectiveBookings.filter((b) => b.sarpras.kategori === 'Perangkat_Kerja');
    const deviceTurnoverRate = totalPerangkat > 0 ? Math.min(100, Math.round((devBookings.length / totalPerangkat) * 10)) : 0;

    // Demographics
    const internalRoles = ['Dosen', 'Taruna'];
    const externalRoles = ['BPSDM', 'Kementerian', 'Alumni'];
    let internalCount = 0;
    let externalCount = 0;
    const breakdown: Record<string, number> = { Dosen: 0, Taruna: 0, BPSDM: 0, Kementerian: 0, Alumni: 0 };
    bookings.forEach((b) => {
      if (internalRoles.includes(b.pemohon.role)) internalCount++;
      if (externalRoles.includes(b.pemohon.role)) externalCount++;
      breakdown[b.pemohon.role] = (breakdown[b.pemohon.role] || 0) + 1;
    });
    const totalCount = internalCount + externalCount;
    const internalPercentage = totalCount > 0 ? Math.round((internalCount / totalCount) * 100) : 0;
    const externalPercentage = totalCount > 0 ? Math.round((externalCount / totalCount) * 100) : 0;

    // Sarpras Stats
    const usageCounts: Record<string, number> = {};
    bookings.forEach((b) => {
      usageCounts[b.id_sarpras] = (usageCounts[b.id_sarpras] || 0) + 1;
    });

    const sarprasStats = allSarpras.map((s) => ({
      kode_aset: s.kode_aset,
      nama_sarpras: s.nama_sarpras,
      kategori: s.kategori,
      lokasi_plat: s.lokasi_plat,
      status_operasional: s.status_operasional,
      total_dipinjam: usageCounts[s.id_sarpras] || 0,
    })).sort((a, b) => b.total_dipinjam - a.total_dipinjam);

    const generatedAt = new Date().toLocaleString('id-ID');

    // 3. Generate Output by Format
    if (format === 'excel' || format === 'xlsx') {
      const excelBookings = bookings.map((b) => ({
        kode_transaksi: b.kode_transaksi,
        sarpras_nama: b.sarpras.nama_sarpras,
        sarpras_kode: b.sarpras.kode_aset,
        sarpras_kategori: b.sarpras.kategori,
        pemohon_nama: b.pemohon.nama_lengkap,
        pemohon_role: b.pemohon.role,
        tgl_mulai: b.tgl_mulai,
        tgl_selesai: b.tgl_selesai,
        maksud_kegiatan: b.maksud_kegiatan,
        status_transaksi: b.status_transaksi,
        nomor_bast: b.bast_digital?.nomor_bast || null,
      }));

      const excelBuffer = await generateExecutiveExcelBuffer({
        periodeLabel,
        generatedAt,
        generatedBy: session.nama_lengkap,
        kpi: {
          totalSarpras,
          totalRuangan,
          totalMobil,
          totalPerangkat,
          totalPeminjaman,
          countPending,
          countDisetujui,
          countSelesai,
          countDibatalkan,
          countDitolak,
          roomOccupancyRate,
          carUtilizationRate,
          deviceTurnoverRate,
        },
        distribusiPemohon: {
          internalCount,
          externalCount,
          internalPercentage,
          externalPercentage,
          breakdown,
        },
        bookings: excelBookings,
        sarprasStats,
      });

      return new Response(new Uint8Array(excelBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="Laporan_Eksekutif_SIMASPRAS_${now.toISOString().slice(0, 10)}.xlsx"`,
        },
      });
    }

    // Default: PDF format
    const pdfData: ExecutiveReportPdfData = {
      periodeLabel,
      generatedAt,
      generatedBy: session.nama_lengkap,
      kabagNama: session.role === 'Kabag' ? session.nama_lengkap : 'Drs. Bambang Irawan, M.M.',
      kpi: {
        totalSarpras,
        totalRuangan,
        totalMobil,
        totalPerangkat,
        totalPeminjaman,
        countPending,
        countDisetujui,
        countSelesai,
        countDibatalkan,
        countDitolak,
        roomOccupancyRate,
        carUtilizationRate,
        deviceTurnoverRate,
      },
      distribusiPemohon: {
        internalCount,
        externalCount,
        internalPercentage,
        externalPercentage,
        breakdown,
      },
      sarprasStats,
    };

    const doc = React.createElement(ExecutiveReportDocument, { data: pdfData });
    const pdfBuffer = await renderToBuffer(doc as any);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Laporan_Eksekutif_SIMASPRAS_${now.toISOString().slice(0, 10)}.pdf"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghasilkan ekspor laporan eksekutif';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
