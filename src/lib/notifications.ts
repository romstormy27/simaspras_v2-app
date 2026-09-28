import { sendEmail } from '@/lib/email';
import prisma from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';
import { TipeNotifikasi } from '@/types';

/**
 * Helper dasar: Buat notifikasi in-app untuk satu pengguna
 */
export async function createInAppNotification({
  id_user,
  judul,
  pesan,
  tipe = 'Info',
  tautan,
}: {
  id_user: string;
  judul: string;
  pesan: string;
  tipe?: TipeNotifikasi;
  tautan?: string | null;
}) {
  try {
    return await prisma.notifikasi.create({
      data: {
        id_user,
        judul,
        pesan,
        tipe,
        tautan: tautan || null,
      },
    });
  } catch (error) {
    console.warn('[NotificationService] Gagal membuat in-app notification:', error);
    return null;
  }
}

/**
 * Helper dasar: Buat notifikasi in-app massal (batch) untuk banyak pengguna
 */
export async function createBatchInAppNotifications({
  user_ids,
  judul,
  pesan,
  tipe = 'Info',
  tautan,
}: {
  user_ids: string[];
  judul: string;
  pesan: string;
  tipe?: TipeNotifikasi;
  tautan?: string | null;
}) {
  if (!user_ids || user_ids.length === 0) return [];
  try {
    return await prisma.notifikasi.createMany({
      data: user_ids.map((id_user) => ({
        id_user,
        judul,
        pesan,
        tipe,
        tautan: tautan || null,
      })),
    });
  } catch (error) {
    console.warn('[NotificationService] Gagal membuat batch in-app notifications:', error);
    return null;
  }
}

/**
 * NotificationService
 * Layanan konsolidasi notifikasi email & in-app notifications untuk seluruh peristiwa sistem SIMASPRAS.
 */
