'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Building2, ArrowRight, UserPlus, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    email: '',
    password: '',
    no_hp: '',
    role: 'Dosen',
    nomor_identitas: '',
    instansi_kategori: '',
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Pendaftaran gagal');
        setLoading(false);
        return;
      }

      setSuccessMessage(data.message);
      setLoading(false);
    } catch (_err) {
      setError('Terjadi kesalahan koneksi. Silakan coba kembali.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#034275] text-white shadow-md">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">SIMASPRAS POLTEKIMIPAS</h1>
          <p className="text-sm text-slate-500">
            Formulir Pendaftaran Akun Pemohon Sarana & Prasarana
          </p>
        </div>

        <Card className="shadow-lg border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#034275]" />
              Registrasi Akun Pemohon
            </CardTitle>
            <CardDescription>
              Akun baru memerlukan verifikasi dan aktivasi oleh Administrator sebelum dapat digunakan.
            </CardDescription>
          </CardHeader>

          {successMessage ? (
            <CardContent className="space-y-4">
              <Alert variant="success">
                <div className="font-semibold mb-1">Pendaftaran Berhasil Terkirim!</div>
                <div className="text-xs">{successMessage}</div>
              </Alert>
              <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
                <p>
                  <strong>Langkah Selanjutnya:</strong>
                </p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Administrator Bagian Umum akan meninjau data identitas Anda.</li>
                  <li>Setelah diverifikasi, status akun akan diubah menjadi <strong>Aktif</strong>.</li>
                  <li>Anda dapat masuk menggunakan email dan password yang telah didaftarkan.</li>
                </ol>
              </div>
              <Link href="/login" className="block">
                <Button className="w-full">Kembali ke Halaman Login</Button>
              </Link>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && <Alert variant="destructive">{error}</Alert>}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Nama lengkap sesuai tanda pengenal"
                    value={formData.nama_lengkap}
                    onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Alamat Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="nama@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Nomor WhatsApp / HP <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="tel"
                      placeholder="081234567890"
                      value={formData.no_hp}
                      onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Kata Sandi (Password) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimal 6 karakter"
                      className="pr-10"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                      aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Kategori Pemohon <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034275]"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      required
                    >
                      <option value="Dosen">Dosen</option>
                      <option value="Taruna">Taruna</option>
                      <option value="BPSDM">BPSDM Imipas</option>
                      <option value="Kementerian">Instansi Kementerian</option>
                      <option value="Alumni">Ikatan Alumni</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Nomor Identitas <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="NIP / NIM / KTP / NIK"
                      value={formData.nomor_identitas}
                      onChange={(e) => setFormData({ ...formData, nomor_identitas: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Jurusan / Unit Kerja / Asal Instansi <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Contoh: Prodi Keimigrasian / Sekretariat Jenderal"
                    value={formData.instansi_kategori}
                    onChange={(e) => setFormData({ ...formData, instansi_kategori: e.target.value })}
                    required
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Mendaftarkan Akun...' : 'Kirim Pendaftaran'}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>

                <div className="text-center text-sm text-slate-600">
                  Sudah memiliki akun aktif?{' '}
                  <Link href="/login" className="font-semibold text-[#034275] hover:underline">
                    Masuk ke Sistem
                  </Link>
                </div>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
