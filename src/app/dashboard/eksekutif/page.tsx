import prisma from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Building2, Car, Laptop, Users, CalendarCheck2 } from 'lucide-react';

export default async function DashboardEksekutifPage() {
  const totalSarpras = await prisma.sarpras.count();
  const totalRuangan = await prisma.sarpras.count({ where: { kategori: 'Ruangan' } });
  const totalMobil = await prisma.sarpras.count({ where: { kategori: 'Mobil_Operasional' } });
  const totalPerangkat = await prisma.sarpras.count({ where: { kategori: 'Perangkat_Kerja' } });
  const totalPeminjaman = await prisma.peminjaman.count();
  const totalUsers = await prisma.user.count({ where: { status_aktivasi: 'Aktif' } });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
          <BarChart3 className="h-7 w-7 text-[#034275]" />
          Executive Monitoring Dashboard
        </h1>
        <p className="text-sm text-slate-500">
          Kepala Bagian Keuangan dan Umum — Pemantauan pemanfaatan fasilitas dan evaluasi anggaran (PRD UC-08 / UI-08).
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Total Sarpras</CardTitle>
            <Building2 className="h-4 w-4 text-[#034275]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalSarpras} Unit</div>
            <p className="text-xs text-slate-500 mt-1">Aset terdaftar di sistem BMN</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Armada Mobil</CardTitle>
            <Car className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalMobil} Kendaraan</div>
            <p className="text-xs text-slate-500 mt-1">Siap untuk penugasan dinas</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Total Transaksi</CardTitle>
            <CalendarCheck2 className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalPeminjaman} Pengajuan</div>
            <p className="text-xs text-slate-500 mt-1">Seluruh siklus peminjaman digital</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Pengguna Aktif</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalUsers} Akun</div>
            <p className="text-xs text-slate-500 mt-1">Dosen, Taruna & Eksternal</p>
          </CardContent>
        </Card>
      </div>

      {/* Ringkasan Distribusi Aset */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribusi Inventaris Sarpras Poltekimipas</CardTitle>
          <CardDescription>Komposisi fasilitas sarana dan prasarana berdasarkan kategori aset.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg text-[#034275]">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">Ruangan & Gedung</div>
                <div className="text-xs text-slate-500">{totalRuangan} Ruangan Terdata</div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-lg text-emerald-800">
                <Car className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">Mobil Operasional</div>
                <div className="text-xs text-slate-500">{totalMobil} Armada Kendaraan</div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg text-amber-800">
                <Laptop className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">Perangkat Kerja</div>
                <div className="text-xs text-slate-500">{totalPerangkat} Unit Perangkat</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
