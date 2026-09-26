import { sendEmail } from '@/lib/email';
import prisma from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';

/**
 * NotificationService
 * Layanan konsolidasi notifikasi email & dasbor untuk 9 skenario peristiwa sesuai PRD §14 SIMASPRAS.
 */
export const NotificationService = {
  /**
   * Skenario 1: Registrasi akun baru masuk (Penerima: Administrator)
   */
  async notifyUserRegistered(user: { id_user: string; nama_lengkap: string; email: string; role: string }) {
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'Admin', status_aktivasi: 'Aktif' },
        select: { email: true, nama_lengkap: true },
      });

      for (const admin of admins) {
        await sendEmail({
          to: admin.email,
          subject: `[SIMASPRAS] Registrasi Pengguna Baru Menunggu Aktivasi: ${user.nama_lengkap}`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #034275; color: #ffffff; padding: 18px; text-align: center;">
                <h3 style="margin: 0;">SIMASPRAS KEMENIMIPAS</h3>
                <p style="margin: 4px 0 0 0; font-size: 12px;">Notifikasi Registrasi Pengguna Baru</p>
              </div>
              <div style="padding: 20px;">
                <p>Yth. <strong>Administrator Sistem</strong>,</p>
                <p>Terdapat pendaftaran akun baru yang membutuhkan verifikasi dan persetujuan aktivasi:</p>
                <ul style="font-size: 13px; line-height: 1.8;">
                  <li><strong>Nama:</strong> ${user.nama_lengkap}</li>
                  <li><strong>Email:</strong> ${user.email}</li>
                  <li><strong>Kategori Peran:</strong> ${user.role}</li>
                </ul>
                <p style="font-size: 12px; color: #64748b;">Silakan masuk ke panel admin untuk meninjau dan menyetujui akun.</p>
              </div>
            </div>
          `,
        });
      }
    } catch (e) {
      console.warn('NotificationService.notifyUserRegistered failed:', e);
    }
  },

  /**
   * Skenario 2: Akun disetujui/ditolak Admin (Penerima: Pemohon)
   */
  async notifyActivationDecision(user: { email: string; nama_lengkap: string }, decision: 'Setujui' | 'Tolak', reason?: string) {
    try {
      const isApproved = decision === 'Setujui';
      await sendEmail({
        to: user.email,
        subject: `[SIMASPRAS] Status Permohonan Akun Anda: ${isApproved ? 'Disetujui & Aktif' : 'Ditolak'}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: ${isApproved ? '#16a34a' : '#dc2626'}; color: #ffffff; padding: 18px; text-align: center;">
              <h3 style="margin: 0;">SIMASPRAS KEMENIMIPAS</h3>
              <p style="margin: 4px 0 0 0; font-size: 12px;">Pemberitahuan Status Aktivasi Akun</p>
            </div>
            <div style="padding: 20px;">
              <p>Yth. <strong>${user.nama_lengkap}</strong>,</p>
              ${
                isApproved
                  ? `<p>Selamat, akun Anda telah <strong>disetujui dan diaktifkan</strong> oleh Administrator. Anda sekarang dapat masuk ke portal SIMASPRAS untuk melakukan peminjaman sarana dan prasarana.</p>`
                  : `<p>Mohon maaf, permohonan registrasi akun Anda <strong>belum dapat disetujui</strong> oleh Administrator.</p>
                     <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 10px; border-radius: 6px; font-size: 13px; color: #991b1b; margin: 12px 0;">
                       <strong>Alasan Penolakan:</strong> ${reason || 'Data identitas belum memenuhi persyaratan.'}
                     </div>`
              }
            </div>
          </div>
        `,
      });
    } catch (e) {
      console.warn('NotificationService.notifyActivationDecision failed:', e);
    }
  },

  /**
   * Skenario 3: Pengajuan peminjaman baru (Penerima: Kasubag & Staf Umum)
   */
  async notifyBookingCreated(booking: {
    kode_transaksi: string;
    sarpras_nama: string;
    pemohon_nama: string;
    pemohon_role: string;
    tgl_mulai: Date | string;
    tgl_selesai: Date | string;
    maksud_kegiatan: string;
  }) {
    try {
      const officers = await prisma.user.findMany({
        where: {
          role: { in: ['Kasubag', 'Staf'] },
          status_aktivasi: 'Aktif',
        },
        select: { email: true },
      });

      const emails = officers.map((o) => o.email);
      if (emails.length === 0) return;

      for (const email of emails) {
        await sendEmail({
          to: email,
          subject: `[SIMASPRAS] Permohonan Peminjaman Baru: ${booking.kode_transaksi}`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #034275; color: #ffffff; padding: 18px; text-align: center;">
                <h3 style="margin: 0;">SIMASPRAS POLTEKIMIPAS</h3>
                <p style="margin: 4px 0 0 0; font-size: 12px;">Pengajuan Peminjaman Sarpras Baru</p>
              </div>
              <div style="padding: 20px;">
                <p>Telah diajukan permohonan peminjaman fasilitas baru yang memerlukan verifikasi staf dan persetujuan Kasubag:</p>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <tr><td style="padding: 4px 0; color: #64748b;">Kode Transaksi:</td><td><strong>${booking.kode_transaksi}</strong></td></tr>
                  <tr><td style="padding: 4px 0; color: #64748b;">Fasilitas:</td><td>${booking.sarpras_nama}</td></tr>
                  <tr><td style="padding: 4px 0; color: #64748b;">Pemohon:</td><td>${booking.pemohon_nama} (${booking.pemohon_role})</td></tr>
                  <tr><td style="padding: 4px 0; color: #64748b;">Jadwal:</td><td>${formatDateTime(booking.tgl_mulai)} s/d ${formatDateTime(booking.tgl_selesai)}</td></tr>
                  <tr><td style="padding: 4px 0; color: #64748b;">Agenda:</td><td>&quot;${booking.maksud_kegiatan}&quot;</td></tr>
                </table>
              </div>
            </div>
          `,
        });
      }
    } catch (e) {
      console.warn('NotificationService.notifyBookingCreated failed:', e);
    }
  },

  /**
   * Skenario 4: Pembatalan peminjaman mandiri (Penerima: Pemohon, Kasubag, Staf)
   */
  async notifyBookingCancelled(booking: {
    kode_transaksi: string;
    sarpras_nama: string;
    pemohon_email: string;
    pemohon_nama: string;
    alasan: string;
  }) {
    try {
      await sendEmail({
        to: booking.pemohon_email,
        subject: `[SIMASPRAS] Konfirmasi Pembatalan Peminjaman: ${booking.kode_transaksi}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #64748b; color: #ffffff; padding: 18px; text-align: center;">
              <h3 style="margin: 0;">SIMASPRAS POLTEKIMIPAS</h3>
              <p style="margin: 4px 0 0 0; font-size: 12px;">Pembatalan Peminjaman Sarpras</p>
            </div>
            <div style="padding: 20px;">
              <p>Yth. <strong>${booking.pemohon_nama}</strong>,</p>
              <p>Transaksi peminjaman nomor <strong>${booking.kode_transaksi}</strong> untuk fasilitas <strong>${booking.sarpras_nama}</strong> telah dibatalkan.</p>
              <p style="font-size: 12px; color: #64748b;">Alasan: ${booking.alasan || 'Dibatalkan mandiri oleh pemohon.'}</p>
              <p style="font-size: 12px; color: #64748b;">Slot jadwal telah otomatis dibebaskan di katalog.</p>
            </div>
          </div>
        `,
      });
    } catch (e) {
      console.warn('NotificationService.notifyBookingCancelled failed:', e);
    }
  },

  /**
   * Skenario 5: Pengajuan disetujui + Tiket QR terbit (Penerima: Pemohon)
   */
  async notifyBookingApproved(booking: {
    kode_transaksi: string;
    sarpras_nama: string;
    pemohon_email: string;
    pemohon_nama: string;
    kode_qr: string;
    tgl_mulai: Date | string;
    tgl_selesai: Date | string;
  }) {
    try {
      await sendEmail({
        to: booking.pemohon_email,
        subject: `[SIMASPRAS] Permohonan Disetujui & Tiket QR Diterbitkan: ${booking.kode_transaksi}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #034275; color: #ffffff; padding: 18px; text-align: center;">
              <h3 style="margin: 0;">SIMASPRAS KEMENIMIPAS</h3>
              <p style="margin: 4px 0 0 0; font-size: 12px;">Tiket Digital Pengambilan Aset</p>
            </div>
            <div style="padding: 20px;">
              <p>Yth. <strong>${booking.pemohon_nama}</strong>,</p>
              <p>Permohonan peminjaman sarpras Anda telah <strong>disetujui oleh Kasubag Bagian Umum</strong>. Tiket Digital QR pengambilan telah resmi diterbitkan:</p>
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 6px; text-align: center; margin: 16px 0;">
                <div style="font-size: 12px; color: #166534; font-weight: bold;">KODE TIKET RESMI</div>
                <div style="font-family: monospace; font-size: 16px; font-weight: bold; color: #034275; margin-top: 4px;">${booking.kode_qr}</div>
              </div>
              <p style="font-size: 12px; color: #475569;">Tunjukkan kode tiket atau cetak tiket digital dari akun Anda saat pengambilan fasilitas di Kantor Bagian Umum.</p>
            </div>
          </div>
        `,
      });
    } catch (e) {
      console.warn('NotificationService.notifyBookingApproved failed:', e);
    }
  },

  /**
   * Skenario 6: Pengajuan ditolak + alasan (Penerima: Pemohon)
   */
  async notifyBookingRejected(booking: {
    kode_transaksi: string;
    sarpras_nama: string;
    pemohon_email: string;
    pemohon_nama: string;
    alasan: string;
  }) {
    try {
      await sendEmail({
        to: booking.pemohon_email,
        subject: `[SIMASPRAS] Permohonan Peminjaman Ditolak: ${booking.kode_transaksi}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #dc2626; color: #ffffff; padding: 18px; text-align: center;">
              <h3 style="margin: 0;">SIMASPRAS POLTEKIMIPAS</h3>
              <p style="margin: 4px 0 0 0; font-size: 12px;">Pemberitahuan Penolakan Pengajuan</p>
            </div>
            <div style="padding: 20px;">
              <p>Yth. <strong>${booking.pemohon_nama}</strong>,</p>
              <p>Mohon maaf, permohonan peminjaman sarpras untuk fasilitas <strong>${booking.sarpras_nama}</strong> belum dapat disetujui.</p>
              <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 10px; border-radius: 6px; font-size: 13px; color: #991b1b; margin: 12px 0;">
                <strong>Alasan Penolakan:</strong> ${booking.alasan}
              </div>
              <p style="font-size: 12px; color: #64748b;">Slot jadwal telah otomatis dibebaskan kembali di kalender.</p>
            </div>
          </div>
        `,
      });
    } catch (e) {
      console.warn('NotificationService.notifyBookingRejected failed:', e);
    }
  },

  /**
   * Skenario 7: Rekomendasi verifikasi fisik selesai (Penerima: Kasubag Umum)
   */
  async notifyInspectionCompleted(verif: {
    kode_transaksi: string;
    sarpras_nama: string;
    jenis: string;
    kondisi: string;
    catatan?: string | null;
    staf_nama: string;
  }) {
    try {
      const kasubags = await prisma.user.findMany({
        where: { role: 'Kasubag', status_aktivasi: 'Aktif' },
        select: { email: true },
      });

      for (const k of kasubags) {
        await sendEmail({
          to: k.email,
          subject: `[SIMASPRAS] Laporan Inspeksi Fisik (${verif.jenis.replace('_', ' ')}): ${verif.kode_transaksi}`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #034275; color: #ffffff; padding: 18px; text-align: center;">
                <h3 style="margin: 0;">SIMASPRAS POLTEKIMIPAS</h3>
                <p style="margin: 4px 0 0 0; font-size: 12px;">Laporan Verifikasi Fisik Staf</p>
              </div>
              <div style="padding: 20px;">
                <p>Staf Bagian Umum (<strong>${verif.staf_nama}</strong>) telah menginput hasil inspeksi fisik untuk transaksi <strong>${verif.kode_transaksi}</strong>:</p>
                <ul style="font-size: 13px; line-height: 1.8;">
                  <li><strong>Fasilitas:</strong> ${verif.sarpras_nama}</li>
                  <li><strong>Jenis Pemeriksaan:</strong> ${verif.jenis.replace('_', ' ')}</li>
                  <li><strong>Kondisi Fisik:</strong> ${verif.kondisi.replace('_', ' ')}</li>
                  <li><strong>Catatan Petugas:</strong> ${verif.catatan || '-'}</li>
                </ul>
              </div>
            </div>
          `,
        });
      }
    } catch (e) {
      console.warn('NotificationService.notifyInspectionCompleted failed:', e);
    }
  },

  /**
   * Skenario 8: BAST Digital terbit (Penerima: Pemohon)
   */
  async notifyBastIssued(bast: {
    nomor_bast: string;
    kode_transaksi: string;
    pemohon_email: string;
    pemohon_nama: string;
    kasubag_nama: string;
  }) {
    try {
      await sendEmail({
        to: bast.pemohon_email,
        subject: `[SIMASPRAS] Berita Acara Serah Terima (BAST) Selesai: ${bast.nomor_bast}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #034275; color: #ffffff; padding: 18px; text-align: center;">
              <h3 style="margin: 0;">SIMASPRAS KEMENIMIPAS</h3>
              <p style="margin: 4px 0 0 0; font-size: 12px;">Penerbitan BAST Digital Resmi</p>
            </div>
            <div style="padding: 20px;">
              <p>Yth. <strong>${bast.pemohon_nama}</strong>,</p>
              <p>Pengembalian fasilitas untuk transaksi <strong>${bast.kode_transaksi}</strong> telah resmi disetujui melalui penandatanganan elektronik BAST Digital:</p>
              <p><strong>Nomor BAST:</strong> ${bast.nomor_bast}</p>
              <p style="font-size: 12px; color: #64748b;">Pengembalian diproses tertib tanpa klausul denda finansial sesuai PRD SIMASPRAS §3.2.</p>
            </div>
          </div>
        `,
      });
    } catch (e) {
      console.warn('NotificationService.notifyBastIssued failed:', e);
    }
  },

  /**
   * Skenario 9: Log keamanan signifikan (Penerima: Administrator)
   */
  async notifySecurityEvent(event: {
    jenis_kejadian: string;
    deskripsi: string;
    ip_address?: string;
  }) {
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'Admin', status_aktivasi: 'Aktif' },
        select: { email: true },
      });

      for (const admin of admins) {
        await sendEmail({
          to: admin.email,
          subject: `[SIMASPRAS KEAMANAN] Notifikasi Peristiwa Keamanan: ${event.jenis_kejadian}`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #991b1b; color: #ffffff; padding: 18px; text-align: center;">
                <h3 style="margin: 0;">SIMASPRAS KEAMANAN SISTEM</h3>
                <p style="margin: 4px 0 0 0; font-size: 12px;">Peringatan Keamanan & Rekam Jejak</p>
              </div>
              <div style="padding: 20px;">
                <p>Tercatat aktivitas keamanan penting pada sistem:</p>
                <ul style="font-size: 13px; line-height: 1.8;">
                  <li><strong>Jenis:</strong> ${event.jenis_kejadian}</li>
                  <li><strong>Deskripsi:</strong> ${event.deskripsi}</li>
                  <li><strong>Alamat IP:</strong> ${event.ip_address || '-'}</li>
                  <li><strong>Waktu:</strong> ${new Date().toLocaleString('id-ID')}</li>
                </ul>
              </div>
            </div>
          `,
        });
      }
    } catch (e) {
      console.warn('NotificationService.notifySecurityEvent failed:', e);
    }
  },
};
