'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDateTime } from '@/lib/utils';
import {
  Building2,
  Car,
  Laptop,
  MapPin,
  Calendar,
  ArrowRight,
  Sparkles,
  Search,
  Clock,
  CheckCircle2,
  X,
  Info,
  CalendarDays,
} from 'lucide-react';

interface SarprasItem {
  id_sarpras: string;
  kode_aset: string;
  nama_sarpras: string;
  kategori: 'Ruangan' | 'Mobil_Operasional' | 'Perangkat_Kerja';
  spesifikasi: string | null;
  lokasi_plat: string;
  status_operasional: 'Tersedia' | 'Maintenance' | 'Rusak' | 'Non_Aktif';
}

interface BookedSlot {
  id_peminjaman: string;
  kode_transaksi: string;
  tgl_mulai: string;
  tgl_selesai: string;
  status_slot: 'Reserved' | 'In Use';
  status_transaksi: string;
  maksud_kegiatan: string;
  pemohon_kategori: string;
  pemohon_nama: string;
}

interface AvailabilityData {
  sarpras: SarprasItem & { is_available: boolean };
  total_terisi: number;
  jadwal_terisi: BookedSlot[];
}

export default function KatalogPage() {
  const [sarprasList, setSarprasList] = useState<SarprasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'Ruangan' | 'Mobil_Operasional' | 'Perangkat_Kerja'>('ALL');
  const [search, setSearch] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  // Modal Kalender Ketersediaan
  const [selectedSarpras, setSelectedSarpras] = useState<SarprasItem | null>(null);
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const fetchSarpras = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sarpras');
      const data = await res.json();
      if (data.success) {
        setSarprasList(data.data);
      }
    } catch (e) {
      console.error('Fetch katalog error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSarpras();
  }, []);

  const openCalendarModal = async (item: SarprasItem) => {
    setSelectedSarpras(item);
    setLoadingAvailability(true);
    setAvailability(null);

    try {
      const res = await fetch(`/api/sarpras/${item.id_sarpras}/ketersediaan`);
      const data = await res.json();
      if (data.success) {
        setAvailability(data.data);
      }
    } catch (e) {
      console.error('Load availability error:', e);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const getIcon = (kategori: string) => {
    switch (kategori) {
      case 'Ruangan':
        return <Building2 className="h-6 w-6 text-[#034275]" />;
      case 'Mobil_Operasional':
        return <Car className="h-6 w-6 text-emerald-700" />;
      case 'Perangkat_Kerja':
      default:
        return <Laptop className="h-6 w-6 text-amber-700" />;
    }
  };

  const formatKategoriName = (kategori: string) => {
    if (kategori === 'Mobil_Operasional') return 'Mobil Operasional';
    if (kategori === 'Perangkat_Kerja') return 'Perangkat Kerja';
    return kategori;
  };

  const filteredItems = sarprasList.filter((item) => {
    const matchesCategory = activeCategory === 'ALL' || item.kategori === activeCategory;
    const matchesSearch =
      item.nama_sarpras.toLowerCase().includes(search.toLowerCase()) ||
      item.kode_aset.toLowerCase().includes(search.toLowerCase()) ||
      item.lokasi_plat.toLowerCase().includes(search.toLowerCase()) ||
      (item.spesifikasi && item.spesifikasi.toLowerCase().includes(search.toLowerCase()));
    const matchesAvailability = availableOnly ? item.status_operasional === 'Tersedia' : true;

    return matchesCategory && matchesSearch && matchesAvailability;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#034275] to-[#022b4d] p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <Badge className="bg-white/10 text-white border-white/20 text-xs">
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-300" />
            Katalog Resmi Sarpras Poltekimipas
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Katalog Fasilitas & Jadwal Ketersediaan
          </h1>
          <p className="text-sm text-slate-200 max-w-2xl">
            Tinjau spesifikasi fisik dan kalender ketersediaan <em>real-time</em> sarpras sebelum mengajukan permohonan digital (PRD UC-02 / UI-02).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/peminjaman/riwayat">
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 text-sm">
              Riwayat Peminjaman Saya
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Tabs Controls */}
      <div className="space-y-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                activeCategory === 'ALL'
                  ? 'bg-[#034275] text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Semua Fasilitas
            </button>
            <button
              onClick={() => setActiveCategory('Ruangan')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                activeCategory === 'Ruangan'
                  ? 'bg-[#034275] text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              Ruangan & Gedung
            </button>
            <button
              onClick={() => setActiveCategory('Mobil_Operasional')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                activeCategory === 'Mobil_Operasional'
                  ? 'bg-[#034275] text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Car className="h-3.5 w-3.5" />
              Mobil Operasional
            </button>
            <button
              onClick={() => setActiveCategory('Perangkat_Kerja')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                activeCategory === 'Perangkat_Kerja'
                  ? 'bg-[#034275] text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Laptop className="h-3.5 w-3.5" />
              Perangkat Kerja
            </button>
          </div>

          {/* Search & Checkbox */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="rounded border-slate-300 text-[#034275] focus:ring-[#034275]"
              />
              Hanya Yang Tersedia
            </label>

            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari fasilitas, kapasitas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Sarpras Grid */}
        {loading ? (
          <div className="py-16 text-center text-slate-500">Memuat katalog sarpras...</div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <Building2 className="mx-auto h-12 w-12 text-slate-300" />
            <div className="font-semibold text-slate-700">Tidak ada fasilitas yang cocok</div>
            <p className="text-xs">Coba sesuaikan kata kunci pencarian atau kategori filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((sarpras) => (
              <Card key={sarpras.id_sarpras} className="flex flex-col hover:shadow-md transition-shadow border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-100">{getIcon(sarpras.kategori)}</div>
                    <Badge
                      variant={
                        sarpras.status_operasional === 'Tersedia'
                          ? 'tersedia'
                          : sarpras.status_operasional === 'Maintenance'
                          ? 'maintenance'
                          : sarpras.status_operasional === 'Rusak'
                          ? 'ditolak'
                          : 'dibatalkan'
                      }
                    >
                      {sarpras.status_operasional}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg pt-2">{sarpras.nama_sarpras}</CardTitle>
                  <CardDescription className="text-xs font-mono text-slate-500">
                    {sarpras.kode_aset} • {formatKategoriName(sarpras.kategori)}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 flex-1 text-sm text-slate-600">
                  <div className="flex items-start gap-2 text-xs">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span>{sarpras.lokasi_plat}</span>
                  </div>
                  {sarpras.spesifikasi && (
                    <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {sarpras.spesifikasi}
                    </p>
                  )}
                </CardContent>

                <CardFooter className="pt-3 border-t border-slate-100 mt-auto flex flex-col gap-2 p-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-700"
                    onClick={() => openCalendarModal(sarpras)}
                  >
                    <CalendarDays className="h-3.5 w-3.5 text-[#034275]" />
                    Cek Kalender Ketersediaan
                  </Button>

                  <Link href={`/peminjaman/ajukan?sarpras=${sarpras.id_sarpras}`} className="w-full">
                    <Button
                      size="sm"
                      className="w-full flex items-center justify-center gap-1.5 text-xs"
                      disabled={sarpras.status_operasional !== 'Tersedia'}
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      {sarpras.status_operasional === 'Tersedia'
                        ? 'Lanjutkan Peminjaman'
                        : 'Sedang Maintenance/Non-Aktif'}
                      {sarpras.status_operasional === 'Tersedia' && <ArrowRight className="h-3.5 w-3.5 ml-1" />}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal Kalender Ketersediaan Real-Time (UC-02 / SD-02) */}
      {selectedSarpras && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-[#034275]" />
                  <h3 className="font-bold text-slate-900 text-lg">Kalender Ketersediaan Real-Time</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedSarpras.nama_sarpras} ({selectedSarpras.kode_aset})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSarpras(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Asset Status Banner */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Status Operasional: </span>
                  <Badge
                    variant={
                      selectedSarpras.status_operasional === 'Tersedia'
                        ? 'tersedia'
                        : selectedSarpras.status_operasional === 'Maintenance'
                        ? 'maintenance'
                        : 'ditolak'
                    }
                  >
                    {selectedSarpras.status_operasional}
                  </Badge>
                </div>
                <div className="text-slate-500 font-mono">
                  Lokasi: <span className="text-slate-800 font-medium">{selectedSarpras.lokasi_plat}</span>
                </div>
              </div>

              {loadingAvailability ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  Memeriksa jadwal transaksi terbaru...
                </div>
              ) : availability?.total_terisi === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                  <div className="font-bold text-slate-800">Jadwal Sepenuhnya Kosong (Tersedia)</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Belum ada pengajuan atau jadwal yang terisi pada fasilitas ini. Anda dapat memilih waktu kapan saja.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Slot Waktu Yang Sudah Terkunci / Terisi:
                    </h4>
                    <span className="text-xs text-slate-500">
                      Total: {availability?.total_terisi} Transaksi Terjadwal
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {availability?.jadwal_terisi.map((slot) => (
                      <div
                        key={slot.id_peminjaman}
                        className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-800">
                            {slot.kode_transaksi}
                          </span>
                          <Badge
                            variant={slot.status_slot === 'In Use' ? 'disetujui' : 'pending'}
                            className="text-[10px]"
                          >
                            {slot.status_slot === 'In Use' ? 'In Use (Disetujui)' : 'Reserved (Menunggu Kasubag)'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {formatDateTime(slot.tgl_mulai)} s/d {formatDateTime(slot.tgl_selesai)}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                          <span className="truncate max-w-[320px]">
                            <strong>Agenda:</strong> {slot.maksud_kegiatan}
                          </span>
                          <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                            {slot.pemohon_kategori}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Info className="h-4 w-4 text-blue-600" />
                <span>Slot bertanda <strong>Reserved</strong> sedang diverifikasi Kasubag</span>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedSarpras(null)}>
                  Tutup
                </Button>
                <Link href={`/peminjaman/ajukan?sarpras=${selectedSarpras.id_sarpras}`}>
                  <Button
                    size="sm"
                    disabled={selectedSarpras.status_operasional !== 'Tersedia'}
                    className="flex items-center gap-1"
                  >
                    Lanjutkan Peminjaman
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
