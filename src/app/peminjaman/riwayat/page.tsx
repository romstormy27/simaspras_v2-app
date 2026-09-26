import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import { ClipboardList, Calendar, ArrowRight, Building2 } from 'lucide-react';
import Link from 'next/link';

export default async function RiwayatPeminjamanPage() {
  const user = await getSession();

  const myBookings = await prisma.peminjaman.findMany({
    where: {
      id_pemohon: user?.id_user,
    },
    include: {
      sarpras: true,
      tiket_digital: true,
      bast_digital: true,
    },
    orderBy: { created_at: 'desc' },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <ClipboardList className="h-7 w-7 text-[#034275]" />
            Riwayat Peminjaman Saya
          </h1>
          <p className="text-sm text-slate-500">
            Daftar seluruh transaksi peminjaman sarana dan prasarana yang pernah diajukan (PRD UC-04 / UI-04).
          </p>
        </div>

        <Link href="/katalog">
          <Button size="sm" className="flex items-center gap-1.5 self-start">
            <Calendar className="h-4 w-4" />
            Ajukan Peminjaman Baru
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaksi Peminjaman Fasilitas</CardTitle>
          <CardDescription>
            Pantau status verifikasi, persetujuan Kasubag Umum, dan tiket digital pengambilan aset.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myBookings.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-3">
              <Building2 className="mx-auto h-12 w-12 text-slate-300" />
              <div className="font-semibold text-slate-700">Belum Ada Riwayat Peminjaman</div>
              <p className="text-xs max-w-md mx-auto">
                Anda belum pernah mengajukan peminjaman sarana atau prasarana kampus. Silakan buka katalog untuk memilih fasilitas yang dibutuhkan.
              </p>
              <Link href="/katalog">
                <Button size="sm" className="mt-2">
                  Lihat Katalog Sarpras
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Kode Transaksi</th>
                    <th className="px-4 py-3">Fasilitas Sarpras</th>
                    <th className="px-4 py-3">Jadwal Penggunaan</th>
                    <th className="px-4 py-3">Tujuan Agenda</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Tiket / Dokumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {myBookings.map((item) => (
                    <tr key={item.id_peminjaman} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{item.kode_transaksi}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{item.sarpras.nama_sarpras}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDateTime(item.tgl_mulai)} s/d {formatDateTime(item.tgl_selesai)}
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate text-slate-600">{item.maksud_kegiatan}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            item.status_transaksi === 'Disetujui'
                              ? 'disetujui'
                              : item.status_transaksi === 'Pending'
                              ? 'pending'
                              : item.status_transaksi === 'Selesai'
                              ? 'selesai'
                              : item.status_transaksi === 'Ditolak'
                              ? 'ditolak'
                              : 'dibatalkan'
                          }
                        >
                          {item.status_transaksi}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {item.tiket_digital ? (
                          <span className="text-[#034275] font-semibold">Tiket QR Terbit</span>
                        ) : item.status_transaksi === 'Selesai' ? (
                          <span className="text-emerald-700 font-semibold">BAST Selesai</span>
                        ) : (
                          <span className="text-slate-400">-</span>
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
