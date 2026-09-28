'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatDateTime } from '@/lib/utils';
import {
  CalendarDays,
  Clock,
  Building2,
  Car,
  Laptop,
  CheckCircle2,
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  Info,
  CalendarCheck,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

interface Sarpras {
  id_sarpras: string;
  kode_aset: string;
  nama_sarpras: string;
  kategori: string;
  spesifikasi: string | null;
  lokasi_plat: string;
  status_operasional: string;
}

interface ConflictDetail {
  kode_transaksi: string;
  tgl_mulai: string;
  tgl_selesai: string;
  status_transaksi: string;
}

interface AlternativeSarpras {
  id_sarpras: string;
  kode_aset: string;
  nama_sarpras: string;
  lokasi_plat: string;
  spesifikasi: string | null;
}

function FormPengajuanContent() {
  const searchParams = useSearchParams();
  const initialSarprasId = searchParams.get('sarpras') || '';

  const [sarprasList, setSarprasList] = useState<Sarpras[]>([]);
  const [selectedSarprasId, setSelectedSarprasId] = useState<string>(initialSarprasId);
  const [selectedSarpras, setSelectedSarpras] = useState<Sarpras | null>(null);

  // Form states
  const [tglMulai, setTglMulai] = useState('');
  const [tglSelesai, setTglSelesai] = useState('');
  const [maksudKegiatan, setMaksudKegiatan] = useState('');
  const [jumlahUnit, setJumlahUnit] = useState<number>(1);
  const [catatanTeknis, setCatatanTeknis] = useState('');
  const [paktaIntegritas, setPaktaIntegritas] = useState(false);

  // Availability / schedule info for selected sarpras
  const [occupiedSlots, setOccupiedSlots] = useState<any[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // State statuses
  const [loading, setLoading] = useState(false);
  const [fetchingList, setFetchingList] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [conflicts, setConflicts] = useState<ConflictDetail[]>([]);
  const [alternatives, setAlternatives] = useState<AlternativeSarpras[]>([]);
  const [successData, setSuccessData] = useState<any | null>(null);

  // Set default initial dates: tomorrow 08:00 to 16:00
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');

    setTglMulai(`${yyyy}-${mm}-${dd}T08:00`);
    setTglSelesai(`${yyyy}-${mm}-${dd}T16:00`);
  }, []);

  // Fetch available sarpras list
  useEffect(() => {
    const fetchSarpras = async () => {
      try {
        setFetchingList(true);
        const res = await fetch('/api/sarpras');
        const data = await res.json();
        if (data.success) {
          const availableOnly = data.data.filter(
            (s: Sarpras) => s.status_operasional === 'Tersedia'
          );
          setSarprasList(availableOnly);

          if (initialSarprasId) {
            const found = availableOnly.find((s: Sarpras) => s.id_sarpras === initialSarprasId);
            if (found) setSelectedSarpras(found);
          } else if (availableOnly.length > 0) {
            setSelectedSarprasId(availableOnly[0].id_sarpras);
            setSelectedSarpras(availableOnly[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load sarpras:', err);
      } finally {
        setFetchingList(false);
      }
    };

    fetchSarpras();
  }, [initialSarprasId]);

  // When selectedSarprasId changes, update selectedSarpras and fetch its schedule
  useEffect(() => {
    if (!selectedSarprasId) return;
    const found = sarprasList.find((s) => s.id_sarpras === selectedSarprasId);
    if (found) {
      setSelectedSarpras(found);
      fetchSchedule(found.id_sarpras);
    }
  }, [selectedSarprasId, sarprasList]);

  const fetchSchedule = async (id: string) => {
    try {
      setLoadingSchedule(true);
      const res = await fetch(`/api/sarpras/${id}/ketersediaan`);
      const data = await res.json();
      if (data.success) {
        setOccupiedSlots(data.data.jadwal_terisi || []);
      }
    } catch (err) {
      console.error('Failed to load schedule:', err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleSelectAlternative = (altId: string) => {
    setSelectedSarprasId(altId);
    setConflicts([]);
    setAlternatives([]);
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setConflicts([]);
    setAlternatives([]);

    if (!paktaIntegritas) {
      setErrorMessage('Persetujuan Pakta Integritas Peminjaman Digital wajib dicentang sebelum mengirim pengajuan.');
      return;
    }

    if (!selectedSarprasId) {
      setErrorMessage('Silakan pilih fasilitas atau sarpras yang ingin dipinjam.');
      return;
    }

    if (!tglMulai || !tglSelesai) {
      setErrorMessage('Rentang tanggal dan jam peminjaman wajib diisi.');
      return;
    }

    const start = new Date(tglMulai);
    const end = new Date(tglSelesai);

    if (start >= end) {
      setErrorMessage('Waktu selesai peminjaman harus lebih lambat dari waktu mulai.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/peminjaman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_sarpras: selectedSarprasId,
          tgl_mulai: tglMulai,
          tgl_selesai: tglSelesai,
          maksud_kegiatan: maksudKegiatan,
          jumlah_unit: Number(jumlahUnit) || 1,
          catatan_teknis: catatanTeknis,
          pakta_integritas: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          // Schedule conflict detected!
          setErrorMessage(data.message || 'Jadwal Bentrok: Fasilitas telah terisi pada slot waktu tersebut.');
          setConflicts(data.conflicts || []);
          setAlternatives(data.saran_alternatif || []);
        } else {
          setErrorMessage(data.message || 'Gagal mengajukan peminjaman.');
        }
        return;
      }

      setSuccessData(data.data);
    } catch (_err: any) {
      setErrorMessage('Terjadi kesalahan jaringan atau server. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'Ruangan':
        return <Building2 className="h-5 w-5 text-indigo-600" />;
      case 'Mobil_Operasional':
        return <Car className="h-5 w-5 text-emerald-600" />;
      case 'Perangkat_Kerja':
        return <Laptop className="h-5 w-5 text-amber-600" />;
      default:
        return <Building2 className="h-5 w-5 text-slate-600" />;
    }
  };

  if (successData) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Card className="border-emerald-200 bg-white shadow-xl overflow-hidden">
          <div className="bg-emerald-600 p-6 text-center text-white">
            <CheckCircle2 className="mx-auto h-16 w-16 text-white mb-3" />
            <h2 className="text-2xl font-bold">Pengajuan Peminjaman Berhasil!</h2>
            <p className="text-emerald-100 text-sm mt-1">
              Slot jadwal telah terkunci secara atomik (Pending Approval Kasubag).
            </p>
          </div>

          <CardContent className="p-6 space-y-5">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-2.5 text-sm">
              <div className="flex justify-between border-b pb-2 border-slate-200">
                <span className="text-slate-500 font-medium">Nomor Kode Transaksi</span>
                <span className="font-mono font-bold text-[#034275]">{successData.kode_transaksi}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-slate-200">
                <span className="text-slate-500 font-medium">Fasilitas / Sarpras</span>
                <span className="font-semibold text-slate-800">{successData.sarpras?.nama_sarpras}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-slate-200">
                <span className="text-slate-500 font-medium">Waktu Mulai</span>
                <span className="text-slate-700">{formatDateTime(successData.tgl_mulai)}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-slate-200">
                <span className="text-slate-500 font-medium">Waktu Selesai</span>
                <span className="text-slate-700">{formatDateTime(successData.tgl_selesai)}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500 font-medium">Status Peminjaman</span>
                <Badge variant="warning" className="text-xs">
                  Pending Approval Kasubag
                </Badge>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-xs text-blue-800 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-blue-900">
                <Info className="h-4 w-4" />
                Langkah Selanjutnya:
              </div>
              <p>
                1. Staf Bagian Umum akan memverifikasi kesiapan teknis sarpras.
              </p>
              <p>
                2. Kasubag Bagian Umum akan meninjau dan menyetujui permohonan Anda.
              </p>
              <p>
                3. Begitu disetujui, Tiket Digital QR Code akan diterbitkan otomatis pada menu Riwayat Peminjaman.
              </p>
            </div>
          </CardContent>

          <CardFooter className="bg-slate-50 p-6 flex flex-col sm:flex-row gap-3 border-t border-slate-200">
            <Link href="/peminjaman/riwayat" className="w-full">
              <Button className="w-full flex items-center justify-center gap-2">
                <FileCheck2 className="h-4 w-4" />
                Lihat Riwayat Peminjaman
              </Button>
            </Link>
            <Link href="/katalog" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">
                Kembali ke Katalog
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/katalog" className="hover:text-[#034275] flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Kembali ke Katalog
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Form Pengajuan Peminjaman</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <CalendarCheck className="h-7 w-7 text-[#034275]" />
            Formulir Pengajuan Peminjaman Digital
          </h1>
          <p className="text-sm text-slate-500">
            Layanan peminjaman fasilitas sarana & prasarana Poltekim / Poltekip 100% paperless.
          </p>
        </div>
      </div>

      {/* Main Grid: Form Left, Facility & Schedule Info Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2 text-[#034275]">
                <FileCheck2 className="h-5 w-5" />
                Rincian Permohonan Peminjaman
              </CardTitle>
              <CardDescription>
                Isi data jadwal operasional dan maksud agenda dengan lengkap dan akurat.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} id="booking-form" className="space-y-5">
                {/* Error Banner (hanya jika bukan kasus bentrok yang sudah ditangani card khusus) */}
                {errorMessage && conflicts.length === 0 && (
                  <Alert variant="destructive" className="animate-in fade-in">
                    <AlertTitle>Perhatian</AlertTitle>
                    <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
                  </Alert>
                )}

                {/* Conflict Card with Alternatives */}
                {conflicts.length > 0 && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-3 animate-in fade-in">
                    <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
                      <ShieldAlert className="h-5 w-5 text-amber-700 flex-shrink-0" />
                      Slot Jadwal Tidak Tersedia / Telah Terisi
                    </div>
                    <div className="text-xs text-amber-800 space-y-1">
                      <p>Fasilitas yang Anda pilih sudah memiliki peminjaman aktif pada jam tersebut:</p>
                      {conflicts.map((c, i) => (
                        <div key={i} className="font-mono bg-amber-100/80 p-2 rounded border border-amber-200 mt-1">
                          • {formatDateTime(c.tgl_mulai)} s/d {formatDateTime(c.tgl_selesai)} ({c.kode_transaksi})
                        </div>
                      ))}
                    </div>

                    {alternatives.length > 0 && (
                      <div className="pt-2 border-t border-amber-200 space-y-2">
                        <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                          Rekomendasi Alternatif Sarpras Sejenis yang Masih Kosong:
                        </div>
                        <div className="space-y-1.5">
                          {alternatives.map((alt) => (
                            <div
                              key={alt.id_sarpras}
                              className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-amber-200 text-xs hover:border-amber-400 transition-colors"
                            >
                              <div>
                                <div className="font-bold text-slate-800">{alt.nama_sarpras}</div>
                                <div className="text-slate-500 text-[11px]">{alt.lokasi_plat} • {alt.kode_aset}</div>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleSelectAlternative(alt.id_sarpras)}
                                className="h-7 text-xs border-amber-600 text-amber-800 hover:bg-amber-100"
                              >
                                Pilih Unit Ini
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Facility Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Pilih Fasilitas Sarpras <span className="text-red-500">*</span>
                  </label>
                  {fetchingList ? (
                    <div className="text-xs text-slate-400 py-2">Memuat daftar fasilitas...</div>
                  ) : (
                    <select
                      value={selectedSarprasId}
                      onChange={(e) => setSelectedSarprasId(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#034275] focus:outline-none focus:ring-1 focus:ring-[#034275] transition-colors"
                      required
                    >
                      <option value="" disabled>-- Pilih Ruangan / Kendaraan / Alat --</option>
                      {sarprasList.map((s) => (
                        <option key={s.id_sarpras} value={s.id_sarpras}>
                          [{s.kategori.replace('_', ' ')}] {s.nama_sarpras} - {s.lokasi_plat} ({s.kode_aset})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Date & Time Range Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Waktu Mulai Peminjaman <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type="datetime-local"
                        value={tglMulai}
                        onChange={(e) => setTglMulai(e.target.value)}
                        className="text-xs h-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Waktu Selesai Peminjaman <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type="datetime-local"
                        value={tglSelesai}
                        onChange={(e) => setTglSelesai(e.target.value)}
                        className="text-xs h-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Agenda / Purpose */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Maksud / Agenda Kegiatan Operasional <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={maksudKegiatan}
                    onChange={(e) => setMaksudKegiatan(e.target.value)}
                    placeholder="Contoh: Kuliah Umum Manajemen Keimigrasian & Pemasyarakatan bersama Taruna Tingkat III. Diperlukan sound system dan proyektor aktif."
                    className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-900 focus:border-[#034275] focus:outline-none focus:ring-1 focus:ring-[#034275] placeholder:text-slate-400"
                    required
                    minLength={5}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Jelaskan rincian kegiatan kedinasan/akademik secara jelas untuk pertimbangan persetujuan Kasubag Umum.
                  </p>
                </div>

                {/* Additional Technical Notes & Unit Quantity */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Jumlah Unit
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={jumlahUnit}
                      onChange={(e) => setJumlahUnit(Number(e.target.value))}
                      className="text-xs h-10"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Catatan Teknis Khusus (Opsional)
                    </label>
                    <Input
                      type="text"
                      placeholder="Contoh: Butuh kabel HDMI panjang / mic wireless 2 unit"
                      value={catatanTeknis}
                      onChange={(e) => setCatatanTeknis(e.target.value)}
                      className="text-xs h-10"
                    />
                  </div>
                </div>

                {/* Pakta Integritas Peminjaman Digital */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                    <ShieldAlert className="h-4 w-4 text-[#034275]" />
                    Pakta Integritas Peminjaman Digital Poltekimipas
                  </div>

                  <div className="rounded-lg bg-white p-3 border border-slate-200 text-xs text-slate-600 space-y-1.5 leading-relaxed max-h-36 overflow-y-auto">
                    <p className="font-semibold text-slate-800">
                      Dengan mengajukan permohonan ini, Pemohon menyatakan tunduk pada ketentuan:
                    </p>
                    <ol className="list-decimal pl-4 space-y-1 text-[11px]">
                      <li>
                        Fasilitas hanya dipergunakan untuk kepentingan kedinasan, pendidikan, dan kegiatan resmi institusi.
                      </li>
                      <li>
                        Pemohon bertanggung jawab penuh atas kebersihan, ketertiban, dan keutuhan kondisi fisik fasilitas selama masa peminjaman.
                      </li>
                      <li>
                        Tidak mengalihkan atau memindahtangankan penggunaan fasilitas kepada pihak ketiga tanpa izin resmi Bagian Umum.
                      </li>
                      <li>
                        <strong>Bebas Denda Finansial:</strong> Setiap kerusakan fisik atau kehilangan yang timbul akan diselesaikan melalui mekanisme pertanggungjawaban kedinasan / sanksi tata tertib politeknik, bukan ganti rugi uang tunai.
                      </li>
                      <li>
                        Wajib menyerahkan kembali tepat waktu dan menandatangani Berita Acara Serah Terima (BAST Digital) setelah verifikasi fisik oleh Staf Umum.
                      </li>
                    </ol>
                  </div>

                  <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={paktaIntegritas}
                      onChange={(e) => setPaktaIntegritas(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-[#034275] focus:ring-[#034275] h-4 w-4"
                      required
                    />
                    <span className="font-medium">
                      Saya telah membaca, memahami, dan menyetujui seluruh ketentuan dalam{' '}
                      <strong>Pakta Integritas Peminjaman Fasilitas</strong> di atas secara sadar dan bertanggung jawab.
                    </span>
                  </label>
                </div>
              </form>
            </CardContent>

            <CardFooter className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
              <Link href="/katalog">
                <Button variant="outline" size="sm" type="button">
                  Batal
                </Button>
              </Link>
              <Button
                form="booking-form"
                type="submit"
                size="sm"
                disabled={loading || !selectedSarprasId || !paktaIntegritas}
                className="flex items-center gap-2"
              >
                {loading ? 'Mengunci Slot Jadwal...' : 'Kirim Pengajuan Digital'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right Info Column (5 cols): Selected Facility Preview & Schedule */}
        <div className="lg:col-span-5 space-y-6">
          {/* Facility Details Card */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-[#034275] p-4 text-white">
              <div className="text-[11px] font-semibold tracking-wider uppercase text-blue-200">
                Spesifikasi Fasilitas Terpilih
              </div>
              <h2 className="text-lg font-bold flex items-center gap-2 mt-0.5">
                {selectedSarpras?.nama_sarpras || 'Pilih Fasilitas'}
              </h2>
            </div>

            <CardContent className="p-4 space-y-3.5 text-xs">
              {selectedSarpras ? (
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Kategori Aset</span>
                    <Badge variant="outline" className="flex items-center gap-1 font-semibold">
                      {getCategoryIcon(selectedSarpras.kategori)}
                      {selectedSarpras.kategori.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Kode Inventaris BMN</span>
                    <span className="font-mono font-bold text-slate-800">{selectedSarpras.kode_aset}</span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Lokasi / Plat Kendaraan</span>
                    <span className="font-semibold text-slate-700">{selectedSarpras.lokasi_plat}</span>
                  </div>

                  {selectedSarpras.spesifikasi && (
                    <div className="pt-1">
                      <span className="text-slate-500 font-medium block mb-1">Kapasitas & Fasilitas Fisik:</span>
                      <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-600 leading-relaxed text-[11px]">
                        {selectedSarpras.spesifikasi}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8 text-center text-slate-400">
                  Silakan pilih sarpras pada dropdown untuk melihat rincian spesifikasi fasilitas.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule Calendar Indicator for this Sarpras */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center justify-between text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-[#034275]" />
                  Jadwal Terisi Fasilitas Ini
                </span>
                <span className="text-[11px] font-normal text-slate-500">
                  {occupiedSlots.length} slot terisi
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                Periksa slot waktu yang telah terisi agar pengajuan Anda tidak bentrok.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0">
              {loadingSchedule ? (
                <div className="py-6 text-center text-xs text-slate-400">Memeriksa jadwal kalender...</div>
              ) : occupiedSlots.length === 0 ? (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 text-center text-xs text-emerald-800 space-y-1">
                  <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600" />
                  <div className="font-bold">Belum Ada Transaksi Terjadwal</div>
                  <p className="text-[11px] text-emerald-700">
                    Fasilitas ini sedang bebas antrean. Slot waktu yang Anda pilih berpeluang besar langsung disetujui.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {occupiedSlots.map((slot, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-700 text-[11px]">
                          {slot.kode_transaksi}
                        </span>
                        <Badge
                          variant={slot.status_transaksi === 'Disetujui' ? 'success' : 'warning'}
                          className="text-[10px] py-0 h-4"
                        >
                          {slot.status_transaksi === 'Disetujui' ? 'In Use' : 'Reserved'}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center gap-1">
                        <CalendarDays className="h-3 w-3 text-slate-400" />
                        <span>{formatDateTime(slot.tgl_mulai)} s/d {formatDateTime(slot.tgl_selesai)}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 italic truncate">
                        Pemohon: {slot.pemohon}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function FormPengajuanPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Memuat formulir pengajuan...</div>}>
      <FormPengajuanContent />
    </Suspense>
  );
}
