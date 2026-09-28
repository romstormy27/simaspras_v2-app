'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import {
  Building2,
  Clock,
  Printer,
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Sparkles,
  Download,
} from 'lucide-react';
import Link from 'next/link';

interface TicketData {
  id_tiket: string;
  kode_qr: string;
  status_tiket: string;
  qr_image: string;
  peminjaman: {
    kode_transaksi: string;
    tgl_mulai: string;
    tgl_selesai: string;
    maksud_kegiatan: string;
    sarpras: {
      kode_aset: string;
      nama_sarpras: string;
      kategori: string;
      lokasi_plat: string;
      spesifikasi: string | null;
    };
    pemohon: {
      id_user: string;
      nama_lengkap: string;
      email: string;
      no_hp: string;
      role: string;
      pemohon_detail?: {
        nomor_identitas: string;
        instansi_kategori: string;
      } | null;
    };
    approver?: {
      nama_lengkap: string;
      email: string;
    } | null;
  };
}

export default function TiketDigitalPage() {
  const params = useParams();
  const id = params?.id as string;

  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchTicket = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/peminjaman/${id}/tiket`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || 'Gagal memuat tiket digital.');
          return;
        }
        setTicket(data.data);
      } catch (_err) {
        setError('Terjadi kesalahan koneksi saat memuat tiket digital.');
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQr = () => {
    if (!ticket?.qr_image) return;
    const link = document.createElement('a');
    link.href = ticket.qr_image;
    link.download = `QR-${ticket.peminjaman.kode_transaksi}.png`;
    link.click();
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center text-xs text-slate-400">
        Memuat Tiket Digital QR Code...
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center space-y-4">
        <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs font-semibold">
          {error || 'Tiket digital tidak ditemukan atau belum disetujui.'}
        </div>
        <Link href="/peminjaman/riwayat">
          <Button variant="outline" size="sm" className="text-xs">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Kembali ke Riwayat Peminjaman
          </Button>
        </Link>
      </div>
    );
  }

  const p = ticket.peminjaman;

  return (
    <div className="mx-auto max-w-xl px-3 sm:px-6 py-5 sm:py-8 space-y-4 sm:space-y-5 print:p-0 print:max-w-full">
      {/* Top Back & Print Actions (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4 print:hidden">
        <Link href="/peminjaman/riwayat" className="w-full sm:w-auto">
          <Button variant="ghost" size="sm" className="text-xs text-slate-600 hover:text-slate-900 w-full sm:w-auto justify-center sm:justify-start h-9">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Kembali ke Riwayat
          </Button>
        </Link>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadQr}
            className="text-xs flex items-center justify-center gap-1.5 flex-1 sm:flex-initial h-9"
          >
            <Download className="h-3.5 w-3.5" />
            Unduh QR
          </Button>

          <Button
            size="sm"
            onClick={handlePrint}
            className="text-xs flex items-center justify-center gap-1.5 bg-[#034275] hover:bg-[#02335c] flex-1 sm:flex-initial h-9"
          >
            <Printer className="h-3.5 w-3.5" />
            Cetak Tiket
          </Button>
        </div>
      </div>

      {/* Official Digital Ticket Card */}
      <Card className="border-slate-300 shadow-xl overflow-hidden rounded-2xl bg-white print:border-none print:shadow-none">
        {/* Ticket Header Banner */}
        <div className="bg-[#034275] text-white p-4 sm:p-5 text-center relative border-b border-[#02335c]">
          <div className="flex items-center justify-center gap-2 text-blue-200 text-[11px] font-semibold tracking-wider uppercase">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Politeknik Imigrasi dan Pemasyarakatan
          </div>
          <h1 className="text-base sm:text-lg font-bold mt-1 tracking-tight">
            TIKET DIGITAL PENGAMBILAN ASET SARPRAS
          </h1>
          <p className="text-[11px] text-blue-200 mt-0.5">
            Kementerian Imigrasi dan Pemasyarakatan Republik Indonesia
          </p>

          <div className="mt-2.5 sm:mt-3 inline-block">
            <Badge variant="success" className="text-xs py-0.5 px-3 font-mono">
              STATUS TIKET: {ticket.status_tiket.toUpperCase()}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* QR Code Centerpiece */}
          <div className="flex flex-col items-center justify-center p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <div className="bg-white p-2.5 sm:p-3 rounded-xl shadow-sm border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ticket.qr_image}
                alt="Kode QR Tiket Digital"
                className="w-44 sm:w-56 h-44 sm:h-56 object-contain mx-auto"
              />
            </div>
            <div className="mt-3 font-mono font-bold text-xs text-[#034275] bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200">
              {ticket.kode_qr}
            </div>
            <p className="text-[11px] text-slate-500 mt-2 max-w-xs">
              Tunjukkan atau pindai kode QR ini kepada Petugas Staf Bagian Umum saat pengambilan kunci atau serah terima fasilitas.
            </p>
          </div>

          {/* Transaction Metadata */}
          <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 text-xs">
            <div className="p-3 flex justify-between items-center">
              <span className="text-slate-500">Nomor Transaksi</span>
              <span className="font-mono font-bold text-slate-900">{p.kode_transaksi}</span>
            </div>

            <div className="p-3 flex justify-between items-center">
              <span className="text-slate-500">Nama Peminjam</span>
              <span className="font-bold text-slate-800">
                {p.pemohon.nama_lengkap} ({p.pemohon.role})
              </span>
            </div>

            {p.pemohon.pemohon_detail && (
              <div className="p-3 flex justify-between items-center">
                <span className="text-slate-500">NIP / NIM / Instansi</span>
                <span className="text-slate-700">
                  {p.pemohon.pemohon_detail.nomor_identitas} • {p.pemohon.pemohon_detail.instansi_kategori}
                </span>
              </div>
            )}

            <div className="p-3 flex justify-between items-center">
              <span className="text-slate-500">Kontak WhatsApp</span>
              <span className="font-mono text-slate-700">{p.pemohon.no_hp}</span>
            </div>
          </div>

          {/* Facility & Schedule Box */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-white border border-blue-200 text-[#034275] shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-blue-900 tracking-wider">
                  Fasilitas yang Dipinjam
                </div>
                <div className="font-bold text-sm text-slate-900">{p.sarpras.nama_sarpras}</div>
                <div className="flex items-center gap-1.5 text-slate-600 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>{p.sarpras.lokasi_plat} • BMN: {p.sarpras.kode_aset}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200/60">
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-500">Waktu Mulai:</div>
                <div className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3 text-[#034275]" />
                  {formatDateTime(p.tgl_mulai)}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-500">Waktu Selesai:</div>
                <div className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3 text-[#034275]" />
                  {formatDateTime(p.tgl_selesai)}
                </div>
              </div>
            </div>
          </div>

          {/* Agenda & Approver Signature Stamp */}
          <div className="space-y-2 text-xs">
            <div className="text-slate-500 font-semibold">Maksud / Agenda Kegiatan:</div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 italic text-slate-700 whitespace-pre-line">
              &quot;{p.maksud_kegiatan}&quot;
            </div>
          </div>

          {/* Approver Stamp */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 flex items-center justify-between text-xs text-emerald-950">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <div className="font-bold">Disetujui Resmi oleh Kasubag Umum</div>
                <div className="text-[11px] text-emerald-800">
                  {p.approver?.nama_lengkap || 'Kasubag Bagian Umum Politeknik'}
                </div>
              </div>
            </div>
            <div className="font-mono text-[10px] bg-white px-2.5 py-1 rounded-full border border-emerald-300 font-bold text-emerald-800">
              VERIFIED
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
