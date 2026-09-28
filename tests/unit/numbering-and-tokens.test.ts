import { describe, it, expect } from 'vitest';

/**
 * Format Standarisasi Penomoran Dokumen & Token Keamanan SIMASPRAS
 */
export function generateKodeTransaksi(date: Date, sequence: number): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const seq = String(sequence).padStart(4, '0');
  return `TRX-${yyyy}${mm}${dd}-${seq}`;
}

export function generateNomorBast(year: number, month: number, sequence: number): string {
  const mm = String(month).padStart(2, '0');
  const seq = String(sequence).padStart(4, '0');
  return `BAST/SARPRAS/${year}/${mm}/${seq}`;
}

export function generateTiketToken(kodeTransaksi: string, randomPart: string): string {
  return `TIKET-${kodeTransaksi}-${randomPart.toUpperCase()}`;
}

export function generateQrSignatureToken(year: number, month: number, sequence: number, suffix: string): string {
  const mm = String(month).padStart(2, '0');
  const seq = String(sequence).padStart(4, '0');
  return `SIG-KASUBAG-${year}${mm}-${seq}-${suffix.toUpperCase()}`;
}

describe('Format Dokumen & Token Digital Resmi SIMASPRAS', () => {
  it('harus menghasilkan kode transaksi dengan pola baku TRX-YYYYMMDD-XXXX', () => {
    const testDate = new Date(2026, 9, 28); // 28 Oktober 2026
    const kode = generateKodeTransaksi(testDate, 12);
    expect(kode).toBe('TRX-20261028-0012');
    expect(kode).toMatch(/^TRX-\d{8}-\d{4}$/);
  });

  it('harus menghasilkan nomor BAST resmi dengan format BAST/SARPRAS/YYYY/MM/XXXX', () => {
    const nomorBast = generateNomorBast(2026, 10, 5);
    expect(nomorBast).toBe('BAST/SARPRAS/2026/10/0005');
    expect(nomorBast).toMatch(/^BAST\/SARPRAS\/\d{4}\/\d{2}\/\d{4}$/);
  });

  it('harus menghasilkan token Tiket Digital yang terhubung dengan kode transaksi', () => {
    const kodeTrx = 'TRX-20261028-0001';
    const tiketToken = generateTiketToken(kodeTrx, 'A1B2C3');
    expect(tiketToken).toBe('TIKET-TRX-20261028-0001-A1B2C3');
    expect(tiketToken.startsWith('TIKET-TRX-')).toBe(true);
  });

  it('harus menghasilkan QR Signature Kasubag dengan format SIG-KASUBAG-YYYYMM-XXXX-SUFFIX', () => {
    const sig = generateQrSignatureToken(2026, 10, 1, 'X7Y8Z9');
    expect(sig).toBe('SIG-KASUBAG-202610-0001-X7Y8Z9');
    expect(sig).toMatch(/^SIG-KASUBAG-\d{6}-\d{4}-[A-Z0-9]+$/);
  });

  it('harus memvalidasi nomenklatur resmi institusi Kementerian Imigrasi dan Pemasyarakatan RI', () => {
    const institusi = {
      kementerian: 'Kementerian Imigrasi dan Pemasyarakatan RI',
      bpsdm: 'Badan Pengembangan Sumber Daya Manusia Imigrasi dan Pemasyarakatan',
      alamat: 'Jl. Satria - Sudirman, RT.001/RW.014, Tanah Tinggi, Kec. Tangerang, Kota Tangerang, Banten 15119',
    };

    expect(institusi.kementerian).not.toContain('Hukum dan HAM');
    expect(institusi.kementerian).toBe('Kementerian Imigrasi dan Pemasyarakatan RI');
    expect(institusi.bpsdm).toBe('Badan Pengembangan Sumber Daya Manusia Imigrasi dan Pemasyarakatan');
    expect(institusi.alamat).toContain('Tanah Tinggi, Kec. Tangerang, Kota Tangerang, Banten 15119');
  });
});
