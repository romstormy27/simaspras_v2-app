import prisma from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils';
import { FileCheck, CheckCircle2 } from 'lucide-react';

export default async function BASTDigitalPage() {
  const bastList = await prisma.bASTDigital.findMany({
    include: {
      kasubag: true,
      peminjaman: {
        include: {
          pemohon: true,
          sarpras: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
          <FileCheck className="h-7 w-7 text-[#034275]" />
          Berita Acara Serah Terima (BAST) Digital
        </h1>
        <p className="text-sm text-slate-500">
          Kasubag Bagian Umum — Konfirmasi resmi pengembalian fasilitas kampus tanpa denda finansial (PRD UC-07 / UI-07).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Arsip Dokumen BAST Digital Resmi</CardTitle>
          <CardDescription>
            Dokumen sah serah-terima pengembalian sarpras berstempel digital QR Signature.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bastList.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <CheckCircle2 className="mx-auto h-10 w-10 text-slate-400" />
              <p className="font-medium text-slate-700">Belum ada dokumen BAST yang diterbitkan</p>
              <p className="text-xs">Dokumen akan terbit otomatis saat transaksi peminjaman selesai diserahterimakan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Nomor BAST</th>
                    <th className="px-4 py-3">Kode Transaksi</th>
                    <th className="px-4 py-3">Peminjam</th>
                    <th className="px-4 py-3">Aset Fasilitas</th>
                    <th className="px-4 py-3">Waktu Penerbitan</th>
                    <th className="px-4 py-3">Approver Kasubag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {bastList.map((item) => (
                    <tr key={item.id_bast} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-mono font-bold text-[#034275]">{item.nomor_bast}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{item.peminjaman.kode_transaksi}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{item.peminjaman.pemohon.nama_lengkap}</td>
                      <td className="px-4 py-3 text-slate-800">{item.peminjaman.sarpras.nama_sarpras}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDateTime(item.created_at)}</td>
                      <td className="px-4 py-3 text-slate-700">{item.kasubag.nama_lengkap}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
