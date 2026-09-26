import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { ClipboardCheck, CheckCircle2 } from 'lucide-react';

export default async function StafVerifikasiPage() {
  const transactions = await prisma.peminjaman.findMany({
    include: {
      pemohon: true,
      sarpras: true,
      verifikasi_fisik: true,
    },
    orderBy: { created_at: 'desc' },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
          <ClipboardCheck className="h-7 w-7 text-[#034275]" />
          Dasbor Verifikasi Fisik & Jadwal Sarpras
        </h1>
        <p className="text-sm text-slate-500">
          Staf Bagian Umum — Verifikasi kelayakan teknis pra-approval dan inspeksi pasca-pengembalian (PRD UC-06 / UI-06).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Tugas Verifikasi Lapangan</CardTitle>
          <CardDescription>
            Pemeriksaan ketersediaan fisik, tidak ada bentrok jadwal nyata, dan kondisi fisik peralatan/ruang/kendaraan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
              <p className="font-medium text-slate-700">Tidak ada antrean tugas verifikasi</p>
              <p className="text-xs">Seluruh sarpras telah diverifikasi dengan baik.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Kode Transaksi</th>
                    <th className="px-4 py-3">Pemohon</th>
                    <th className="px-4 py-3">Fasilitas Sarpras</th>
                    <th className="px-4 py-3">Jadwal Penggunaan</th>
                    <th className="px-4 py-3">Status Transaksi</th>
                    <th className="px-4 py-3">Hasil Inspeksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {transactions.map((item) => (
                    <tr key={item.id_peminjaman} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{item.kode_transaksi}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{item.pemohon.nama_lengkap}</div>
                        <div className="text-[11px] text-slate-500">{item.pemohon.role}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{item.sarpras.nama_sarpras}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDateTime(item.tgl_mulai)} s/d {formatDateTime(item.tgl_selesai)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            item.status_transaksi === 'Disetujui'
                              ? 'disetujui'
                              : item.status_transaksi === 'Pending'
                              ? 'pending'
                              : item.status_transaksi === 'Selesai'
                              ? 'selesai'
                              : 'dibatalkan'
                          }
                        >
                          {item.status_transaksi}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {item.verifikasi_fisik.length > 0 ? (
                          <span className="text-emerald-700 font-medium">Terverifikasi</span>
                        ) : (
                          <span className="text-amber-700 font-medium">Perlu Inspeksi</span>
                        )}
                      </td>
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
