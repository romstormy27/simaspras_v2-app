'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ClipboardCheck,
  FileCheck,
  ShieldAlert,
  Info,
  ExternalLink,
} from 'lucide-react';
import { InAppNotifikasi, TipeNotifikasi } from '@/types';

function formatRelativeTime(dateString: string | Date): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Baru saja';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m yang lalu`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}j yang lalu`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}h yang lalu`;

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getNotificationIcon(tipe: TipeNotifikasi) {
  switch (tipe) {
    case 'Persetujuan':
      return <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />;
    case 'Penolakan':
      return <XCircle className="h-4 w-4 text-rose-600 shrink-0" />;
    case 'Peringatan':
      return <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />;
    case 'Inspeksi':
      return <ClipboardCheck className="h-4 w-4 text-blue-600 shrink-0" />;
    case 'BAST':
      return <FileCheck className="h-4 w-4 text-indigo-600 shrink-0" />;
    case 'Keamanan':
      return <ShieldAlert className="h-4 w-4 text-red-600 shrink-0" />;
    case 'Info':
    default:
      return <Info className="h-4 w-4 text-sky-600 shrink-0" />;
  }
}

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<InAppNotifikasi[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=30');
      const data = await res.json();
      if (data.success && data.data) {
        setNotifications(data.data.notifications || []);
        setUnreadCount(data.data.unread_count || 0);
      }
    } catch (e) {
      console.warn('Gagal mengambil notifikasi:', e);
    }
  }, []);

  // Polling adaptif setiap 30 detik & refetch saat jendela aktif
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchNotifications]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id_notifikasi: string, tautan?: string | null) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id_notifikasi === id_notifikasi ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch(`/api/notifications/${id_notifikasi}/read`, {
        method: 'PATCH',
      });
    } catch (e) {
      console.warn('Gagal menandai notifikasi dibaca:', e);
    }

    if (tautan) {
      setIsOpen(false);
      router.push(tautan);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    setLoading(true);
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
      });
    } catch (e) {
      console.warn('Gagal menandai semua notifikasi dibaca:', e);
      fetchNotifications();
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.is_read;
    return true;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Tombol Lonceng Notifikasi */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#034275]/20"
        title="Pemberitahuan Sistem"
        aria-label="Notifikasi"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full shadow-sm animate-in zoom-in-75">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Notifikasi */}
      {isOpen && (
        <div className="fixed inset-x-2 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96 max-w-sm sm:max-w-none rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fade-in">
          {/* Header Popover */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Notifikasi</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  {unreadCount} Baru
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="text-xs text-[#034275] hover:text-[#022b4d] font-semibold flex items-center gap-1 transition-colors hover:underline disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* Tab Filter */}
          <div className="flex border-b border-slate-100 bg-white px-2 pt-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-[#034275] text-[#034275] font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={`flex-1 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'unread'
                  ? 'border-[#034275] text-[#034275] font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Belum Dibaca ({unreadCount})
            </button>
          </div>

          {/* Daftar Notifikasi */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2">
                <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Bell className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-slate-700">
                  {activeTab === 'unread' ? 'Tidak ada notifikasi belum dibaca' : 'Belum ada notifikasi'}
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Setiap aktivitas dan status transaksi peminjaman sarpras akun Anda akan muncul di sini.
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id_notifikasi}
                  onClick={() => handleMarkAsRead(item.id_notifikasi, item.tautan)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors text-left group ${
                    !item.is_read
                      ? 'bg-blue-50/40 hover:bg-blue-50/70'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Icon Tipe */}
                  <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-white shadow-xs border border-slate-200/60">
                    {getNotificationIcon(item.tipe)}
                  </div>

                  {/* Isi Notifikasi */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {item.judul}
                      </h4>
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[#034275] shrink-0" title="Belum dibaca" />
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                      {item.pesan}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatRelativeTime(item.created_at)}
                      </span>
                      {item.tautan && (
                        <span className="text-[10px] text-[#034275] font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          Buka
                          <ExternalLink className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
