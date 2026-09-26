'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatDateTime } from '@/lib/utils';
import {
  ClipboardList,
  Calendar,
  Building2,
  Car,
  Laptop,
  Search,
  Clock,
  XCircle,
  Eye,
  CheckCircle2,
  AlertCircle,
  QrCode,
  UserCheck,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

interface Peminjaman {
  id_peminjaman: string;
  kode_transaksi: string;
  id_pemohon: string;
  id_sarpras: string;
  id_approver: string | null;
  tgl_mulai: string;
  tgl_selesai: string;
  maksud_kegiatan: string;
  status_transaksi: 'Pending' | 'Disetujui' | 'Ditolak' | 'Dibatalkan' | 'Selesai';
  created_at: string;
  sarpras: {
    id_sarpras: string;
    kode_aset: string;
    nama_sarpras: string;
    kategori: string;
    lokasi_plat: string;
    spesifikasi: string | null;
  };
  approver?: {
    nama_lengkap: string;
    email: string;
  } | null;
  tiket_digital?: {
    id_tiket: string;
    kode_qr: string;
    status_tiket: string;
  } | null;
  bast_digital?: {
    id_bast: string;
    nomor_bast: string;
    created_at: string;
  } | null;
  verifikasi_fisik?: Array<{
    id_verifikasi: string;
    jenis_pemeriksaan: string;
    kondisi_fisik: string;
    catatan_inspeksi: string | null;
    created_at: string;
    staf?: {
      nama_lengkap: string;
    };
  }>;
}

export default function RiwayatPeminjamanPage() {
  const [bookings, setBookings] = useState<Peminjaman[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [search, setSearch] = useState('');

  // Selected booking for detail modal
  const [selectedDetail, setSelectedDetail] = useState<Peminjaman | null>(null);

  // Cancellation modal states (UC-04)
  const [cancellingBooking, setCancellingBooking] = useState<Peminjaman | null>(null);
  const [alasanBatal, setAlasanBatal] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const url = new URL('/api/peminjaman', window.location.origin);
      if (statusFilter !== 'Semua') {
        url.searchParams.append('status', statusFilter);
      }
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setBookings(data.data || []);
      }
    } catch (_err) {
      console.error('Failed to load bookings:', _err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleOpenCancelModal = (booking: Peminjaman) => {
    setCancellingBooking(booking);
    setAlasanBatal('');
    setCancelError('');
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingBooking) return;

    if (!alasanBatal.trim() || alasanBatal.trim().length < 5) {
      setCancelError('Alasan pembatalan wajib diisi minimal 5 karakter.');
      return;
    }

    try {
      setCancelLoading(true);
      setCancelError('');

      const res = await fetch(`/api/peminjaman/${cancellingBooking.id_peminjaman}/batalkan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alasan_pembatalan: alasanBatal.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCancelError(data.message || 'Gagal membatalkan peminjaman.');
        return;
      }

      setFeedbackMessage(data.message || 'Peminjaman berhasil dibatalkan dan slot jadwal telah dibuka kembali.');
      setCancellingBooking(null);
      fetchBookings();

      setTimeout(() => setFeedbackMessage(''), 6000);
    } catch (_err: any) {
      setCancelError('Terjadi kesalahan koneksi saat membatalkan peminjaman.');
    } finally {
      setCancelLoading(false);
    }
  };

  const getStatusBadge = (status: Peminjaman['status_transaksi']) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="pending">Pending Approval Kasubag</Badge>;
      case 'Disetujui':
        return <Badge variant="disetujui">Disetujui</Badge>;
      case 'Ditolak':
        return <Badge variant="ditolak">Ditolak</Badge>;
      case 'Dibatalkan':
        return <Badge variant="dibatalkan">Dibatalkan</Badge>;
      case 'Selesai':
        return <Badge variant="selesai">Selesai (BAST Terbit)</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Ruangan':
        return <Building2 className="h-4 w-4 text-indigo-600" />;
      case 'Mobil_Operasional':
        return <Car className="h-4 w-4 text-emerald-600" />;
      case 'Perangkat_Kerja':
        return <Laptop className="h-4 w-4 text-amber-600" />;
      default:
        return <Building2 className="h-4 w-4 text-slate-600" />;
    }
  };

  // Filter bookings by client-side search
  const filteredBookings = bookings.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.kode_transaksi.toLowerCase().includes(q) ||
      b.sarpras.nama_sarpras.toLowerCase().includes(q) ||
      b.sarpras.lokasi_plat.toLowerCase().includes(q) ||
      b.maksud_kegiatan.toLowerCase().includes(q)
    );
  });

  // Calculate summary counts
  const countPending = bookings.filter((b) => b.status_transaksi === 'Pending').length;
  const countDisetujui = bookings.filter((b) => b.status_transaksi === 'Disetujui').length;
  const countSelesai = bookings.filter((b) => b.status_transaksi === 'Selesai').length;
  const countDibatalkan = bookings.filter((b) => b.status_transaksi === 'Dibatalkan').length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <ClipboardList className="h-7 w-7 text-[#034275]" />
            Riwayat Peminjaman Fasilitas
          </h1>
          <p className="text-sm text-slate-500">
            Pantau status transaksi, tiket QR digital, serta pembatalan mandiri peminjaman (PRD UC-04 / UI-04).
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

      {/* Success / Feedback Alert */}
      {feedbackMessage && (
        <Alert className="border-emerald-300 bg-emerald-50 text-emerald-900 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="text-xs font-bold">Sukses</AlertTitle>
          <AlertDescription className="text-xs">{feedbackMessage}</AlertDescription>
        </Alert>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Pending Approval</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">{countPending}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Disetujui (Tiket Aktif)</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{countDisetujui}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
              <QrCode className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Selesai (BAST)</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{countSelesai}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Dibatalkan</div>
              <div className="text-2xl font-bold text-slate-600 mt-1">{countDibatalkan}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {['Semua', 'Pending', 'Disetujui', 'Selesai', 'Dibatalkan', 'Ditolak'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1.5 font-medium whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-[#034275] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Cari kode transaksi, fasilitas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      {/* Transaction List */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-slate-800">Daftar Transaksi Peminjaman</CardTitle>
            <span className="text-xs text-slate-500">
              Menampilkan {filteredBookings.length} permohonan
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">Memuat daftar peminjaman...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-3">
              <ClipboardList className="mx-auto h-12 w-12 text-slate-300" />
              <div className="font-semibold text-slate-700">Tidak Ada Transaksi Ditemukan</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {search || statusFilter !== 'Semua'
                  ? 'Tidak ada permohonan yang sesuai dengan filter pencarian.'
                  : 'Anda belum memiliki riwayat peminjaman fasilitas sarana dan prasarana.'}
              </p>
              <Link href="/katalog">
                <Button size="sm" variant="outline" className="mt-2 text-xs">
                  Buka Katalog Fasilitas
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredBookings.map((b) => {
                const isUpcoming = new Date() < new Date(b.tgl_mulai);
                const canCancel = ['Pending', 'Disetujui'].includes(b.status_transaksi) && isUpcoming;

                return (
                  <div
                    key={b.id_peminjaman}
                    className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left: Transaction Info */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#034275] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {b.kode_transaksi}
                        </span>
                        {getStatusBadge(b.status_transaksi)}
                        <span className="text-[11px] text-slate-400">
                          Diajukan: {formatDateTime(b.created_at)}
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100">
                          {getCategoryIcon(b.sarpras.kategori)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 text-sm">
                            {b.sarpras.nama_sarpras}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {b.sarpras.lokasi_plat} • BMN: {b.sarpras.kode_aset}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-[#034275]" />
                          <span>
                            <strong>Mulai:</strong> {formatDateTime(b.tgl_mulai)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-[#034275]" />
                          <span>
                            <strong>Selesai:</strong> {formatDateTime(b.tgl_selesai)}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 italic bg-white p-2 rounded border border-slate-100">
                        &quot;{b.maksud_kegiatan}&quot;
                      </p>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedDetail(b)}
                        className="text-xs flex items-center gap-1.5 h-8"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-500" />
                        Rincian Detail
                      </Button>

                      {b.status_transaksi === 'Disetujui' && b.tiket_digital && (
                        <Button
                          size="sm"
                          onClick={() => setSelectedDetail(b)}
                          className="text-xs flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 h-8"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          Tiket QR Pengambilan
                        </Button>
                      )}

                      {canCancel && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleOpenCancelModal(b)}
                          className="text-xs flex items-center gap-1.5 h-8 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Batalkan Peminjaman
                        </Button>
                      )}

                      {['Pending', 'Disetujui'].includes(b.status_transaksi) && !isUpcoming && (
                        <span className="text-[10px] text-slate-400 italic">
                          Peminjaman sedang berjalan / waktu mulai telah lewat
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Detail Peminjaman */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <div>
                <span className="font-mono text-xs font-bold text-[#034275] bg-blue-100 px-2 py-0.5 rounded">
                  {selectedDetail.kode_transaksi}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Rincian Transaksi Peminjaman
                </h3>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedDetail(null)}
                className="h-8 w-8 p-0 rounded-full"
              >
                ✕
              </Button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              {/* Status Section */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-600">Status Permohonan Saat Ini:</span>
                <div>{getStatusBadge(selectedDetail.status_transaksi)}</div>
              </div>

              {/* Tiket Digital QR Box (If approved) */}
              {selectedDetail.status_transaksi === 'Disetujui' && selectedDetail.tiket_digital && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-center space-y-2">
                  <div className="text-xs font-bold text-blue-900 flex items-center justify-center gap-1.5">
                    <QrCode className="h-4 w-4 text-blue-700" />
                    TIKET DIGITAL PENGAMBILAN ASET RESMI
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-blue-200 inline-block shadow-sm">
                    <div className="font-mono font-bold text-sm text-[#034275]">
                      {selectedDetail.tiket_digital.kode_qr}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Status Tiket: {selectedDetail.tiket_digital.status_tiket}
                    </div>
                  </div>
                  <p className="text-[11px] text-blue-800">
                    Tunjukkan tiket ini kepada Petugas Staf Bagian Umum saat pengambilan kunci/fasilitas.
                  </p>
                </div>
              )}

              {/* Facility & Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Informasi Sarpras
                  </div>
                  <div className="font-bold text-sm text-slate-900">
                    {selectedDetail.sarpras.nama_sarpras}
                  </div>
                  <div>Kategori: {selectedDetail.sarpras.kategori.replace('_', ' ')}</div>
                  <div>Lokasi / Plat: {selectedDetail.sarpras.lokasi_plat}</div>
                  <div>Kode BMN: {selectedDetail.sarpras.kode_aset}</div>
                </div>

                <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Jadwal Peminjaman
                  </div>
                  <div>
                    <strong>Waktu Mulai:</strong> {formatDateTime(selectedDetail.tgl_mulai)}
                  </div>
                  <div>
                    <strong>Waktu Selesai:</strong> {formatDateTime(selectedDetail.tgl_selesai)}
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1">
                    Waktu Pengajuan: {formatDateTime(selectedDetail.created_at)}
                  </div>
                </div>
              </div>

              {/* Maksud Kegiatan */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Maksud / Agenda Kegiatan Operasional
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 whitespace-pre-line leading-relaxed text-xs">
                  {selectedDetail.maksud_kegiatan}
                </div>
              </div>

              {/* Approver Info */}
              {selectedDetail.approver && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs">
                  <UserCheck className="h-4 w-4 text-emerald-700" />
                  <span>
                    Disetujui oleh: <strong>{selectedDetail.approver.nama_lengkap}</strong> ({selectedDetail.approver.email})
                  </span>
                </div>
              )}

              {/* Inspeksi / Verifikasi Staf */}
              {selectedDetail.verifikasi_fisik && selectedDetail.verifikasi_fisik.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Catatan Verifikasi & Inspeksi Lapangan (Staf Bagian Umum)
                  </div>
                  {selectedDetail.verifikasi_fisik.map((v) => (
                    <div key={v.id_verifikasi} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span>{v.jenis_pemeriksaan}: {v.kondisi_fisik}</span>
                        <span className="text-[10px] text-slate-400">{formatDateTime(v.created_at)}</span>
                      </div>
                      {v.catatan_inspeksi && (
                        <p className="text-slate-600 italic text-[11px]">&quot;{v.catatan_inspeksi}&quot;</p>
                      )}
                      {v.staf && <div className="text-[10px] text-slate-400">Pemeriksa: {v.staf.nama_lengkap}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 px-6 py-3 bg-slate-50 flex justify-end">
              <Button size="sm" onClick={() => setSelectedDetail(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog Pembatalan Mandiri (UC-04 / SD-04) */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-red-600 p-4 text-white flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-white shrink-0" />
              <div>
                <h3 className="font-bold text-base">Konfirmasi Pembatalan Peminjaman</h3>
                <p className="text-red-100 text-xs">
                  Transaksi: {cancellingBooking.kode_transaksi}
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmCancel} className="p-6 space-y-4">
              {cancelError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Gagal</AlertTitle>
                  <AlertDescription className="text-xs">{cancelError}</AlertDescription>
                </Alert>
              )}

              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-700" />
                  Konsekuensi Pembatalan:
                </div>
                <p>
                  Dengan membatalkan transaksi ini, kuncian slot jadwal untuk fasilitas{' '}
                  <strong>{cancellingBooking.sarpras.nama_sarpras}</strong> pada tanggal{' '}
                  <strong>{formatDateTime(cancellingBooking.tgl_mulai)}</strong> s/d{' '}
                  <strong>{formatDateTime(cancellingBooking.tgl_selesai)}</strong> akan{' '}
                  <strong>otomatis dilepas</strong> dan dibuka kembali bagi pemohon lain.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Alasan Pembatalan <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={alasanBatal}
                  onChange={(e) => setAlasanBatal(e.target.value)}
                  placeholder="Contoh: Agenda perkuliahan dimajukan secara mendadak / kegiatan beralih daring..."
                  className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                  minLength={5}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Wajib mengisi alasan pembatalan untuk dicatat pada log audit sistem.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCancellingBooking(null)}
                  disabled={cancelLoading}
                >
                  Batal, Tetap Pinjam
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={cancelLoading || !alasanBatal.trim()}
                  className="flex items-center gap-1.5"
                >
                  {cancelLoading ? 'Memproses Pembatalan...' : 'Ya, Batalkan Peminjaman'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
