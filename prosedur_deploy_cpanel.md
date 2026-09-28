# PROSEDUR STANDAR OPERASIONAL (SOP) DEPLOYMENT CPANEL
## Sistem Informasi Manajemen Sarana dan Prasarana (SIMASPRAS V2)
### Politeknik Imigrasi dan Pemasyarakatan Indonesia (Poltekimipas)

Dokumen ini merupakan panduan praktis dan teruji bagi pengembang (*developer*) dan administrator IT untuk menerapkan pembaruan kode dari lingkungan lokal (*local development*) ke lingkungan produksi (*cPanel Phusion Passenger*) secara cepat, aman, dan efisien tanpa mengalami kendala batas memori/proses (*spawn EAGAIN*).

---

## 1. Prinsip Utama Alur Deployment

> [!IMPORTANT]
> **Prinsip Dasar:**
> * Kompilasi produksi (`next build`) **selalu dilakukan di lingkungan Lokal**.
> * Server cPanel **hanya bertugas menjalankan (*serve runtime*)** bundle standalone yang sudah jadi melalui Phusion Passenger.
> * Hal ini menjamin proses update berlangsung dalam hitungan detik ($\approx 1$ menit) dan terbebas dari batasan proses CloudLinux (*NPROC / EAGAIN limit*).

```
+------------------------------------+          +------------------------------------+
|         LINGKUNGAN LOKAL           |          |        LINGKUNGAN CPANEL           |
|                                    |          |                                    |
| 1. Modifikasi Kode (UI / API / DB) |          |                                    |
| 2. Uji coba lokal (npm run dev)    |          |                                    |
| 3. Jalankan: npm run build:cpanel  |          |                                    |
|    - Prisma multi-platform         |          |                                    |
|    - Next.js Standalone Build      |          |                                    |
|    - Otomatis membuat .zip         |          |                                    |
+------------------------------------+          +------------------------------------+
                  |                                                ^
                  | Unggah Paket (via File Manager / FTP)          |
                  +------------------------------------------------+
                                                                   |
                                                +------------------------------------+
                                                | 1. Ekstrak Berkas Zip              |
                                                | 2. File .env tetap aman            |
                                                | 3. Restart Aplikasi di Node.js App |
                                                |    (Status: LIVE 🚀)               |
                                                +------------------------------------+
```

---

## 2. Alur Pembaruan Berdasarkan Skenario Perubahan

Pilihlah skenario yang sesuai dengan jenis perubahan yang Anda buat di lokal:

| Skenario | Jenis Perubahan | Berkas yang Diunggah | Estimasi Waktu |
|---|---|---|---|
| **Skenario A (Paling Sering - 90%)** | Perubahan Halaman, Komponen UI, Tampilan Mobile, Bugfix API Handler | `next_bundle.zip` | $\approx 1$ Menit |
| **Skenario B** | Penambahan/Perubahan Tabel & Kolom Database (`prisma/schema.prisma`) | `simaspras_v2-cpanel.zip` *(atau `next_bundle.zip` + `schema.prisma`)* | $\approx 2$ Menit |
| **Skenario C** | Penambahan Library/Paket Baru (`package.json` / `npm install`) | `simaspras_v2-cpanel.zip` | $\approx 2$ Menit |

---

## 3. Prosedur Skenario A: Update Rutin (Kode / UI / API Handler)

Gunakan prosedur ini untuk sebagian besar update sehari-hari (perubahan tampilan, fitur baru, perbaikan bug logika):

### Langkah 3.1: Di Komputer Lokal
1. Pastikan perubahan kode Anda sudah disimpan dan diuji di lokal.
2. Buka terminal proyek di lokal, lalu jalankan satu perintah otomatis:
   ```bash
   npm run build:cpanel
   ```
   *(Atau jalankan `./scripts/build-cpanel.sh`)*.
3. Skrip otomatis ini akan:
   - Membuat Prisma engine untuk seluruh platform (termasuk Debian/CloudLinux cPanel).
   - Mengompilasi Next.js Standalone.
   - Menghasilkan berkas rilis cepat: **`next_bundle.zip`** (ukuran $\approx 48$ MB).

### Langkah 3.2: Di cPanel File Manager
1. Buka **cPanel**, pilih menu **File Manager**.
2. Masuk ke folder aplikasi Anda: `/home/u6486240/simaspras`.
3. Pastikan opsi **Show Hidden Files (dotfiles)** telah dicentang *(ikon gerigi Settings di pojok kanan atas File Manager)*.
4. Hapus folder `.next` lama:
   - Klik kanan folder `.next`, pilih **Delete** *(centang opsi "Skip trash" untuk menghemat waktu)*.
5. Klik menu **Upload**, lalu unggah berkas **`next_bundle.zip`** dari komputer lokal Anda.
6. Klik kanan berkas `next_bundle.zip` yang baru diunggah, lalu pilih **Extract** ke folder `/home/u6486240/simaspras`.
7. Setelah ekstraksi selesai, hapus berkas `next_bundle.zip` untuk menjaga kebersihan kapasitas disk.

