import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Harap login terlebih dahulu' }, { status: 401 });
    }

    // Role check: Kabag, Kasubag, Admin
    const allowedRoles = ['Kabag', 'Kasubag', 'Admin'];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Dasbor Eksekutif hanya diperuntukkan bagi Pimpinan (Kabag / Kasubag / Admin).' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const periode = searchParams.get('periode') || 'semua'; // 'bulan_ini' | 'semester_ini' | 'tahun_ini' | 'semua'
    const kategoriFilter = searchParams.get('kategori') || 'Semua';

    // 1. Calculate Date Range
    const now = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (periode === 'bulan_ini') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (periode === 'semester_ini') {
      const isSecondSemester = now.getMonth() >= 6;
      startDate = new Date(now.getFullYear(), isSecondSemester ? 6 : 0, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), isSecondSemester ? 11 : 5, isSecondSemester ? 31 : 30, 23, 59, 59, 999);
    } else if (periode === 'tahun_ini') {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    // 2. Base Booking Filter
    const bookingWhere: any = {};
    if (startDate && endDate) {
      bookingWhere.tgl_mulai = {
        gte: startDate,
        lte: endDate,
      };
    }
    if (kategoriFilter !== 'Semua') {
      bookingWhere.sarpras = { kategori: kategoriFilter };
    }

    // 3. Inventory Totals (Sarpras)
    const [
      totalRuangan,
      totalMobil,
      totalPerangkat,
    ] = await Promise.all([
      prisma.sarpras.count({ where: { kategori: 'Ruangan', status_operasional: { not: 'Non_Aktif' } } }),
      prisma.sarpras.count({ where: { kategori: 'Mobil_Operasional', status_operasional: { not: 'Non_Aktif' } } }),
      prisma.sarpras.count({ where: { kategori: 'Perangkat_Kerja', status_operasional: { not: 'Non_Aktif' } } }),
    ]);

    const totalSarpras = totalRuangan + totalMobil + totalPerangkat;

    // 4. Booking Transactions in Period
    const bookings = await prisma.peminjaman.findMany({
      where: bookingWhere,
      include: {
        sarpras: true,
        pemohon: true,
        bast_digital: true,
        verifikasi_fisik: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const totalPeminjaman = bookings.length;
    const countPending = bookings.filter((b) => b.status_transaksi === 'Pending').length;
    const countDisetujui = bookings.filter((b) => b.status_transaksi === 'Disetujui').length;
    const countSelesai = bookings.filter((b) => b.status_transaksi === 'Selesai').length;
    const countDibatalkan = bookings.filter((b) => b.status_transaksi === 'Dibatalkan').length;
    const countDitolak = bookings.filter((b) => b.status_transaksi === 'Ditolak').length;

    // 5. Okupansi & Utilisasi Per Kategori
    // Active / finished bookings for utilization calculations
    const effectiveBookings = bookings.filter((b) => ['Disetujui', 'Selesai'].includes(b.status_transaksi));

    // A. Ruangan: Calculate total hours used
    const roomBookings = effectiveBookings.filter((b) => b.sarpras.kategori === 'Ruangan');
    let totalRoomHoursUsed = 0;
    roomBookings.forEach((b) => {
      const diffMs = new Date(b.tgl_selesai).getTime() - new Date(b.tgl_mulai).getTime();
      const hours = Math.max(1, diffMs / (1000 * 60 * 60));
      totalRoomHoursUsed += hours;
    });

    // Assume 8 hours/day, 22 working days in a month = ~176 operational hours per room per month
    const operationalHoursPerUnit = periode === 'bulan_ini' ? 176 : periode === 'semester_ini' ? 1056 : 2112;
    const totalPotentialRoomHours = Math.max(1, totalRuangan * operationalHoursPerUnit);
    const roomOccupancyRate = Math.min(100, Math.round((totalRoomHoursUsed / totalPotentialRoomHours) * 100));

    // B. Mobil Operasional: Trip count & unique vehicles used
    const carBookings = effectiveBookings.filter((b) => b.sarpras.kategori === 'Mobil_Operasional');
    const uniqueCarsUsed = new Set(carBookings.map((b) => b.id_sarpras)).size;
    const carUtilizationRate = totalMobil > 0 ? Math.min(100, Math.round((uniqueCarsUsed / totalMobil) * 100)) : 0;

    // C. Perangkat Kerja: Count
    const deviceBookings = effectiveBookings.filter((b) => b.sarpras.kategori === 'Perangkat_Kerja');
    const _uniqueDevicesUsed = new Set(deviceBookings.map((b) => b.id_sarpras)).size;
    const deviceTurnoverRate = totalPerangkat > 0 ? Math.min(100, Math.round((deviceBookings.length / totalPerangkat) * 10)) : 0;

    // 6. Applicant Distribution (Internal vs External)
    const internalRoles = ['Dosen', 'Taruna'];
    const externalRoles = ['BPSDM', 'Kementerian', 'Alumni'];

    let countInternal = 0;
    let countExternal = 0;
    const roleBreakdown: Record<string, number> = {
      Dosen: 0,
      Taruna: 0,
      BPSDM: 0,
      Kementerian: 0,
      Alumni: 0,
    };

    bookings.forEach((b) => {
      const role = b.pemohon.role;
      if (internalRoles.includes(role)) countInternal++;
      if (externalRoles.includes(role)) countExternal++;
      if (roleBreakdown[role] !== undefined) {
        roleBreakdown[role]++;
      } else {
        roleBreakdown[role] = 1;
      }
    });

    const totalApplicantCount = countInternal + countExternal;
    const internalPercentage = totalApplicantCount > 0 ? Math.round((countInternal / totalApplicantCount) * 100) : 0;
    const externalPercentage = totalApplicantCount > 0 ? Math.round((countExternal / totalApplicantCount) * 100) : 0;

    // 7. Monthly Trend (Past 6 Months)
    const monthlyTrend: Array<{
      monthKey: string;
      label: string;
      ruangan: number;
      mobil: number;
      perangkat: number;
      total: number;
    }> = [];

    const monthNamesIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    for (let i = 5; i >= 0; i--) {
      const target = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = target.getFullYear();
      const m = target.getMonth();
      const label = `${monthNamesIndo[m]} ${y}`;
      const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`;

      // Filter bookings that started in that month
      const monthBookings = bookings.filter((b) => {
        const d = new Date(b.tgl_mulai);
        return d.getFullYear() === y && d.getMonth() === m;
      });

      monthlyTrend.push({
        monthKey,
        label,
        ruangan: monthBookings.filter((b) => b.sarpras.kategori === 'Ruangan').length,
        mobil: monthBookings.filter((b) => b.sarpras.kategori === 'Mobil_Operasional').length,
        perangkat: monthBookings.filter((b) => b.sarpras.kategori === 'Perangkat_Kerja').length,
        total: monthBookings.length,
      });
    }

    // 8. Top 5 Most Borrowed Facilities
    const usageBySarpras: Record<string, { sarpras: any; count: number; hours: number }> = {};
    bookings.forEach((b) => {
      if (!usageBySarpras[b.id_sarpras]) {
        usageBySarpras[b.id_sarpras] = {
          sarpras: b.sarpras,
          count: 0,
          hours: 0,
        };
      }
      usageBySarpras[b.id_sarpras].count++;
      const diffMs = new Date(b.tgl_selesai).getTime() - new Date(b.tgl_mulai).getTime();
      usageBySarpras[b.id_sarpras].hours += Math.round(diffMs / (1000 * 60 * 60));
    });

    const topSarpras = Object.values(usageBySarpras)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 9. Recent Bookings (Limit 8)
    const recentBookings = bookings.slice(0, 8).map((b) => ({
      id_peminjaman: b.id_peminjaman,
      kode_transaksi: b.kode_transaksi,
      sarpras_nama: b.sarpras.nama_sarpras,
      sarpras_kategori: b.sarpras.kategori,
      pemohon_nama: b.pemohon.nama_lengkap,
      pemohon_role: b.pemohon.role,
      tgl_mulai: b.tgl_mulai,
      tgl_selesai: b.tgl_selesai,
      status_transaksi: b.status_transaksi,
      has_bast: !!b.bast_digital,
    }));

    return NextResponse.json({
      success: true,
      data: {
        filter: {
          periode,
          kategori: kategoriFilter,
          startDate: startDate ? startDate.toISOString() : null,
          endDate: endDate ? endDate.toISOString() : null,
        },
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
          uniqueCarsUsed,
          deviceTurnoverRate,
          deviceBookingsCount: deviceBookings.length,
        },
        distribusiPemohon: {
          internalCount: countInternal,
          externalCount: countExternal,
          internalPercentage,
          externalPercentage,
          breakdown: roleBreakdown,
        },
        monthlyTrend,
        topSarpras,
        recentBookings,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memproses agregasi data monitoring eksekutif';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
