import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Wrench, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Halaman Ini Sedang Dalam Pengembangan | SIMASPRAS Poltekimipas',
  description: 'Halaman ini sedang dalam tahap pengembangan',
};

export default function PengaduanPage() {
  return (
    <div className="min-h-[calc(100vh-8.5rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="border-slate-200 bg-white shadow-lg overflow-hidden text-center rounded-2xl">
          <div className="h-2 bg-[#034275]" />

          <CardContent className="p-8 sm:p-10 space-y-6">
            {/* Icon di atas */}
            <div className="mx-auto w-20 h-20 rounded-2xl bg-blue-50 text-[#034275] flex items-center justify-center shadow-xs">
              <Wrench className="h-10 w-10" />
            </div>

            {/* Tulisan Judul Tunggal */}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-snug">
              Halaman Ini Sedang Dalam Pengembangan
            </h1>

            {/* Tombol Kembali di bawah */}
            <div className="pt-2">
              <Link href="/">
                <Button className="w-full sm:w-auto bg-[#034275] text-white hover:bg-[#022b4d] px-8 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-2 mx-auto font-semibold text-sm transition-all active:scale-[0.98]">
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke Halaman Utama
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