export const NotificationService = {
  /**
   * Skenario 1: Registrasi akun baru masuk (Penerima: Seluruh Administrator)
   */
  async notifyUserRegistered(user: { id_user: string; nama_lengkap: string; email: string; role: string }) {
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'Admin', status_aktivasi: 'Aktif' },
        select: { id_user: true, email: true, nama_lengkap: true },
      });

      if (admins.length > 0) {
        // In-app notifications untuk para admin
        await createBatchInAppNotifications({
          user_ids: admins.map((a) => a.id_user),
          judul: 'Registrasi Akun Baru Menunggu Aktivasi',
          pesan: `${user.nama_lengkap} (${user.role}) telah mendaftarkan akun dan menunggu peninjauan aktivasi oleh Administrator.`,
          tipe: 'Info',
          tautan: '/admin/users',
        });

        // Email notifications
        for (const admin of admins) {
          await sendEmail({
            to: admin.email,
            subject: `[SIMASPRAS] Registrasi Pengguna Baru Menunggu Aktivasi: ${user.nama_lengkap}`,
            html: `
              <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #034275; color: #ffffff; padding: 18px; text-align: center;">
                  <h3 style="margin: 0;">SIMASPRAS POLTEKIMIPAS</h3>
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
      }
    } catch (e) {
      console.warn('NotificationService.notifyUserRegistered failed:', e);
    }
  },

  /**
   * Skenario 2: Akun disetujui/ditolak Admin (Penerima: Pemohon)
   */
  async notifyActivationDecision(
    user: { id_user?: string; email: string; nama_lengkap: string },
    decision: 'Setujui' | 'Tolak',
    reason?: string
  ) {
    try {
      const isApproved = decision === 'Setujui';

      // In-app notification ke user jika id_user tersedia
      if (user.id_user) {
        await createInAppNotification({
          id_user: user.id_user,
          judul: isApproved ? 'Akun Anda Telah Diaktifkan' : 'Permohonan Akun Belum Disetujui',
          pesan: isApproved
            ? 'Selamat! Akun Anda telah disetujui dan diaktifkan oleh Administrator. Anda sekarang dapat mengakses katalog dan mengajukan peminjaman sarpras.'
            : `Permohonan aktivasi akun Anda belum disetujui oleh Administrator. Alasan: ${reason || 'Data identitas belum memenuhi persyaratan.'}`,
          tipe: isApproved ? 'Persetujuan' : 'Penolakan',
          tautan: isApproved ? '/katalog' : '/login',
        });
      }

      // Email notification
      await sendEmail({
        to: user.email,
        subject: `[SIMASPRAS] Status Permohonan Akun Anda: ${isApproved ? 'Disetujui & Aktif' : 'Ditolak'}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: ${isApproved ? '#16a34a' : '#dc2626'}; color: #ffffff; padding: 18px; text-align: center;">
              <h3 style="margin: 0;">SIMASPRAS POLTEKIMIPAS</h3>
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
   * Skenario 3: Pengajuan peminjaman baru (Penerima: Pemohon, Kasubag & Staf Umum)
   */
  async notifyBookingCreated(booking: {
    id_peminjaman?: string;
    id_pemohon?: string;
    kode_transaksi: string;
    sarpras_nama: string;
    pemohon_nama: string;
    pemohon_role: string;
    tgl_mulai: Date | string;
    tgl_selesai: Date | string;
    maksud_kegiatan: string;
  }) {
    try {
      // 1. In-app notification ke Pemohon
      if (booking.id_pemohon) {
        await createInAppNotification({
          id_user: booking.id_pemohon,
          judul: `Pengajuan Peminjaman Terkirim: ${booking.kode_transaksi}`,
          pesan: `Permohonan peminjaman untuk fasilitas ${booking.sarpras_nama} telah berhasil dikirim dan sedang menunggu verifikasi teknis staf Bagian Umum.`,
          tipe: 'Info',
          tautan: '/peminjaman/riwayat',
        });
      }

      // 2. In-app & email notifications ke Kasubag & Staf
      const officers = await prisma.user.findMany({
        where: {
          role: { in: ['Kasubag', 'Staf'] },
          status_aktivasi: 'Aktif',
        },
        select: { id_user: true, role: true, email: true },
      });

      const stafIds = officers.filter((o) => o.role === 'Staf').map((o) => o.id_user);
      const kasubagIds = officers.filter((o) => o.role === 'Kasubag').map((o) => o.id_user);

      if (stafIds.length > 0) {
        await createBatchInAppNotifications({
          user_ids: stafIds,
          judul: `Pengajuan Baru Menunggu Verifikasi: ${booking.kode_transaksi}`,
          pesan: `${booking.pemohon_nama} (${booking.pemohon_role}) mengajukan peminjaman ${booking.sarpras_nama}. Siapkan inspeksi teknis pra-approval.`,
          tipe: 'Info',
          tautan: '/dashboard/verifikasi',
        });
      }

      if (kasubagIds.length > 0) {
        await createBatchInAppNotifications({
          user_ids: kasubagIds,
          judul: `Pengajuan Peminjaman Masuk: ${booking.kode_transaksi}`,
          pesan: `${booking.pemohon_nama} mengajukan ${booking.sarpras_nama} (${formatDateTime(booking.tgl_mulai)} s/d ${formatDateTime(booking.tgl_selesai)}).`,
          tipe: 'Info',
          tautan: '/dashboard/approval',
        });
      }

      // Email notifications
      const emails = officers.map((o) => o.email);
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
    id_pemohon?: string;
    kode_transaksi: string;
    sarpras_nama: string;
    pemohon_email: string;
    pemohon_nama: string;
    alasan: string;
  }) {
    try {
      // In-app ke Pemohon
      if (booking.id_pemohon) {
        await createInAppNotification({
          id_user: booking.id_pemohon,
          judul: `Pembatalan Berhasil: ${booking.kode_transaksi}`,
          pesan: `Permohonan peminjaman ${booking.sarpras_nama} telah berhasil dibatalkan. Alasan: ${booking.alasan || 'Dibatalkan mandiri.'}`,
          tipe: 'Peringatan',
          tautan: '/peminjaman/riwayat',
        });
      }

      // In-app ke Kasubag & Staf
      const officers = await prisma.user.findMany({
        where: { role: { in: ['Kasubag', 'Staf'] }, status_aktivasi: 'Aktif' },
        select: { id_user: true },
      });
      if (officers.length > 0) {
        await createBatchInAppNotifications({
          user_ids: officers.map((o) => o.id_user),
          judul: `Peminjaman Dibatalkan: ${booking.kode_transaksi}`,
          pesan: `${booking.pemohon_nama} telah membatalkan peminjaman ${booking.sarpras_nama} (${booking.kode_transaksi}). Slot jadwal otomatis dibebaskan.`,
          tipe: 'Peringatan',
          tautan: '/dashboard/approval',
        });
      }

      // Email ke Pemohon
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
   * Skenario 5: Pengajuan disetujui + Tiket QR terbit (Penerima: Pemohon & Staf)
   */
  async notifyBookingApproved(booking: {
    id_pemohon?: string;
    kode_transaksi: string;
    sarpras_nama: string;
    pemohon_email: string;
    pemohon_nama: string;
    kode_qr: string;
    tgl_mulai: Date | string;
    tgl_selesai: Date | string;
  }) {
    try {
      // In-app ke Pemohon
      if (booking.id_pemohon) {
        await createInAppNotification({
          id_user: booking.id_pemohon,
          judul: `Permohonan Disetujui: ${booking.kode_transaksi}`,
          pesan: `Permohonan peminjaman ${booking.sarpras_nama} telah disetujui Kasubag Bagian Umum. Tiket QR (${booking.kode_qr}) telah terbit dan siap digunakan saat serah terima.`,
          tipe: 'Persetujuan',
          tautan: '/peminjaman/riwayat',
        });
      }

      // In-app ke Staf Umum (siap dilakukan serah terima)
      const stafs = await prisma.user.findMany({
        where: { role: 'Staf', status_aktivasi: 'Aktif' },
        select: { id_user: true },
      });
      if (stafs.length > 0) {
        await createBatchInAppNotifications({
          user_ids: stafs.map((s) => s.id_user),
          judul: `Peminjaman Siap Serah Terima: ${booking.kode_transaksi}`,
          pesan: `Permohonan ${booking.sarpras_nama} oleh ${booking.pemohon_nama} telah disetujui Kasubag. Siap dilakukan serah terima dengan scan tiket QR.`,
          tipe: 'Info',
          tautan: '/dashboard/verifikasi',
        });
      }

      // Email ke Pemohon
      await sendEmail({
        to: booking.pemohon_email,
        subject: `[SIMASPRAS] Permohonan Disetujui & Tiket QR Diterbitkan: ${booking.kode_transaksi}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #034275; color: #ffffff; padding: 18px; text-align: center;">
              <h3 style="margin: 0;">SIMASPRAS POLTEKIMIPAS</h3>
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
    id_pemohon?: string;
    kode_transaksi: string;
    sarpras_nama: string;
    pemohon_email: string;
    pemohon_nama: string;
    alasan: string;
  }) {
    try {
      // In-app ke Pemohon
      if (booking.id_pemohon) {
        await createInAppNotification({
          id_user: booking.id_pemohon,
          judul: `Permohonan Ditolak: ${booking.kode_transaksi}`,
          pesan: `Permohonan peminjaman ${booking.sarpras_nama} belum disetujui Kasubag Bagian Umum. Alasan: ${booking.alasan}`,
          tipe: 'Penolakan',
          tautan: '/peminjaman/riwayat',
        });
      }

      // Email ke Pemohon
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
   * Skenario 7: Rekomendasi verifikasi fisik selesai (Penerima: Kasubag Umum & Pemohon)
   */
  async notifyInspectionCompleted(verif: {
    id_pemohon?: string;
    kode_transaksi: string;
    sarpras_nama: string;
    jenis: string;
    kondisi: string;
    catatan?: string | null;
    staf_nama: string;
  }) {
    try {
      const isPasca = verif.jenis === 'Pasca_Pengembalian';

      // 1. In-app ke Kasubag
      const kasubags = await prisma.user.findMany({
        where: { role: 'Kasubag', status_aktivasi: 'Aktif' },
        select: { id_user: true, email: true },
      });

      if (kasubags.length > 0) {
        await createBatchInAppNotifications({
          user_ids: kasubags.map((k) => k.id_user),
          judul: isPasca
            ? `Inspeksi Pengembalian Selesai: ${verif.kode_transaksi}`
            : `Hasil Verifikasi Teknis Masuk: ${verif.kode_transaksi}`,
          pesan: isPasca
            ? `Staf ${verif.staf_nama} telah memverifikasi pengembalian ${verif.sarpras_nama} (${verif.kondisi.replace('_', ' ')}). Siap diterbitkan BAST Digital.`
            : `Staf ${verif.staf_nama} telah menyelesaikan inspeksi pra-approval untuk ${verif.sarpras_nama} (${verif.kondisi.replace('_', ' ')}). Permohonan siap diputuskan.`,
          tipe: isPasca ? 'BAST' : 'Inspeksi',
          tautan: isPasca ? '/dashboard/bast' : '/dashboard/approval',
        });
      }

      // 2. In-app ke Pemohon
      if (verif.id_pemohon) {
        await createInAppNotification({
          id_user: verif.id_pemohon,
          judul: isPasca
            ? `Pemeriksaan Pengembalian Selesai: ${verif.kode_transaksi}`
            : `Inspeksi Teknis Selesai: ${verif.kode_transaksi}`,
          pesan: isPasca
            ? `Fasilitas ${verif.sarpras_nama} telah selesai diperiksa staf teknis pasca-pengembalian (${verif.kondisi.replace('_', ' ')}). Menunggu penerbitan BAST resmi.`
            : `Kondisi teknis ${verif.sarpras_nama} telah diverifikasi oleh staf Bagian Umum (${verif.kondisi.replace('_', ' ')}).`,
          tipe: 'Inspeksi',
          tautan: '/peminjaman/riwayat',
        });
      }

      // Email ke Kasubag
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
    id_pemohon?: string;
    id_peminjaman?: string;
    nomor_bast: string;
    kode_transaksi: string;
    pemohon_email: string;
    pemohon_nama: string;
    kasubag_nama: string;
  }) {
    try {
      // In-app ke Pemohon
      if (bast.id_pemohon) {
        await createInAppNotification({
          id_user: bast.id_pemohon,
          judul: `BAST Digital Resmi Diterbitkan: ${bast.nomor_bast}`,
          pesan: `Berita Acara Serah Terima Nomor ${bast.nomor_bast} untuk transaksi ${bast.kode_transaksi} telah selesai ditandatangani Kasubag (${bast.kasubag_nama}) secara digital. Aset telah kembali resmi dan bebas denda finansial.`,
          tipe: 'BAST',
          tautan: bast.id_peminjaman ? `/peminjaman/${bast.id_peminjaman}/bast` : '/peminjaman/riwayat',
        });
      }

      // Email ke Pemohon
      await sendEmail({
        to: bast.pemohon_email,
        subject: `[SIMASPRAS] Berita Acara Serah Terima (BAST) Selesai: ${bast.nomor_bast}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #034275; color: #ffffff; padding: 18px; text-align: center;">
              <h3 style="margin: 0;">SIMASPRAS POLTEKIMIPAS</h3>
              <p style="margin: 4px 0 0 0; font-size: 12px;">Penerbitan BAST Digital Resmi</p>
            </div>
            <div style="padding: 20px;">
              <p>Yth. <strong>${bast.pemohon_nama}</strong>,</p>
              <p>Pengembalian fasilitas untuk transaksi <strong>${bast.kode_transaksi}</strong> telah resmi disetujui melalui penandatanganan elektronik BAST Digital:</p>
              <p><strong>Nomor BAST:</strong> ${bast.nomor_bast}</p>
              <p style="font-size: 12px; color: #64748b;">Pengembalian diproses tertib tanpa klausul denda finansial sesuai ketetapan Poltekimipas.</p>
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
        select: { id_user: true, email: true },
      });

      if (admins.length > 0) {
        // In-app ke Admins
        await createBatchInAppNotifications({
          user_ids: admins.map((a) => a.id_user),
          judul: `Peringatan Keamanan: ${event.jenis_kejadian}`,
          pesan: `${event.deskripsi} (IP: ${event.ip_address || '-'})`,
          tipe: 'Keamanan',
          tautan: '/admin/users',
        });

        // Email ke Admins
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
      }
    } catch (e) {
      console.warn('NotificationService.notifySecurityEvent failed:', e);
    }
  },

  /**
   * Skenario 10: Perubahan peran pengguna (RBAC Role Change) (Penerima: Pengguna Terkait)
   */
  async notifyRoleChanged(data: {
    id_user: string;
    role_lama: string;
    role_baru: string;
    admin_nama?: string;
  }) {
    try {
      await createInAppNotification({
        id_user: data.id_user,
        judul: 'Pembaruan Hak Akses Akun (RBAC)',
        pesan: `Peran akun Anda telah diperbarui dari "${data.role_lama}" menjadi "${data.role_baru}" oleh Administrator${data.admin_nama ? ` (${data.admin_nama})` : ''}.`,
        tipe: 'Info',
        tautan: '/',
      });
    } catch (e) {
      console.warn('NotificationService.notifyRoleChanged failed:', e);
    }
  },

  /**
   * Skenario 11: Serah terima tiket QR sukses (Penerima: Pemohon)
   */
  async notifyAssetHandedOver(data: {
    id_pemohon: string;
    kode_transaksi: string;
    sarpras_nama: string;
    staf_nama: string;
  }) {
    try {
      await createInAppNotification({
        id_user: data.id_pemohon,
        judul: `Serah Terima Fasilitas Berhasil: ${data.kode_transaksi}`,
        pesan: `Fasilitas ${data.sarpras_nama} telah resmi diserahterimakan oleh staf Bagian Umum (${data.staf_nama}). Periode peminjaman aktif dimulai. Harap menjaga dan merawat fasilitas selama penggunaan.`,
        tipe: 'Persetujuan',
        tautan: '/peminjaman/riwayat',
      });
    } catch (e) {
      console.warn('NotificationService.notifyAssetHandedOver failed:', e);
    }
  },

  /**
   * Skenario 12: Pembatalan otomatis jadwal kadaluarsa oleh Cron (Penerima: Pemohon)
   */
  async notifyAutoCancelled(data: {
    id_pemohon: string;
    kode_transaksi: string;
    sarpras_nama: string;
    jadwal_mulai: string;
  }) {
    try {
      await createInAppNotification({
        id_user: data.id_pemohon,
        judul: `Peminjaman Dibatalkan Otomatis: ${data.kode_transaksi}`,
        pesan: `Pengajuan peminjaman untuk ${data.sarpras_nama} telah dibatalkan otomatis oleh sistem karena jadwal pelaksanaan kegiatan (${data.jadwal_mulai}) telah terlewati tanpa verifikasi lengkap.`,
        tipe: 'Peringatan',
        tautan: '/peminjaman/riwayat',
      });
    } catch (e) {
      console.warn('NotificationService.notifyAutoCancelled failed:', e);
    }
  },
};
