# PANDUAN OPERASIONAL & SERAH TERIMA ADMINISTRATOR IT
## Sistem Informasi Manajemen Sarana dan Prasarana (SIMASPRAS V2)
### Politeknik Imigrasi dan Pemasyarakatan Indonesia (Poltekimipas)

---

## 1. Ikhtisar Arsitektur Sistem

SIMASPRAS V2 dibangun dengan standar arsitektur modern berkinerja tinggi yang dirancang khusus untuk lingkungan **cPanel Phusion Passenger** maupun **Node.js Standalone VPS/Server**.

```
                +---------------------------------------------------+
                |           Klien / Web Browser / Mobile            |
                +---------------------------------------------------+
                                          |
                                    HTTPS / Port 443
                                          v
                +---------------------------------------------------+
                |            cPanel Apache / LiteSpeed              |
                |               + Phusion Passenger                 |
                +---------------------------------------------------+
                                          |
                        Port dinamis (process.env.PORT)
                                          v
                +---------------------------------------------------+
                |             SIMASPRAS Root Runner                 |
                |                  (server.js)                      |
                +---------------------------------------------------+
                                          |
                                          v
                +---------------------------------------------------+
                |         Next.js 14 Standalone Engine              |
                |          (.next/standalone/server.js)             |
                |  - SSR Pages (Katalog, Kalender, Form, Dasbor)    |
                |  - RESTful Route Handlers & Zod Validators        |
                |  - In-Memory Rate Limiter (Login Brute Force)     |
                |  - PDF BAST Engine (@react-pdf / PDFKit)          |
                +---------------------------------------------------+
                                          |
                                 Prisma ORM Client
                                          v
                +---------------------------------------------------+
                |             MySQL / MariaDB Database              |
                |               (db_peminjaman_sarpras)             |
                +---------------------------------------------------+
```

### Karakteristik Utama Rilis:
1. **Next.js Standalone Build**: Bundle produksi mandiri yang hanya menyertakan modul yang benar-benar digunakan, mengurangi jejak memori server secara drastis.
2. **Passenger Entry Point (`server.js`)**: Jembatan mulus antara Phusion Passenger di cPanel dan server standalone Next.js.
3. **Role-Based Access Control (RBAC) 9 Peran**: Pemisahan hak akses ketat antara Pemohon, Staf Bagian Umum, Kasubag Bagian Umum, Kepala Bagian Keuangan & Umum, dan Administrator.
4. **Audit Trail Keamanan**: Seluruh transaksi penting tercatat secara forensik di tabel `audit_log` (IP address, user, rekaman terdampak, timestamp).
5. **Skrip Otomasi Terjadwal (`scripts/cron-maintenance.js`)**: Pembersihan transaksi kadaluarsa dan pengingat pengembalian sarpras otomatis.

---

## 2. Persyaratan Lingkungan Server (cPanel)

Sebelum memulai konfigurasi, pastikan hosting cPanel memenuhi spesifikasi berikut:

| Komponen | Spesifikasi Minimum | Rekomendasi |
|---|---|---|
| **Node.js** | v18.17.0 LTS | v20.x LTS |
| **Database** | MySQL 8.0+ / MariaDB 10.5+ | MySQL 8.0+ |
| **cPanel Feature** | "Setup Node.js App" (CloudLinux LVE / Phusion Passenger) | Tersedia & Aktif |
| **Akses Terminal** | SSH Shell atau fitur "Terminal" cPanel | Diaktifkan oleh penyedia hosting |
| **RAM Alokasi** | 1024 MB (1 GB) | 2048 MB (2 GB) |
| **Kapasitas Disk** | 2 GB ruang kosong | 5 GB+ (untuk penyimpanan BAST PDF) |

---

## 3. Langkah-Langkah Deployment Awal di cPanel

### Langkah 3.1: Pembuatan Database MySQL di cPanel
1. Masuk ke cPanel, buka menu **MySQL® Databases**.
2. Buat database baru, misalnya: `poltekim_simaspras`.
3. Buat pengguna MySQL baru, misalnya: `poltekim_simasusr`, generate password yang kuat.
4. Hubungkan pengguna tersebut ke database baru dengan memilih opsi **ALL PRIVILEGES**.
5. Catat kredensial koneksi:
   ```
   DATABASE_URL="mysql://poltekim_simasusr:PasswordKuatAnda@localhost:3306/poltekim_simaspras"
   ```

