import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { CheckCircle2, Clock } from 'lucide-react';

export default async function KasubagApprovalPage() {
  const pendingList = await prisma.peminjaman.findMany({
    where: { status_transaksi: 'Pending' },
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
          <CheckCircle2 className="h-7 w-7 text-[#034275]" />
          Dasbor Persetujuan Peminjaman Sarpras
        </h1>
        <p className="text-sm text-slate-500">
          Kasubag Bagian Umum — Tinjau dan putuskan persetujuan permohonan digital masuk (PRD UC-05 / UI-05).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Antrean Pengajuan Menunggu Persetujuan</CardTitle>
          <CardDescription>
            Menampilkan permohonan dengan status Pending Approval Kasubag beserta hasil verifikasi awal Staf Umum.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingList.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Clock className="mx-auto h-10 w-10 text-slate-400" />
              <p className="font-medium text-slate-700">Belum ada pengajuan baru yang menunggu persetujuan</p>
              <p className="text-xs">Seluruh permohonan peminjaman telah dievaluasi.</p>
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
                    <th className="px-4 py-3">Maksud Agenda</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {pendingList.map((item) => (
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
                      <td className="px-4 py-3 max-w-[200px] truncate text-slate-600">{item.maksud_kegiatan}</td>
                      <td className="px-4 py-3">
                        <Badge variant="pending">Pending Kasubag</Badge>
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
