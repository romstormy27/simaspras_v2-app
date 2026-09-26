'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatDateTime } from '@/lib/utils';
import {
  ClipboardCheck,
  Building2,
  Car,
  Laptop,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  History,
  FileCheck2,
  Sparkles,
  ArrowRight,
  PackageCheck,
  Eye,
} from 'lucide-react';

interface VerifikasiItem {
  id_verifikasi: string;
  jenis_pemeriksaan: 'Pra_Approval' | 'Pasca_Pengembalian';
  kondisi_fisik: 'Baik_Sesuai' | 'Ada_Catatan_Khusus';
  catatan_inspeksi: string | null;
  created_at: string;
  staf?: {
    nama_lengkap: string;
    email: string;
  };
}

interface BookingTransaction {
  id_peminjaman: string;
  kode_transaksi: string;
  id_pemohon: string;
  id_sarpras: string;
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
  tiket_digital?: {
    id_tiket: string;
    kode_qr: string;
    status_tiket: string;
  } | null;
  verifikasi_fisik?: VerifikasiItem[];
}

export default function StafVerifikasiPage() {
  const [activeTab, setActiveTab] = useState<'pra-approval' | 'pasca-pengembalian' | 'riwayat-inspeksi'>('pra-approval');
  const [transactions, setTransactions] = useState<BookingTransaction[]>([]);
  const [allVerifications, setAllVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Inspection modal states (UC-06 / SD-06)
  const [selectedBooking, setSelectedBooking] = useState<BookingTransaction | null>(null);
  const [modalJenis, setModalJenis] = useState<'Pra_Approval' | 'Pasca_Pengembalian'>('Pra_Approval');
  const [modalKondisi, setModalKondisi] = useState<'Baik_Sesuai' | 'Ada_Catatan_Khusus'>('Baik_Sesuai');
  const [modalCatatan, setModalCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Detail viewer modal
  const [viewDetailBooking, setViewDetailBooking] = useState<BookingTransaction | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all bookings
      const resBookings = await fetch('/api/peminjaman');
      const dataBookings = await resBookings.json();

      // Fetch all verifications
      const resVerifications = await fetch('/api/verifikasi-fisik');
      const dataVerifications = await resVerifications.json();

      if (dataBookings.success) {
        setTransactions(dataBookings.data || []);
      }
      if (dataVerifications.success) {
        setAllVerifications(dataVerifications.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch data for verification dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenInspectModal = (booking: BookingTransaction, jenis: 'Pra_Approval' | 'Pasca_Pengembalian') => {
    setSelectedBooking(booking);
    setModalJenis(jenis);
    setModalKondisi('Baik_Sesuai');
    setModalCatatan('');
    setFormError('');
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    if (modalKondisi === 'Ada_Catatan_Khusus' && (!modalCatatan.trim() || modalCatatan.trim().length < 5)) {
      setFormError('Rincian catatan fisik khusus wajib diisi minimal 5 karakter jika terdapat temuan lapangan.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');

      const res = await fetch('/api/verifikasi-fisik', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_peminjaman: selectedBooking.id_peminjaman,
          jenis_pemeriksaan: modalJenis,
          kondisi_fisik: modalKondisi,
          catatan_inspeksi: modalCatatan.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.message || 'Gagal menyimpan hasil verifikasi.');
        return;
      }

      setFeedbackMessage(data.message || 'Hasil pemeriksaan fisik berhasil disimpan.');
      setSelectedBooking(null);
      fetchData();

      setTimeout(() => setFeedbackMessage(''), 6000);
    } catch (_err) {
      setFormError('Terjadi kesalahan jaringan atau server saat menyimpan hasil inspeksi.');
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

  // Filter lists per tab
  const pendingPraApproval = transactions.filter((b) => b.status_transaksi === 'Pending');
  const returnInspectionList = transactions.filter(
    (b) => b.status_transaksi === 'Disetujui' || b.status_transaksi === 'Selesai'
  );

  const filteredPraApproval = pendingPraApproval.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.kode_transaksi.toLowerCase().includes(q) ||
      b.sarpras.nama_sarpras.toLowerCase().includes(q) ||
      b.pemohon.nama_lengkap.toLowerCase().includes(q) ||
      b.maksud_kegiatan.toLowerCase().includes(q)
    );
  });

  const filteredReturns = returnInspectionList.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.kode_transaksi.toLowerCase().includes(q) ||
      b.sarpras.nama_sarpras.toLowerCase().includes(q) ||
      b.pemohon.nama_lengkap.toLowerCase().includes(q) ||
      b.maksud_kegiatan.toLowerCase().includes(q)
    );
  });

  // Calculate statistics
  const countPendingVerif = pendingPraApproval.length;
  const countReturnVerif = returnInspectionList.filter(
    (b) => !(b.verifikasi_fisik || []).some((v) => v.jenis_pemeriksaan === 'Pasca_Pengembalian')
  ).length;
  const countTotalInspeksi = allVerifications.length;
  const countCatatanKhusus = allVerifications.filter((v) => v.kondisi_fisik === 'Ada_Catatan_Khusus').length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
          <ClipboardCheck className="h-7 w-7 text-[#034275]" />
          Dasbor Verifikasi Fisik & Jadwal Sarpras
        </h1>
        <p className="text-sm text-slate-500">
          Staf Bagian Umum — Verifikasi kelayakan teknis pra-approval dan inspeksi kondisi fisik pasca-pengembalian fasilitas (PRD UC-06 / UI-06).
        </p>
      </div>

      {/* Success Feedback Alert */}
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
              <div className="text-xs text-slate-500 font-medium">Antrean Pra-Approval</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">{countPendingVerif}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Perlu Cek Pengembalian</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{countReturnVerif}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
              <PackageCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Total Inspeksi Selesai</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{countTotalInspeksi}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Temuan Catatan Khusus</div>
              <div className="text-2xl font-bold text-red-600 mt-1">{countCatatanKhusus}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-red-50 text-red-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Search Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setActiveTab('pra-approval')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 font-semibold transition-all ${
              activeTab === 'pra-approval'
                ? 'bg-[#034275] text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Verifikasi Pra-Approval ({pendingPraApproval.length})
          </button>

          <button
            onClick={() => setActiveTab('pasca-pengembalian')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 font-semibold transition-all ${
              activeTab === 'pasca-pengembalian'
                ? 'bg-[#034275] text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <PackageCheck className="h-3.5 w-3.5" />
            Inspeksi Pengembalian ({returnInspectionList.length})
          </button>

          <button
            onClick={() => setActiveTab('riwayat-inspeksi')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 font-semibold transition-all ${
              activeTab === 'riwayat-inspeksi'
                ? 'bg-[#034275] text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            Log Riwayat Inspeksi ({allVerifications.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Cari kode transaksi, fasilitas, pemohon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      {/* Main Tab Content */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Memuat data verifikasi...</div>
      ) : activeTab === 'pra-approval' ? (
        /* TAB 1: VERIFIKASI PRA-APPROVAL */
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-slate-800">Antrean Verifikasi Kesiapan Pra-Approval</CardTitle>
                <CardDescription className="text-xs">
                  Periksa ketersediaan fisik sarpras dan konfirmasi tidak adanya bentrok jadwal lapangan sebelum disetujui Kasubag Umum.
                </CardDescription>
              </div>
              <Badge variant="warning" className="text-xs">
                {filteredPraApproval.length} Menunggu Verifikasi
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredPraApproval.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                <div className="font-semibold text-slate-700">Semua Permohonan Telah Diperiksa</div>
                <p className="text-xs text-slate-400">Tidak ada antrean permohonan pending yang memerlukan verifikasi staf saat ini.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredPraApproval.map((b) => {
                  const praVerif = (b.verifikasi_fisik || []).filter(
                    (v) => v.jenis_pemeriksaan === 'Pra_Approval'
                  );
                  const isVerified = praVerif.length > 0;
                  const latestVerif = isVerified ? praVerif[0] : null;

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
                          <Badge variant="pending">Pending Approval Kasubag</Badge>

                          {isVerified ? (
                            <Badge
                              variant={latestVerif?.kondisi_fisik === 'Baik_Sesuai' ? 'success' : 'warning'}
                              className="text-[11px]"
                            >
                              ✓ Terverifikasi:{' '}
                              {latestVerif?.kondisi_fisik === 'Baik_Sesuai' ? 'Baik / Layak' : 'Ada Catatan Khusus'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[11px] text-amber-700 border-amber-300 bg-amber-50">
                              Belum Diverifikasi Staf
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
                          <div className="flex items-center gap-3">
                            <span>
                              <strong>Pemohon:</strong> {b.pemohon.nama_lengkap} ({b.pemohon.role})
                            </span>
                            <span>•</span>
                            <span>
                              <strong>No. HP:</strong> {b.pemohon.no_hp}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-500">
                            <span>
                              <strong>Mulai:</strong> {formatDateTime(b.tgl_mulai)}
                            </span>
                            <span>s/d</span>
                            <span>
                              <strong>Selesai:</strong> {formatDateTime(b.tgl_selesai)}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 italic bg-white p-2 rounded border border-slate-100">
                          Agenda: &quot;{b.maksud_kegiatan}&quot;
                        </p>

                        {latestVerif && (
                          <div className="rounded-lg bg-blue-50/70 border border-blue-200 p-2 text-xs text-blue-900 space-y-0.5">
                            <span className="font-semibold">Catatan Verifikasi Staf Terakhir:</span>
                            <p className="italic text-[11px]">
                              {latestVerif.catatan_inspeksi || 'Kondisi fisik sarpras siap dan tidak ada kendala.'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-row lg:flex-col items-center lg:items-end justify-end gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewDetailBooking(b)}
                          className="text-xs flex items-center gap-1.5 h-8"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                          Rincian
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleOpenInspectModal(b, 'Pra_Approval')}
                          className="text-xs flex items-center gap-1.5 h-8 bg-[#034275] hover:bg-[#02335c]"
                        >
                          <FileCheck2 className="h-3.5 w-3.5" />
                          {isVerified ? 'Perbarui Verifikasi' : 'Input Verifikasi Pra-Approval'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : activeTab === 'pasca-pengembalian' ? (
        /* TAB 2: INSPEKSI PASCA-PENGEMBALIAN */
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-slate-800">Daftar Fasilitas untuk Inspeksi Pengembalian</CardTitle>
                <CardDescription className="text-xs">
                  Pemeriksaan kelengkapan, kebersihan, dan kondisi fisik barang setelah pemakaian selesai untuk syarat penerbitan BAST Digital Kasubag Umum.
                </CardDescription>
              </div>
              <Badge variant="disetujui" className="text-xs">
                {filteredReturns.length} Transaksi
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredReturns.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <PackageCheck className="mx-auto h-12 w-12 text-slate-300" />
                <div className="font-semibold text-slate-700">Tidak Ada Fasilitas Menunggu Inspeksi</div>
                <p className="text-xs text-slate-400">Tidak ada transaksi yang berstatus Disetujui atau siap serah terima saat ini.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredReturns.map((b) => {
                  const returnVerif = (b.verifikasi_fisik || []).filter(
                    (v) => v.jenis_pemeriksaan === 'Pasca_Pengembalian'
                  );
                  const isReturned = returnVerif.length > 0;
                  const latestReturn = isReturned ? returnVerif[0] : null;

                  const isExpired = new Date() > new Date(b.tgl_selesai);

                  return (
                    <div
                      key={b.id_peminjaman}
                      className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[#034275] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {b.kode_transaksi}
                          </span>
                          <Badge variant={b.status_transaksi === 'Selesai' ? 'selesai' : 'disetujui'}>
                            {b.status_transaksi === 'Selesai' ? 'Selesai (BAST Terbit)' : 'Disetujui / In Use'}
                          </Badge>

                          {isReturned ? (
                            <Badge
                              variant={latestReturn?.kondisi_fisik === 'Baik_Sesuai' ? 'success' : 'warning'}
                              className="text-[11px]"
                            >
                              ✓ Fisik Diinspeksi:{' '}
                              {latestReturn?.kondisi_fisik === 'Baik_Sesuai' ? 'Kondisi Baik' : 'Ada Catatan Khusus'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[11px] text-blue-700 border-blue-300 bg-blue-50">
                              {isExpired ? 'Jadwal Selesai — Belum Inspeksi' : 'Sedang Berjalan'}
                            </Badge>
                          )}

                          {b.tiket_digital && (
                            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              QR: {b.tiket_digital.kode_qr}
                            </span>
                          )}
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
                          <div className="flex items-center gap-3">
                            <span>
                              <strong>Peminjam:</strong> {b.pemohon.nama_lengkap} ({b.pemohon.role})
                            </span>
                            <span>•</span>
                            <span>
                              <strong>No. HP:</strong> {b.pemohon.no_hp}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-500">
                            <span>
                              <strong>Jadwal:</strong> {formatDateTime(b.tgl_mulai)} s/d {formatDateTime(b.tgl_selesai)}
                            </span>
                            {isExpired && (
                              <span className="text-amber-600 font-semibold text-[11px]">
                                (Waktu penggunaan telah usai)
                              </span>
                            )}
                          </div>
                        </div>

                        {latestReturn && (
                          <div className="rounded-lg bg-emerald-50/70 border border-emerald-200 p-2 text-xs text-emerald-900 space-y-0.5">
                            <span className="font-semibold">Hasil Inspeksi Pengembalian:</span>
                            <p className="italic text-[11px]">
                              {latestReturn.catatan_inspeksi || 'Barang diserahkan dalam keadaan lengkap dan baik.'}
                            </p>
                            <span className="text-[10px] text-emerald-700">
                              Diperiksa pada {formatDateTime(latestReturn.created_at)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row lg:flex-col items-center lg:items-end justify-end gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewDetailBooking(b)}
                          className="text-xs flex items-center gap-1.5 h-8"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                          Rincian
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleOpenInspectModal(b, 'Pasca_Pengembalian')}
                          className="text-xs flex items-center gap-1.5 h-8 bg-emerald-700 hover:bg-emerald-800 text-white"
                        >
                          <PackageCheck className="h-3.5 w-3.5" />
                          {isReturned ? 'Perbarui Catatan Fisik' : 'Input Inspeksi Pengembalian'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* TAB 3: RIWAYAT SELURUH INSPEKSI STAF */
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-slate-800">Log Rekam Jejak Inspeksi Fisik Lapangan</CardTitle>
                <CardDescription className="text-xs">
                  Seluruh riwayat pemeriksaan fisik pra-approval dan pasca-pengembalian yang tercatat di sistem.
                </CardDescription>
              </div>
              <span className="text-xs text-slate-500">Total {allVerifications.length} rekam inspeksi</span>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {allVerifications.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <History className="mx-auto h-12 w-12 text-slate-300" />
                <div className="font-semibold text-slate-700">Belum Ada Riwayat Inspeksi</div>
                <p className="text-xs text-slate-400">Hasil verifikasi staf akan tercatat di sini secara kronologis.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {allVerifications.map((v) => (
                  <div key={v.id_verifikasi} className="p-4 hover:bg-slate-50/80 transition-colors text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#034275] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {v.peminjaman?.kode_transaksi}
                        </span>
                        <Badge variant="outline" className="text-[11px] font-semibold">
                          {v.jenis_pemeriksaan === 'Pra_Approval' ? 'Pra-Approval' : 'Pasca-Pengembalian'}
                        </Badge>
                        <Badge
                          variant={v.kondisi_fisik === 'Baik_Sesuai' ? 'success' : 'warning'}
                          className="text-[11px]"
                        >
                          {v.kondisi_fisik === 'Baik_Sesuai' ? 'Kondisi Baik/Sesuai' : 'Ada Catatan Khusus'}
                        </Badge>
                      </div>
                      <span className="text-slate-400 text-[11px]">{formatDateTime(v.created_at)}</span>
                    </div>

                    <div className="text-slate-700">
                      <strong>Fasilitas:</strong> {v.peminjaman?.sarpras?.nama_sarpras} (
                      {v.peminjaman?.sarpras?.lokasi_plat}) • <strong>Pemohon:</strong>{' '}
                      {v.peminjaman?.pemohon?.nama_lengkap}
                    </div>

                    {v.catatan_inspeksi ? (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-600 italic">
                        &quot;{v.catatan_inspeksi}&quot;
                      </div>
                    ) : (
                      <div className="text-slate-400 italic">Tidak ada catatan fisik khusus.</div>
                    )}

                    <div className="text-[11px] text-slate-500">
                      Staf Pemeriksa: <strong>{v.staf?.nama_lengkap || 'Staf Bagian Umum'}</strong> ({v.staf?.email})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* MODAL FORMULIR INSPEKSI FISIK LAPANGAN (UC-06 / SD-06) */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#034275] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ClipboardCheck className="h-6 w-6 text-white shrink-0" />
                <div>
                  <h3 className="font-bold text-base">Formulir Verifikasi Fisik Lapangan</h3>
                  <p className="text-blue-100 text-xs font-mono">{selectedBooking.kode_transaksi}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedBooking(null)}
                className="h-8 w-8 p-0 rounded-full text-slate-700 hover:text-black"
              >
                ✕
              </Button>
            </div>

            <form onSubmit={handleSubmitVerification} className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Perhatian</AlertTitle>
                  <AlertDescription className="text-xs">{formError}</AlertDescription>
                </Alert>
              )}

              {/* Target Facility Summary */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-700 space-y-1.5">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{selectedBooking.sarpras.nama_sarpras}</span>
                  <span className="font-mono text-[#034275]">{selectedBooking.sarpras.kode_aset}</span>
                </div>
                <div>Lokasi / Plat: {selectedBooking.sarpras.lokasi_plat}</div>
                <div>Pemohon: {selectedBooking.pemohon.nama_lengkap} ({selectedBooking.pemohon.role})</div>
                <div className="text-[11px] text-slate-500">
                  Jadwal: {formatDateTime(selectedBooking.tgl_mulai)} s/d {formatDateTime(selectedBooking.tgl_selesai)}
                </div>
              </div>

              {/* Jenis Pemeriksaan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Jenis Pemeriksaan <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${
                      modalJenis === 'Pra_Approval'
                        ? 'border-[#034275] bg-blue-50 text-[#034275] font-semibold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="jenis"
                      value="Pra_Approval"
                      checked={modalJenis === 'Pra_Approval'}
                      onChange={() => setModalJenis('Pra_Approval')}
                      className="text-[#034275]"
                    />
                    <span>Pra-Approval (Kesiapan Sarpras)</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${
                      modalJenis === 'Pasca_Pengembalian'
                        ? 'border-[#034275] bg-blue-50 text-[#034275] font-semibold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="jenis"
                      value="Pasca_Pengembalian"
                      checked={modalJenis === 'Pasca_Pengembalian'}
                      onChange={() => setModalJenis('Pasca_Pengembalian')}
                      className="text-[#034275]"
                    />
                    <span>Pasca-Pengembalian (Serah Terima)</span>
                  </label>
                </div>
              </div>

              {/* Kondisi Fisik Options */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Evaluasi Kondisi Fisik Lapangan <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div
                    onClick={() => setModalKondisi('Baik_Sesuai')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      modalKondisi === 'Baik_Sesuai'
                        ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500 text-emerald-950'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold mb-1">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Kondisi Baik / Sesuai
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Unit sarpras siap pakai, bersih, kelengkapan utuh, dan jadwal fisik bebas bentrok.
                    </p>
                  </div>

                  <div
                    onClick={() => setModalKondisi('Ada_Catatan_Khusus')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      modalKondisi === 'Ada_Catatan_Khusus'
                        ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500 text-amber-950'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold mb-1">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      Ada Catatan Khusus
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Terdapat temuan kelengkapan kurang, bodi lecet, AC kurang dingin, atau catatan teknis.
                    </p>
                  </div>
                </div>
              </div>

              {/* Catatan Inspeksi Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Catatan Rincian Hasil Inspeksi{' '}
                  {modalKondisi === 'Ada_Catatan_Khusus' ? (
                    <span className="text-red-500">* (Wajib diisi)</span>
                  ) : (
                    <span className="text-slate-400">(Opsional)</span>
                  )}
                </label>
                <textarea
                  rows={4}
                  value={modalCatatan}
                  onChange={(e) => setModalCatatan(e.target.value)}
                  placeholder={
                    modalJenis === 'Pra_Approval'
                      ? 'Contoh: Ruangan aula telah dibersihkan, proyektor dan AC berfungsi prima, mic wireless 2 unit disiapkan di meja operator.'
                      : 'Contoh: Kendaraan telah kembali, STNK dan kunci lengkap. Terdapat sedikit goresan halus di bemper kiri depan / bahan bakar terisi setengah tangki.'
                  }
                  className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-900 focus:border-[#034275] focus:outline-none focus:ring-1 focus:ring-[#034275]"
                  required={modalKondisi === 'Ada_Catatan_Khusus'}
                  minLength={modalKondisi === 'Ada_Catatan_Khusus' ? 5 : 0}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Catatan ini akan diteruskan ke dasbor Kasubag Bagian Umum untuk pertimbangan Approval atau penerbitan Berita Acara (BAST Digital).
                </p>
              </div>

              {/* Bebas Denda Finansial Notice */}
              <div className="rounded-lg bg-blue-50/70 border border-blue-200 p-3 text-[11px] text-blue-900 flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-blue-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Ketentuan Bebas Denda Finansial:</strong> Seluruh catatan temuan fisik bersifat inventarisasi kedinasan. Segala kerusakan/kehilangan ditindaklanjuti via mekanisme disiplin internal, bukan penarikan uang denda.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedBooking(null)}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting || (modalKondisi === 'Ada_Catatan_Khusus' && !modalCatatan.trim())}
                  className="flex items-center gap-1.5 bg-[#034275] hover:bg-[#02335c]"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan & Teruskan ke Kasubag'}
                  {!submitting && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VIEW DETAIL TRANSACTION */}
      {viewDetailBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <div>
                <span className="font-mono text-xs font-bold text-[#034275] bg-blue-100 px-2 py-0.5 rounded">
                  {viewDetailBooking.kode_transaksi}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Detail Permohonan & Fasilitas</h3>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setViewDetailBooking(null)}
                className="h-8 w-8 p-0 rounded-full"
              >
                ✕
              </Button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-sm text-slate-900">{viewDetailBooking.sarpras.nama_sarpras}</div>
                <div>Kategori: {viewDetailBooking.sarpras.kategori.replace('_', ' ')}</div>
                <div>Lokasi / Plat: {viewDetailBooking.sarpras.lokasi_plat}</div>
                <div>Kode BMN: {viewDetailBooking.sarpras.kode_aset}</div>
                {viewDetailBooking.sarpras.spesifikasi && (
                  <div className="pt-1 text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-100">
                    {viewDetailBooking.sarpras.spesifikasi}
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-800">Identitas Pemohon</div>
                <div>Nama: {viewDetailBooking.pemohon.nama_lengkap} ({viewDetailBooking.pemohon.role})</div>
                <div>Email: {viewDetailBooking.pemohon.email}</div>
                <div>Kontak WhatsApp: {viewDetailBooking.pemohon.no_hp}</div>
                {viewDetailBooking.pemohon.pemohon_detail && (
                  <div>
                    Identitas/Instansi: {viewDetailBooking.pemohon.pemohon_detail.nomor_identitas} •{' '}
                    {viewDetailBooking.pemohon.pemohon_detail.instansi_kategori}
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-800">Jadwal & Agenda</div>
                <div>Mulai: {formatDateTime(viewDetailBooking.tgl_mulai)}</div>
                <div>Selesai: {formatDateTime(viewDetailBooking.tgl_selesai)}</div>
                <div className="pt-1 whitespace-pre-line italic text-slate-600 bg-white p-2 rounded border border-slate-100">
                  &quot;{viewDetailBooking.maksud_kegiatan}&quot;
                </div>
              </div>

              {/* Riwayat Inspeksi Transaksi Ini */}
              {viewDetailBooking.verifikasi_fisik && viewDetailBooking.verifikasi_fisik.length > 0 && (
                <div className="space-y-2">
                  <div className="font-bold text-slate-800">Riwayat Catatan Verifikasi Staf</div>
                  {viewDetailBooking.verifikasi_fisik.map((v) => (
                    <div key={v.id_verifikasi} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span>{v.jenis_pemeriksaan.replace('_', ' ')}: {v.kondisi_fisik.replace('_', ' ')}</span>
                        <span className="text-[10px] text-slate-400">{formatDateTime(v.created_at)}</span>
                      </div>
                      {v.catatan_inspeksi && <p className="italic text-slate-600">&quot;{v.catatan_inspeksi}&quot;</p>}
                      {v.staf && <div className="text-[10px] text-slate-400">Pemeriksa: {v.staf.nama_lengkap}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 px-6 py-3 bg-slate-50 flex justify-end">
              <Button size="sm" onClick={() => setViewDetailBooking(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
