import { describe, it, expect } from 'vitest';

/**
 * Logika Soft-Delete Integrity sesuai PRD UC-09 & SD-09:
 * 1. Jika sarpras memiliki transaksi aktif (Pending / Disetujui):
 *    -> Tidak boleh di-hard delete; harus diubah menjadi status Non_Aktif (Soft Delete).
 * 2. Jika sarpras memiliki riwayat transaksi historis (Selesai / Dibatalkan / Ditolak):
 *    -> Diubah menjadi Non_Aktif (Soft Delete) untuk menjaga integritas data relasional.
 * 3. Jika sarpras sama sekali belum pernah digunakan:
 *    -> Boleh di-hard delete dari basis data.
 */
interface DeletionEvaluationInput {
  activeTransactionCount: number;
  totalTransactionCount: number;
}

type DeletionAction = 'SOFT_DELETE' | 'HARD_DELETE';

function evaluateSarprasDeletion(input: DeletionEvaluationInput): {
  action: DeletionAction;
  resultingStatus?: 'Non-Aktif';
  reason: string;
} {
  if (input.activeTransactionCount > 0) {
    return {
      action: 'SOFT_DELETE',
      resultingStatus: 'Non-Aktif',
      reason: `Fasilitas memiliki ${input.activeTransactionCount} transaksi aktif; diubah menjadi Non-Aktif agar tersembunyi dari katalog peminjaman baru.`,
    };
  }

  if (input.totalTransactionCount > 0) {
    return {
      action: 'SOFT_DELETE',
      resultingStatus: 'Non-Aktif',
      reason: 'Fasilitas memiliki arsip transaksi historis; diubah menjadi Non-Aktif demi integritas data referensial.',
    };
  }

  return {
    action: 'HARD_DELETE',
    reason: 'Fasilitas belum memiliki riwayat transaksi apa pun; aman dihapus permanen dari basis data.',
  };
}

describe('UC-09: Integritas Data Soft-Delete Sarpras (Referential Integrity Protection)', () => {
  it('harus memilih SOFT_DELETE menjadi Non-Aktif jika sarpras masih memiliki transaksi aktif', () => {
    const result = evaluateSarprasDeletion({
      activeTransactionCount: 2,
      totalTransactionCount: 5,
    });
    expect(result.action).toBe('SOFT_DELETE');
    expect(result.resultingStatus).toBe('Non-Aktif');
    expect(result.reason).toContain('transaksi aktif');
  });

  it('harus memilih SOFT_DELETE jika hanya memiliki riwayat transaksi historis (tanpa transaksi aktif)', () => {
    const result = evaluateSarprasDeletion({
      activeTransactionCount: 0,
      totalTransactionCount: 10,
    });
    expect(result.action).toBe('SOFT_DELETE');
    expect(result.resultingStatus).toBe('Non-Aktif');
    expect(result.reason).toContain('arsip transaksi historis');
  });

  it('harus memilih HARD_DELETE jika sarpras baru dibuat dan belum memiliki keterikatan transaksi', () => {
    const result = evaluateSarprasDeletion({
      activeTransactionCount: 0,
      totalTransactionCount: 0,
    });
    expect(result.action).toBe('HARD_DELETE');
    expect(result.reason).toContain('aman dihapus permanen');
  });
});