### Langkah 3.2: Konfigurasi "Setup Node.js App" di cPanel
1. Buka menu **Setup Node.js App** di cPanel.
2. Klik tombol **Create Application**.
3. Isi parameter konfigurasi berikut:
   * **Node.js version**: Pilih `20.x` (atau `18.x`).
   * **Application mode**: `Production`
   * **Application root**: `simaspras` (folder relatif terhadap home direktori, misal `/home/username/simaspras`).
   * **Application URL**: Pilih domain/subdomain yang dituju (misal: `simaspras.poltekimipas.ac.id`).
   * **Application startup file**: `server.js`
4. Klik **Create**.
5. Salin baris perintah virtual environment yang muncul di bagian atas halaman (misal: `source /home/username/nodevenv/simaspras/20/bin/activate && cd /home/username/simaspras`).

### Langkah 3.3: Unggah Berkas & Konfigurasi `.env`
1. Unggah seluruh berkas proyek ke direktori `/home/username/simaspras` (bisa melalui Git, FTP, atau File Manager cPanel).
2. Di dalam folder `simaspras`, buat berkas `.env` dengan format:
   ```env
   # Koneksi Database MySQL cPanel
   DATABASE_URL="mysql://poltekim_simasusr:PasswordKuatAnda@localhost:3306/poltekim_simaspras"

   # Secret Key untuk Enkripsi Token JWT & Autentikasi
   JWT_SECRET="ganti_dengan_string_acak_64_karakter_sangat_rahasia"

   # Lingkungan & URL Publik Aplikasi
   NODE_ENV="production"
   PORT="3000"
   NEXT_PUBLIC_APP_URL="https://simaspras.poltekimipas.ac.id"

   # Secret Token untuk Eksekusi Cron Jobs Pemeliharaan
   CRON_SECRET="ganti_dengan_token_cron_rahasia_2026"
   ```

### Langkah 3.4: Eksekusi Skrip Deployment Terotomasi (`deploy.sh`)
Buka menu **Terminal** di cPanel, kemudian jalankan:
```bash
# 1. Masuk ke direktori aplikasi
cd /home/username/simaspras

# 2. Aktifkan virtual environment Node.js cPanel
source /home/username/nodevenv/simaspras/20/bin/activate

# 3. Jalankan skrip deployment terotomasi
./deploy.sh
```

Skrip `deploy.sh` akan secara otomatis melakukan:
1. Validasi Node.js & berkas `.env`.
2. Instalasi dependensi (`npm install`).
3. Sinkronisasi skema Prisma ke database MySQL (`prisma db push` / `prisma migrate deploy`).
4. Kompilasi Next.js Standalone (`npm run build`).
5. Menyalin folder `public` dan `.next/static` ke direktori `.next/standalone/`.
6. Membuat sinyal reload Phusion Passenger (`tmp/restart.txt`).

### Langkah 3.5: Inisialisasi Data Master & Akun Default (Seeding)
Jika database masih kosong dan ingin memasukkan data awal akun (Administrator, Kasubag, Staf, Mahasiswa/Taruna) dan fasilitas contoh:
```bash
npx tsx prisma/seed.ts
```

Akun bawaan sistem hasil seeding:
* **Administrator**: `admin@poltekimipas.ac.id` / `Admin@2026`
* **Kasubag Bagian Umum**: `kasubag@poltekimipas.ac.id` / `Kasubag@2026`
* **Staf Bagian Umum**: `staf@poltekimipas.ac.id` / `Staf@2026`
* **Kepala Bagian**: `kabag@poltekimipas.ac.id` / `Kabag@2026`
* **Dosen Pemohon**: `dosen@poltekimipas.ac.id` / `Dosen@2026`
* **Taruna Pemohon**: `taruna@poltekimipas.ac.id` / `Taruna@2026`

> [!WARNING]
> Segera ubah password seluruh akun default setelah sistem pertama kali daring melalui menu profil masing-masing.

---

## 4. Pengaturan Pemeliharaan Otomatis (cPanel Cron Jobs)

SIMASPRAS menyediakan skrip pemeliharaan mandiri untuk membatalkan pengajuan kadaluarsa, menyortir transaksi, dan menyiapkan pengingat H-1.

Buka menu **Cron Jobs** di cPanel:

