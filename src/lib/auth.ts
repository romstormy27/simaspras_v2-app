import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { AuthUser, Role } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'simaspras_poltekimipas_default_secret_key_2026';
export const SESSION_COOKIE_NAME = 'simaspras_session';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(payload: AuthUser): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch (_error) {
    return null;
  }
}

export async function getSession(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch (_error) {
    return null;
  }
}

export function getDefaultDashboardRoute(role: Role): string {
  switch (role) {
    case 'Kabag':
      return '/dashboard/eksekutif';
    case 'Kasubag':
      return '/dashboard/approval';
    case 'Staf':
      return '/dashboard/verifikasi';
    case 'Admin':
      return '/admin/users';
    case 'Dosen':
    case 'Taruna':
    case 'BPSDM':
    case 'Kementerian':
    case 'Alumni':
    default:
      return '/katalog';
  }
}
