import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { verifyPassword, createToken, SESSION_COOKIE_NAME, getDefaultDashboardRoute } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: 'Validasi gagal', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { pemohon_detail: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Email atau password salah' },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, user.password_hash);
    if (!isMatch) {
      await logAudit({
        id_user: user.id_user,
        aktivitas: `Gagal login: Password salah untuk ${email}`,
        ip_address: ip,
      });
      return NextResponse.json(
        { success: false, message: 'Email atau password salah' },
        { status: 401 }
      );
    }

    // Cek Status Aktivasi PRD UC-01
    if (user.status_aktivasi === 'Pending') {
      return NextResponse.json(
        {
          success: false,
          message: 'Akun Anda Belum Diaktifkan oleh Administrator. Silakan menunggu proses verifikasi.',
        },
        { status: 403 }
      );
    }

    if (user.status_aktivasi === 'Ditolak') {
      return NextResponse.json(
        {
          success: false,
          message: 'Pendaftaran akun Anda ditolak oleh Administrator. Hubungi Bagian Umum untuk info lebih lanjut.',
        },
        { status: 403 }
      );
    }

    const authUser = {
      id_user: user.id_user,
      nama_lengkap: user.nama_lengkap,
      email: user.email,
      no_hp: user.no_hp,
      role: user.role,
      status_aktivasi: user.status_aktivasi,
      nomor_identitas: user.pemohon_detail?.nomor_identitas,
      instansi_kategori: user.pemohon_detail?.instansi_kategori,
    };

    const token = createToken(authUser);
    const redirectUrl = getDefaultDashboardRoute(user.role);

    await logAudit({
      id_user: user.id_user,
      aktivitas: `Login berhasil sebagai ${user.role}`,
      ip_address: ip,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil',
      data: { user: authUser, redirectUrl },
    });

    const isHttps =
      request.headers.get('x-forwarded-proto') === 'https' ||
      request.nextUrl.protocol === 'https:';

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 hari
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server internal' },
      { status: 500 }
    );
  }
}
