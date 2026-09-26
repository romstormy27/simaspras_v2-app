'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { formatDateTime } from '@/lib/utils';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  RefreshCw,
  Search,
  History,
  FileSpreadsheet,
  Shield,
  ShieldAlert,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface UserRecord {
  id_user: string;
  nama_lengkap: string;
  email: string;
  no_hp: string;
  role: string;
  status_aktivasi: 'Pending' | 'Aktif' | 'Ditolak';
  created_at: string;
  nomor_identitas: string;
  instansi_kategori: string;
}

interface AuditRecord {
  id_log: string;
  aktivitas: string;
  ip_address: string;
  timestamp: string;
  user_nama: string;
  user_email: string;
  user_role: string;
}

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'users' | 'audit'>('pending');
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'destructive'; text: string } | null>(null);

  // Users Filter States
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('Semua');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('Semua');

  // Audit Logs Filter States
  const [auditSearch, setAuditSearch] = useState('');
  const [auditRoleFilter, setAuditRoleFilter] = useState<string>('Semua');
  const [auditStartDate, setAuditStartDate] = useState('');
  const [auditEndDate, setAuditEndDate] = useState('');
  const [auditLoading, setAuditLoading] = useState(false);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (e) {
      console.error('Fetch users error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Audit Logs with Filters
  const fetchAuditLogs = useCallback(async () => {
    try {
      setAuditLoading(true);
      const params = new URLSearchParams();
      if (auditSearch.trim()) params.set('search', auditSearch.trim());
      if (auditRoleFilter && auditRoleFilter !== 'Semua') params.set('role', auditRoleFilter);
      if (auditStartDate) params.set('start_date', auditStartDate);
      if (auditEndDate) params.set('end_date', auditEndDate);

      const res = await fetch(`/api/admin/audit-log?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.data);
      }
    } catch (e) {
      console.error('Fetch audit log error:', e);
    } finally {
      setAuditLoading(false);
    }
  }, [auditSearch, auditRoleFilter, auditStartDate, auditEndDate]);

  useEffect(() => {
    fetchUsers();
    fetchAuditLogs();
  }, [fetchUsers, fetchAuditLogs]);

  const handleActivation = async (userId: string, decision: 'Setujui' | 'Tolak') => {
    let reason = '';
    if (decision === 'Tolak') {
      const promptReason = prompt('Masukkan alasan penolakan aktivasi:');
      if (promptReason === null) return;
      reason = promptReason;
    }

    try {
      setActionLoading(userId);
      const res = await fetch(`/api/admin/users/${userId}/aktivasi`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, reason }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        fetchUsers();
        fetchAuditLogs();
      } else {
        setMessage({ type: 'destructive', text: data.message || 'Gagal memproses aksi' });
      }
    } catch (_e) {
      setMessage({ type: 'destructive', text: 'Terjadi kesalahan jaringan' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Ubah hak akses (role) pengguna ini menjadi "${newRole}"?`)) return;

    try {
      setActionLoading(userId);
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newRole }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        fetchUsers();
        fetchAuditLogs();
      } else {
        setMessage({ type: 'destructive', text: data.message || 'Gagal mengubah role' });
      }
    } catch (_e) {
      setMessage({ type: 'destructive', text: 'Terjadi kesalahan jaringan' });
    } finally {
      setActionLoading(null);
    }
  };

  const pendingUsers = users.filter((u) => u.status_aktivasi === 'Pending');

  const filteredUsers = users.filter((u) => {
    // Search match
    const q = userSearch.toLowerCase();
    const matchesSearch =
      !q ||
      u.nama_lengkap.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.nomor_identitas && u.nomor_identitas.toLowerCase().includes(q)) ||
      (u.instansi_kategori && u.instansi_kategori.toLowerCase().includes(q));

    // Status filter
    const matchesStatus = userStatusFilter === 'Semua' || u.status_aktivasi === userStatusFilter;

    // Role filter
    const matchesRole = userRoleFilter === 'Semua' || u.role === userRoleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#034275] text-white">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Manajemen Pengguna, Hak Akses RBAC & Audit Trail
              </h1>
              <p className="text-xs text-slate-500">
                Tata kelola 9 peran RBAC, persetujuan aktivasi akun, dan pemantauan forensik keamanan (PRD UC-10 / Seksi 14).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-900 text-xs px-3 py-1">
            Administrator Sistem
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchUsers();
              fetchAuditLogs();
            }}
            disabled={loading || auditLoading}
            className="flex items-center gap-1.5 text-xs h-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading || auditLoading ? 'animate-spin' : ''}`} />
            Segarkan Data
          </Button>
        </div>
      </div>

      {message && (
        <Alert variant={message.type} className="animate-in fade-in flex items-center justify-between">
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="text-xs underline ml-4 hover:opacity-80"
          >
            Tutup
          </button>
        </Alert>
      )}

      {/* Tabs Layout UI-10 */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'pending'
                ? 'border-[#034275] text-[#034275]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Clock className="h-4 w-4" />
            Pending Aktivasi
            {pendingUsers.length > 0 && (
              <span className="ml-1 rounded-full bg-amber-500 text-white text-[11px] font-bold px-2 py-0.5">
                {pendingUsers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'users'
                ? 'border-[#034275] text-[#034275]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            Daftar User & Role RBAC
            <span className="ml-1 rounded-full bg-slate-200 text-slate-700 text-[11px] px-2 py-0.5 font-mono">
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'audit'
                ? 'border-[#034275] text-[#034275]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <History className="h-4 w-4" />
            Log Audit Trail Keamanan
            <span className="ml-1 rounded-full bg-slate-200 text-slate-700 text-[11px] px-2 py-0.5 font-mono">
              {auditLogs.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Tab 1: Pending Aktivasi */}
      {activeTab === 'pending' && (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="py-4 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base text-slate-800">Antrean Persetujuan Aktivasi Akun</CardTitle>
            <CardDescription className="text-xs">
              Tinjau identitas calon pemohon sarpras sebelum mengaktifkan hak akses login ke sistem (PRD UC-01 & UC-10).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {pendingUsers.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                <p className="font-semibold text-slate-700">Tidak ada antrean aktivasi akun</p>
                <p className="text-xs text-slate-400">Seluruh permohonan pendaftaran telah selesai diproses.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Nama Lengkap & Kontak</th>
                      <th className="px-4 py-3">Peran Diajukan</th>
                      <th className="px-4 py-3">Nomor Identitas</th>
                      <th className="px-4 py-3">Instansi / Unit Kerja</th>
                      <th className="px-4 py-3">Waktu Daftar</th>
                      <th className="px-4 py-3 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingUsers.map((u) => (
                      <tr key={u.id_user} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{u.nama_lengkap}</div>
                          <div className="text-[11px] text-slate-500">{u.email}</div>
                          <div className="text-[11px] text-slate-400">{u.no_hp}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="default" className="bg-[#034275] text-[11px]">
                            {u.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-mono">{u.nomor_identitas || '-'}</td>
                        <td className="px-4 py-3">{u.instansi_kategori || '-'}</td>
                        <td className="px-4 py-3 text-slate-500">{formatDateTime(u.created_at)}</td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                            disabled={actionLoading === u.id_user}
                            onClick={() => handleActivation(u.id_user, 'Setujui')}
                          >
                            <UserCheck className="mr-1 h-3.5 w-3.5" />
                            Setujui
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-xs h-8"
                            disabled={actionLoading === u.id_user}
                            onClick={() => handleActivation(u.id_user, 'Tolak')}
                          >
                            <UserX className="mr-1 h-3.5 w-3.5" />
                            Tolak
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Daftar User & Konfigurasi Role RBAC */}
      {activeTab === 'users' && (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base text-slate-800">
                  Daftar Pengguna & Konfigurasi Hak Akses (9 Peran RBAC)
                </CardTitle>
                <CardDescription className="text-xs">
                  Kelola peran otorisasi RBAC (Dosen, Taruna, BPSDM, Kementerian, Alumni, Staf, Kasubag, Kabag, Admin) secara instan.
                </CardDescription>
              </div>

              {/* Filter controls */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#034275]"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Aktif">Status: Aktif</option>
                  <option value="Pending">Status: Pending</option>
                  <option value="Ditolak">Status: Ditolak</option>
                </select>

                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#034275]"
                >
                  <option value="Semua">Semua Peran</option>
                  <option value="Dosen">Dosen</option>
                  <option value="Taruna">Taruna</option>
                  <option value="BPSDM">BPSDM</option>
                  <option value="Kementerian">Kementerian</option>
                  <option value="Alumni">Alumni</option>
                  <option value="Staf">Staf Umum</option>
                  <option value="Kasubag">Kasubag Umum</option>
                  <option value="Kabag">Kabag Keuangan</option>
                  <option value="Admin">Administrator</option>
                </select>

                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Cari pengguna..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Nama Lengkap & Email</th>
                    <th className="px-4 py-3">Status Aktivasi</th>
                    <th className="px-4 py-3">Role RBAC Saat Ini</th>
                    <th className="px-4 py-3">No. Identitas & Unit</th>
                    <th className="px-4 py-3 text-right">Ubah Hak Akses (RBAC)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        Tidak ada pengguna yang cocok dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id_user} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{u.nama_lengkap}</div>
                          <div className="text-[11px] text-slate-500">{u.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              u.status_aktivasi === 'Aktif'
                                ? 'selesai'
                                : u.status_aktivasi === 'Pending'
                                ? 'pending'
                                : 'ditolak'
                            }
                            className="text-[10px]"
                          >
                            {u.status_aktivasi}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-800 text-xs bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-mono text-slate-800">{u.nomor_identitas || '-'}</div>
                          <div className="text-slate-500 truncate max-w-[200px]">{u.instansi_kategori || '-'}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <select
                            className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#034275]"
                            value={u.role}
                            disabled={actionLoading === u.id_user}
                            onChange={(e) => handleRoleChange(u.id_user, e.target.value)}
                          >
                            <option value="Dosen">Dosen</option>
                            <option value="Taruna">Taruna</option>
                            <option value="BPSDM">BPSDM</option>
                            <option value="Kementerian">Kementerian</option>
                            <option value="Alumni">Alumni</option>
                            <option value="Staf">Staf Umum</option>
                            <option value="Kasubag">Kasubag Umum</option>
                            <option value="Kabag">Kabag Keuangan</option>
                            <option value="Admin">Administrator</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Log Audit Trail */}
      {activeTab === 'audit' && (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                  <History className="h-5 w-5 text-[#034275]" />
                  Rekam Jejak Keamanan & Log Audit Trail
                </CardTitle>
                <CardDescription className="text-xs">
                  Seluruh mutasi data penting (Login, Aktivasi Akun, Perubahan Role RBAC, Peminjaman, BAST) tercatat permanen.
                </CardDescription>
              </div>

              {/* Export Audit Log Button */}
              <div className="flex items-center gap-2">
                <a
                  href={`/api/admin/audit-log?export=excel&search=${encodeURIComponent(auditSearch)}&role=${encodeURIComponent(auditRoleFilter)}&start_date=${encodeURIComponent(auditStartDate)}&end_date=${encodeURIComponent(auditEndDate)}`}
                >
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 flex items-center gap-1.5 shadow-sm"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Ekspor Audit Trail (.xlsx)
                  </Button>
                </a>
              </div>
            </div>

            {/* Filter Bar for Audit Trail */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-3 border-t border-slate-200/60 mt-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Cari aktivitas / aktor / IP..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>

              <div>
                <select
                  value={auditRoleFilter}
                  onChange={(e) => setAuditRoleFilter(e.target.value)}
                  className="h-8 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#034275]"
                >
                  <option value="Semua">Semua Peran Aktor</option>
                  <option value="Admin">Admin</option>
                  <option value="Kasubag">Kasubag</option>
                  <option value="Staf">Staf</option>
                  <option value="Kabag">Kabag</option>
                  <option value="Dosen">Dosen</option>
                  <option value="Taruna">Taruna</option>
                  <option value="BPSDM">BPSDM</option>
                  <option value="Kementerian">Kementerian</option>
                  <option value="Alumni">Alumni</option>
                </select>
              </div>

              <div>
                <Input
                  type="date"
                  value={auditStartDate}
                  onChange={(e) => setAuditStartDate(e.target.value)}
                  placeholder="Tanggal Mulai"
                  className="h-8 text-xs text-slate-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={auditEndDate}
                  onChange={(e) => setAuditEndDate(e.target.value)}
                  placeholder="Tanggal Akhir"
                  className="h-8 text-xs text-slate-600 flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setAuditSearch('');
                    setAuditRoleFilter('Semua');
                    setAuditStartDate('');
                    setAuditEndDate('');
                  }}
                  className="h-8 px-2 text-[11px]"
                  title="Reset Filter"
                >
                  Reset
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Waktu (WIB)</th>
                    <th className="px-4 py-3">Aktor Pengguna</th>
                    <th className="px-4 py-3">Peran</th>
                    <th className="px-4 py-3">Deskripsi Aktivitas</th>
                    <th className="px-4 py-3">Alamat IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 font-sans">
                        Tidak ada catatan log aktivitas yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id_log} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {formatDateTime(log.timestamp)}
                        </td>
                        <td className="px-4 py-3 font-sans">
                          <div className="font-semibold text-slate-900">{log.user_nama}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{log.user_email}</div>
                        </td>
                        <td className="px-4 py-3 font-sans">
                          <Badge variant="outline" className="text-[10px]">
                            {log.user_role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-sans text-slate-800">{log.aktivitas}</td>
                        <td className="px-4 py-3 text-slate-500">{log.ip_address || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
