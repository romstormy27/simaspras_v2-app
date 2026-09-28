import { describe, it, expect } from 'vitest';

/**
 * Logika pengecekan bentrok jadwal sesuai PRD UC-02 & UC-03 SIMASPRAS.
 * Rumus ACID slot locking:
 * start < existing.tgl_selesai AND end > existing.tgl_mulai
 * dengan status_transaksi IN ('Pending', 'Disetujui')
 */
function isSlotOverlapping(
  existingStart: Date,
  existingEnd: Date,
  requestedStart: Date,
  requestedEnd: Date,
  existingStatus: 'Pending' | 'Disetujui' | 'Dibatalkan' | 'Ditolak' | 'Selesai'
): boolean {
  // Hanya status Pending dan Disetujui yang mengunci slot
  if (!['Pending', 'Disetujui'].includes(existingStatus)) {
    return false;
  }

  return requestedStart < existingEnd && requestedEnd > existingStart;
}

describe('UC-02 & UC-03: Logika Pengecekan Bentrok Jadwal (Overlap Scheduling Engine)', () => {
  const existingStart = new Date('2026-10-10T08:00:00Z');
  const existingEnd = new Date('2026-10-10T12:00:00Z');

  it('harus mendeteksi bentrok jika jadwal baru berada tepat di tengah slot eksisting (inner containment)', () => {
    const reqStart = new Date('2026-10-10T09:00:00Z');
    const reqEnd = new Date('2026-10-10T11:00:00Z');
    expect(isSlotOverlapping(existingStart, existingEnd, reqStart, reqEnd, 'Disetujui')).toBe(true);
    expect(isSlotOverlapping(existingStart, existingEnd, reqStart, reqEnd, 'Pending')).toBe(true);
  });

  it('harus mendeteksi bentrok jika jadwal baru mencakup keseluruhan slot eksisting (outer containment)', () => {
    const reqStart = new Date('2026-10-10T07:00:00Z');
    const reqEnd = new Date('2026-10-10T13:00:00Z');
    expect(isSlotOverlapping(existingStart, existingEnd, reqStart, reqEnd, 'Disetujui')).toBe(true);
  });

  it('harus mendeteksi bentrok jika jadwal baru overlap di awal (left-overlap)', () => {
    const reqStart = new Date('2026-10-10T07:00:00Z');
    const reqEnd = new Date('2026-10-10T09:00:00Z');
    expect(isSlotOverlapping(existingStart, existingEnd, reqStart, reqEnd, 'Disetujui')).toBe(true);
  });

  it('harus mendeteksi bentrok jika jadwal baru overlap di akhir (right-overlap)', () => {
    const reqStart = new Date('2026-10-10T11:00:00Z');
    const reqEnd = new Date('2026-10-10T13:00:00Z');
    expect(isSlotOverlapping(existingStart, existingEnd, reqStart, reqEnd, 'Disetujui')).toBe(true);
  });

  it('TIDAK boleh mendeteksi bentrok jika jadwal baru berbatasan langsung di akhir (adjacent back-to-back: start === existingEnd)', () => {
    // Sesi 1: 08:00 - 12:00, Sesi 2: 12:00 - 15:00 -> Sah dan tidak bentrok
    const reqStart = new Date('2026-10-10T12:00:00Z');
    const reqEnd = new Date('2026-10-10T15:00:00Z');
    expect(isSlotOverlapping(existingStart, existingEnd, reqStart, reqEnd, 'Disetujui')).toBe(false);
  });

  it('TIDAK boleh mendeteksi bentrok jika jadwal baru berbatasan langsung di awal (adjacent: end === existingStart)', () => {
    // Sesi 1: 06:00 - 08:00, Sesi 2: 08:00 - 12:00 -> Sah dan tidak bentrok
    const reqStart = new Date('2026-10-10T06:00:00Z');
    const reqEnd = new Date('2026-10-10T08:00:00Z');
    expect(isSlotOverlapping(existingStart, existingEnd, reqStart, reqEnd, 'Disetujui')).toBe(false);
  });

  it('TIDAK boleh mendeteksi bentrok jika jadwal eksisting berstatus Dibatalkan, Ditolak, atau Selesai (slot bebas)', () => {
    const reqStart = new Date('2026-10-10T09:00:00Z');
    const reqEnd = new Date('2026-10-10T11:00:00Z');

    expect(isSlotOverlapping(existingStart, existingEnd, reqStart, reqEnd, 'Dibatalkan')).toBe(false);
    expect(isSlotOverlapping(existingStart, existingEnd, reqStart, reqEnd, 'Ditolak')).toBe(false);
    expect(isSlotOverlapping(existingStart, existingEnd, reqStart, reqEnd, 'Selesai')).toBe(false);
  });
});
