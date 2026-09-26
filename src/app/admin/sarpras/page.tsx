'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import {
  Layers,
  Plus,
  Building2,
  Car,
  Laptop,
  Search,
  Edit2,
  Trash2,
  Wrench,
  RefreshCw,
  X,
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

export default function AdminSarprasPage() {
  const [sarprasList, setSarprasList] = useState<SarprasItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [message, setMessage] = useState<{ type: 'success' | 'destructive'; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SarprasItem | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    kode_aset: '',
    nama_sarpras: '',
    kategori: 'Ruangan' as 'Ruangan' | 'Mobil_Operasional' | 'Perangkat_Kerja',
    spesifikasi: '',
    lokasi_plat: '',
    status_operasional: 'Tersedia' as 'Tersedia' | 'Maintenance' | 'Rusak' | 'Non_Aktif',
  });

  const fetchSarpras = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sarpras?include_inactive=true');
      const data = await res.json();
      if (data.success) {
        setSarprasList(data.data);
      }
    } catch (_e) {
      setMessage({ type: 'destructive', text: 'Gagal memuat data sarpras' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSarpras();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      kode_aset: '',
      nama_sarpras: '',
      kategori: 'Ruangan',
      spesifikasi: '',
      lokasi_plat: '',
      status_operasional: 'Tersedia',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: SarprasItem) => {
    setEditingItem(item);
    setFormData({
      kode_aset: item.kode_aset,
      nama_sarpras: item.nama_sarpras,
      kategori: item.kategori,
      spesifikasi: item.spesifikasi || '',
      lokasi_plat: item.lokasi_plat,
      status_operasional: item.status_operasional,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setMessage(null);

    try {
      const url = editingItem ? `/api/sarpras/${editingItem.id_sarpras}` : '/api/sarpras';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        setIsModalOpen(false);
        fetchSarpras();
      } else {
        setMessage({ type: 'destructive', text: data.message || 'Gagal menyimpan data' });
      }
    } catch (_e) {
      setMessage({ type: 'destructive', text: 'Terjadi kesalahan jaringan' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleMaintenance = async (item: SarprasItem) => {
    const nextStatus = item.status_operasional === 'Maintenance' ? 'Tersedia' : 'Maintenance';
    const confirmText =
      nextStatus === 'Maintenance'
        ? `Atur "${item.nama_sarpras}" ke status Maintenance? Fasilitas akan dikunci sementara dari katalog pemohon.`
        : `Kembalikan "${item.nama_sarpras}" ke status Tersedia?`;

    if (!confirm(confirmText)) return;

    try {
      const res = await fetch(`/api/sarpras/${item.id_sarpras}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_operasional: nextStatus }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        fetchSarpras();
      } else {
        setMessage({ type: 'destructive', text: data.message || 'Gagal mengubah status' });
      }
    } catch (_e) {
      setMessage({ type: 'destructive', text: 'Terjadi kesalahan jaringan' });
    }
  };

  const handleDelete = async (item: SarprasItem) => {
    if (!confirm(`Hapus fasilitas "${item.nama_sarpras}" (${item.kode_aset})?`)) return;

    try {
      const res = await fetch(`/api/sarpras/${item.id_sarpras}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        fetchSarpras();
      } else {
        setMessage({ type: 'destructive', text: data.message || 'Gagal menghapus aset' });
      }
    } catch (_e) {
      setMessage({ type: 'destructive', text: 'Terjadi kesalahan jaringan' });
    }
  };

  const getKategoriBadge = (kategori: string) => {
    switch (kategori) {
      case 'Ruangan':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Ruangan</Badge>;
      case 'Mobil_Operasional':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Mobil Operasional</Badge>;
      case 'Perangkat_Kerja':
      default:
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Perangkat Kerja</Badge>;
    }
  };

  const filteredItems = sarprasList.filter((item) => {
    const matchesSearch =
      item.nama_sarpras.toLowerCase().includes(search.toLowerCase()) ||
      item.kode_aset.toLowerCase().includes(search.toLowerCase()) ||
      item.lokasi_plat.toLowerCase().includes(search.toLowerCase()) ||
      (item.spesifikasi && item.spesifikasi.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || item.kategori === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const totalRuangan = sarprasList.filter((s) => s.kategori === 'Ruangan' && s.status_operasional !== 'Non_Aktif').length;
  const totalMobil = sarprasList.filter((s) => s.kategori === 'Mobil_Operasional' && s.status_operasional !== 'Non_Aktif').length;
  const totalAlat = sarprasList.filter((s) => s.kategori === 'Perangkat_Kerja' && s.status_operasional !== 'Non_Aktif').length;
  const totalMaintenance = sarprasList.filter((s) => s.status_operasional === 'Maintenance').length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Layers className="h-7 w-7 text-[#034275]" />
            Kelola Master Data Sarpras
          </h1>
          <p className="text-sm text-slate-500">
            Administrator — Pengelolaan fasilitas inventaris kampus: Ruangan, Mobil Operasional, dan Perangkat Kerja (PRD UC-09 / UI-09).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchSarpras} disabled={loading} className="flex items-center gap-1.5">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </Button>
          <Button size="sm" onClick={openAddModal} className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            Tambah Sarpras Baru
          </Button>
        </div>
      </div>

      {message && (
        <Alert variant={message.type} className="animate-in fade-in">
          {message.text}
        </Alert>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-[#034275] rounded-lg">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{totalRuangan}</div>
            <div className="text-xs text-slate-500">Ruangan Aktif</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{totalMobil}</div>
            <div className="text-xs text-slate-500">Mobil Operasional</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg">
            <Laptop className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{totalAlat}</div>
            <div className="text-xs text-slate-500">Perangkat Kerja</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-amber-100 text-amber-900 rounded-lg">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-amber-900">{totalMaintenance}</div>
            <div className="text-xs text-slate-500">Status Maintenance</div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Katalog Master Fasilitas & Aset</CardTitle>
              <CardDescription>
                Seluruh data sarpras terintegrasi dengan kode inventaris BMN dan status kelayakan operasional.
              </CardDescription>
            </div>

            {/* Filter and Search */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <select
                className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#034275] w-full sm:w-auto"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="ALL">Semua Kategori</option>
                <option value="Ruangan">Ruangan</option>
                <option value="Mobil_Operasional">Mobil Operasional</option>
                <option value="Perangkat_Kerja">Perangkat Kerja</option>
              </select>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, BMN, lokasi..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#034275]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Kode Aset (BMN)</th>
                  <th className="px-4 py-3">Nama Fasilitas</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Lokasi / Plat</th>
                  <th className="px-4 py-3">Status Operasional</th>
                  <th className="px-4 py-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Tidak ditemukan data sarpras yang sesuai kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((s) => (
                    <tr key={s.id_sarpras} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{s.kode_aset}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{s.nama_sarpras}</div>
                        {s.spesifikasi && (
                          <div className="text-[11px] text-slate-500 max-w-[260px] truncate">{s.spesifikasi}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">{getKategoriBadge(s.kategori)}</td>
                      <td className="px-4 py-3 text-slate-600">{s.lokasi_plat}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            s.status_operasional === 'Tersedia'
                              ? 'tersedia'
                              : s.status_operasional === 'Maintenance'
                              ? 'maintenance'
                              : s.status_operasional === 'Rusak'
                              ? 'ditolak'
                              : 'dibatalkan'
                          }
                        >
                          {s.status_operasional}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-slate-600 hover:text-amber-700"
                          title={s.status_operasional === 'Maintenance' ? 'Batal Maintenance' : 'Set Maintenance'}
                          onClick={() => handleToggleMaintenance(s)}
                        >
                          <Wrench className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-slate-600 hover:text-[#034275]"
                          title="Edit Fasilitas"
                          onClick={() => openEditModal(s)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-slate-600 hover:text-red-600"
                          title="Hapus / Nonaktifkan"
                          onClick={() => handleDelete(s)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Dialog Tambah / Edit Sarpras */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingItem ? 'Edit Master Data Sarpras' : 'Tambah Sarpras Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-700">Kode Aset (BMN)</label>
                  <Input
                    placeholder="Contoh: BMN-R-102"
                    value={formData.kode_aset}
                    onChange={(e) => setFormData({ ...formData, kode_aset: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-700">Kategori Fasilitas</label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#034275]"
                    value={formData.kategori}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        kategori: e.target.value as 'Ruangan' | 'Mobil_Operasional' | 'Perangkat_Kerja',
                      })
                    }
                    required
                  >
                    <option value="Ruangan">Ruangan</option>
                    <option value="Mobil_Operasional">Mobil Operasional</option>
                    <option value="Perangkat_Kerja">Perangkat Kerja</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-slate-700">Nama Fasilitas</label>
                <Input
                  placeholder="Contoh: Laboratorium Komputer Siber"
                  value={formData.nama_sarpras}
                  onChange={(e) => setFormData({ ...formData, nama_sarpras: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-700">Lokasi / Nomor Plat</label>
                  <Input
                    placeholder="Gedung Diklat Lt. 2 / B 1234 POL"
                    value={formData.lokasi_plat}
                    onChange={(e) => setFormData({ ...formData, lokasi_plat: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-700">Status Operasional</label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#034275]"
                    value={formData.status_operasional}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status_operasional: e.target.value as 'Tersedia' | 'Maintenance' | 'Rusak' | 'Non_Aktif',
                      })
                    }
                    required
                  >
                    <option value="Tersedia">Tersedia</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Rusak">Rusak</option>
                    <option value="Non_Aktif">Non-Aktif</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-slate-700">Spesifikasi & Fasilitas Detail</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#034275]"
                  placeholder="Kapasitas, kelengkapan audio visual, spesifikasi mesin..."
                  value={formData.spesifikasi}
                  onChange={(e) => setFormData({ ...formData, spesifikasi: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={formSubmitting}>
                  {formSubmitting ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Tambahkan Sarpras'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
