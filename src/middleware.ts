import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'simaspras_session';

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    if (parsed.exp && parsed.exp * 1000 < Date.now()) {
      return null;
    }
    return parsed;
  } catch (_e) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? parseJwt(token) : null;

  // Rute Publik
  const isPublicRoute =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/' ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/register');

  // Jika sudah login dan mencoba akses /login atau /register -> redirect ke dasbor
  if (user && (pathname === '/login' || pathname === '/register')) {
    if (user.role === 'Kabag') {
      return NextResponse.redirect(new URL('/dashboard/eksekutif', request.url));
    } else if (user.role === 'Kasubag') {
      return NextResponse.redirect(new URL('/dashboard/approval', request.url));
    } else if (user.role === 'Staf') {
      return NextResponse.redirect(new URL('/dashboard/verifikasi', request.url));
    } else if (user.role === 'Admin') {
      return NextResponse.redirect(new URL('/admin/users', request.url));
    } else {
      return NextResponse.redirect(new URL('/katalog', request.url));
    }
  }

  // Jika belum login dan mengakses rute terproteksi
  if (!user && !isPublicRoute) {
    // API endpoint return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, message: 'Autentikasi diperlukan' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Penegakan Hak Akses RBAC (§5.2)
  if (user) {
    const role = user.role;

    // 1. Rute Admin: /admin/* dan /api/admin/*
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      if (role !== 'Admin') {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ success: false, message: 'Akses ditolak: Hanya Administrator' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    // 2. Rute Approval & BAST Kasubag: /dashboard/approval, /dashboard/bast
    if (pathname.startsWith('/dashboard/approval') || pathname.startsWith('/dashboard/bast')) {
      if (role !== 'Kasubag') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    // 3. Rute Verifikasi Staf: /dashboard/verifikasi
    if (pathname.startsWith('/dashboard/verifikasi')) {
      if (role !== 'Staf') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    // 4. Rute Dashboard Eksekutif: /dashboard/eksekutif
    if (pathname.startsWith('/dashboard/eksekutif')) {
      if (!['Kabag', 'Kasubag', 'Admin'].includes(role)) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|fonts).*)',
  ],
};
