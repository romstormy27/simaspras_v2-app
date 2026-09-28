export type Role =
  | 'Dosen'
  | 'Taruna'
  | 'BPSDM'
  | 'Kementerian'
  | 'Alumni'
  | 'Kabag'
  | 'Kasubag'
  | 'Staf'
  | 'Admin';

export type StatusAktivasi = 'Pending' | 'Aktif' | 'Ditolak';

export type KategoriSarpras = 'Ruangan' | 'Mobil Operasional' | 'Perangkat Kerja';

export type StatusOperasional = 'Tersedia' | 'Maintenance' | 'Rusak' | 'Non-Aktif';

export type StatusTransaksi = 'Pending' | 'Disetujui' | 'Ditolak' | 'Dibatalkan' | 'Selesai';

export type StatusTiket = 'Aktif' | 'Digunakan' | 'Kadaluarsa';

export type JenisPemeriksaan = 'Pra-Approval' | 'Pasca-Pengembalian';

export type KondisiFisik = 'Baik/Sesuai' | 'Ada Catatan Khusus';

export interface AuthUser {
  id_user: string;
  nama_lengkap: string;
  email: string;
  no_hp: string;
  role: Role;
  status_aktivasi: StatusAktivasi;
  nomor_identitas?: string;
  instansi_kategori?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]> | string | unknown;
}

export type TipeNotifikasi =
  | 'Info'
  | 'Persetujuan'
  | 'Penolakan'
  | 'Peringatan'
  | 'Inspeksi'
  | 'BAST'
  | 'Keamanan';

export interface InAppNotifikasi {
  id_notifikasi: string;
  id_user: string;
  judul: string;
  pesan: string;
  tipe: TipeNotifikasi;
  tautan?: string | null;
  is_read: boolean;
  created_at: string | Date;
}
