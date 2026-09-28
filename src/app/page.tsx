import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CalendarCheck,
  Wrench,
  ArrowRight,
  Sparkles,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

export const metadata = {
  title: 'Portal Layanan SIMASPRAS - Politeknik Imigrasi dan Pemasyarakatan Indonesia',
  description: 'Portal Layanan Peminjaman Sarpras dan Pengaduan Fasilitas Kampus Poltekimipas',
};

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-8.5rem)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      {/* Header Identitas Institusi */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <Badge
          variant="outline"
          className="border-blue-200 bg-blue-50/70 text-[#034275] text-xs py-1 px-3.5 font-semibold inline-flex items-center gap-1.5 shadow-xs"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          Kementerian Imigrasi dan Pemasyarakatan RI • BPSDM Imipas
        </Badge>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
          SIMASPRAS <span className="text-[#034275]">POLTEKIMIPAS</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
          Pusat Layanan Terpadu Sarana dan Prasarana Kampus Politeknik Imigrasi dan Pemasyarakatan Indonesia.
          Silakan pilih menu navigasi layanan yang Anda perlukan di bawah ini:
        </p>
      </div>

      {/* Grid Dua Tombol Navigasi Utama */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl w-full mx-auto">
        {/* Tombol Kiri: Peminjaman Sarpras -> /login */}
        <Link href="/login" className="block group focus:outline-none">
          <div className="h-full rounded-2xl border-2 border-slate-200 bg-white p-7 sm:p-8 shadow-sm hover:shadow-xl hover:border-[#034275] transition-all duration-300 relative overflow-hidden flex flex-col justify-between group-hover:-translate-y-1">
            {/* Top Accent Strip */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#034275] opacity-90 group-hover:opacity-100 transition-opacity" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#034275] group-hover:bg-[#034275] group-hover:text-white transition-all flex items-center justify-center shadow-xs">
                  <CalendarCheck className="h-7 w-7" />
                </div>
                <Badge className="bg-blue-50 text-[#034275] border-blue-200 text-[11px] font-semibold">
                  Layanan Utama
                </Badge>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 group-hover:text-[#034275] transition-colors">
                  Peminjaman Sarpras
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                  Layanan permohonan digital peminjaman Ruangan & Gedung, Mobil Operasional, serta Perangkat Kerja
                  dengan jadwal real-time, verifikasi teknis, dan BAST resmi.
                </p>
              </div>

              {/* Fitur Utama */}
              <div className="pt-2 space-y-1.5 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Katalog Fasilitas & Kalender Real-Time</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Penerbitan Tiket QR Serah Terima</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Berita Acara Digital (BAST) Sah Paperless</span>
                </div>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-[#034275] transition-colors">
                Masuk Sistem
              </span>
              <Button className="bg-[#034275] hover:bg-[#022b4d] text-white rounded-xl px-4 py-2 text-sm flex items-center gap-2 shadow-sm font-semibold pointer-events-none">
                Peminjaman Sarpras
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </Link>

        {/* Tombol Kanan: Pengaduan Sarpras Rusak -> /pengaduan */}
        <Link href="/pengaduan" className="block group focus:outline-none">
          <div className="h-full rounded-2xl border-2 border-slate-200 bg-white p-7 sm:p-8 shadow-sm hover:shadow-xl hover:border-amber-500 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group-hover:-translate-y-1">
            {/* Top Accent Strip */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500 opacity-90 group-hover:opacity-100 transition-opacity" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-all flex items-center justify-center shadow-xs">
                  <Wrench className="h-7 w-7" />
                </div>
                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 text-[11px] font-semibold">
                  Layanan Pengaduan
                </Badge>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                  Pengaduan Sarpras Rusak
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                  Layanan pelaporan kerusakan fasilitas fisik kampus, permohonan perbaikan darurat,
                  dan penanganan pemeliharaan teknis oleh Staf Bagian Umum.
                </p>
              </div>

              {/* Fitur Utama */}
              <div className="pt-2 space-y-1.5 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Pelaporan Cepat Kendala Fasilitas</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Inspeksi Lapangan & Tindak Lanjut</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Pemantauan Progres Perbaikan Fisik</span>
                </div>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-amber-700 transition-colors">
                Lapor Kerusakan
              </span>
              <Button
                variant="outline"
                className="border-amber-300 bg-amber-50/50 text-amber-800 group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-600 rounded-xl px-4 py-2 text-sm flex items-center gap-2 shadow-sm font-semibold pointer-events-none transition-all"
              >
                Pengaduan Sarpras Rusak
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </Link>
      </div>

      {/* Footer Info Tambahan */}
      <div className="text-center space-y-1 pt-2">
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span>Kampus Poltekimipas: Jl. Satria - Sudirman, Tanah Tinggi, Tangerang, Banten 15119</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Bagian Umum & Pengelolaan Fasilitas Kampus BPSDM Imipas
        </p>
      </div>
    </div>
  );
}
