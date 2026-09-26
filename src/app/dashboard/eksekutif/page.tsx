'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import {
  BarChart3,
  Building2,
  Car,
  Laptop,
  Users,
  CheckCircle2,
  Clock,
  FileText,
  FileSpreadsheet,
  TrendingUp,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface ExecutiveData {
  filter: {
    periode: string;
    kategori: string;
    startDate: string | null;
    endDate: string | null;
  };
  kpi: {
    totalSarpras: number;
    totalRuangan: number;
    totalMobil: number;
    totalPerangkat: number;
    totalPeminjaman: number;
    countPending: number;
    countDisetujui: number;
    countSelesai: number;
    countDibatalkan: number;
    countDitolak: number;
    roomOccupancyRate: number;
    carUtilizationRate: number;
    uniqueCarsUsed: number;
    deviceTurnoverRate: number;
    deviceBookingsCount: number;
  };
  distribusiPemohon: {
    internalCount: number;
    externalCount: number;
    internalPercentage: number;
    externalPercentage: number;
    breakdown: Record<string, number>;
  };
  monthlyTrend: Array<{
    monthKey: string;
    label: string;
    ruangan: number;
    mobil: number;
    perangkat: number;
    total: number;
  }>;
  topSarpras: Array<{
    sarpras: {
      id_sarpras: string;
      nama_sarpras: string;
      kode_aset: string;
      kategori: string;
      lokasi_plat: string;
    };
    count: number;
    hours: number;
  }>;
  recentBookings: Array<{
    id_peminjaman: string;
    kode_transaksi: string;
    sarpras_nama: string;
    sarpras_kategori: string;
    pemohon_nama: string;
    pemohon_role: string;
    tgl_mulai: string;
    tgl_selesai: string;
    status_transaksi: string;
    has_bast: boolean;
  }>;
}

