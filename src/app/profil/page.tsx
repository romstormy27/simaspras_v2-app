'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { formatDateTime } from '@/lib/utils';
import {
  User,
  Shield,
  KeyRound,
  Mail,
  Phone,
  CreditCard,
  Building,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  Lock,
} from 'lucide-react';

interface ProfileData {
  id_user: string;
  nama_lengkap: string;
  email: string;
  no_hp: string;
  role: string;
  status_aktivasi: 'Pending' | 'Aktif' | 'Ditolak';
  nomor_identitas: string;
  instansi_kategori: string;
  created_at: string;
}

export default function ProfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State: Profile Details
  const [namaLengkap, setNamaLengkap] = useState('');
  const [email, setEmail] = useState('');
  const [noHp, setNoHp] = useState('');
  const [nomorIdentitas, setNomorIdentitas] = useState('');
  const [instansiKategori, setInstansiKategori] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Form State: Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Notification / Alert Message
  const [message, setMessage] = useState<{ type: 'success' | 'destructive'; text: string } | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/profile');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (data.success && data.data) {
        const u: ProfileData = data.data;
        setProfile(u);
        setNamaLengkap(u.nama_lengkap || '');
        setEmail(u.email || '');
        setNoHp(u.no_hp || '');
        setNomorIdentitas(u.nomor_identitas || '');
        setInstansiKategori(u.instansi_kategori || '');
      } else {
        setMessage({ type: 'destructive', text: data.message || 'Gagal memuat profil pengguna' });
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
      setMessage({ type: 'destructive', text: 'Terjadi kesalahan koneksi saat memuat profil' });
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!namaLengkap.trim() || namaLengkap.trim().length < 3) {
      setMessage({ type: 'destructive', text: 'Nama lengkap minimal 3 karakter' });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setMessage({ type: 'destructive', text: 'Format alamat email tidak valid' });
      return;
    }
    if (!noHp.trim() || noHp.trim().length < 10) {
      setMessage({ type: 'destructive', text: 'Nomor WhatsApp / HP minimal 10 digit' });
      return;
    }

    try {
      setIsSavingProfile(true);
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_lengkap: namaLengkap.trim(),
          email: email.trim(),
          no_hp: noHp.trim(),
          nomor_identitas: nomorIdentitas.trim(),
          instansi_kategori: instansiKategori.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: data.message || 'Profil Anda berhasil diperbarui' });
        // Sync state
        if (data.data) {
          setProfile((prev) => prev ? { ...prev, ...data.data } : null);
        }
        router.refresh();
      } else {
        setMessage({ type: 'destructive', text: data.message || 'Gagal memperbarui profil' });
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setMessage({ type: 'destructive', text: 'Gagal menghubungi server saat memperbarui profil' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!currentPassword) {
      setMessage({ type: 'destructive', text: 'Kata sandi saat ini wajib diisi' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setMessage({ type: 'destructive', text: 'Kata sandi baru minimal 6 karakter' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'destructive', text: 'Konfirmasi kata sandi baru tidak cocok' });
      return;
    }

    try {
      setIsSavingPassword(true);
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_lengkap: namaLengkap.trim(),
          email: email.trim(),
          no_hp: noHp.trim(),
          nomor_identitas: nomorIdentitas.trim(),
          instansi_kategori: instansiKategori.trim(),
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: data.message || 'Kata sandi Anda berhasil diperbarui' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'destructive', text: data.message || 'Gagal mengganti kata sandi' });
      }
    } catch (err) {
      console.error('Update password error:', err);
      setMessage({ type: 'destructive', text: 'Gagal menghubungi server saat mengganti kata sandi' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-3 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#034275] border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Memuat data profil akun...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#034275] text-white shadow-xs shrink-0">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Profil & Pengaturan Akun
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Kelola informasi identitas pribadi, kontak dinas, dan kredensial keamanan Anda.
            </p>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {message && (
        <Alert variant={message.type} className="animate-in fade-in flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span className="text-xs sm:text-sm">{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-xs underline ml-4 hover:opacity-80 p-1 font-medium"
          >
            Tutup
          </button>
        </Alert>
      )}

      {/* Card 1: Read-Only Account Overview */}
      {profile && (
        <Card className="border-slate-200 shadow-xs overflow-hidden">
          <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-blue-50/70 via-slate-50 to-white border-b border-slate-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-[#034275] text-white flex items-center justify-center font-bold text-xl sm:text-2xl shadow-xs shrink-0">
                {profile.nama_lengkap.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                    {profile.nama_lengkap}
                  </h2>
                  <Badge className="bg-[#034275] text-[11px] py-0.5 px-2.5">
                    Peran: {profile.role}
                  </Badge>
                  <Badge
                    variant={
                      profile.status_aktivasi === 'Aktif'
                        ? 'selesai'
                        : profile.status_aktivasi === 'Pending'
                        ? 'pending'
                        : 'ditolak'
                    }
                    className="text-[11px] py-0.5 px-2.5"
                  >
                    Status: {profile.status_aktivasi}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-mono">{profile.email}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-0.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Terdaftar sejak: {formatDateTime(profile.created_at)}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 bg-slate-50/50 text-xs text-slate-600 flex items-start gap-2 border-t border-slate-100">
            <Shield className="h-4 w-4 text-[#034275] shrink-0 mt-0.5" />
            <p>
              Hak akses sistem (RBAC) dan status aktivasi akun ditetapkan berdasarkan verifikasi administratif. 
              Jika terdapat kebutuhan perubahan wewenang peran, silakan berkoordinasi dengan Administrator Sistem.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grid: 2 Form Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form 1: Personal Data & Contact (7 cols on lg) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleUpdateProfile}>
            <Card className="border-slate-200 shadow-xs h-full flex flex-col">
              <CardHeader className="p-4 sm:p-6 border-b border-slate-100 bg-white">
                <CardTitle className="text-base sm:text-lg text-slate-800 flex items-center gap-2">
                  <User className="h-5 w-5 text-[#034275]" />
                  <span>Informasi Identitas & Kontak</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Perbarui nama lengkap, kontak WhatsApp, serta identitas kedinasan pemohon Anda.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      value={namaLengkap}
                      onChange={(e) => setNamaLengkap(e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      required
                      className="pl-9 h-10 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Alamat Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@kemenkumham.go.id"
                      required
                      className="pl-9 h-10 text-sm font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Digunakan untuk autentikasi login dan menerima notifikasi sistem.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nomor WhatsApp / HP Aktif <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      type="tel"
                      value={noHp}
                      onChange={(e) => setNoHp(e.target.value)}
                      placeholder="081234567890"
                      required
                      className="pl-9 h-10 text-sm font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Diperlukan untuk koordinasi operasional serah terima kunci/sarpras.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nomor Identitas (NIP / NIK / NIM / NRP)
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        type="text"
                        value={nomorIdentitas}
                        onChange={(e) => setNomorIdentitas(e.target.value)}
                        placeholder="Contoh: 198501012010121001"
                        className="pl-9 h-10 text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Instansi / Unit Kerja / Program Studi
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        type="text"
                        value={instansiKategori}
                        onChange={(e) => setInstansiKategori(e.target.value)}
                        placeholder="Contoh: Prodi Keimigrasian / Bagian Umum"
                        className="pl-9 h-10 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <Button
                  type="submit"
                  disabled={isSavingProfile}
                  className="bg-[#034275] hover:bg-[#023157] text-white flex items-center gap-2 min-h-[44px] px-5 text-xs sm:text-sm font-medium w-full sm:w-auto"
                >
                  <Save className={`h-4 w-4 ${isSavingProfile ? 'animate-spin' : ''}`} />
                  <span>{isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan Data'}</span>
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>

        {/* Form 2: Password Security (5 cols on lg) */}
        <div className="lg:col-span-5">
          <form onSubmit={handleUpdatePassword}>
            <Card className="border-slate-200 shadow-xs h-full flex flex-col">
              <CardHeader className="p-4 sm:p-6 border-b border-slate-100 bg-white">
                <CardTitle className="text-base sm:text-lg text-slate-800 flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-amber-600" />
                  <span>Keamanan Kata Sandi</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Ubah kata sandi secara berkala demi menjaga keamanan akun SIMASPRAS Anda.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Kata Sandi Saat Ini <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan kata sandi lama"
                      required
                      className="pl-9 pr-10 h-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Kata Sandi Baru <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      required
                      minLength={6}
                      className="pl-9 pr-10 h-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Gunakan kombinasi huruf, angka, dan karakter simbol.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Konfirmasi Kata Sandi Baru <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi baru"
                      required
                      minLength={6}
                      className="pl-9 pr-10 h-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-[11px] text-red-600 mt-1">Konfirmasi kata sandi tidak cocok</p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <Button
                  type="submit"
                  disabled={isSavingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                  className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 min-h-[44px] px-5 text-xs sm:text-sm font-medium w-full sm:w-auto"
                >
                  <KeyRound className={`h-4 w-4 ${isSavingPassword ? 'animate-spin' : ''}`} />
                  <span>{isSavingPassword ? 'Menyimpan...' : 'Perbarui Kata Sandi'}</span>
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}
