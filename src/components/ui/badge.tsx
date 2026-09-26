import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'success'
    | 'warning'
    | 'pending'
    | 'disetujui'
    | 'ditolak'
    | 'dibatalkan'
    | 'selesai'
    | 'tersedia'
    | 'maintenance';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[#034275] text-white',
    secondary: 'bg-slate-100 text-slate-800',
    destructive: 'bg-red-600 text-white',
    outline: 'border border-slate-300 text-slate-800',
    success: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    warning: 'bg-amber-100 text-amber-800 border border-amber-300',
    // Status Transaksi PRD §13.2
    pending: 'bg-amber-100 text-amber-800 border border-amber-300',
    disetujui: 'bg-blue-100 text-blue-800 border border-blue-300',
    ditolak: 'bg-red-100 text-red-800 border border-red-300',
    dibatalkan: 'bg-slate-100 text-slate-700 border border-slate-300',
    selesai: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    // Status Operasional Sarpras
    tersedia: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    maintenance: 'bg-amber-100 text-amber-800 border border-amber-300',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
