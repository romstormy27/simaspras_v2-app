'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AuthUser } from '@/types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { NotificationBell } from './notification-bell';
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
  Menu,
  X,
  User as UserIcon,
} from 'lucide-react';

interface NavbarProps {
  user: AuthUser | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu whenever pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setMobileMenuOpen(false);
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isPemohon = user && ['Dosen', 'Taruna', 'BPSDM', 'Kementerian', 'Alumni'].includes(user.role);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Brand & Desktop Nav Links */}
        <div className="flex items-center gap-4 lg:gap-6">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-[#034275] text-white shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-bold tracking-tight text-[#034275] block leading-none">
                SIMASPRAS
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Poltekimipas</span>
            </div>
          </Link>

          {/* Desktop Navigation Links based on role */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 pl-2 lg:pl-4">
              {isPemohon && (
                <>
                  <Link
                    href="/katalog"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname === '/katalog' ? 'bg-slate-100 text-[#034275] font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Calendar className="h-4 w-4" />
                    Katalog & Kalender
                  </Link>
                  <Link
                    href="/peminjaman/ajukan"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname === '/peminjaman/ajukan' ? 'bg-slate-100 text-[#034275] font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileCheck className="h-4 w-4" />
                    Ajukan Peminjaman
                  </Link>
                  <Link
                    href="/peminjaman/riwayat"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname === '/peminjaman/riwayat' ? 'bg-slate-100 text-[#034275] font-semibold' : 'text-slate-600 hover:text-slate-900'
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname === '/dashboard/approval' ? 'bg-slate-100 text-[#034275] font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Persetujuan Peminjaman
                  </Link>
                  <Link
                    href="/dashboard/bast"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname === '/dashboard/bast' ? 'bg-slate-100 text-[#034275] font-semibold' : 'text-slate-600 hover:text-slate-900'
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/dashboard/verifikasi' ? 'bg-slate-100 text-[#034275] font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                  Verifikasi & Inspeksi
                </Link>
              )}

              {user.role === 'Kabag' && (
                <Link
                  href="/dashboard/eksekutif"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/dashboard/eksekutif' ? 'bg-slate-100 text-[#034275] font-semibold' : 'text-slate-600 hover:text-slate-900'
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith('/admin/users') ? 'bg-slate-100 text-[#034275] font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    Kelola Pengguna
                  </Link>
                  <Link
                    href="/admin/sarpras"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith('/admin/sarpras') ? 'bg-slate-100 text-[#034275] font-semibold' : 'text-slate-600 hover:text-slate-900'
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

        {/* Right Section: Notification, Profile, and Mobile Hamburger Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-3">
              <NotificationBell />

              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-800 leading-tight">
                  {user.nama_lengkap}
                </span>
                <span className="text-xs text-slate-500">{user.email}</span>
              </div>

              <Badge variant="default" className="text-[10px] sm:text-[11px] py-0.5 px-2 bg-[#034275]">
                {user.role}
              </Badge>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hidden sm:flex text-slate-600 hover:text-red-600 hover:bg-red-50 items-center gap-1.5"
                title="Keluar"
              >
                <LogOut className="h-4 w-4" />
                <span>Keluar</span>
              </Button>

              {/* Hamburger Button for Mobile screens */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#034275]/20"
                aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
              >
                {mobileMenuOpen ? <X className="h-6 w-6 text-slate-800" /> : <Menu className="h-6 w-6 text-slate-800" />}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link href="/login">
                <Button variant="outline" size="sm" className="h-9 px-3 text-xs sm:text-sm">
                  Masuk
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="h-9 px-3 text-xs sm:text-sm">
                  Registrasi
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Slide-Over Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative ml-auto flex h-full w-[85%] max-w-xs flex-col bg-white shadow-2xl border-l border-slate-200 z-10 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#034275] text-white flex items-center justify-center">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-[#034275] block leading-none">SIMASPRAS</span>
                  <span className="text-[10px] text-slate-500 font-medium">Navigasi Layanan</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User Identity Card on Mobile Drawer */}
            {user && (
              <div className="p-4 border-b border-slate-100 bg-blue-50/40">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#034275] text-white flex items-center justify-center font-bold text-sm">
                    {user.nama_lengkap.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-slate-900 truncate">{user.nama_lengkap}</div>
                    <div className="text-xs text-slate-500 truncate">{user.email}</div>
                    <div className="mt-1">
                      <Badge className="bg-[#034275] text-[10px] py-0 px-2 font-medium">
                        Peran: {user.role}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Nav Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 text-sm font-medium">
              {user && isPemohon && (
                <>
                  <div className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Layanan Pemohon
                  </div>
                  <Link
                    href="/katalog"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      pathname === '/katalog' ? 'bg-[#034275] text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>Katalog & Kalender</span>
                  </Link>

                  <Link
                    href="/peminjaman/ajukan"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      pathname === '/peminjaman/ajukan' ? 'bg-[#034275] text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <FileCheck className="h-4 w-4 shrink-0" />
                    <span>Ajukan Peminjaman</span>
                  </Link>

                  <Link
                    href="/peminjaman/riwayat"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      pathname === '/peminjaman/riwayat' ? 'bg-[#034275] text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <ClipboardList className="h-4 w-4 shrink-0" />
                    <span>Riwayat Peminjaman</span>
                  </Link>
                </>
              )}

              {user && user.role === 'Kasubag' && (
                <>
                  <div className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Menu Kasubag Umum
                  </div>
                  <Link
                    href="/dashboard/approval"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      pathname === '/dashboard/approval' ? 'bg-[#034275] text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>Persetujuan Peminjaman</span>
                  </Link>

                  <Link
                    href="/dashboard/bast"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      pathname === '/dashboard/bast' ? 'bg-[#034275] text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <FileCheck className="h-4 w-4 shrink-0" />
                    <span>Penerbitan BAST Digital</span>
                  </Link>
                </>
              )}

              {user && user.role === 'Staf' && (
                <>
                  <div className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Menu Staf Umum
                  </div>
                  <Link
                    href="/dashboard/verifikasi"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      pathname === '/dashboard/verifikasi' ? 'bg-[#034275] text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>Verifikasi & Inspeksi Fisik</span>
                  </Link>
                </>
              )}

              {user && user.role === 'Kabag' && (
                <>
                  <div className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Menu Pimpinan
                  </div>
                  <Link
                    href="/dashboard/eksekutif"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      pathname === '/dashboard/eksekutif' ? 'bg-[#034275] text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <BarChart3 className="h-4 w-4 shrink-0" />
                    <span>Dashboard Eksekutif</span>
                  </Link>
                </>
              )}

              {user && user.role === 'Admin' && (
                <>
                  <div className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Menu Administrator
                  </div>
                  <Link
                    href="/admin/users"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      pathname.startsWith('/admin/users') ? 'bg-[#034275] text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="h-4 w-4 shrink-0" />
                    <span>Kelola Pengguna RBAC</span>
                  </Link>

                  <Link
                    href="/admin/sarpras"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      pathname.startsWith('/admin/sarpras') ? 'bg-[#034275] text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Layers className="h-4 w-4 shrink-0" />
                    <span>Master Data Sarpras</span>
                  </Link>
                </>
              )}

              {!user && (
                <div className="space-y-3 pt-4">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full p-2.5 border border-slate-300 rounded-xl text-slate-700 font-semibold"
                  >
                    <UserIcon className="h-4 w-4" />
                    Masuk ke Sistem
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full p-2.5 bg-[#034275] text-white rounded-xl font-semibold shadow-sm"
                  >
                    Registrasi Akun Pemohon
                  </Link>
                </div>
              )}
            </div>

            {/* Drawer Footer (Logout) */}
            {user && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/70">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 h-10 text-xs font-semibold rounded-xl"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Keluar dari Akun</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
