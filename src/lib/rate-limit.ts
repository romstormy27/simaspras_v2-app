/**
 * In-memory rate limiter untuk proteksi endpoint autentikasi terhadap serangan brute-force.
 * Sesuai PRD Seksi 16 & TASK-9.3.
 */

interface RateLimitRecord {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}

export class InMemoryRateLimiter {
  private attempts: Map<string, RateLimitRecord> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly blockDurationMs: number;

  constructor(options: { maxAttempts?: number; windowMs?: number; blockDurationMs?: number } = {}) {
    this.maxAttempts = options.maxAttempts ?? 5; // Maksimal 5 percobaan gagal
    this.windowMs = options.windowMs ?? 15 * 60 * 1000; // Jendela 15 menit
    this.blockDurationMs = options.blockDurationMs ?? 15 * 60 * 1000; // Blokir selama 15 menit jika melebihi batas
  }

  /**
   * Cek apakah key (IP atau IP:email) saat ini sedang terblokir.
   */
  check(key: string): { isBlocked: boolean; remainingAttempts: number; retryAfterSeconds: number } {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record) {
      return { isBlocked: false, remainingAttempts: this.maxAttempts, retryAfterSeconds: 0 };
    }

    // Jika sedang dalam masa blokir
    if (record.blockedUntil && record.blockedUntil > now) {
      const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
      return { isBlocked: true, remainingAttempts: 0, retryAfterSeconds };
    }

    // Jika jendela waktu sudah lewat, hapus record lama
    if (now - record.firstAttempt > this.windowMs) {
      this.attempts.delete(key);
      return { isBlocked: false, remainingAttempts: this.maxAttempts, retryAfterSeconds: 0 };
    }

    const remaining = Math.max(0, this.maxAttempts - record.count);
    return { isBlocked: remaining === 0, remainingAttempts: remaining, retryAfterSeconds: 0 };
  }

  /**
   * Catat satu kegagalan login untuk key tertentu.
   */
  recordFailure(key: string): { isBlocked: boolean; remainingAttempts: number; retryAfterSeconds: number } {
    const now = Date.now();
    let record = this.attempts.get(key);

    if (!record || now - record.firstAttempt > this.windowMs) {
      record = { count: 1, firstAttempt: now };
    } else {
      record.count += 1;
    }

    if (record.count >= this.maxAttempts) {
      record.blockedUntil = now + this.blockDurationMs;
      this.attempts.set(key, record);
      const retryAfterSeconds = Math.ceil(this.blockDurationMs / 1000);
      return { isBlocked: true, remainingAttempts: 0, retryAfterSeconds };
    }

    this.attempts.set(key, record);
    return {
      isBlocked: false,
      remainingAttempts: Math.max(0, this.maxAttempts - record.count),
      retryAfterSeconds: 0,
    };
  }

  /**
   * Reset hitungan jika pengguna berhasil login.
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Bersihkan memori dari rekaman yang sudah kedaluwarsa.
   */
  cleanup(): void {
    const now = Date.now();
    this.attempts.forEach((record, key) => {
      const isWindowExpired = now - record.firstAttempt > this.windowMs;
      const isBlockExpired = !record.blockedUntil || record.blockedUntil <= now;
      if (isWindowExpired && isBlockExpired) {
        this.attempts.delete(key);
      }
    });
  }
}

// Instance global tunggal untuk rate limiting login
export const loginRateLimiter = new InMemoryRateLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  blockDurationMs: 15 * 60 * 1000,
});
