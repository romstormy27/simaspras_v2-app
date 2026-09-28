import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import prisma from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock getSession dari '@/lib/auth' agar dapat disimulasikan sebagai berbagai peran (Pemohon vs Admin vs Unauthenticated)
let mockSessionUser: any = null;

vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth')>();
  return {
    ...actual,
    getSession: vi.fn(async () => mockSessionUser),
  };
});

// Import route handlers setelah vi.mock
import { GET as getUserProfile, PUT as updateUserProfile } from '@/app/api/user/profile/route';
import { GET as getAdminUser, PUT as updateAdminUser } from '@/app/api/admin/users/[id]/route';

describe('Unit & Integration Test: User Profile & Admin Management', () => {
  let testUser1: any;
  let testUser2: any;
  let adminUser: any;
  const createdUserIds: string[] = [];

  beforeEach(async () => {
    const uid = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

    // 1. Buat Test User 1 (Pemohon Dosen)
    const initialHash1 = await hashPassword('passwordLama123');
    testUser1 = await prisma.user.create({
      data: {
        nama_lengkap: `Dosen Uji Coba ${uid}`,
        email: `dosen.${uid}@profiltest.internal`,
        password_hash: initialHash1,
        no_hp: '081234567891',
        role: 'Dosen',
        status_aktivasi: 'Aktif',
        pemohon_detail: {
          create: {
            nomor_identitas: '198501012010121001',
            instansi_kategori: 'Prodi Pemasyarakatan',
          },
        },
      },
      include: { pemohon_detail: true },
    });
    createdUserIds.push(testUser1.id_user);

    // 2. Buat Test User 2 (Pemohon Taruna)
    const initialHash2 = await hashPassword('passwordLama456');
    testUser2 = await prisma.user.create({
      data: {
        nama_lengkap: `Taruna Uji Coba ${uid}`,
        email: `taruna.${uid}@profiltest.internal`,
        password_hash: initialHash2,
        no_hp: '081234567892',
        role: 'Taruna',
        status_aktivasi: 'Aktif',
        pemohon_detail: {
          create: {
            nomor_identitas: '2022001002',
            instansi_kategori: 'Tingkat III Poltekip',
          },
        },
      },
      include: { pemohon_detail: true },
    });
    createdUserIds.push(testUser2.id_user);

    // 3. Buat Admin User
    adminUser = await prisma.user.create({
      data: {
        nama_lengkap: `Admin Uji Coba ${uid}`,
        email: `admin.${uid}@profiltest.internal`,
        password_hash: initialHash1,
        no_hp: '081234567899',
        role: 'Admin',
        status_aktivasi: 'Aktif',
      },
    });
    createdUserIds.push(adminUser.id_user);
  });

  afterEach(async () => {
    mockSessionUser = null;
    const ids = [testUser1?.id_user, testUser2?.id_user, adminUser?.id_user].filter(Boolean);
    if (ids.length > 0) {
      await prisma.notifikasi.deleteMany({ where: { id_user: { in: ids } } });
      await prisma.auditLog.deleteMany({ where: { id_user: { in: ids } } });
      await prisma.pemohonDetail.deleteMany({ where: { id_user: { in: ids } } });
      await prisma.user.deleteMany({ where: { id_user: { in: ids } } });
    }
  });

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await prisma.notifikasi.deleteMany({ where: { id_user: { in: createdUserIds } } });
      await prisma.auditLog.deleteMany({ where: { id_user: { in: createdUserIds } } });
      await prisma.pemohonDetail.deleteMany({ where: { id_user: { in: createdUserIds } } });
      await prisma.user.deleteMany({ where: { id_user: { in: createdUserIds } } });
    }
  });

  describe('1. Self-Service Profile: GET & PUT /api/user/profile', () => {
    it('Harus menolak akses jika pengguna belum terautentikasi (401)', async () => {
      mockSessionUser = null;
      const res = await getUserProfile();
      expect(res.status).toBe(401);
    });

    it('Harus berhasil mengambil data profil pengguna aktif (GET)', async () => {
      mockSessionUser = {
        id_user: testUser1.id_user,
        nama_lengkap: testUser1.nama_lengkap,
        email: testUser1.email,
        role: testUser1.role,
      };

      const res = await getUserProfile();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.nama_lengkap).toBe(testUser1.nama_lengkap);
      expect(json.data.nomor_identitas).toBe('198501012010121001');
      expect(json.data.instansi_kategori).toBe('Prodi Pemasyarakatan');
    });

    it('Harus berhasil memperbarui data diri dan nomor identitas tanpa mengubah kata sandi (PUT)', async () => {
      mockSessionUser = {
        id_user: testUser1.id_user,
        nama_lengkap: testUser1.nama_lengkap,
        email: testUser1.email,
        role: testUser1.role,
      };

      const req = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_lengkap: 'Dr. Dosen Uji Coba M.Si',
          email: testUser1.email,
          no_hp: '081299998888',
          nomor_identitas: '198501012010121099',
          instansi_kategori: 'Prodi Keimigrasian Lanjutan',
        }),
      });

      const res = await updateUserProfile(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);

      // Verifikasi di DB
      const updated = await prisma.user.findUnique({
        where: { id_user: testUser1.id_user },
        include: { pemohon_detail: true },
      });
      expect(updated?.nama_lengkap).toBe('Dr. Dosen Uji Coba M.Si');
      expect(updated?.no_hp).toBe('081299998888');
      expect(updated?.pemohon_detail?.nomor_identitas).toBe('198501012010121099');
      expect(updated?.pemohon_detail?.instansi_kategori).toBe('Prodi Keimigrasian Lanjutan');

      // Verifikasi In-App Notification masuk
      const notif = await prisma.notifikasi.findFirst({
        where: { id_user: testUser1.id_user },
        orderBy: { created_at: 'desc' },
      });
      expect(notif).toBeDefined();
      expect(notif?.judul).toContain('Profil Akun Berhasil Diperbarui');
    });

    it('Harus menolak perubahan email jika email sudah digunakan oleh pengguna lain', async () => {
      mockSessionUser = {
        id_user: testUser1.id_user,
        nama_lengkap: testUser1.nama_lengkap,
        email: testUser1.email,
        role: testUser1.role,
      };

      const req = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_lengkap: testUser1.nama_lengkap,
          email: testUser2.email, // email konflik dengan testUser2
          no_hp: testUser1.no_hp,
          nomor_identitas: '12345',
          instansi_kategori: 'Unit',
        }),
      });

      const res = await updateUserProfile(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.message).toContain('sudah digunakan');
    });

    it('Harus menolak ganti kata sandi jika kata sandi lama salah', async () => {
      mockSessionUser = {
        id_user: testUser1.id_user,
        nama_lengkap: testUser1.nama_lengkap,
        email: testUser1.email,
        role: testUser1.role,
      };

      const req = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_lengkap: testUser1.nama_lengkap,
          email: testUser1.email,
          no_hp: testUser1.no_hp,
          nomor_identitas: '12345',
          instansi_kategori: 'Unit',
          current_password: 'PasswordSalahTotal',
          new_password: 'PasswordBaru123',
          confirm_password: 'PasswordBaru123',
        }),
      });

      const res = await updateUserProfile(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.message).toContain('Kata sandi saat ini yang Anda masukkan salah');
    });

    it('Harus menolak jika konfirmasi kata sandi baru tidak cocok', async () => {
      mockSessionUser = {
        id_user: testUser1.id_user,
        nama_lengkap: testUser1.nama_lengkap,
        email: testUser1.email,
        role: testUser1.role,
      };

      const req = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_lengkap: testUser1.nama_lengkap,
          email: testUser1.email,
          no_hp: testUser1.no_hp,
          nomor_identitas: '12345',
          instansi_kategori: 'Unit',
          current_password: 'passwordLama123',
          new_password: 'PasswordBaru123',
          confirm_password: 'PasswordBeda123',
        }),
      });

      const res = await updateUserProfile(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.message).toContain('Konfirmasi kata sandi baru tidak cocok');
    });

    it('Harus berhasil mengganti kata sandi dengan kata sandi lama yang valid', async () => {
      mockSessionUser = {
        id_user: testUser1.id_user,
        nama_lengkap: testUser1.nama_lengkap,
        email: testUser1.email,
        role: testUser1.role,
      };

      const req = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_lengkap: testUser1.nama_lengkap,
          email: testUser1.email,
          no_hp: testUser1.no_hp,
          nomor_identitas: '12345',
          instansi_kategori: 'Unit',
          current_password: 'passwordLama123',
          new_password: 'PasswordBaruAman999!',
          confirm_password: 'PasswordBaruAman999!',
        }),
      });

      const res = await updateUserProfile(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.message).toContain('kata sandi');

      // Verifikasi kata sandi baru dapat diverifikasi dengan bcrypt
      const updated = await prisma.user.findUnique({ where: { id_user: testUser1.id_user } });
      const isValid = await verifyPassword('PasswordBaruAman999!', updated!.password_hash);
      expect(isValid).toBe(true);

      // Verifikasi notifikasi keamanan dikirimkan
      const notifs = await prisma.notifikasi.findMany({
        where: { id_user: testUser1.id_user },
        orderBy: { created_at: 'desc' },
      });
      const pwNotif = notifs.find((n) => n.judul.includes('Kata Sandi'));
      expect(pwNotif).toBeDefined();
    });
  });

  describe('2. Admin Management: GET & PUT /api/admin/users/[id]', () => {
    it('Harus menolak non-admin untuk mengakses route admin (403)', async () => {
      mockSessionUser = {
        id_user: testUser1.id_user,
        nama_lengkap: testUser1.nama_lengkap,
        email: testUser1.email,
        role: 'Dosen', // Non-Admin
      };

      const resGet = await getAdminUser(new NextRequest('http://localhost:3000/api/admin/users/123'), {
        params: { id: testUser2.id_user },
      });
      expect(resGet.status).toBe(403);

      const resPut = await updateAdminUser(
        new NextRequest('http://localhost:3000/api/admin/users/123', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nama_lengkap: 'Nama Ubah',
            email: 'test@profiltest.internal',
            no_hp: '081234567890',
            role: 'Staf',
            status_aktivasi: 'Aktif',
          }),
        }),
        { params: { id: testUser2.id_user } }
      );
      expect(resPut.status).toBe(403);
    });

    it('Harus mengizinkan Administrator mengambil data detail user target (GET)', async () => {
      mockSessionUser = {
        id_user: adminUser.id_user,
        nama_lengkap: adminUser.nama_lengkap,
        email: adminUser.email,
        role: 'Admin',
      };

      const res = await getAdminUser(new NextRequest('http://localhost:3000/api/admin/users/123'), {
        params: { id: testUser2.id_user },
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.nama_lengkap).toBe(testUser2.nama_lengkap);
      expect(json.data.nomor_identitas).toBe('2022001002');
    });

    it('Harus mengizinkan Administrator mengubah role, status aktivasi, dan data pengguna (PUT)', async () => {
      mockSessionUser = {
        id_user: adminUser.id_user,
        nama_lengkap: adminUser.nama_lengkap,
        email: adminUser.email,
        role: 'Admin',
      };

      const req = new NextRequest('http://localhost:3000/api/admin/users/123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_lengkap: 'Taruna Berprestasi Tingkat Akhir',
          email: testUser2.email,
          no_hp: '081277776666',
          role: 'Alumni', // Diubah menjadi Alumni
          status_aktivasi: 'Aktif',
          nomor_identitas: '2022001099',
          instansi_kategori: 'Ikatan Alumni Poltekip',
        }),
      });

      const res = await updateAdminUser(req, { params: { id: testUser2.id_user } });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);

      const updated = await prisma.user.findUnique({
        where: { id_user: testUser2.id_user },
        include: { pemohon_detail: true },
      });
      expect(updated?.nama_lengkap).toBe('Taruna Berprestasi Tingkat Akhir');
      expect(updated?.role).toBe('Alumni');
      expect(updated?.pemohon_detail?.nomor_identitas).toBe('2022001099');
      expect(updated?.pemohon_detail?.instansi_kategori).toBe('Ikatan Alumni Poltekip');

      // Verifikasi notifikasi masuk ke target user
      const notif = await prisma.notifikasi.findFirst({
        where: { id_user: testUser2.id_user },
        orderBy: { created_at: 'desc' },
      });
      expect(notif).toBeDefined();
      expect(notif?.pesan).toContain('Administrator');
    });

    it('Harus mengizinkan Administrator mereset password pengguna secara langsung tanpa password lama', async () => {
      mockSessionUser = {
        id_user: adminUser.id_user,
        nama_lengkap: adminUser.nama_lengkap,
        email: adminUser.email,
        role: 'Admin',
      };

      const req = new NextRequest('http://localhost:3000/api/admin/users/123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_lengkap: 'Taruna Berprestasi Tingkat Akhir',
          email: testUser2.email,
          no_hp: '081277776666',
          role: 'Alumni',
          status_aktivasi: 'Aktif',
          nomor_identitas: '2022001099',
          instansi_kategori: 'Ikatan Alumni Poltekip',
          new_password: 'ResetPasswordOlehAdmin123!', // Direct reset
        }),
      });

      const res = await updateAdminUser(req, { params: { id: testUser2.id_user } });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.message).toContain('kata sandi berhasil diperbarui');

      const updated = await prisma.user.findUnique({ where: { id_user: testUser2.id_user } });
      const isValid = await verifyPassword('ResetPasswordOlehAdmin123!', updated!.password_hash);
      expect(isValid).toBe(true);

      // Verifikasi audit log tercatat
      const audit = await prisma.auditLog.findFirst({
        where: { id_user: adminUser.id_user },
        orderBy: { timestamp: 'desc' },
      });
      expect(audit).toBeDefined();
      expect(audit?.aktivitas).toContain('mereset kata sandi');
    });
  });
});
