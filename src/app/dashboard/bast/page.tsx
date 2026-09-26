'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatDateTime } from '@/lib/utils';
import {
  FileCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Download,
  Eye,
  FileText,
  Building2,
  Car,
  Laptop,
  ShieldCheck,
  CheckCheck,
  RefreshCw,
  X,
  Sparkles,
} from 'lucide-react';

interface PemohonInfo {
  id_user: string;
  nama_lengkap: string;
  email: string;
  no_hp: string;
  role: string;
  pemohon_detail?: {
    nomor_identitas: string;
    instansi_kategori: string;
  } | null;
}

interface SarprasInfo {
  id_sarpras: string;
  kode_aset: string;
  nama_sarpras: string;
  kategori: string;
  lokasi_plat: string;
  status_operasional: string;
}

interface VerifikasiFisikInfo {
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
  status_transaksi: string;
  created_at: string;
  pemohon: PemohonInfo;
  sarpras: SarprasInfo;
  verifikasi_fisik: VerifikasiFisikInfo[];
  bast_digital?: {
    id_bast: string;
    nomor_bast: string;
    qr_signature: string;
    created_at: string;
  } | null;
}

interface BASTItem {
  id_bast: string;
  nomor_bast: string;
  qr_signature: string;
  created_at: string;
  kasubag: {
    nama_lengkap: string;
    email: string;
  };
  peminjaman: {
    id_peminjaman: string;
    kode_transaksi: string;
    tgl_mulai: string;
    tgl_selesai: string;
    maksud_kegiatan: string;
    sarpras: SarprasInfo;
    pemohon: PemohonInfo;
    verifikasi_fisik: VerifikasiFisikInfo[];
  };
}

