'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
} from 'lucide-react';

interface NavbarProps {
  user: AuthUser | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu whenever pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
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

  // Rute Publik yang dapat diakses publik tanpa login
  const isPublicRoute =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/pengaduan';

  // Hamburger menu HANYA aktif pada laman non-publik (memerlukan login)
  const showMobileMenu = !!user && !isPublicRoute;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
          {/* Brand & Desktop Nav Links */}
          <div className="flex items-center gap-4 lg:gap-6">
            <Link href="/" className="flex items-center gap-2 sm:gap-2.5">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-[#034275] text-white shadow-xs">
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

                {/* Tombol Logout: Tampil di sm:flex saat ada hamburger menu, atau selalu tampil di mobile saat berada di halaman publik tanpa hamburger */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className={`${
                    showMobileMenu ? 'hidden sm:flex' : 'flex'
                  } text-slate-600 hover:text-red-600 hover:bg-red-50 items-center gap-1.5 h-9 px-2 sm:px-3 text-xs`}
                  title="Keluar"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Keluar</span>
                </Button>

                {/* Hamburger Button: HANYA tampil pada laman non-publik (perlu login) */}
                {showMobileMenu && (
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen((prev) => !prev)}
                    className="md:hidden h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#034275]/20"
                    aria-label={mobileMenuOpen ? 'Tutup navigasi' : 'Buka navigasi'}
                  >
                    {mobileMenuOpen ? <X className="h-5 w-5 text-slate-800" /> : <Menu className="h-5 w-5 text-slate-800" />}
                  </button>
                )}
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
      </header>

      {/* Mobile Slide-Over Navigation Drawer via Portal: HANYA dirender pada laman non-publik */}
      {showMobileMenu && mounted && mobileMenuOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Backdrop with smooth blur and fade-in */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel: 100% solid white, right-anchored slide-in */}
          <aside
            className="fixed inset-y-0 right-0 z-[101] flex h-[100dvh] w-full max-w-[320px] sm:max-w-xs flex-col bg-white shadow-2xl border-l border-slate-200 animate-slide-in-right overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigasi Menu Mobile"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/90 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-[#034275] text-white flex items-center justify-center shadow-xs">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-[#034275] block leading-none">SIMASPRAS</span>
                  <span className="text-[10px] text-slate-500 font-medium">Poltekimipas</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors active:scale-95"
                aria-label="Tutup menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User Identity Card on Mobile Drawer */}
            <div className="p-4 border-b border-slate-100 bg-gradient-to-br from-blue-50/70 via-slate-50 to-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#034275] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
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

            {/* Mobile Nav Links: smooth scrolling list with active styling */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1 text-sm font-medium">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 ${
                  pathname === '/'
                    ? 'bg-[#034275] text-white shadow-xs font-semibold'
                    : 'text-slate-700 hover:bg-slate-100 active:scale-[0.98]'
                }`}
              >
                <Building2 className="h-4 w-4 shrink-0" />
                <span>Beranda Portal</span>
              </Link>

              {isPemohon && (
                <>
                  <div className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Layanan Pemohon
                  </div>
                  <Link
                    href="/katalog"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 ${
                      pathname === '/katalog'
                        ? 'bg-[#034275] text-white shadow-xs font-semibold'
                        : 'text-slate-700 hover:bg-slate-100 active:scale-[0.98]'
                    }`}
                  >
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>Katalog & Kalender</span>
                  </Link>

                  <Link
                    href="/peminjaman/ajukan"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 ${
                      pathname === '/peminjaman/ajukan'
                        ? 'bg-[#034275] text-white shadow-xs font-semibold'
                        : 'text-slate-700 hover:bg-slate-100 active:scale-[0.98]'
                    }`}
                  >
                    <FileCheck className="h-4 w-4 shrink-0" />
                    <span>Ajukan Peminjaman</span>
                  </Link>

                  <Link
                    href="/peminjaman/riwayat"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 ${
                      pathname === '/peminjaman/riwayat'
                        ? 'bg-[#034275] text-white shadow-xs font-semibold'
                        : 'text-slate-700 hover:bg-slate-100 active:scale-[0.98]'
                    }`}
                  >
                    <ClipboardList className="h-4 w-4 shrink-0" />
                    <span>Riwayat Peminjaman</span>
                  </Link>
                </>
              )}

              {user.role === 'Kasubag' && (
                <>
                  <div className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Menu Kasubag Umum
                  </div>
                  <Link
                    href="/dashboard/approval"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 ${
                      pathname === '/dashboard/approval'
                        ? 'bg-[#034275] text-white shadow-xs font-semibold'
                        : 'text-slate-700 hover:bg-slate-100 active:scale-[0.98]'
                    }`}
                  >
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>Persetujuan Peminjaman</span>
                  </Link>

                  <Link
                    href="/dashboard/bast"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 ${
                      pathname === '/dashboard/bast'
                        ? 'bg-[#034275] text-white shadow-xs font-semibold'
                        : 'text-slate-700 hover:bg-slate-100 active:scale-[0.98]'
                    }`}
                  >
                    <FileCheck className="h-4 w-4 shrink-0" />
                    <span>Penerbitan BAST Digital</span>
                  </Link>
                </>
              )}

              {user.role === 'Staf' && (
                <>
                  <div className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Menu Staf Umum
                  </div>
                  <Link
                    href="/dashboard/verifikasi"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 ${
                      pathname === '/dashboard/verifikasi'
                        ? 'bg-[#034275] text-white shadow-xs font-semibold'
                        : 'text-slate-700 hover:bg-slate-100 active:scale-[0.98]'
                    }`}
                  >
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>Verifikasi & Inspeksi Fisik</span>
                  </Link>
                </>
              )}

              {user.role === 'Kabag' && (
                <>
                  <div className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Menu Pimpinan
                  </div>
                  <Link
                    href="/dashboard/eksekutif"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 ${
                      pathname === '/dashboard/eksekutif'
                        ? 'bg-[#034275] text-white shadow-xs font-semibold'
                        : 'text-slate-700 hover:bg-slate-100 active:scale-[0.98]'
                    }`}
                  >
                    <BarChart3 className="h-4 w-4 shrink-0" />
                    <span>Dashboard Eksekutif</span>
                  </Link>
                </>
              )}

              {user.role === 'Admin' && (
                <>
                  <div className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Menu Administrator
                  </div>
                  <Link
                    href="/admin/users"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 ${
                      pathname.startsWith('/admin/users')
                        ? 'bg-[#034275] text-white shadow-xs font-semibold'
                        : 'text-slate-700 hover:bg-slate-100 active:scale-[0.98]'
                    }`}
                  >
                    <Users className="h-4 w-4 shrink-0" />
                    <span>Kelola Pengguna RBAC</span>
                  </Link>

                  <Link
                    href="/admin/sarpras"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 ${
                      pathname.startsWith('/admin/sarpras')
                        ? 'bg-[#034275] text-white shadow-xs font-semibold'
                        : 'text-slate-700 hover:bg-slate-100 active:scale-[0.98]'
                    }`}
                  >
                    <Layers className="h-4 w-4 shrink-0" />
                    <span>Master Data Sarpras</span>
                  </Link>
                </>
              )}

            </nav>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 shrink-0 space-y-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 min-h-[44px] text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:text-rose-800 transition-all active:scale-[0.98]"
              >
                <LogOut className="h-4 w-4" />
                <span>Keluar dari Akun</span>
              </Button>
              <div className="text-center text-[10px] text-slate-400">
                SIMASPRAS V2 • Poltekimipas
              </div>
            </div>
          </aside>
        </div>,
        document.body
      )}
    </>
  );
}
