import prisma from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function AdminSarprasPage() {
  const sarprasList = await prisma.sarpras.findMany({
    orderBy: { nama_sarpras: 'asc' },
  });

  const getKategoriBadge = (kategori: string) => {
    switch (kategori) {
      case 'Ruangan':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Ruangan</Badge>;
      case 'Mobil_Operasional':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Mobil Operasional</Badge>;
      case 'Perangkat_Kerja':
      default:
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Perangkat Kerja</Badge>;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Layers className="h-7 w-7 text-[#034275]" />
            Kelola Master Data Sarpras
          </h1>
          <p className="text-sm text-slate-500">
            Administrator — Pengelolaan fasilitas inventaris kampus: Ruangan, Kendaraan, dan Perangkat Kerja (PRD UC-09 / UI-09).
          </p>
        </div>

        <Button size="sm" className="flex items-center gap-1.5 self-start">
          <Plus className="h-4 w-4" />
          Tambah Sarpras Baru
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Katalog Master Fasilitas & Aset</CardTitle>
          <CardDescription>
            Seluruh data aset politeknik terintegrasi dengan kode inventaris BMN dan status operasional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Kode Aset</th>
                  <th className="px-4 py-3">Nama Fasilitas</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Lokasi / Nomor Plat</th>
                  <th className="px-4 py-3">Status Operasional</th>
                  <th className="px-4 py-3 text-right">Spesifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {sarprasList.map((s) => (
                  <tr key={s.id_sarpras} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{s.kode_aset}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{s.nama_sarpras}</td>
                    <td className="px-4 py-3">{getKategoriBadge(s.kategori)}</td>
                    <td className="px-4 py-3 text-slate-600">{s.lokasi_plat}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          s.status_operasional === 'Tersedia'
                            ? 'tersedia'
                            : s.status_operasional === 'Maintenance'
                            ? 'maintenance'
                            : 'ditolak'
                        }
                      >
                        {s.status_operasional}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500 max-w-[200px] truncate">
                      {s.spesifikasi || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
