import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    if (user) {
      await logAudit({
        id_user: user.id_user,
        aktivitas: 'Pengguna melakukan logout',
        ip_address: ip,
      });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logout berhasil',
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: '',
      httpOnly: true,
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (_error) {
    return NextResponse.json(
      { success: false, message: 'Gagal melakukan logout' },
      { status: 500 }
    );
  }
}
