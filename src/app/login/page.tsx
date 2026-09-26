'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Building2, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Login gagal');
        setLoading(false);
        return;
      }

      // Redirect ke dasbor sesuai peran
      const target = searchParams.get('from') || data.data.redirectUrl;
      router.push(target);
      router.refresh();
    } catch (_err) {
      setError('Terjadi kesalahan jaringan. Coba lagi beberapa saat.');
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('password123');
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#034275] text-white shadow-md">
          <Building2 className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">SIMASPRAS POLTEKIMIPAS</h1>
        <p className="text-sm text-slate-500">
          Sistem Informasi Peminjaman Sarana dan Prasarana Kampus
        </p>
      </div>

      <Card className="shadow-lg border-slate-200">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">Masuk ke Akun Anda</CardTitle>
          <CardDescription>Masukkan email resmi dan password untuk melanjutkan</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <Alert variant="destructive">{error}</Alert>}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  placeholder="nama@politeknik.ac.id"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Memverifikasi...' : 'Masuk Sekarang'}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>

            <div className="text-center text-sm text-slate-600">
              Belum memiliki akun?{' '}
              <Link href="/register" className="font-semibold text-[#034275] hover:underline">
                Registrasi Pemohon
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* Quick Demo Login Picker */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <ShieldCheck className="h-4 w-4 text-[#034275]" />
          Akun Percobaan Cepat (Seed Data):
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleQuickLogin('admin@politeknik.ac.id')}
            className="rounded-lg border border-slate-200 p-2 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="font-bold text-slate-800">Administrator</div>
            <div className="text-[11px] text-slate-500 truncate">admin@politeknik.ac.id</div>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('kasubag.umum@politeknik.ac.id')}
            className="rounded-lg border border-slate-200 p-2 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="font-bold text-slate-800">Kasubag Umum</div>
            <div className="text-[11px] text-slate-500 truncate">kasubag.umum@...</div>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('staf.umum@politeknik.ac.id')}
            className="rounded-lg border border-slate-200 p-2 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="font-bold text-slate-800">Staf Umum</div>
            <div className="text-[11px] text-slate-500 truncate">staf.umum@...</div>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('kabag.keuangan@politeknik.ac.id')}
            className="rounded-lg border border-slate-200 p-2 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="font-bold text-slate-800">Kabag Keuangan</div>
            <div className="text-[11px] text-slate-500 truncate">kabag.keuangan@...</div>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('dosen@politeknik.ac.id')}
            className="rounded-lg border border-slate-200 p-2 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="font-bold text-slate-800">Pemohon Dosen</div>
            <div className="text-[11px] text-slate-500 truncate">dosen@politeknik.ac.id</div>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('taruna@politeknik.ac.id')}
            className="rounded-lg border border-slate-200 p-2 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="font-bold text-slate-800">Pemohon Taruna</div>
            <div className="text-[11px] text-slate-500 truncate">taruna@politeknik.ac.id</div>
          </button>
        </div>
        <p className="text-[11px] text-slate-400 text-center">Password seluruh akun contoh: <code>password123</code></p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <Suspense fallback={<div className="text-sm text-slate-500">Memuat formulir login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
