import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Wrench,
  ArrowLeft,
  Clock,
  Building2,
  PhoneCall,
  Sparkles,
} from 'lucide-react';

export const metadata = {
  title: 'Pengaduan Sarpras Rusak - Sedang Dalam Pengembangan | SIMASPRAS',
  description: 'Layanan Pengaduan Sarana dan Prasarana Rusak Poltekimipas',
};

export default function PengaduanPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <Card className="border-slate-200 shadow-xl overflow-hidden text-center">
          <div className="h-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-[#034275]" />
          
          <CardContent className="p-8 sm:p-10 space-y-6">
            {/* Icon Banner */}
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-3xl bg-amber-100/70 rotate-6" />
              <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
                <Wrench className="h-11 w-11 animate-pulse" />
              </div>
            </div>

            {/* Badge & Title */}
            <div className="space-y-2">
              <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 text-xs py-1 px-3">
                <Clock className="mr-1.5 h-3.5 w-3.5 text-amber-600" />
                Tahap Pengembangan Sistem
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Halaman Ini Sedang Dalam Pengembangan
              </h1>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Modul digital <strong>Pengaduan Sarpras Rusak</strong> sedang dalam tahap integrasi teknis oleh
                Bagian Umum BPSDM Imipas dan akan segera diluncurkan untuk mempermudah pelaporan serta
                percepatan tindak lanjut perbaikan fasilitas kampus.
              </p>
            </div>

            {/* Information Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-left text-xs text-slate-600 space-y-2.5">
              <div className="flex items-center gap-2 font-semibold text-slate-800 text-xs">
                <Building2 className="h-4 w-4 text-[#034275]" />
                Layanan Pelaporan Darurat / Mendesak:
              </div>
              <p className="leading-relaxed">
                Bila Anda menemukan kerusakan fasilitas mendesak yang memerlukan penanganan darurat segera (seperti kebocoran, kelistrikan, atau AC ruang sidang/kuliah), silakan hubungi langsung:
              </p>
              <div className="flex items-center gap-2 text-slate-800 font-medium bg-white p-2.5 rounded-lg border border-slate-200">
                <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
                <span>Meja Layanan Bagian Umum Gedung Utama: <strong>Ext. 114 / Ruang Sarpras Lantai 2</strong></span>
              </div>
            </div>

            {/* Return Button */}
            <div className="pt-2">
              <Link href="/">
                <Button className="w-full sm:w-auto bg-[#034275] text-white hover:bg-[#02335c] px-8 py-2.5 shadow-md flex items-center justify-center gap-2 mx-auto font-semibold">
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke Halaman Utama
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer Brand Note */}
        <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[#034275]" />
          <span>SIMASPRAS • Politeknik Imigrasi dan Pemasyarakatan Indonesia</span>
        </div>
      </div>
    </div>
  );
}
