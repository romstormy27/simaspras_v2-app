'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AuthUser } from '@/types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Building2,
  Calendar,
  ClipboardList,
  CheckCircle,
  FileCheck,
  BarChart3,
  Users,
  Layers,
  LogOut,
} from 'lucide-react';

interface NavbarProps {
  user: AuthUser | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isPemohon = user && ['Dosen', 'Taruna', 'BPSDM', 'Kementerian', 'Alumni'].includes(user.role);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#034275] text-white shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-[#034275] block leading-none">
                SIMASPRAS
              </span>
              <span className="text-xs text-slate-500 font-medium">Poltekimipas</span>
            </div>
          </Link>

          {/* Navigation Links based on role */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 pl-4">
              {isPemohon && (
                <>
                  <Link
                    href="/katalog"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      pathname === '/katalog' ? 'bg-slate-100 text-[#034275]' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Calendar className="h-4 w-4" />
                    Katalog & Kalender
                  </Link>
                  <Link
                    href="/peminjaman/ajukan"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      pathname === '/peminjaman/ajukan' ? 'bg-slate-100 text-[#034275]' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileCheck className="h-4 w-4" />
                    Ajukan Peminjaman
                  </Link>
                  <Link
                    href="/peminjaman/riwayat"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      pathname === '/peminjaman/riwayat' ? 'bg-slate-100 text-[#034275]' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ClipboardList className="h-4 w-4" />
                    Riwayat Peminjaman
                  </Link>
                </>
              )}

              {user.role === 'Kasubag' && (
                <>
                  <Link
                    href="/dashboard/approval"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      pathname === '/dashboard/approval' ? 'bg-slate-100 text-[#034275]' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Persetujuan Peminjaman
                  </Link>
                  <Link
                    href="/dashboard/bast"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      pathname === '/dashboard/bast' ? 'bg-slate-100 text-[#034275]' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileCheck className="h-4 w-4" />
                    BAST Digital
                  </Link>
                </>
              )}

              {user.role === 'Staf' && (
                <Link
                  href="/dashboard/verifikasi"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/dashboard/verifikasi' ? 'bg-slate-100 text-[#034275]' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                  Verifikasi & Inspeksi
                </Link>
              )}

              {user.role === 'Kabag' && (
                <Link
                  href="/dashboard/eksekutif"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/dashboard/eksekutif' ? 'bg-slate-100 text-[#034275]' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  Dashboard Eksekutif
                </Link>
              )}

              {user.role === 'Admin' && (
                <>
                  <Link
                    href="/admin/users"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      pathname.startsWith('/admin/users') ? 'bg-slate-100 text-[#034275]' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    Kelola Pengguna
                  </Link>
                  <Link
                    href="/admin/sarpras"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      pathname.startsWith('/admin/sarpras') ? 'bg-slate-100 text-[#034275]' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="h-4 w-4" />
                    Master Sarpras
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>

        {/* User Status / Action Buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-800 leading-tight">
                  {user.nama_lengkap}
                </span>
                <span className="text-xs text-slate-500">{user.email}</span>
              </div>
              <Badge variant="default" className="text-[11px] py-0.5 px-2 bg-[#034275]">
                {user.role}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-slate-600 hover:text-red-600 hover:bg-red-50 flex items-center gap-1.5"
                title="Keluar"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Keluar</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Masuk
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Registrasi Akun</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