### Opsi A: Eksekusi Skrip Node CLI (Rekomendasi)
* **Waktu Eksekusi**: Setiap 1 jam (`0 * * * *`)
* **Perintah**:
  ```bash
  /usr/local/bin/node /home/username/simaspras/scripts/cron-maintenance.js >> /home/username/simaspras/logs/cron.log 2>&1
  ```
  *(Pastikan folder `/home/username/simaspras/logs` telah dibuat sebelumnya)*.

### Opsi B: Panggilan Web Hook HTTP
Jika hosting membatasi akses node pada cron CLI:
* **Waktu Eksekusi**: Setiap hari pukul 01:00 dini hari (`0 1 * * *`)
* **Perintah**:
  ```bash
  curl -s -H "Authorization: Bearer ganti_dengan_token_cron_rahasia_2026" https://simaspras.poltekimipas.ac.id/api/cron/maintenance > /dev/null 2>&1
  ```

---

## 5. Prosedur Restart & Zero-Downtime Reload

Phusion Passenger pada cPanel memonitor berkas penanda `tmp/restart.txt`. Anda tidak perlu mematikan seluruh server hosting untuk memperbarui kode:

1. **Melalui Baris Perintah (Terminal / SSH)**:
   ```bash
   cd /home/username/simaspras
   mkdir -p tmp
   touch tmp/restart.txt
   ```
   Passenger akan mendeteksi perubahan mtime pada `restart.txt` dan memulai proses pekerja Node.js baru secara mulus (*graceful restart*).

2. **Melalui Antarmuka cPanel**:
   * Buka **Setup Node.js App**.
   * Klik tombol **Restart** pada aplikasi `simaspras`.

---

## 6. Prosedur Backup & Pemulihan (Disaster Recovery)

### 6.1. Backup Database Terjadwal
Buat cron job harian pada pukul 02:00 dini hari untuk menyimpan dump database:
```bash
0 2 * * * mysqldump -u poltekim_simasusr -p'PasswordKuatAnda' poltekim_simaspras | gzip > /home/username/backups/db_simaspras_$(date +\%F).sql.gz
```

### 6.2. Prosedur Pemulihan Database (Restore)
Jika terjadi insiden data:
```bash
gunzip < /home/username/backups/db_simaspras_YYYY-MM-DD.sql.gz | mysql -u poltekim_simasusr -p'PasswordKuatAnda' poltekim_simaspras
```

---

## 7. Panduan Pemecahan Masalah (Troubleshooting)

### 1. Error 503 / "Application failed to start"
* **Penyebab**: Node.js gagal mengeksekusi `server.js` atau port terbentur.
* **Solusi**: Periksa log error Passenger di folder aplikasi:
  ```bash
  cat /home/username/simaspras/stderr.log
  ```
  Pastikan `.next/standalone/server.js` ada. Jika belum, jalankan `./deploy.sh`.

### 2. Error Prisma: "Can't reach database server"
* **Penyebab**: MySQL host tidak dapat dihubungi atau kredensial salah.
* **Solusi**: Periksa koneksi lokal di `.env`. Pada cPanel shared hosting, gunakan `127.0.0.1:3306` atau `localhost:3306`.

### 3. Font PDFKit BAST Gagal Dimuat di Standalone Mode
* **Penyebab**: File font bawaan PDFKit tidak tersalin ke tracing standalone Next.js.
* **Solusi**: Konfigurasi `next.config.mjs` telah dilengkapi blok `outputFileTracingIncludes` untuk `./node_modules/pdfkit/js/standard-fonts/**/*`. Pastikan build menggunakan skrip `./deploy.sh`.

### 4. Tombol atau Tampilan Aset Tidak Memiliki CSS / Hilang Style
* **Penyebab**: Folder `.next/static` belum disalin ke direktori `.next/standalone/.next/static`.
* **Solusi**: Skrip `./deploy.sh` langkah 5 menangani penyalinan ini secara otomatis. Jalankan kembali `./deploy.sh`.

---

## 8. Kontak Bantuan & Eskalasi

Unit Pengelola Sarana & Prasarana Kampus Poltekimipas:
* **Bagian Umum BPSDM Imipas**: Gedung Utama Lantai 2, Bagian Sarana dan Prasarana
* **Alamat**: Jl. Satria - Sudirman, RT.001/RW.014, Tanah Tinggi, Kec. Tangerang, Kota Tangerang, Banten 15119
* **Dukungan Teknis IT**: Unit Teknologi Informasi Kampus Poltekimipas
