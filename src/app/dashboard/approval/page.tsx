'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatDateTime } from '@/lib/utils';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Building2,
  Car,
  Laptop,
  AlertCircle,
  FileCheck2,
  Eye,
  QrCode,
  AlertTriangle,
  History,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

interface VerifikasiItem {
  id_verifikasi: string;
  jenis_pemeriksaan: string;
  kondisi_fisik: string;
  catatan_inspeksi: string | null;
  created_at: string;
  staf?: {
    nama_lengkap: string;
  };
}

interface BookingTransaction {
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
  tiket_digital?: {
    id_tiket: string;
    kode_qr: string;
    status_tiket: string;
  } | null;
  verifikasi_fisik?: VerifikasiItem[];
}

export default function KasubagApprovalPage() {
  const [transactions, setTransactions] = useState<BookingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [search, setSearch] = useState('');

  // Decision Modal States (Approve / Reject)
  const [selectedBooking, setSelectedBooking] = useState<BookingTransaction | null>(null);
  const [actionType, setActionType] = useState<'Approve' | 'Reject' | 'Detail' | null>(null);
  const [alasanPenolakan, setAlasanPenolakan] = useState('');
  const [catatanApprover, setCatatanApprover] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/peminjaman');
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data || []);
      }
    } catch (_err) {
      console.error('Failed to fetch approval list:', _err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleOpenActionModal = (booking: BookingTransaction, type: 'Approve' | 'Reject' | 'Detail') => {
    setSelectedBooking(booking);
    setActionType(type);
    setAlasanPenolakan('');
    setCatatanApprover('');
    setFormError('');
  };

  const handleProcessDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !actionType) return;

    if (actionType === 'Reject' && (!alasanPenolakan.trim() || alasanPenolakan.trim().length < 5)) {
      setFormError('Alasan penolakan wajib diisi minimal 5 karakter.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');

      const res = await fetch(`/api/peminjaman/${selectedBooking.id_peminjaman}/approval`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: actionType === 'Approve' ? 'Setujui' : 'Tolak',
          alasan_penolakan: alasanPenolakan.trim(),
          catatan_approver: catatanApprover.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.message || 'Gagal memproses keputusan.');
        return;
      }

      setFeedbackMessage(data.message || 'Keputusan permohonan berhasil diproses.');
      setSelectedBooking(null);
      setActionType(null);
      fetchBookings();

      setTimeout(() => setFeedbackMessage(''), 6000);
    } catch (_err) {
      setFormError('Terjadi kesalahan jaringan atau server saat memproses approval.');
    } finally {
      setSubmitting(false);
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

  const getStatusBadge = (status: BookingTransaction['status_transaksi']) => {
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

  // Filtered lists
  const filteredTransactions = transactions.filter((b) => {
    const matchStatus = statusFilter === 'Semua' ? true : b.status_transaksi === statusFilter;
    if (!matchStatus) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.kode_transaksi.toLowerCase().includes(q) ||
      b.sarpras.nama_sarpras.toLowerCase().includes(q) ||
      b.pemohon.nama_lengkap.toLowerCase().includes(q) ||
      b.maksud_kegiatan.toLowerCase().includes(q)
    );
  });

  const countPending = transactions.filter((b) => b.status_transaksi === 'Pending').length;
  const countDisetujui = transactions.filter((b) => b.status_transaksi === 'Disetujui').length;
  const countDitolak = transactions.filter((b) => b.status_transaksi === 'Ditolak').length;
  const countTotal = transactions.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
          <CheckCircle2 className="h-7 w-7 text-[#034275]" />
          Dasbor Persetujuan Peminjaman Sarpras
        </h1>
        <p className="text-sm text-slate-500">
          Kasubag Bagian Umum — Evaluasi permohonan digital, tinjau catatan verifikasi staf, dan terbitkan Tiket QR (PRD UC-05 / UI-05).
        </p>
      </div>

      {/* Success Notification Alert */}
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
              <div className="text-xs text-slate-500 font-medium">Antrean Menunggu Approval</div>
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
              <div className="text-xs text-slate-500 font-medium">Telah Disetujui (Tiket Aktif)</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{countDisetujui}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Permohonan Ditolak</div>
              <div className="text-2xl font-bold text-red-600 mt-1">{countDitolak}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-red-50 text-red-700">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Total Seluruh Permohonan</div>
              <div className="text-2xl font-bold text-slate-700 mt-1">{countTotal}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
              <History className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {['Pending', 'Disetujui', 'Ditolak', 'Semua'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3.5 py-1.5 font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-[#034275] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {st === 'Pending' ? `Antrean Pending (${countPending})` : st}
            </button>
          ))}
        </div>

        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Cari transaksi, pemohon, fasilitas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      {/* Transaction List Card */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-slate-800">
                {statusFilter === 'Pending'
                  ? 'Antrean Pengajuan Menunggu Evaluasi & Persetujuan'
                  : `Daftar Transaksi (${statusFilter})`}
              </CardTitle>
              <CardDescription className="text-xs">
                {statusFilter === 'Pending'
                  ? 'Tinjau urgensi kegiatan, identitas pemohon, dan rekomendasi hasil verifikasi staf teknis sebelum membuat keputusan.'
                  : 'Riwayat keputusan persetujuan yang telah diproses oleh Kasubag Umum.'}
              </CardDescription>
            </div>
            <span className="text-xs text-slate-500">
              Menampilkan {filteredTransactions.length} permohonan
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">Memuat data permohonan...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <CheckCircle2 className="mx-auto h-12 w-12 text-slate-300" />
              <div className="font-semibold text-slate-700">Tidak Ada Antrean Ditemukan</div>
              <p className="text-xs text-slate-400">
                {statusFilter === 'Pending'
                  ? 'Seluruh permohonan peminjaman telah dievaluasi.'
                  : 'Tidak ada data transaksi yang cocok dengan filter pencarian.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTransactions.map((b) => {
                const praVerif = (b.verifikasi_fisik || []).find(
                  (v) => v.jenis_pemeriksaan === 'Pra_Approval'
                );

                return (
                  <div
                    key={b.id_peminjaman}
                    className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    {/* Left: Transaction Info */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#034275] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {b.kode_transaksi}
                        </span>
                        {getStatusBadge(b.status_transaksi)}

                        {/* Staf Inspection Recommendation Badge (PRD UC-05 & UC-06 integration) */}
                        {praVerif ? (
                          <Badge
                            variant={praVerif.kondisi_fisik === 'Baik_Sesuai' ? 'success' : 'warning'}
                            className="text-[11px]"
                          >
                            ✓ Verifikasi Staf:{' '}
                            {praVerif.kondisi_fisik === 'Baik_Sesuai'
                              ? 'Layak / Sesuai Standard'
                              : 'Ada Catatan Fisik'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[11px] text-amber-700 border-amber-300 bg-amber-50">
                            ⚠ Belum Diverifikasi Staf
                          </Badge>
                        )}

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

                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>
                            <strong>Pemohon:</strong> {b.pemohon.nama_lengkap} ({b.pemohon.role})
                          </span>
                          {b.pemohon.pemohon_detail && (
                            <span>• Instansi: {b.pemohon.pemohon_detail.instansi_kategori}</span>
                          )}
                          <span>• Kontak: {b.pemohon.no_hp}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500">
                          <span>
                            <strong>Waktu Penggunaan:</strong> {formatDateTime(b.tgl_mulai)} s/d{' '}
                            {formatDateTime(b.tgl_selesai)}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 italic bg-white p-2 rounded border border-slate-100">
                        Agenda Kegiatan: &quot;{b.maksud_kegiatan}&quot;
                      </p>

                      {praVerif && (
                        <div className="rounded-lg bg-emerald-50/70 border border-emerald-200 p-2 text-xs text-emerald-950 space-y-0.5">
                          <span className="font-semibold">Catatan Verifikasi Lapangan Staf:</span>
                          <p className="italic text-[11px]">
                            {praVerif.catatan_inspeksi || 'Sarpras siap pakai dan bebas kendala.'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-end gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenActionModal(b, 'Detail')}
                        className="text-xs flex items-center gap-1.5 h-8"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-500" />
                        Evaluasi Detail
                      </Button>

                      {b.status_transaksi === 'Pending' && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleOpenActionModal(b, 'Approve')}
                            className="text-xs flex items-center gap-1.5 h-8 bg-emerald-700 hover:bg-emerald-800 text-white"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Setujui (Approve)
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleOpenActionModal(b, 'Reject')}
                            className="text-xs flex items-center gap-1.5 h-8 bg-red-600 hover:bg-red-700"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Tolak (Reject)
                          </Button>
                        </div>
                      )}

                      {b.status_transaksi === 'Disetujui' && b.tiket_digital && (
                        <Link href={`/peminjaman/${b.id_peminjaman}/tiket`}>
                          <Button size="sm" variant="outline" className="text-xs flex items-center gap-1.5 h-8 text-blue-700 border-blue-300 bg-blue-50 hover:bg-blue-100">
                            <QrCode className="h-3.5 w-3.5" />
                            Lihat Tiket QR
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL DIALOG EVALUASI & KEPUTUSAN APPROVAL / REJECT */}
      {selectedBooking && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div
              className={`p-5 text-white flex items-center justify-between ${
                actionType === 'Approve'
                  ? 'bg-emerald-700'
                  : actionType === 'Reject'
                  ? 'bg-red-700'
                  : 'bg-[#034275]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {actionType === 'Approve' ? (
                  <CheckCircle2 className="h-6 w-6 text-white shrink-0" />
                ) : actionType === 'Reject' ? (
                  <XCircle className="h-6 w-6 text-white shrink-0" />
                ) : (
                  <FileCheck2 className="h-6 w-6 text-white shrink-0" />
                )}
                <div>
                  <h3 className="font-bold text-base">
                    {actionType === 'Approve'
                      ? 'Persetujuan Peminjaman Sarpras'
                      : actionType === 'Reject'
                      ? 'Penolakan Permohonan Peminjaman'
                      : 'Lembar Evaluasi Permohonan'}
                  </h3>
                  <p className="text-white/80 text-xs font-mono">{selectedBooking.kode_transaksi}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedBooking(null);
                  setActionType(null);
                }}
                className="h-8 w-8 p-0 rounded-full text-slate-700 hover:text-black"
              >
                ✕
              </Button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto text-xs text-slate-700">
              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Perhatian</AlertTitle>
                  <AlertDescription className="text-xs">{formError}</AlertDescription>
                </Alert>
              )}

              {/* Rincian Permohonan */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
                <div className="flex justify-between font-bold text-slate-900 text-sm">
                  <span>{selectedBooking.sarpras.nama_sarpras}</span>
                  <span className="font-mono text-[#034275]">{selectedBooking.sarpras.kode_aset}</span>
                </div>
                <div>Lokasi / Plat: {selectedBooking.sarpras.lokasi_plat}</div>
                <div>
                  Pemohon: <strong>{selectedBooking.pemohon.nama_lengkap}</strong> ({selectedBooking.pemohon.role}) • {selectedBooking.pemohon.no_hp}
                </div>
                <div>
                  Waktu: {formatDateTime(selectedBooking.tgl_mulai)} s/d {formatDateTime(selectedBooking.tgl_selesai)}
                </div>
                <div className="pt-1 whitespace-pre-line italic text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                  Agenda: &quot;{selectedBooking.maksud_kegiatan}&quot;
                </div>
              </div>

              {/* Verifikasi Staf Umum Box */}
              {selectedBooking.verifikasi_fisik && selectedBooking.verifikasi_fisik.length > 0 ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 space-y-1.5 text-emerald-950">
                  <div className="font-bold flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-emerald-700" />
                    Hasil Verifikasi Lapangan Staf Bagian Umum:
                  </div>
                  {selectedBooking.verifikasi_fisik.map((v) => (
                    <div key={v.id_verifikasi} className="text-xs">
                      <div>
                        Status: <strong>{v.kondisi_fisik.replace('_', ' ')}</strong> (Pemeriksaan {v.jenis_pemeriksaan.replace('_', ' ')})
                      </div>
                      <p className="italic text-[11px] text-emerald-800">
                        {v.catatan_inspeksi || 'Sarpras siap pakai dan bebas kendala.'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Peringatan Verifikasi Teknis:</strong> Permohonan ini belum memiliki catatan verifikasi pra-approval dari Staf Bagian Umum. Anda tetap dapat memutuskan, namun disarankan memastikan ketersediaan unit di gudang/pool.
                  </div>
                </div>
              )}

              {/* Skenario APPROVE */}
              {actionType === 'Approve' && (
                <form onSubmit={handleProcessDecision} id="decision-form" className="space-y-3 pt-2">
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-[11px] text-blue-900 space-y-1">
                    <div className="font-bold">Konsekuensi Persetujuan:</div>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li>Status permohonan akan diperbarui menjadi <strong>Disetujui</strong>.</li>
                      <li>Sistem otomatis menerbitkan <strong>Tiket Digital & Kode QR Resmi</strong>.</li>
                      <li>Notifikasi email persetujuan beserta kode tiket langsung dikirimkan ke akun pemohon.</li>
                    </ul>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Catatan Disposisi Persetujuan (Opsional)
                    </label>
                    <textarea
                      rows={3}
                      value={catatanApprover}
                      onChange={(e) => setCatatanApprover(e.target.value)}
                      placeholder="Contoh: Disetujui. Harap menjaga kebersihan dan berkoordinasi dengan Staf Sarpras untuk serah terima kunci."
                      className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                </form>
              )}

              {/* Skenario REJECT */}
              {actionType === 'Reject' && (
                <form onSubmit={handleProcessDecision} id="decision-form" className="space-y-3 pt-2">
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-[11px] text-red-900 space-y-1">
                    <div className="font-bold">Konsekuensi Penolakan:</div>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li>Status permohonan akan diubah menjadi <strong>Ditolak</strong>.</li>
                      <li>Kuncian slot jadwal kalender fasilitas akan <strong>otomatis dibebaskan</strong>.</li>
                      <li>Email pemberitahuan resmi beserta alasan penolakan akan dikirimkan kepada pemohon.</li>
                    </ul>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Alasan Resmi Penolakan <span className="text-red-500">* (Wajib diisi)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={alasanPenolakan}
                      onChange={(e) => setAlasanPenolakan(e.target.value)}
                      placeholder="Contoh: Fasilitas auditorium dipergunakan untuk agenda mendadak Pimpinan Politeknik / Dalam perbaikan sistem kelistrikan."
                      className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-900 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                      required
                      minLength={5}
                    />
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 px-6 py-3 bg-slate-50 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedBooking(null);
                  setActionType(null);
                }}
                disabled={submitting}
              >
                Tutup
              </Button>

              {actionType === 'Approve' && (
                <Button
                  form="decision-form"
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {submitting ? 'Memproses...' : 'Setujui Permohonan & Terbitkan Tiket'}
                </Button>
              )}

              {actionType === 'Reject' && (
                <Button
                  form="decision-form"
                  type="submit"
                  size="sm"
                  variant="destructive"
                  disabled={submitting || !alasanPenolakan.trim()}
                  className="bg-red-700 hover:bg-red-800 flex items-center gap-1.5"
                >
                  <XCircle className="h-4 w-4" />
                  {submitting ? 'Memproses...' : 'Konfirmasi Tolak Permohonan'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
