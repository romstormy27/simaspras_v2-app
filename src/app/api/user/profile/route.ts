import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSession, hashPassword, verifyPassword, createToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { NotificationService } from '@/lib/notifications';
import { AuthUser } from '@/types';

const updateProfileSchema = z.object({
  nama_lengkap: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  email: z.string().email('Format email tidak valid'),
  no_hp: z.string().min(10, 'Nomor HP minimal 10 digit'),
  nomor_identitas: z.string().optional().default(''),
  instansi_kategori: z.string().optional().default(''),
  current_password: z.string().optional(),
  new_password: z.string().optional(),
  confirm_password: z.string().optional(),
});

// GET: Ambil detail profil lengkap pengguna yang sedang aktif login
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Autentikasi diperlukan' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id_user: session.id_user },
      include: { pemohon_detail: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id_user: user.id_user,
        nama_lengkap: user.nama_lengkap,
        email: user.email,
        no_hp: user.no_hp,
        role: user.role,
        status_aktivasi: user.status_aktivasi,
        nomor_identitas: user.pemohon_detail?.nomor_identitas || '',
        instansi_kategori: user.pemohon_detail?.instansi_kategori || '',
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data profil' },
      { status: 500 }
    );
  }
}

// PUT: Perbarui data profil mandiri & opsi ganti kata sandi
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Autentikasi diperlukan' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = updateProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: 'Validasi gagal', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    const currentUser = await prisma.user.findUnique({
      where: { id_user: session.id_user },
      include: { pemohon_detail: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Akun pengguna tidak ditemukan' },
        { status: 404 }
      );
    }

    // 1. Cek keunikan email bila email diubah
    const normalizedEmail = data.email.toLowerCase().trim();
    if (normalizedEmail !== currentUser.email.toLowerCase()) {
      const emailConflict = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          id_user: { not: session.id_user },
        },
      });

      if (emailConflict) {
        return NextResponse.json(
          { success: false, message: 'Alamat email baru sudah digunakan oleh akun lain' },
          { status: 400 }
        );
      }
    }

    // 2. Validasi Pergantian Password bila new_password diisi
    let newPasswordHash: string | undefined = undefined;
    let passwordChanged = false;

    if (data.new_password && data.new_password.trim() !== '') {
      if (!data.current_password || data.current_password.trim() === '') {
        return NextResponse.json(
          { success: false, message: 'Kata sandi saat ini wajib diisi untuk mengganti kata sandi' },
          { status: 400 }
        );
      }

      if (data.new_password.length < 6) {
        return NextResponse.json(
          { success: false, message: 'Kata sandi baru minimal 6 karakter' },
          { status: 400 }
        );
      }

      if (data.new_password !== data.confirm_password) {
        return NextResponse.json(
          { success: false, message: 'Konfirmasi kata sandi baru tidak cocok' },
          { status: 400 }
        );
      }

      const isCurrentPasswordCorrect = await verifyPassword(
        data.current_password,
        currentUser.password_hash
      );

      if (!isCurrentPasswordCorrect) {
        return NextResponse.json(
          { success: false, message: 'Kata sandi saat ini yang Anda masukkan salah' },
          { status: 400 }
        );
      }

      newPasswordHash = await hashPassword(data.new_password);
      passwordChanged = true;
    }

    // 3. Simpan perubahan ke Database secara transaksional
    const updatedUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id_user: session.id_user },
        data: {
          nama_lengkap: data.nama_lengkap.trim(),
          email: normalizedEmail,
          no_hp: data.no_hp.trim(),
          ...(newPasswordHash ? { password_hash: newPasswordHash } : {}),
        },
      });

      if (data.nomor_identitas !== undefined || data.instansi_kategori !== undefined) {
        await tx.pemohonDetail.upsert({
          where: { id_user: session.id_user },
          update: {
            nomor_identitas: data.nomor_identitas.trim(),
            instansi_kategori: data.instansi_kategori.trim(),
          },
          create: {
            id_user: session.id_user,
            nomor_identitas: data.nomor_identitas.trim(),
            instansi_kategori: data.instansi_kategori.trim(),
          },
        });
      }

      return u;
    });

    // 4. Perbarui JWT session token agar data navbar langsung sinkron
    const updatedAuthUser: AuthUser = {
      id_user: updatedUser.id_user,
      nama_lengkap: updatedUser.nama_lengkap,
      email: updatedUser.email,
      no_hp: updatedUser.no_hp,
      role: updatedUser.role,
      status_aktivasi: updatedUser.status_aktivasi,
      nomor_identitas: data.nomor_identitas.trim(),
      instansi_kategori: data.instansi_kategori.trim(),
    };

    const newToken = createToken(updatedAuthUser);

    // 5. Catat Log Audit Keamanan
    let logMessage = `Pengguna memperbarui data profil (${updatedUser.nama_lengkap})`;
    if (passwordChanged) {
      logMessage += ' dan berhasil mengganti kata sandi';
    }

    await logAudit({
      id_user: session.id_user,
      aktivitas: logMessage,
      ip_address: ip,
    });

    // 6. Kirim In-App Notifications
    await NotificationService.notifyProfileUpdated({
      id_user: session.id_user,
      nama_lengkap: updatedUser.nama_lengkap,
    });

    if (passwordChanged) {
      await NotificationService.notifyPasswordChanged({
        id_user: session.id_user,
      });
    }

    // 7. Buat response dengan cookie sesi baru
    const response = NextResponse.json({
      success: true,
      message: passwordChanged
        ? 'Profil dan kata sandi Anda berhasil diperbarui'
        : 'Profil Anda berhasil diperbarui',
      data: updatedAuthUser,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: newToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
    });

    return response;
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memperbarui profil pengguna' },
      { status: 500 }
    );
  }
}
