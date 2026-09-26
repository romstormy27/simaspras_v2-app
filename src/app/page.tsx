import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Car,
  Laptop,
  ArrowRight,
  Sparkles,
  CheckCircle,
} from 'lucide-react';

export default async function HomePage() {
  const user = await getSession();

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#034275] to-[#022b4d] text-white py-20 px-4 sm:px-6 lg:px-8 shadow-inner">
        <div className="mx-auto max-w-5xl text-center space-y-6">
          <Badge className="bg-white/10 text-white hover:bg-white/20 border-white/20 py-1 px-3 text-xs">
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-300" />
            Sistem Informasi Resmi Poltekimipas
          </Badge>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Peminjaman Sarana dan Prasarana Kampus Berbasis Digital
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-200">
            Layanan peminjaman 100% *paperless* untuk Ruangan, Mobil Operasional, dan Perangkat Kerja
            dengan jadwal real-time, verifikasi terstruktur, dan BAST Digital resmi.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {user ? (
              <Link href="/katalog">
                <Button size="lg" className="bg-white text-[#034275] hover:bg-slate-100 font-semibold shadow-md">
                  Lihat Katalog & Kalender Sarpras
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button size="lg" className="bg-white text-[#034275] hover:bg-slate-100 font-semibold shadow-md">
                    Masuk ke Sistem
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                    Registrasi Pemohon Baru
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 3 Kategori Sarpras Utama */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Fasilitas Sarana dan Prasarana
          </h2>
          <p className="text-sm text-slate-500">
            Tersedia untuk kegiatan akademik, kedinasan, kemahasiswaan, dan agenda resmi kementerian
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow border-slate-200">
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-[#034275] flex items-center justify-center mb-2">
                <Building2 className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">Ruangan & Gedung</CardTitle>
              <CardDescription>
                Auditorium utama, ruang kelas perkuliahan, laboratorium komputer, dan ruang rapat pimpinan.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Kapasitas hingga 500 orang</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Dilengkapi Full AC, Audio, & Videotron</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Kalender ketersediaan real-time</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow border-slate-200">
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2">
                <Car className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">Mobil Operasional</CardTitle>
              <CardDescription>
                Armada kendaraan dinas, Bus Kampus, dan Toyota HiAce untuk perjalanan dinas resmi.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Unit prima & pengemudi kedinasan</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Dilengkapi pelacak GPS terintegrasi</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Inspeksi fisik sebelum & sesudah jalan</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow border-slate-200">
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-2">
                <Laptop className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">Perangkat Kerja</CardTitle>
              <CardDescription>
                Proyektor lumens tinggi, portable screen, perlengkapan sound system, dan laptop kerja.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Penerbitan Tiket QR pengambilan alat</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Pemeriksaan kondisi fisik terdata</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Pengembalian sah via BAST Digital</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Alur Kerja 4 Langkah */}
      <section className="bg-slate-100/70 py-12 border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Alur Peminjaman Paperless
            </h2>
            <p className="text-sm text-slate-500">
              Prosedur digital cepat tanpa formulir fisik dan bebas antrean manual
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 text-center space-y-2">
              <div className="mx-auto h-10 w-10 rounded-full bg-[#034275] text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">Pilih & Kunci Jadwal</h3>
              <p className="text-xs text-slate-500">
                Pilih sarpras pada kalender real-time dan setujui Pakta Integritas digital.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 text-center space-y-2">
              <div className="mx-auto h-10 w-10 rounded-full bg-[#034275] text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">Verifikasi Staf</h3>
              <p className="text-xs text-slate-500">
                Staf Bagian Umum memverifikasi kelayakan fisik dan kesiapan teknis fasilitas.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 text-center space-y-2">
              <div className="mx-auto h-10 w-10 rounded-full bg-[#034275] text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">Persetujuan & Tiket QR</h3>
              <p className="text-xs text-slate-500">
                Kasubag Umum menyetujui permohonan dan menerbitkan Tiket Digital Kode QR.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 text-center space-y-2">
              <div className="mx-auto h-10 w-10 rounded-full bg-[#034275] text-white flex items-center justify-center font-bold text-sm">
                4
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">BAST Digital</h3>
              <p className="text-xs text-slate-500">
                Konfirmasi serah-terima pengembalian resmi dengan dokumen BAST bertanda tangan QR.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
