import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Car, Laptop, MapPin, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default async function KatalogPage() {
  const user = await getSession();

  const sarprasList = await prisma.sarpras.findMany({
    where: {
      status_operasional: {
        not: 'Non_Aktif',
      },
    },
    orderBy: {
      nama_sarpras: 'asc',
    },
  });

  const getIcon = (kategori: string) => {
    switch (kategori) {
      case 'Ruangan':
        return <Building2 className="h-6 w-6 text-[#034275]" />;
      case 'Mobil_Operasional':
        return <Car className="h-6 w-6 text-emerald-700" />;
      case 'Perangkat_Kerja':
      default:
        return <Laptop className="h-6 w-6 text-amber-700" />;
    }
  };

  const formatKategoriName = (kategori: string) => {
    if (kategori === 'Mobil_Operasional') return 'Mobil Operasional';
    if (kategori === 'Perangkat_Kerja') return 'Perangkat Kerja';
    return kategori;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#034275] to-[#022b4d] p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <Badge className="bg-white/10 text-white border-white/20 text-xs">
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-300" />
            Katalog Resmi Sarpras Poltekimipas
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Katalog Fasilitas & Jadwal Ketersediaan
          </h1>
          <p className="text-sm text-slate-200 max-w-2xl">
            Selamat datang, <strong>{user?.nama_lengkap}</strong> ({user?.role}). Pilih unit sarana dan prasarana di bawah untuk memeriksa ketersediaan dan melanjutkan pengajuan peminjaman digital.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/peminjaman/riwayat">
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 text-sm">
              Riwayat Peminjaman Saya
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid Katalog Sarpras */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Daftar Fasilitas Tersedia</h2>
          <span className="text-xs text-slate-500 font-medium">Total: {sarprasList.length} Unit Sarpras</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sarprasList.map((sarpras) => (
            <Card key={sarpras.id_sarpras} className="flex flex-col hover:shadow-md transition-shadow border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-100">{getIcon(sarpras.kategori)}</div>
                  <Badge
                    variant={
                      sarpras.status_operasional === 'Tersedia'
                        ? 'tersedia'
                        : sarpras.status_operasional === 'Maintenance'
                        ? 'maintenance'
                        : 'ditolak'
                    }
                  >
                    {sarpras.status_operasional}
                  </Badge>
                </div>
                <CardTitle className="text-lg pt-2">{sarpras.nama_sarpras}</CardTitle>
                <CardDescription className="text-xs font-mono text-slate-500">
                  {sarpras.kode_aset} • {formatKategoriName(sarpras.kategori)}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 flex-1 text-sm text-slate-600">
                <div className="flex items-start gap-2 text-xs">
                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span>{sarpras.lokasi_plat}</span>
                </div>
                {sarpras.spesifikasi && (
                  <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {sarpras.spesifikasi}
                  </p>
                )}
              </CardContent>

              <CardFooter className="pt-0 border-t border-slate-100 mt-auto p-4">
                <Link
                  href={`/peminjaman/ajukan?sarpras=${sarpras.id_sarpras}`}
                  className="w-full"
                >
                  <Button
                    size="sm"
                    className="w-full flex items-center justify-center gap-1.5"
                    disabled={sarpras.status_operasional !== 'Tersedia'}
                  >
                    <Calendar className="h-4 w-4" />
                    {sarpras.status_operasional === 'Tersedia'
                      ? 'Lanjutkan Peminjaman'
                      : 'Sedang Tidak Tersedia'}
                    {sarpras.status_operasional === 'Tersedia' && <ArrowRight className="h-4 w-4 ml-1" />}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
