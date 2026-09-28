import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRateLimiter } from '@/lib/rate-limit';

describe('TASK-9.3 / Seksi 16: Proteksi Brute-Force Login (InMemoryRateLimiter)', () => {
  let limiter: InMemoryRateLimiter;

  beforeEach(() => {
    limiter = new InMemoryRateLimiter({
      maxAttempts: 3,
      windowMs: 60 * 1000, // 1 menit
      blockDurationMs: 60 * 1000,
    });
  });

  it('harus mengizinkan percobaan login awal ketika belum ada kegagalan', () => {
    const status = limiter.check('192.168.1.1:user@politeknik.ac.id');
    expect(status.isBlocked).toBe(false);
    expect(status.remainingAttempts).toBe(3);
  });

  it('harus mengurangi sisa kesempatan pada setiap kegagalan login', () => {
    const key = '192.168.1.1:user@politeknik.ac.id';

    const fail1 = limiter.recordFailure(key);
    expect(fail1.isBlocked).toBe(false);
    expect(fail1.remainingAttempts).toBe(2);

    const fail2 = limiter.recordFailure(key);
    expect(fail2.isBlocked).toBe(false);
    expect(fail2.remainingAttempts).toBe(1);
  });

  it('harus memblokir akun/IP jika batas percobaan gagal (maxAttempts) terlampaui', () => {
    const key = '192.168.1.1:user@politeknik.ac.id';

    limiter.recordFailure(key);
    limiter.recordFailure(key);
    const fail3 = limiter.recordFailure(key);

    expect(fail3.isBlocked).toBe(true);
    expect(fail3.remainingAttempts).toBe(0);
    expect(fail3.retryAfterSeconds).toBeGreaterThan(0);

    // Pengecekan berikutnya harus tetap terblokir
    const checkBlocked = limiter.check(key);
    expect(checkBlocked.isBlocked).toBe(true);
  });

  it('harus mereset rekaman kegagalan saat pengguna berhasil login', () => {
    const key = '192.168.1.1:user@politeknik.ac.id';

    limiter.recordFailure(key);
    limiter.recordFailure(key);

    // Pengguna berhasil memasukkan password yang benar
    limiter.reset(key);

    const statusAfterReset = limiter.check(key);
    expect(statusAfterReset.isBlocked).toBe(false);
    expect(statusAfterReset.remainingAttempts).toBe(3);
  });

  it('harus memisahkan batas percobaan antar IP/kunci yang berbeda', () => {
    const key1 = '192.168.1.1:user1@politeknik.ac.id';
    const key2 = '192.168.1.2:user2@politeknik.ac.id';

    // Key 1 gagal 3 kali
    limiter.recordFailure(key1);
    limiter.recordFailure(key1);
    limiter.recordFailure(key1);

    expect(limiter.check(key1).isBlocked).toBe(true);
    // Key 2 harus tetap bebas
    expect(limiter.check(key2).isBlocked).toBe(false);
    expect(limiter.check(key2).remainingAttempts).toBe(3);
  });
});