export default function DashboardEksekutifPage() {
  const [data, setData] = useState<ExecutiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState<'bulan_ini' | 'semester_ini' | 'tahun_ini' | 'semua'>('semua');
  const [kategori, setKategori] = useState<string>('Semua');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/dashboard/eksekutif?periode=${periode}&kategori=${kategori}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Error fetching executive dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [periode, kategori]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const maxMonthlyCount = data
    ? Math.max(...data.monthlyTrend.map((m) => m.total), 1)
    : 1;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#034275] text-white shadow-sm">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Executive Monitoring Dashboard
              </h1>
              <p className="text-xs text-slate-500">
                Kepala Bagian Keuangan & Umum — Evaluasi utilisasi fasilitas, okupansi, dan laporan eksekutif (PRD UC-08).
              </p>
            </div>
          </div>
        </div>

        {/* Action & Role Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-900 text-xs px-3 py-1">
            Kabag Keuangan & Umum
          </Badge>

          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchData()}
            disabled={loading}
            className="text-xs h-8 flex items-center gap-1.5 border-slate-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </Button>

          {/* Export PDF Button */}
          <a
            href={`/api/dashboard/eksekutif/export?format=pdf&periode=${periode}&kategori=${kategori}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-8 flex items-center gap-1.5 border-[#034275] text-[#034275] hover:bg-blue-50"
            >
              <FileText className="h-3.5 w-3.5" />
              Laporan PDF
            </Button>
          </a>

          {/* Export Excel Button */}
          <a
            href={`/api/dashboard/eksekutif/export?format=excel&periode=${periode}&kategori=${kategori}`}
          >
            <Button
              size="sm"
              className="text-xs h-8 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Ekspor Excel (.xlsx)
            </Button>
          </a>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        {/* Period Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="font-semibold text-slate-500 mr-1 shrink-0">Periode:</span>
          {(
            [
              { key: 'semua', label: 'Semua Waktu' },
              { key: 'bulan_ini', label: 'Bulan Ini' },
              { key: 'semester_ini', label: 'Semester Ini' },
              { key: 'tahun_ini', label: 'Tahun Anggaran' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setPeriode(item.key)}
              className={`rounded-lg px-3 py-1.5 font-medium whitespace-nowrap transition-colors ${
                periode === item.key
                  ? 'bg-[#034275] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-semibold text-slate-500 shrink-0">Kategori:</span>
          <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#034275]"
          >
            <option value="Semua">Semua Sarpras</option>
            <option value="Ruangan">Ruangan</option>
            <option value="Mobil_Operasional">Mobil Operasional</option>
            <option value="Perangkat_Kerja">Perangkat Kerja</option>
          </select>
        </div>
      </div>

      {/* Executive KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Okupansi Ruangan */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 bg-slate-50/50">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Okupansi Ruangan Kampus
            </CardTitle>
            <Building2 className="h-4 w-4 text-[#034275]" />
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-extrabold text-[#034275]">
                {data ? `${data.kpi.roomOccupancyRate}%` : '...'}
              </div>
              <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-700 bg-blue-50">
                {data?.kpi.totalRuangan || 0} Unit Ruang
              </Badge>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#034275] h-full rounded-full transition-all duration-500"
                style={{ width: `${data?.kpi.roomOccupancyRate || 0}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Jam pemakaian vs kapasitas operasional kampus
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Utilisasi Mobil Operasional */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 bg-slate-50/50">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Utilisasi Armada Mobil
            </CardTitle>
            <Car className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-extrabold text-emerald-600">
                {data ? `${data.kpi.carUtilizationRate}%` : '...'}
              </div>
              <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700 bg-emerald-50">
                {data?.kpi.uniqueCarsUsed || 0}/{data?.kpi.totalMobil || 0} Mobil Aktif
              </Badge>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${data?.kpi.carUtilizationRate || 0}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Rasio armada kedinasan terpakai pada periode
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Perputaran Perangkat Kerja */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 bg-slate-50/50">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Perputaran Perangkat Kerja
            </CardTitle>
            <Laptop className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-extrabold text-amber-600">
                {data ? `${data.kpi.deviceTurnoverRate}%` : '...'}
              </div>
              <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-700 bg-amber-50">
                {data?.kpi.deviceBookingsCount || 0} Peminjaman
              </Badge>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, data?.kpi.deviceTurnoverRate || 0)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Frekuensi pemakaian proyektor, laptop, dan audio
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Tuntas BAST Paperless */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 bg-slate-50/50">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tuntas BAST Paperless
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-extrabold text-emerald-700">
                {data?.kpi.countSelesai || 0}
              </div>
              <Badge variant="success" className="text-[10px]">
                {data?.kpi.totalPeminjaman ? Math.round(((data.kpi.countSelesai) / data.kpi.totalPeminjaman) * 100) : 0}% Selesai
              </Badge>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${
                    data?.kpi.totalPeminjaman
                      ? Math.round(((data.kpi.countSelesai) / data.kpi.totalPeminjaman) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Dokumen BAST resmi tertandatangani QR Signature
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Monthly Trend Chart */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#034275]" />
                  Tren Utilisasi Sarpras Bulanan (6 Bulan Terakhir)
                </CardTitle>
                <CardDescription className="text-xs">
                  Frekuensi peminjaman aset Politeknik per bulan berdasarkan kategori fasilitas
                </CardDescription>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#034275]" /> Ruangan
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Mobil
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Perangkat
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {data && data.monthlyTrend.length > 0 ? (
              <div className="space-y-4">
                <div className="h-56 flex items-end justify-between gap-4 pt-4 px-2">
                  {data.monthlyTrend.map((m) => {
                    const totalH = Math.max(15, Math.round((m.total / maxMonthlyCount) * 180));
                    const roomH = m.total > 0 ? Math.round((m.ruangan / m.total) * totalH) : 0;
                    const carH = m.total > 0 ? Math.round((m.mobil / m.total) * totalH) : 0;
                    const devH = m.total > 0 ? Math.round((m.perangkat / m.total) * totalH) : 0;

                    return (
                      <div key={m.monthKey} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <div className="text-[11px] font-bold text-slate-700 opacity-80 group-hover:opacity-100">
                          {m.total}
                        </div>

                        {/* Stacked Bar */}
                        <div
                          className="w-full max-w-[48px] rounded-t-lg overflow-hidden flex flex-col justify-end bg-slate-100 shadow-inner"
                          style={{ height: `${totalH}px` }}
                        >
                          {devH > 0 && <div className="bg-amber-500 w-full" style={{ height: `${devH}px` }} />}
                          {carH > 0 && <div className="bg-emerald-500 w-full" style={{ height: `${carH}px` }} />}
                          {roomH > 0 && <div className="bg-[#034275] w-full" style={{ height: `${roomH}px` }} />}
                        </div>

                        <span className="text-[11px] font-semibold text-slate-500 truncate text-center">
                          {m.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Memuat data tren operasional...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Column 3: Demografi Pemohon (Internal vs Eksternal) */}
        <Card className="border-slate-200 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base text-slate-800 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#034275]" />
              Demografi Pemohon Sarpras
            </CardTitle>
            <CardDescription className="text-xs">
              Distribusi pengguna internal kampus vs eksternal institusi
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            {/* Visual ratio bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[#034275]">
                  Internal: {data?.distribusiPemohon.internalPercentage || 0}% ({data?.distribusiPemohon.internalCount || 0})
                </span>
                <span className="text-amber-700">
                  Eksternal: {data?.distribusiPemohon.externalPercentage || 0}% ({data?.distribusiPemohon.externalCount || 0})
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex shadow-inner">
                <div
                  className="bg-[#034275] h-full transition-all duration-500"
                  style={{ width: `${data?.distribusiPemohon.internalPercentage || 0}%` }}
                />
                <div
                  className="bg-amber-500 h-full transition-all duration-500"
                  style={{ width: `${data?.distribusiPemohon.externalPercentage || 0}%` }}
                />
              </div>
            </div>

            {/* Role Breakdown List */}
            <div className="space-y-2 text-xs divide-y divide-slate-100">
              <div className="pt-2 font-semibold text-slate-700">Rincian Peran Pemohon:</div>
              {data &&
                Object.entries(data.distribusiPemohon.breakdown).map(([role, count]) => (
                  <div key={role} className="flex justify-between items-center py-1.5 text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      {role}
                    </span>
                    <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {count}
                    </span>
                  </div>
                ))}
            </div>

            <div className="rounded-xl bg-blue-50/70 p-3 border border-blue-200 text-[11px] text-blue-900 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Penggunaan internal diprioritaskan untuk perkuliahan dan kedinasan utama Politeknik, sementara eksternal mendukung sinergi Kemenimipas.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Top 5 Sarpras & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Sarpras */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="py-4 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Top 5 Fasilitas Terpopuler & Paling Produktif
              </span>
              <span className="text-xs text-slate-400 font-normal">Berdasarkan frekuensi pinjam</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data && data.topSarpras.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {data.topSarpras.map((item, idx) => (
                  <div key={item.sarpras.id_sarpras} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 text-[#034275] flex items-center justify-center font-bold text-xs shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                          {item.sarpras.nama_sarpras}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.sarpras.lokasi_plat} • BMN: {item.sarpras.kode_aset}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-xs sm:text-sm text-[#034275]">
                        {item.count} Kali Dipinjam
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ~{item.hours} Jam Terpakai
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Belum ada data peminjaman sarpras pada filter ini.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions List */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="py-4 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#034275]" />
                Aktivitas Peminjaman Terkini
              </span>
              <span className="text-xs text-slate-400 font-normal">Siklus operasional realtime</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data && data.recentBookings.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {data.recentBookings.map((b) => (
                  <div key={b.id_peminjaman} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[11px] text-[#034275] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {b.kode_transaksi}
                        </span>
                        <Badge
                          variant={
                            b.status_transaksi === 'Selesai'
                              ? 'selesai'
                              : b.status_transaksi === 'Disetujui'
                              ? 'disetujui'
                              : b.status_transaksi === 'Pending'
                              ? 'pending'
                              : 'destructive'
                          }
                          className="text-[10px]"
                        >
                          {b.status_transaksi}
                        </Badge>
                        {b.has_bast && (
                          <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-800 bg-emerald-50">
                            ✓ BAST Sah
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-slate-800">
                        {b.sarpras_nama}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Peminjam: {b.pemohon_nama} ({b.pemohon_role})
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-500 shrink-0">
                      <div>{formatDateTime(b.tgl_mulai)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Belum ada transaksi pada periode ini.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
