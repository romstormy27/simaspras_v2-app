import { PrismaClient, Role, StatusAktivasi, KategoriSarpras, StatusOperasional } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai proses seeding data SIMASPRAS Poltekimipas...');

  const defaultPassword = await bcrypt.hash('password123', 10);

  // 1. Akun Pegawai & Administrator
  const users = [
    {
      id_user: 'usr-admin-001',
      nama_lengkap: 'System Administrator',
      email: 'admin@politeknik.ac.id',
      password_hash: defaultPassword,
      no_hp: '081234567890',
      role: Role.Admin,
      status_aktivasi: StatusAktivasi.Aktif,
    },
    {
      id_user: 'usr-kasubag-001',
      nama_lengkap: 'Kasubag Bagian Umum',
      email: 'kasubag.umum@politeknik.ac.id',
      password_hash: defaultPassword,
      no_hp: '081234567891',
      role: Role.Kasubag,
      status_aktivasi: StatusAktivasi.Aktif,
    },
    {
      id_user: 'usr-staf-001',
      nama_lengkap: 'Staf Verifikator Sarpras',
      email: 'staf.umum@politeknik.ac.id',
      password_hash: defaultPassword,
      no_hp: '081234567892',
      role: Role.Staf,
      status_aktivasi: StatusAktivasi.Aktif,
    },
    {
      id_user: 'usr-kabag-001',
      nama_lengkap: 'Kepala Bagian Keuangan dan Umum',
      email: 'kabag.keuangan@politeknik.ac.id',
      password_hash: defaultPassword,
      no_hp: '081234567893',
      role: Role.Kabag,
      status_aktivasi: StatusAktivasi.Aktif,
    },
    {
      id_user: 'usr-dosen-001',
      nama_lengkap: 'Dr. H. Ahmad Fauzi, M.Si.',
      email: 'dosen@politeknik.ac.id',
      password_hash: defaultPassword,
      no_hp: '081234567894',
      role: Role.Dosen,
      status_aktivasi: StatusAktivasi.Aktif,
    },
    {
      id_user: 'usr-taruna-001',
      nama_lengkap: 'Muhammad Rizky Pratama',
      email: 'taruna@politeknik.ac.id',
      password_hash: defaultPassword,
      no_hp: '081234567895',
      role: Role.Taruna,
      status_aktivasi: StatusAktivasi.Aktif,
    },
  ];

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: u,
      create: u,
    });
    console.log(`✓ Pengguna disiapkan: ${user.nama_lengkap} (${user.role})`);
  }

  // 2. Pemohon Detail untuk Dosen dan Taruna
  await prisma.pemohonDetail.upsert({
    where: { id_user: 'usr-dosen-001' },
    update: {
      nomor_identitas: '198501012010121001',
      instansi_kategori: 'Prodi Manajemen Keimigrasian',
    },
    create: {
      id_pemohon: 'pmh-dosen-001',
      id_user: 'usr-dosen-001',
      nomor_identitas: '198501012010121001',
      instansi_kategori: 'Prodi Manajemen Keimigrasian',
    },
  });

  await prisma.pemohonDetail.upsert({
    where: { id_user: 'usr-taruna-001' },
    update: {
      nomor_identitas: '2022.1234.1.01',
      instansi_kategori: 'Korp Taruna Pemasyarakatan',
    },
    create: {
      id_pemohon: 'pmh-taruna-001',
      id_user: 'usr-taruna-001',
      nomor_identitas: '2022.1234.1.01',
      instansi_kategori: 'Korp Taruna Pemasyarakatan',
    },
  });
  console.log('✓ Detail pemohon disiapkan.');

  // 3. Master Data Sarpras
  const sarprasData = [
    {
      id_sarpras: 'srp-ruang-001',
      kode_aset: 'BMN-R-101',
      nama_sarpras: 'Auditorium Utama Politeknik',
      kategori: KategoriSarpras.Ruangan,
      spesifikasi: 'Kapasitas 500 orang, Sound System, AC, Videotron LED',
      lokasi_plat: 'Gedung Rektorat Lt. 3',
      status_operasional: StatusOperasional.Tersedia,
    },
    {
      id_sarpras: 'srp-mobil-001',
      kode_aset: 'BMN-M-001',
      nama_sarpras: 'Toyota HiAce Premio Executive',
      kategori: KategoriSarpras.Mobil_Operasional,
      spesifikasi: '15 Seat, Full AC, Reclining Seat, GPS Tracking',
      lokasi_plat: 'B 1234 POL (Pool Kendaraan)',
      status_operasional: StatusOperasional.Tersedia,
    },
    {
      id_sarpras: 'srp-alat-001',
      kode_aset: 'BMN-P-001',
      nama_sarpras: 'Proyektor High-Lumens & Screen',
      kategori: KategoriSarpras.Perangkat_Kerja,
      spesifikasi: '5000 Lumens, HDMI/Wireless, Portable Tripod Screen',
      lokasi_plat: 'Gudang Sarpras Utama',
      status_operasional: StatusOperasional.Tersedia,
    },
  ];

  for (const s of sarprasData) {
    const sarpras = await prisma.sarpras.upsert({
      where: { kode_aset: s.kode_aset },
      update: s,
      create: s,
    });
    console.log(`✓ Sarpras disiapkan: ${sarpras.nama_sarpras} (${sarpras.kategori})`);
  }

  // 4. Log Audit awal
  await prisma.auditLog.create({
    data: {
      id_user: 'usr-admin-001',
      aktivitas: 'Inisialisasi sistem dan seeding basis data SIMASPRAS',
      ip_address: '127.0.0.1',
    },
  });
  console.log('✓ Log audit inisialisasi berhasil dicatat.');

  console.log('🎉 Seeding data SIMASPRAS selesai dengan sukses!');
}

main()
  .catch((e) => {
    console.error('❌ Gagal melakukan seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
