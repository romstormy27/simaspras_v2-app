import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { sendEmail } from '@/lib/email';
import { NotificationService } from '@/lib/notifications';
import { Role, StatusAktivasi } from '@prisma/client';

const registerSchema = z.object({
  nama_lengkap: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  no_hp: z.string().min(10, 'Nomor HP minimal 10 digit'),
  role: z.enum(['Dosen', 'Taruna', 'BPSDM', 'Kementerian', 'Alumni']),
  nomor_identitas: z.string().min(3, 'Nomor identitas (NIP/NIM/KTP) wajib diisi'),
  instansi_kategori: z.string().min(2, 'Instansi / Jurusan asal wajib diisi'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: 'Validasi gagal', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Alamat email sudah terdaftar dalam sistem' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(data.password);

    // Buat User dan PemohonDetail secara transaksional
    const newUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          nama_lengkap: data.nama_lengkap,
          email: data.email.toLowerCase(),
          password_hash: passwordHash,
          no_hp: data.no_hp,
          role: data.role as Role,
          status_aktivasi: StatusAktivasi.Pending,
        },
      });

      await tx.pemohonDetail.create({
        data: {
          id_user: u.id_user,
          nomor_identitas: data.nomor_identitas,
          instansi_kategori: data.instansi_kategori,
        },
      });

      return u;
    });

    await logAudit({
      id_user: newUser.id_user,
      aktivitas: `Pendaftaran akun baru sebagai ${data.role} (Status: Pending Aktivasi)`,
      ip_address: ip,
    });

    // Kirim notifikasi email konfirmasi pendaftaran
    await sendEmail({
      to: data.email,
      subject: 'Pendaftaran Akun SIMASPRAS Poltekimipas Menunggu Aktivasi',
      html: `
        <h2>Pendaftaran Berhasil</h2>
        <p>Halo <strong>${data.nama_lengkap}</strong>,</p>
        <p>Terima kasih telah mendaftar di Sistem Informasi Peminjaman Sarpras (SIMASPRAS) Politeknik Imigrasi dan Pemasyarakatan.</p>
        <p>Akun Anda saat ini berstatus <strong>Menunggu Persetujuan (Pending)</strong> dan sedang diverifikasi oleh Administrator Bagian Umum.</p>
        <p>Anda akan menerima pemberitahuan via email setelah akun Anda diaktifkan.</p>
        <br/>
        <p>Salam hangat,<br/>Bagian Keuangan dan Umum Poltekimipas</p>
      `,
    });

    // Kirim notifikasi ke Administrator terkait pendaftaran akun baru (Skenario 1)
    await NotificationService.notifyUserRegistered({
      id_user: newUser.id_user,
      nama_lengkap: newUser.nama_lengkap,
      email: newUser.email,
      role: newUser.role,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          'Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan dan aktivasi dari Administrator.',
        data: {
          id_user: newUser.id_user,
          email: newUser.email,
          status_aktivasi: newUser.status_aktivasi,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memproses pendaftaran pengguna' },
      { status: 500 }
    );
  }
}
