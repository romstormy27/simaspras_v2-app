import React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import QRCode from 'qrcode';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import {
  CheckCircle2,
  Download,
  Printer,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

export default async function PemohonBastViewPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login?from=' + encodeURIComponent(`/peminjaman/${params.id}/bast`));
  }

  // Find booking and bast
  const booking = await prisma.peminjaman.findFirst({
    where: {
      OR: [
        { id_peminjaman: params.id },
        { kode_transaksi: params.id },
      ],
    },
    include: {
      sarpras: true,
      pemohon: {
        include: {
          pemohon_detail: true,
        },
      },
      bast_digital: {
        include: {
          kasubag: true,
        },
      },
      verifikasi_fisik: {
        include: {
          staf: true,
        },
        orderBy: { created_at: 'desc' },
      },
    },
  });

  if (!booking || !booking.bast_digital) {
    notFound();
  }

  const bast = booking.bast_digital;
  const pascaVerif = booking.verifikasi_fisik.find(
    (v) => v.jenis_pemeriksaan === 'Pasca_Pengembalian'
  ) || booking.verifikasi_fisik[0];

  // Generate QR Code data URL for Kasubag signature
  const qrSignaturePayload = `BAST-VERIFIED|NO:${bast.nomor_bast}|KASUBAG:${bast.kasubag.nama_lengkap}|SIG:${bast.qr_signature}|DATE:${bast.created_at.toISOString()}`;
  const qrCodeDataUrl = await QRCode.toDataURL(qrSignaturePayload, {
    width: 250,
    margin: 1,
    color: {
      dark: '#034275',
      light: '#ffffff',
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/peminjaman/riwayat"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Riwayat Peminjaman
        </Link>

        <div className="flex items-center gap-2">
          <a
            href={`/api/bast/${bast.id_bast}/pdf`}
            target="_blank"
            rel="noreferrer"
          >
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-8 flex items-center gap-1.5 border-slate-300"
            >
              <Printer className="h-3.5 w-3.5" />
              Cetak / Buka PDF
            </Button>
          </a>

          <a
            href={`/api/bast/${bast.id_bast}/pdf?download=true`}
          >
            <Button
              size="sm"
              className="text-xs h-8 flex items-center gap-1.5 bg-[#034275] hover:bg-[#02335c] text-white"
            >
              <Download className="h-3.5 w-3.5" />
              Unduh PDF Resmi
            </Button>
          </a>
        </div>
      </div>

      {/* Main Certificate / BAST Sheet */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden print:border-none print:shadow-none">
        {/* Kop Institusi */}
        <div className="border-b-2 border-[#034275] p-6 sm:p-8 text-center bg-slate-50/60 space-y-1">
          <div className="text-xs font-bold tracking-wider text-slate-600 uppercase">
            Kementerian Imigrasi dan Pemasyarakatan RI
          </div>
          <div className="text-xs font-medium text-slate-500 uppercase">
            Badan Pengembangan Sumber Daya Manusia Imigrasi dan Pemasyarakatan
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#034275] uppercase tracking-wide">
            Politeknik Imigrasi dan Pemasyarakatan (Poltekimipas)
          </h2>
          <p className="text-[11px] text-slate-400">
            Jl. Satria - Sudirman, RT.001/RW.014, Tanah Tinggi, Kec. Tangerang, Kota Tangerang, Banten 15119 • Laman: poltekimipas.ac.id • SIMASPRAS Paperless
          </p>
        </div>

        {/* Certificate Title */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-1 border-b border-slate-100 pb-5">
            <Badge variant="selesai" className="px-3 py-1 text-xs">
              ✓ Serah Terima Sah & Selesai
            </Badge>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-2">
              BERITA ACARA SERAH TERIMA PENGEMBALIAN SARPRAS
            </h1>
            <p className="font-mono text-xs sm:text-sm font-bold text-[#034275]">
              Nomor: {bast.nomor_bast}
            </p>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed text-justify">
            Pada hari ini, tanggal{' '}
            <strong>
              {new Date(bast.created_at).toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </strong>
            , bertempat di Kampus Politeknik Imigrasi dan Pemasyarakatan, telah dilaksanakan pemeriksaan fisik,
            pengembalian fasilitas, dan penandatanganan Berita Acara Serah Terima (BAST) secara elektronik
            antara para pihak:
          </p>

          {/* Identitas Para Pihak */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1">
                Pihak Pertama (Peminjam)
              </div>
              <div className="space-y-1 text-slate-700">
                <div><strong>Nama:</strong> {booking.pemohon.nama_lengkap}</div>
                <div><strong>Peran:</strong> {booking.pemohon.role}</div>
                <div><strong>ID/NIP/NIM:</strong> {booking.pemohon.pemohon_detail?.nomor_identitas || '-'}</div>
                <div><strong>Unit/Instansi:</strong> {booking.pemohon.pemohon_detail?.instansi_kategori || '-'}</div>
                <div><strong>Kontak:</strong> {booking.pemohon.no_hp}</div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1">
                Pihak Kedua (Pengelola Sarpras)
              </div>
              <div className="space-y-1 text-slate-700">
                <div><strong>Nama:</strong> {bast.kasubag.nama_lengkap}</div>
                <div><strong>Jabatan:</strong> Kepala Sub Bagian Umum</div>
                <div><strong>Unit Kerja:</strong> Bagian Umum & Rumah Tangga</div>
                <div><strong>Email:</strong> {bast.kasubag.email}</div>
                <div><strong>Verifikasi:</strong> SIMASPRAS E-Signature</div>
              </div>
            </div>
          </div>

          {/* Rincian Sarpras */}
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs space-y-2">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1">
              Rincian Sarana / Prasarana yang Diserahterimakan
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-slate-700">
              <div><strong>Nama Fasilitas:</strong> {booking.sarpras.nama_sarpras}</div>
              <div><strong>Kode BMN:</strong> {booking.sarpras.kode_aset}</div>
              <div><strong>Kategori:</strong> {booking.sarpras.kategori.replace('_', ' ')}</div>
              <div><strong>Lokasi / Plat:</strong> {booking.sarpras.lokasi_plat}</div>
              <div><strong>Kode Transaksi:</strong> {booking.kode_transaksi}</div>
              <div>
                <strong>Jadwal Pakai:</strong> {formatDateTime(booking.tgl_mulai)} s/d {formatDateTime(booking.tgl_selesai)}
              </div>
              <div className="sm:col-span-2">
                <strong>Agenda Kegiatan:</strong> &quot;{booking.maksud_kegiatan}&quot;
              </div>
            </div>
          </div>

          {/* Laporan Pemeriksaan Fisik Staf */}
          <div className="rounded-2xl bg-emerald-50/70 p-4 border border-emerald-300 text-xs space-y-2">
            <div className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] flex items-center justify-between border-b border-emerald-200 pb-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Laporan Hasil Inspeksi Fisik Lapangan (Staf Bagian Umum)
              </span>
              <Badge variant="success">Lulus Inspeksi</Badge>
            </div>
            <div className="space-y-1 text-emerald-900">
              <div>
                <strong>Pemeriksa Lapangan:</strong> Staf Bagian Umum ({pascaVerif?.staf?.nama_lengkap || 'Tim Teknis Sarpras'})
              </div>
              <div>
                <strong>Kondisi Fisik:</strong>{' '}
                {pascaVerif?.kondisi_fisik === 'Baik_Sesuai'
                  ? 'Baik & Lengkap Sesuai Standar Operasional'
                  : 'Terdapat Catatan Khusus'}
              </div>
              <div>
                <strong>Catatan Pemeriksaan:</strong> &quot;
                {pascaVerif?.catatan_inspeksi ||
                  'Fasilitas dan seluruh kelengkapannya telah diserahterimakan kembali dalam keadaan utuh, bersih, dan siap untuk dipinjamkan kembali.'}
                &quot;
              </div>
            </div>
          </div>

          {/* Klausul Tanpa Denda Finansial (PRD §3.2) */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-blue-900 text-xs space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              Ketetapan SIMASPRAS Bebas Denda Finansial (PRD §3.2):
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Pengembalian fasilitas ini telah tuntas secara sah dan paperless. Sesuai kebijakan Politeknik
              Imigrasi dan Pemasyarakatan Indonesia, pengelolaan peminjaman sarpras diselenggarakan tanpa
              pengenaan denda finansial, melainkan melalui disiplin dan pembinaan institusional.
            </p>
          </div>

          {/* Lembar Tanda Tangan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 text-center">
            {/* Pihak Pertama */}
            <div className="flex flex-col items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div>
                <div className="font-bold text-xs text-slate-800 uppercase">PIHAK PERTAMA</div>
                <div className="text-[11px] text-slate-500">Yang Menyerahkan (Peminjam)</div>
              </div>
              <div className="py-4 text-xs italic text-slate-400">
                Disetujui secara digital melalui akun pemohon SIMASPRAS
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 underline">
                  {booking.pemohon.nama_lengkap}
                </div>
                <div className="text-[11px] text-slate-500">
                  {booking.pemohon.role} • {booking.pemohon.pemohon_detail?.nomor_identitas || '-'}
                </div>
              </div>
            </div>

            {/* Pihak Kedua */}
            <div className="flex flex-col items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div>
                <div className="font-bold text-xs text-slate-800 uppercase">PIHAK KEDUA</div>
                <div className="text-[11px] text-slate-500">Yang Menerima & Menyetujui</div>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCodeDataUrl}
                  alt="QR Signature Kasubag Umum"
                  className="h-24 w-24 object-contain"
                />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 underline">
                  {bast.kasubag.nama_lengkap}
                </div>
                <div className="text-[11px] text-slate-500">
                  Kepala Sub Bagian Umum Poltekimipas
                </div>
                <div className="font-mono text-[9px] text-slate-400 mt-0.5">
                  Token: {bast.qr_signature}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 text-center text-[11px] text-slate-500">
          Dokumen Berita Acara Serah Terima (BAST) ini diterbitkan secara sah oleh SIMASPRAS Poltekimipas dan
          memiliki kekuatan hukum internal institusi.
        </div>
      </div>
    </div>
  );
}
