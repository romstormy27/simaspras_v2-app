import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSession, hashPassword } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { NotificationService } from '@/lib/notifications';
import { Role, StatusAktivasi } from '@prisma/client';

const adminUpdateUserSchema = z.object({
  nama_lengkap: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  email: z.string().email('Format email tidak valid'),
  no_hp: z.string().min(10, 'Nomor HP minimal 10 digit'),
  role: z.enum(['Dosen', 'Taruna', 'BPSDM', 'Kementerian', 'Alumni', 'Kabag', 'Kasubag', 'Staf', 'Admin']),
  status_aktivasi: z.enum(['Pending', 'Aktif', 'Ditolak']),
  nomor_identitas: z.string().optional().default(''),
  instansi_kategori: z.string().optional().default(''),
  new_password: z.string().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

// GET: Ambil data detail pengguna target untuk Administrator
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'Admin') {
      return NextResponse.json({ success: false, message: 'Akses ditolak: Hanya Administrator' }, { status: 403 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id_user: params.id },
      include: { pemohon_detail: true },
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, message: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id_user: targetUser.id_user,
        nama_lengkap: targetUser.nama_lengkap,
        email: targetUser.email,
        no_hp: targetUser.no_hp,
        role: targetUser.role,
        status_aktivasi: targetUser.status_aktivasi,
        nomor_identitas: targetUser.pemohon_detail?.nomor_identitas || '',
        instansi_kategori: targetUser.pemohon_detail?.instansi_kategori || '',
        created_at: targetUser.created_at,
      },
    });
  } catch (error) {
    console.error('Admin get user error:', error);
    return NextResponse.json({ success: false, message: 'Gagal mengambil data pengguna' }, { status: 500 });
  }
}

// PUT: Perbarui data pengguna oleh Administrator
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'Admin') {
      return NextResponse.json({ success: false, message: 'Akses ditolak: Hanya Administrator' }, { status: 403 });
    }

    const body = await request.json();
    const result = adminUpdateUserSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: 'Validasi gagal', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    const targetUser = await prisma.user.findUnique({
      where: { id_user: params.id },
      include: { pemohon_detail: true },
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, message: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    // 1. Cek keunikan email
    const normalizedEmail = data.email.toLowerCase().trim();
    if (normalizedEmail !== targetUser.email.toLowerCase()) {
      const emailConflict = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          id_user: { not: params.id },
        },
      });

      if (emailConflict) {
        return NextResponse.json(
          { success: false, message: 'Alamat email sudah digunakan oleh pengguna lain' },
          { status: 400 }
        );
      }
    }

    // 2. Opsi Reset Password Pengguna
    let newPasswordHash: string | undefined = undefined;
    let passwordReset = false;

    if (data.new_password && data.new_password.trim() !== '') {
      if (data.new_password.length < 6) {
        return NextResponse.json(
          { success: false, message: 'Kata sandi baru minimal 6 karakter' },
          { status: 400 }
        );
      }
      newPasswordHash = await hashPassword(data.new_password);
      passwordReset = true;
    }

    // 3. Simpan perubahan ke Database
    const updatedUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id_user: params.id },
        data: {
          nama_lengkap: data.nama_lengkap.trim(),
          email: normalizedEmail,
          no_hp: data.no_hp.trim(),
          role: data.role as Role,
          status_aktivasi: data.status_aktivasi as StatusAktivasi,
          ...(newPasswordHash ? { password_hash: newPasswordHash } : {}),
        },
      });

      if (data.nomor_identitas !== undefined || data.instansi_kategori !== undefined) {
        await tx.pemohonDetail.upsert({
          where: { id_user: params.id },
          update: {
            nomor_identitas: data.nomor_identitas.trim(),
            instansi_kategori: data.instansi_kategori.trim(),
          },
          create: {
            id_user: params.id,
            nomor_identitas: data.nomor_identitas.trim(),
            instansi_kategori: data.instansi_kategori.trim(),
          },
        });
      }

      return u;
    });

    // 4. Catat Log Audit Keamanan
    let logMessage = `Administrator (${session.nama_lengkap}) memperbarui data profil akun ${updatedUser.nama_lengkap} (${updatedUser.email})`;
    if (passwordReset) {
      logMessage += ' dan mereset kata sandi akun';
    }

    await logAudit({
      id_user: session.id_user,
      aktivitas: logMessage,
      ip_address: ip,
    });

    // 5. Kirim In-App Notification ke Pengguna Terkait
    await NotificationService.notifyAdminUpdatedUser({
      id_user: params.id,
      admin_nama: session.nama_lengkap,
    });

    return NextResponse.json({
      success: true,
      message: passwordReset
        ? `Data pengguna ${updatedUser.nama_lengkap} dan kata sandi berhasil diperbarui`
        : `Data pengguna ${updatedUser.nama_lengkap} berhasil diperbarui`,
      data: {
        id_user: updatedUser.id_user,
        nama_lengkap: updatedUser.nama_lengkap,
        email: updatedUser.email,
        role: updatedUser.role,
        status_aktivasi: updatedUser.status_aktivasi,
      },
    });
  } catch (error) {
    console.error('Admin update user error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui data pengguna' },
      { status: 500 }
    );
  }
}
