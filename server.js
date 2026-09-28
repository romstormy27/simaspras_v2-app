/**
 * SIMASPRAS - Politeknik Imigrasi dan Pemasyarakatan Indonesia
 * Entry Point Runner untuk cPanel Phusion Passenger & Standalone Node.js Environment.
 * 
 * Sesuai PRD Seksi 17 & TASK-10.1:
 * - Menangani delegasi port dinamis cPanel (process.env.PORT)
 * - Memuat bundle standalone Next.js yang telah dioptimalkan
 * - Kompatibel dengan restart file tmp/restart.txt di cPanel
 */

const path = require('path');
const fs = require('fs');

// Set environment defaults
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '3000';
// Di Linux/cPanel, $HOSTNAME bawaan berisi nama server fisik (misal srv1.host.com).
// Jika Next.js mencoba bind ke host tersebut, akan gagal EADDRNOTAVAIL.
// Kita paksa HOSTNAME selalu ke '0.0.0.0'.
process.env.HOSTNAME = '0.0.0.0';

const standaloneServerPath = path.join(__dirname, '.next', 'standalone', 'server.js');

if (!fs.existsSync(standaloneServerPath)) {
  console.error('======================================================================');
  console.error('[SIMASPRAS ERROR] File .next/standalone/server.js tidak ditemukan!');
  console.error('Silakan jalankan build terlebih dahulu dengan perintah:');
  console.error('  npm run build');
  console.error('  ./deploy.sh');
  console.error('======================================================================');
  process.exit(1);
}

console.log('[SIMASPRAS] Memulai server produksi Phusion Passenger / Node.js Standalone...');
console.log(`[SIMASPRAS] Environment: ${process.env.NODE_ENV}`);
console.log(`[SIMASPRAS] Host/Port: ${process.env.HOSTNAME}:${process.env.PORT}`);

// Delegasikan eksekusi langsung ke server standalone Next.js
require(standaloneServerPath);