export default function KasubagBastDashboardPage() {
  const [activeTab, setActiveTab] = useState<'siap-bast' | 'arsip-bast' | 'dalam-pemakaian'>('siap-bast');
  const [bookings, setBookings] = useState<BookingTransaction[]>([]);
  const [bastList, setBastList] = useState<BASTItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Issue BAST modal state
  const [selectedBookingForBast, setSelectedBookingForBast] = useState<BookingTransaction | null>(null);
  const [catatanPenutupan, setCatatanPenutupan] = useState('');
  const [submittingBast, setSubmittingBast] = useState(false);
  const [bastError, setBastError] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  // Detail viewer modal
  const [viewingBastDetail, setViewingBastDetail] = useState<BASTItem | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [resBookings, resBast] = await Promise.all([
        fetch('/api/peminjaman'),
        fetch('/api/bast'),
      ]);

      const dataBookings = await resBookings.json();
      const dataBast = await resBast.json();

      if (dataBookings.success) {
        setBookings(dataBookings.data || []);
      }
      if (dataBast.success) {
        setBastList(dataBast.data || []);
      }
    } catch (err) {
      console.error('Error fetching BAST dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter 1: Ready for BAST (Approved bookings with Pasca_Pengembalian inspection done, not yet Selesai)
  const readyForBastBookings = bookings.filter((b) => {
    if (b.status_transaksi !== 'Disetujui' || b.bast_digital) return false;
    const hasReturnInspection = (b.verifikasi_fisik || []).some(
      (v) => v.jenis_pemeriksaan === 'Pasca_Pengembalian'
    );
    return hasReturnInspection;
  });

  // Filter 2: In Use / Awaiting Staf Return Inspection (Approved bookings with NO return inspection yet)
  const inUseBookings = bookings.filter((b) => {
    if (b.status_transaksi !== 'Disetujui' || b.bast_digital) return false;
    const hasReturnInspection = (b.verifikasi_fisik || []).some(
      (v) => v.jenis_pemeriksaan === 'Pasca_Pengembalian'
    );
    return !hasReturnInspection;
  });

  // Filter 3: Search in active tab
  const filteredReady = readyForBastBookings.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.kode_transaksi.toLowerCase().includes(q) ||
      b.sarpras.nama_sarpras.toLowerCase().includes(q) ||
      b.pemohon.nama_lengkap.toLowerCase().includes(q)
    );
  });

  const filteredInUse = inUseBookings.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.kode_transaksi.toLowerCase().includes(q) ||
      b.sarpras.nama_sarpras.toLowerCase().includes(q) ||
      b.pemohon.nama_lengkap.toLowerCase().includes(q)
    );
  });

  const filteredArchive = bastList.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.nomor_bast.toLowerCase().includes(q) ||
      b.peminjaman.kode_transaksi.toLowerCase().includes(q) ||
      b.peminjaman.sarpras.nama_sarpras.toLowerCase().includes(q) ||
      b.peminjaman.pemohon.nama_lengkap.toLowerCase().includes(q)
    );
  });

  const handleOpenIssueModal = (booking: BookingTransaction) => {
    setSelectedBookingForBast(booking);
    setCatatanPenutupan('');
    setBastError('');
  };

  const handleConfirmIssueBast = async () => {
    if (!selectedBookingForBast) return;

    try {
      setSubmittingBast(true);
      setBastError('');

      const res = await fetch('/api/bast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_peminjaman: selectedBookingForBast.id_peminjaman,
          catatan_penutupan: catatanPenutupan.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBastError(data.message || 'Gagal menerbitkan BAST Digital.');
        return;
      }

      setFeedbackSuccess(data.message || 'BAST Digital resmi berhasil diterbitkan.');
      setSelectedBookingForBast(null);
      await fetchData();
      setActiveTab('arsip-bast');
    } catch (_err) {
      setBastError('Terjadi kesalahan koneksi saat memproses penerbitan BAST.');
    } finally {
      setSubmittingBast(false);
    }
  };

  const getCategoryIcon = (kat: string) => {
    switch (kat) {
      case 'Ruangan':
        return <Building2 className="h-4 w-4 text-blue-600" />;
      case 'Mobil_Operasional':
        return <Car className="h-4 w-4 text-emerald-600" />;
      default:
        return <Laptop className="h-4 w-4 text-amber-600" />;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-[#034275] p-2 text-white">
              <FileCheck className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Penerbitan Berita Acara Serah Terima (BAST) Digital
              </h1>
              <p className="text-xs text-slate-500">
                Konfirmasi serah-terima pengembalian fasilitas kampus dengan penandatanganan elektronik QR Signature (PRD UC-07).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-800 text-xs px-3 py-1">
            Kasubag Bagian Umum
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchData()}
            disabled={loading}
            className="text-xs h-8 flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Muat Ulang
          </Button>
        </div>
      </div>

      {feedbackSuccess && (
        <Alert variant="success" className="bg-emerald-50 border-emerald-300 text-emerald-900">
          <CheckCheck className="h-4 w-4 text-emerald-600" />
          <AlertTitle>Penerbitan Sukses</AlertTitle>
          <AlertDescription className="text-xs flex items-center justify-between">
            <span>{feedbackSuccess}</span>
            <button
              onClick={() => setFeedbackSuccess('')}
              className="text-xs underline text-emerald-700 hover:text-emerald-900"
            >
              Tutup
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className={`border-slate-200 cursor-pointer transition-all ${activeTab === 'siap-bast' ? 'ring-2 ring-[#034275] bg-blue-50/20' : 'hover:border-slate-300'}`} onClick={() => setActiveTab('siap-bast')}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Siap Diterbitkan BAST</div>
              <div className="text-2xl font-bold text-[#034275] mt-1">{readyForBastBookings.length}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Inspeksi fisik staf selesai</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-100 text-[#034275]">
              <FileCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border-slate-200 cursor-pointer transition-all ${activeTab === 'dalam-pemakaian' ? 'ring-2 ring-amber-500 bg-amber-50/20' : 'hover:border-slate-300'}`} onClick={() => setActiveTab('dalam-pemakaian')}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Dalam Pemakaian / Belum Inspeksi</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">{inUseBookings.length}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Menunggu verifikasi kembali staf</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border-slate-200 cursor-pointer transition-all ${activeTab === 'arsip-bast' ? 'ring-2 ring-emerald-500 bg-emerald-50/20' : 'hover:border-slate-300'}`} onClick={() => setActiveTab('arsip-bast')}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium">Total BAST Diterbitkan</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{bastList.length}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Dokumen resmi tuntas (PDF)</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('siap-bast')}
            className={`rounded-lg px-3.5 py-2 font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'siap-bast'
                ? 'bg-[#034275] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileCheck className="h-4 w-4" />
            Siap Penerbitan BAST ({readyForBastBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('dalam-pemakaian')}
            className={`rounded-lg px-3.5 py-2 font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'dalam-pemakaian'
                ? 'bg-[#034275] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="h-4 w-4" />
            Menunggu Inspeksi Staf ({inUseBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('arsip-bast')}
            className={`rounded-lg px-3.5 py-2 font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'arsip-bast'
                ? 'bg-[#034275] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            Arsip Dokumen BAST ({bastList.length})
          </button>
        </div>

        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Cari transaksi, BAST, peminjam..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      {/* Content for TAB 1: Siap Penerbitan BAST */}
      {activeTab === 'siap-bast' && (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="py-4 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base text-slate-800 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Daftar Fasilitas Siap Ditandatangani BAST Digital
            </CardTitle>
            <CardDescription className="text-xs">
              Transaksi berikut telah selesai digunakan dan telah lulus pemeriksaan fisik pasca-pengembalian oleh Staf Bagian Umum.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {filteredReady.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <CheckCircle2 className="mx-auto h-12 w-12 text-slate-300" />
                <div className="font-semibold text-slate-700">Tidak Ada Antrean BAST Saat Ini</div>
                <p className="text-xs text-slate-400">
                  Seluruh pengembalian fasilitas yang telah diinspeksi staf telah selesai diproses.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredReady.map((b) => {
                  const returnInspections = (b.verifikasi_fisik || []).filter(
                    (v) => v.jenis_pemeriksaan === 'Pasca_Pengembalian'
                  );
                  const latestInspection = returnInspections[0];

                  return (
                    <div
                      key={b.id_peminjaman}
                      className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[#034275] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {b.kode_transaksi}
                          </span>
                          <Badge variant="disetujui">Siap Terbit BAST</Badge>
                          {latestInspection && (
                            <Badge
                              variant={latestInspection.kondisi_fisik === 'Baik_Sesuai' ? 'success' : 'warning'}
                              className="text-[11px]"
                            >
                              ✓ Fisik:{' '}
                              {latestInspection.kondisi_fisik === 'Baik_Sesuai'
                                ? 'Baik & Sesuai'
                                : 'Ada Catatan Khusus'}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100">
                            {getCategoryIcon(b.sarpras.kategori)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 text-sm">{b.sarpras.nama_sarpras}</h3>
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
                          </div>
                        </div>

                        {/* Staf Inspection Note */}
                        {latestInspection && (
                          <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-2.5 text-xs text-emerald-900 space-y-0.5">
                            <div className="font-semibold flex items-center justify-between">
                              <span>Hasil Inspeksi Staf Bagian Umum:</span>
                              <span className="text-[10px] text-emerald-700 font-normal">
                                Pemeriksa: {latestInspection.staf?.nama_lengkap || 'Staf Teknis'} • {formatDateTime(latestInspection.created_at)}
                              </span>
                            </div>
                            <p className="italic text-[11px] text-emerald-800">
                              &quot;{latestInspection.catatan_inspeksi || 'Kondisi barang telah diperiksa dalam keadaan baik dan lengkap.'}&quot;
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row lg:flex-col items-center lg:items-end justify-end gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                        <Button
                          onClick={() => handleOpenIssueModal(b)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4 flex items-center gap-1.5 shadow-sm"
                        >
                          <FileCheck className="h-4 w-4" />
                          Terbitkan & Tandatangani BAST
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Content for TAB 2: Dalam Pemakaian / Menunggu Inspeksi Staf */}
      {activeTab === 'dalam-pemakaian' && (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="py-4 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base text-slate-800 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              Fasilitas Sedang Dipakai / Menunggu Verifikasi Staf Teknis
            </CardTitle>
            <CardDescription className="text-xs">
              Transaksi berikut belum dapat diterbitkan BAST karena staf teknis Bagian Umum belum menginput hasil inspeksi fisik pasca-pengembalian (PRD UC-07).
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {filteredInUse.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <CheckCircle2 className="mx-auto h-12 w-12 text-slate-300" />
                <div className="font-semibold text-slate-700">Tidak Ada Fasilitas Sedang Dipinjam</div>
                <p className="text-xs text-slate-400">Tidak ada peminjaman aktif yang menunggu proses inspeksi saat ini.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredInUse.map((b) => {
                  const isPastEnd = new Date() > new Date(b.tgl_selesai);

                  return (
                    <div
                      key={b.id_peminjaman}
                      className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[#034275] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {b.kode_transaksi}
                          </span>
                          <Badge variant="disetujui">In Use</Badge>
                          {isPastEnd && (
                            <Badge variant="warning" className="text-[11px]">
                              Waktu Selesai — Menunggu Staf
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {getCategoryIcon(b.sarpras.kategori)}
                          <span className="font-semibold text-slate-900 text-sm">
                            {b.sarpras.nama_sarpras}
                          </span>
                          <span className="text-xs text-slate-400">({b.sarpras.lokasi_plat})</span>
                        </div>

                        <div className="text-xs text-slate-500">
                          Peminjam: <strong>{b.pemohon.nama_lengkap}</strong> ({b.pemohon.role}) • Jadwal:{' '}
                          {formatDateTime(b.tgl_mulai)} s/d {formatDateTime(b.tgl_selesai)}
                        </div>
                      </div>

                      <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 max-w-xs text-right sm:text-left">
                        <span className="font-semibold block">Syarat BAST:</span>
                        Staf Bagian Umum harus menginput inspeksi fisik di Dasbor Verifikasi Teknis terlebih dahulu.
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Content for TAB 3: Arsip Dokumen BAST */}
      {activeTab === 'arsip-bast' && (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="py-4 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base text-slate-800 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#034275]" />
              Arsip Dokumen BAST Digital Resmi Politeknik
            </CardTitle>
            <CardDescription className="text-xs">
              Daftar seluruh Berita Acara Serah Terima sah yang diterbitkan dan ditandatangani secara elektronik dengan QR Signature Kasubag Umum.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {filteredArchive.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <FileCheck className="mx-auto h-12 w-12 text-slate-300" />
                <div className="font-semibold text-slate-700">Belum Ada Dokumen BAST Diterbitkan</div>
                <p className="text-xs text-slate-400">Dokumen akan otomatis tersimpan di sini saat Anda menyetujui serah terima.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredArchive.map((bast) => (
                  <div
                    key={bast.id_bast}
                    className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                          {bast.nomor_bast}
                        </span>
                        <Badge variant="selesai">Sah & Terarsip</Badge>
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          TRX: {bast.peminjaman.kode_transaksi}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {getCategoryIcon(bast.peminjaman.sarpras.kategori)}
                        <h3 className="font-semibold text-slate-900 text-sm">
                          {bast.peminjaman.sarpras.nama_sarpras}
                        </h3>
                        <span className="text-xs text-slate-500">
                          • BMN: {bast.peminjaman.sarpras.kode_aset}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                        <span>
                          <strong>Peminjam:</strong> {bast.peminjaman.pemohon.nama_lengkap} ({bast.peminjaman.pemohon.role})
                        </span>
                        <span>•</span>
                        <span>
                          <strong>Penandatangan:</strong> {bast.kasubag.nama_lengkap} (Kasubag Umum)
                        </span>
                        <span>•</span>
                        <span>
                          <strong>Tanggal:</strong> {formatDateTime(bast.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingBastDetail(bast)}
                        className="text-xs h-8 flex items-center gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-500" />
                        Rincian
                      </Button>

                      <a
                        href={`/api/bast/${bast.id_bast}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 flex items-center gap-1.5 border-[#034275] text-[#034275] hover:bg-blue-50"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Lihat PDF
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
                          Unduh PDF
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal Dialog: Konfirmasi Penerbitan BAST */}
      {selectedBookingForBast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-600 text-white">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Konfirmasi & Tanda Tangan BAST Digital
                  </h3>
                  <p className="text-xs text-slate-500">
                    Penerbitan dokumen Berita Acara Serah Terima resmi Politeknik Imigrasi dan Pemasyarakatan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBookingForBast(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 flex-1">
              {bastError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Gagal Menerbitkan BAST</AlertTitle>
                  <AlertDescription className="text-xs">{bastError}</AlertDescription>
                </Alert>
              )}

              {/* Rincian Transaksi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Fasilitas / Sarpras</div>
                  <div className="font-bold text-slate-900 text-sm">
                    {selectedBookingForBast.sarpras.nama_sarpras}
                  </div>
                  <div className="text-slate-500">
                    BMN: {selectedBookingForBast.sarpras.kode_aset} • {selectedBookingForBast.sarpras.lokasi_plat}
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Identitas Peminjam</div>
                  <div className="font-bold text-slate-900 text-sm">
                    {selectedBookingForBast.pemohon.nama_lengkap}
                  </div>
                  <div className="text-slate-500">
                    {selectedBookingForBast.pemohon.role} • {selectedBookingForBast.pemohon.email}
                  </div>
                </div>
              </div>

              {/* Hasil Inspeksi Staf Pasca-Pengembalian */}
              <div className="bg-emerald-50/70 border border-emerald-300 rounded-xl p-3.5 space-y-2">
                <div className="font-bold text-emerald-900 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCheck className="h-4 w-4 text-emerald-600" />
                    Laporan Verifikasi Fisik Staf Lapangan
                  </span>
                  <Badge variant="success">Lulus Inspeksi</Badge>
                </div>
                {selectedBookingForBast.verifikasi_fisik &&
                  selectedBookingForBast.verifikasi_fisik.length > 0 && (
                    <div className="text-xs text-emerald-800 space-y-1 bg-white/70 p-2.5 rounded-lg border border-emerald-200">
                      <div>
                        <strong>Kondisi Fisik:</strong>{' '}
                        {selectedBookingForBast.verifikasi_fisik[0].kondisi_fisik.replace('_', ' ')}
                      </div>
                      <div>
                        <strong>Catatan Petugas:</strong> &quot;
                        {selectedBookingForBast.verifikasi_fisik[0].catatan_inspeksi ||
                          'Tidak ada kerusakan atau kehilangan kelengkapan.'}
                        &quot;
                      </div>
                    </div>
                  )}
              </div>

              {/* Klausul Tanpa Denda Finansial (PRD §3.2) */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-blue-900 space-y-1">
                <div className="font-semibold text-xs flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  Klausul Bebas Denda Finansial (PRD §3.2):
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Sesuai ketentuan SIMASPRAS Poltekimipas, penyelesaian pengembalian sarpras dikelola secara tertib
                  dan membina tanpa pengenaan denda finansial. Transaksi ini akan ditutup dan status aset otomatis
                  dikembalikan menjadi <strong>Tersedia</strong> di katalog.
                </p>
              </div>

              {/* Catatan Kasubag */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">
                  Catatan Penutupan Kasubag Umum (Opsional):
                </label>
                <textarea
                  rows={2}
                  value={catatanPenutupan}
                  onChange={(e) => setCatatanPenutupan(e.target.value)}
                  placeholder="Contoh: Pengembalian diterima lengkap. Terima kasih atas penggunaan sarpras yang tertib."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:border-[#034275] focus:outline-none"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-3.5 bg-slate-50 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBookingForBast(null)}
                className="text-xs"
              >
                Batal
              </Button>

              <Button
                onClick={handleConfirmIssueBast}
                disabled={submittingBast}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-5 flex items-center gap-2"
              >
                <FileCheck className="h-4 w-4" />
                {submittingBast ? 'Menerbitkan & Menandatangani...' : 'Tandatangani Elektronik & Terbitkan BAST'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog: Detail BAST Terbit */}
      {viewingBastDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded">
                  {viewingBastDetail.nomor_bast}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Rincian Berita Acara Serah Terima (BAST)
                </h3>
              </div>
              <button
                onClick={() => setViewingBastDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <div className="font-bold text-emerald-900 text-sm">Dokumen BAST Digital Resmi</div>
                <p className="font-mono text-[11px] text-emerald-800 bg-white py-1 px-3 rounded border border-emerald-200 inline-block">
                  QR Signature: {viewingBastDetail.qr_signature}
                </p>
                <p className="text-[11px] text-slate-500">
                  Ditandatangani secara elektronik oleh Kasubag Umum pada {formatDateTime(viewingBastDetail.created_at)}
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-800">Detail Para Pihak & Fasilitas:</div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5">
                  <div>
                    <strong>Pihak Peminjam:</strong> {viewingBastDetail.peminjaman.pemohon.nama_lengkap} (
                    {viewingBastDetail.peminjaman.pemohon.role})
                  </div>
                  <div>
                    <strong>Fasilitas:</strong> {viewingBastDetail.peminjaman.sarpras.nama_sarpras} (BMN:{' '}
                    {viewingBastDetail.peminjaman.sarpras.kode_aset})
                  </div>
                  <div>
                    <strong>Lokasi / Plat:</strong> {viewingBastDetail.peminjaman.sarpras.lokasi_plat}
                  </div>
                  <div>
                    <strong>Periode:</strong> {formatDateTime(viewingBastDetail.peminjaman.tgl_mulai)} s/d{' '}
                    {formatDateTime(viewingBastDetail.peminjaman.tgl_selesai)}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-3.5 bg-slate-50 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewingBastDetail(null)}
                className="text-xs"
              >
                Tutup
              </Button>

              <div className="flex items-center gap-2">
                <a
                  href={`/api/bast/${viewingBastDetail.id_bast}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8 border-[#034275] text-[#034275]"
                  >
                    <FileText className="h-3.5 w-3.5 mr-1" />
                    Lihat PDF
                  </Button>
                </a>
                <a
                  href={`/api/bast/${viewingBastDetail.id_bast}/pdf?download=true`}
                >
                  <Button
                    size="sm"
                    className="text-xs h-8 bg-[#034275] hover:bg-[#02335c] text-white"
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Unduh PDF
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
