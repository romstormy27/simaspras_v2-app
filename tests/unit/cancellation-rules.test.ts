import { describe, it, expect } from 'vitest';

/**
 * Logika pembatalan mandiri peminjaman sesuai PRD UC-04:
 * 1. Hanya pemohon pemilik transaksi atau Admin yang boleh membatalkan.
 * 2. Hanya status 'Pending' atau 'Disetujui' yang dapat dibatalkan.
 * 3. Waktu eksekusi pembatalan harus SEBELUM waktu mulai (now < tgl_mulai).
 * 4. Jika now >= tgl_mulai: tolak dengan pesan "Pembatalan Gagal: Peminjaman Sedang Berjalan".
 */
interface CancellationValidationInput {
  userId: string;
  userRole: string;
  bookingOwnerId: string;
  bookingStatus: 'Pending' | 'Disetujui' | 'Dibatalkan' | 'Ditolak' | 'Selesai';
  startTime: Date;
  currentTime: Date;
}

interface ValidationResult {
  allowed: boolean;
  errorCode?: string;
  message?: string;
}

function validateCancellation(input: CancellationValidationInput): ValidationResult {
  const { userId, userRole, bookingOwnerId, bookingStatus, startTime, currentTime } = input;

  // 1. Otorisasi
  const isOwner = userId === bookingOwnerId;
  const isAdmin = userRole === 'Admin';
  if (!isOwner && !isAdmin) {
    return {
      allowed: false,
      errorCode: 'FORBIDDEN',
      message: 'Anda tidak memiliki wewenang untuk membatalkan transaksi ini.',
    };
  }

  // 2. Status Transaksi
  if (!['Pending', 'Disetujui'].includes(bookingStatus)) {
    return {
      allowed: false,
      errorCode: 'INVALID_STATUS',
      message: `Pembatalan tidak dapat dilakukan untuk transaksi berstatus "${bookingStatus}".`,
    };
  }

  // 3. Batas Waktu Jadwal
  if (currentTime >= startTime) {
    return {
      allowed: false,
      errorCode: 'ALREADY_STARTED',
      message: 'Pembatalan Gagal: Peminjaman Sedang Berjalan. Pembatalan Mandiri Tidak Dapat Dilakukan.',
    };
  }

  return { allowed: true };
}

describe('UC-04: Validasi Aturan Pembatalan Mandiri (Self-Cancellation Rules)', () => {
  const pemohonId = 'user-dosen-001';
  const otherUserId = 'user-dosen-999';
  const startTime = new Date('2026-10-15T08:00:00Z');

  it('harus mengizinkan pembatalan oleh pemilik transaksi sebelum jadwal dimulai', () => {
    const currentTime = new Date('2026-10-15T07:30:00Z'); // 30 menit sebelum mulai
    const res = validateCancellation({
      userId: pemohonId,
      userRole: 'Dosen',
      bookingOwnerId: pemohonId,
      bookingStatus: 'Pending',
      startTime,
      currentTime,
    });
    expect(res.allowed).toBe(true);
  });

  it('harus mengizinkan pembatalan oleh Admin sekalipun bukan pemilik permohonan', () => {
    const currentTime = new Date('2026-10-15T07:00:00Z');
    const res = validateCancellation({
      userId: 'admin-001',
      userRole: 'Admin',
      bookingOwnerId: pemohonId,
      bookingStatus: 'Disetujui',
      startTime,
      currentTime,
    });
    expect(res.allowed).toBe(true);
  });

  it('harus menolak jika waktu saat ini sudah melewati atau sama dengan jam mulai (kegiatan berjalan)', () => {
    const currentTime = new Date('2026-10-15T08:05:00Z'); // 5 menit setelah mulai
    const res = validateCancellation({
      userId: pemohonId,
      userRole: 'Dosen',
      bookingOwnerId: pemohonId,
      bookingStatus: 'Disetujui',
      startTime,
      currentTime,
    });
    expect(res.allowed).toBe(false);
    expect(res.errorCode).toBe('ALREADY_STARTED');
    expect(res.message).toContain('Pembatalan Gagal: Peminjaman Sedang Berjalan');
  });

  it('harus menolak pembatalan oleh pengguna lain yang bukan pemilik transaksi dan bukan Admin', () => {
    const currentTime = new Date('2026-10-15T07:00:00Z');
    const res = validateCancellation({
      userId: otherUserId,
      userRole: 'Dosen',
      bookingOwnerId: pemohonId,
      bookingStatus: 'Pending',
      startTime,
      currentTime,
    });
    expect(res.allowed).toBe(false);
    expect(res.errorCode).toBe('FORBIDDEN');
  });

  it('harus menolak pembatalan jika status transaksi sudah Selesai atau Ditolak', () => {
    const currentTime = new Date('2026-10-15T07:00:00Z');
    const resSelesai = validateCancellation({
      userId: pemohonId,
      userRole: 'Dosen',
      bookingOwnerId: pemohonId,
      bookingStatus: 'Selesai',
      startTime,
      currentTime,
    });
    expect(resSelesai.allowed).toBe(false);
    expect(resSelesai.errorCode).toBe('INVALID_STATUS');

    const resDitolak = validateCancellation({
      userId: pemohonId,
      userRole: 'Dosen',
      bookingOwnerId: pemohonId,
      bookingStatus: 'Ditolak',
      startTime,
      currentTime,
    });
    expect(resDitolak.allowed).toBe(false);
    expect(resDitolak.errorCode).toBe('INVALID_STATUS');
  });
});
