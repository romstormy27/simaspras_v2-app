import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import prisma from '@/lib/prisma';
import {
  createInAppNotification,
  createBatchInAppNotifications,
  NotificationService,
} from '@/lib/notifications';
import { TipeNotifikasi } from '@/types';

describe('Unit & Integration Test: In-App Notifications System', () => {
  let testUserId1: string;
  let testUserId2: string;

  beforeEach(async () => {
    // Cari atau buat test users
    const users = await prisma.user.findMany({ take: 2 });
    if (users.length >= 2) {
      testUserId1 = users[0].id_user;
      testUserId2 = users[1].id_user;
    } else {
      const u1 = await prisma.user.create({
        data: {
          nama_lengkap: 'Test User Notif 1',
          email: `test_notif1_${Date.now()}@poltekimipas.ac.id`,
          password_hash: 'hashedpassword',
          no_hp: '081234567891',
          role: 'Dosen',
          status_aktivasi: 'Aktif',
        },
      });
      const u2 = await prisma.user.create({
        data: {
          nama_lengkap: 'Test User Notif 2',
          email: `test_notif2_${Date.now()}@poltekimipas.ac.id`,
          password_hash: 'hashedpassword',
          no_hp: '081234567892',
          role: 'Kasubag',
          status_aktivasi: 'Aktif',
        },
      });
      testUserId1 = u1.id_user;
      testUserId2 = u2.id_user;
    }

    // Bersihkan notifikasi test pengguna terkait
    await prisma.notifikasi.deleteMany({
      where: { id_user: { in: [testUserId1, testUserId2] } },
    });
  });

  afterAll(async () => {
    if (testUserId1 && testUserId2) {
      await prisma.notifikasi.deleteMany({
        where: { id_user: { in: [testUserId1, testUserId2] } },
      });
    }
  });

  it('1. Harus berhasil membuat notifikasi in-app tunggal dengan atribut lengkap', async () => {
    const notif = await createInAppNotification({
      id_user: testUserId1,
      judul: 'Peminjaman Disetujui',
      pesan: 'Permohonan peminjaman Aula Utama Anda telah disetujui Kasubag.',
      tipe: 'Persetujuan',
      tautan: '/peminjaman/riwayat',
    });

    expect(notif).toBeDefined();
    expect(notif?.id_user).toBe(testUserId1);
    expect(notif?.judul).toBe('Peminjaman Disetujui');
    expect(notif?.tipe).toBe('Persetujuan');
    expect(notif?.tautan).toBe('/peminjaman/riwayat');
    expect(notif?.is_read).toBe(false);
  });

  it('2. Harus berhasil membuat notifikasi batch untuk multi-user', async () => {
    const batchResult = await createBatchInAppNotifications({
      user_ids: [testUserId1, testUserId2],
      judul: 'Pengumuman Pemeliharaan Kampus',
      pesan: 'Pemeliharaan server SIMASPRAS akan dilakukan malam ini.',
      tipe: 'Info',
      tautan: '/',
    });

    expect(batchResult).toBeDefined();

    const notifsUser1 = await prisma.notifikasi.findMany({ where: { id_user: testUserId1 } });
    const notifsUser2 = await prisma.notifikasi.findMany({ where: { id_user: testUserId2 } });

    expect(notifsUser1.length).toBeGreaterThanOrEqual(1);
    expect(notifsUser2.length).toBeGreaterThanOrEqual(1);
  });

  it('3. Harus dapat menandai satu notifikasi tertentu sebagai telah dibaca (is_read: true)', async () => {
    const created = await createInAppNotification({
      id_user: testUserId1,
      judul: 'Inspeksi Fisik Selesai',
      pesan: 'Staf teknis telah memeriksa fisik Mobil Operasional.',
      tipe: 'Inspeksi',
    });

    expect(created?.is_read).toBe(false);

    const updated = await prisma.notifikasi.update({
      where: { id_notifikasi: created!.id_notifikasi },
      data: { is_read: true },
    });

    expect(updated.is_read).toBe(true);
  });

  it('4. Harus dapat menandai seluruh notifikasi unread pengguna sebagai dibaca (read-all)', async () => {
    await createInAppNotification({
      id_user: testUserId1,
      judul: 'Notif 1',
      pesan: 'Pesan 1',
      tipe: 'Info',
    });
    await createInAppNotification({
      id_user: testUserId1,
      judul: 'Notif 2',
      pesan: 'Pesan 2',
      tipe: 'Peringatan',
    });

    const unreadBefore = await prisma.notifikasi.count({
      where: { id_user: testUserId1, is_read: false },
    });
    expect(unreadBefore).toBeGreaterThanOrEqual(2);

    await prisma.notifikasi.updateMany({
      where: { id_user: testUserId1, is_read: false },
      data: { is_read: true },
    });

    const unreadAfter = await prisma.notifikasi.count({
      where: { id_user: testUserId1, is_read: false },
    });
    expect(unreadAfter).toBe(0);
  });

  it('5. Memastikan isolasi data: Notifikasi milik User 1 tidak tercampur dengan User 2', async () => {
    await createInAppNotification({
      id_user: testUserId1,
      judul: 'Khusus User 1',
      pesan: 'Pesan rahasia pemohon 1',
      tipe: 'BAST',
    });

    const notifsUser2 = await prisma.notifikasi.findMany({
      where: { id_user: testUserId2, judul: 'Khusus User 1' },
    });

    expect(notifsUser2.length).toBe(0);
  });

  it('6. Mendukung seluruh enum TipeNotifikasi secara valid', async () => {
    const allTypes: TipeNotifikasi[] = [
      'Info',
      'Persetujuan',
      'Penolakan',
      'Peringatan',
      'Inspeksi',
      'BAST',
      'Keamanan',
    ];

    for (const tipe of allTypes) {
      const notif = await createInAppNotification({
        id_user: testUserId1,
        judul: `Test Tipe ${tipe}`,
        pesan: `Deskripsi untuk tipe notifikasi ${tipe}`,
        tipe,
      });

      expect(notif?.tipe).toBe(tipe);
    }
  });

  it('7. NotificationService.notifyRoleChanged membuat notifikasi in-app yang sesuai', async () => {
    await NotificationService.notifyRoleChanged({
      id_user: testUserId1,
      role_lama: 'Taruna',
      role_baru: 'Dosen',
      admin_nama: 'Admin Utama',
    });

    const notif = await prisma.notifikasi.findFirst({
      where: { id_user: testUserId1, judul: 'Pembaruan Hak Akses Akun (RBAC)' },
    });

    expect(notif).toBeDefined();
    expect(notif?.pesan).toContain('Taruna');
    expect(notif?.pesan).toContain('Dosen');
  });

  it('8. NotificationService.notifyAssetHandedOver membuat notifikasi in-app serah terima aset', async () => {
    await NotificationService.notifyAssetHandedOver({
      id_pemohon: testUserId1,
      kode_transaksi: 'TRX-2026-TEST',
      sarpras_nama: 'Mobil Hiace Operasional',
      staf_nama: 'Staf Bagian Umum 1',
    });

    const notif = await prisma.notifikasi.findFirst({
      where: { id_user: testUserId1, judul: 'Serah Terima Fasilitas Berhasil: TRX-2026-TEST' },
    });

    expect(notif).toBeDefined();
    expect(notif?.tipe).toBe('Persetujuan');
    expect(notif?.pesan).toContain('Mobil Hiace Operasional');
  });
});