### Langkah 3.3: Di cPanel "Setup Node.js App"
1. Masuk ke menu **Setup Node.js App** di cPanel.
2. Temukan aplikasi `simaspras`, lalu klik ikon **Restart** (tombol putar).
3. Buka URL domain: `https://simaspras.poltekimipas.ac.id`. Perubahan langsung tampil aktif!

---

## 4. Prosedur Skenario B: Update dengan Perubahan Database (`schema.prisma`)

Gunakan prosedur ini jika Anda menambahkan tabel baru, relasi baru, atau kolom baru di `prisma/schema.prisma`:

### Langkah 4.1: Di Komputer Lokal
1. Lakukan perubahan pada `prisma/schema.prisma`.
2. Jalankan perintah pemaketan lengkap:
   ```bash
   npm run build:cpanel
   ```
   Skrip akan menghasilkan berkas rilis lengkap: **`simaspras_v2-cpanel.zip`**.

### Langkah 4.2: Di cPanel File Manager
1. Buka **File Manager**, masuk ke `/home/u6486240/simaspras`.
2. **PENTING:** Jangan hapus berkas `.env` Anda!
3. Hapus folder `.next` lama dan folder `src` lama (jika ingin bersih).
4. Unggah berkas **`simaspras_v2-cpanel.zip`**, lalu **Extract**.

### Langkah 4.3: Di Terminal cPanel
Buka menu **Terminal** di cPanel, lalu jalankan:
```bash
cd /home/u6486240/simaspras
source /home/u6486240/nodevenv/simaspras/20/bin/activate

# 1. Terapkan perubahan skema ke database MySQL cPanel
npx prisma db push --skip-generate

# 2. Sinkronkan biner query engine ke standalone
mkdir -p .next/standalone/node_modules/.prisma/client
cp -f node_modules/.prisma/client/*.so.node .next/standalone/node_modules/.prisma/client/ 2>/dev/null || true

# 3. Beri sinyal restart ke Passenger
touch tmp/restart.txt
```
Lalu klik **Restart** pada menu **Setup Node.js App** di cPanel.

---

## 5. Prosedur Skenario C: Update Dependensi Baru (`package.json`)

Gunakan prosedur ini jika Anda menambahkan dependensi baru menggunakan `npm install <nama-paket>`:

1. Di **Lokal**:
   Jalankan `npm run build:cpanel` untuk membuat paket `simaspras_v2-cpanel.zip`.
2. Di **cPanel File Manager**:
   Unggah dan ekstrak `simaspras_v2-cpanel.zip` ke `/home/u6486240/simaspras` *(pastikan berkas `.env` tidak tertimpa)*.
3. Di **Terminal cPanel**:
   Jalankan skrip deploy yang telah terotomasi:
   ```bash
   cd /home/u6486240/simaspras
   source /home/u6486240/nodevenv/simaspras/20/bin/activate
   ./deploy.sh
   ```
   Skrip `deploy.sh` akan menginstal dependensi baru via `npm install`, melewati proses kompilasi (*skip build*) karena bundle pre-built sudah ada, menyalin aset statis, dan merestart Passenger.
4. Klik **Restart** di **Setup Node.js App** cPanel.

---

## 6. Lembar Pintas Perintah Terminal cPanel (*Cheat Sheet*)

Jika Anda lebih memilih mengeksekusi langsung via baris perintah Terminal SSH / cPanel:

```bash
# Masuk ke folder proyek & aktifkan environment
cd /home/u6486240/simaspras
source /home/u6486240/nodevenv/simaspras/20/bin/activate

# Cek log error jika web mengalami kendala (misal 503)
cat stderr.log | tail -n 50

# Restart cepat aplikasi tanpa membuka browser cPanel
touch tmp/restart.txt

# Inisialisasi akun bawaan/data demo jika database kosong
npx tsx prisma/seed.ts
```

---

## 7. Praktik Terbaik & Tips Keamanan

1. **Jaga Berkas `.env` di cPanel:**  
   Berkas `.env` di server produksi menyimpan kredensial database `u6486240_simaspras_db` dan `JWT_SECRET`. Saat mengunggah paket pembaruan, pastikan berkas `.env` di cPanel tidak terhapus.
2. **Aktifkan Opsi "Show Hidden Files":**  
   Folder seperti `.next`, `.prisma`, dan berkas `.env` diawali dengan tanda titik (*dotfiles*). Pastikan fitur penampil file tersembunyi di File Manager cPanel selalu diaktifkan agar folder `.next` terlihat.
3. **Penyimpanan Log:**  
   Jika aplikasi mengalami kendala sewaktu-waktu, periksa berkas `stderr.log` di folder `/home/u6486240/simaspras` untuk melihat penyebab kegagalan secara presisi.
