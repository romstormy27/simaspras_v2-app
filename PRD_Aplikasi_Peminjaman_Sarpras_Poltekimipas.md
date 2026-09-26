# Product Requirements Document (PRD)
# Sistem Informasi Peminjaman Sarana dan Prasarana (SIMASPRAS)
## Politeknik Imigrasi dan Pemasyarakatan Indonesia (Poltekimipas)

| | |
|---|---|
| **Nama Dokumen** | PRD Sistem Informasi Peminjaman Sarana dan Prasarana Poltekimipas |
| **Versi** | 1.0 (Final Draft — siap pakai untuk pengembangan) |
| **Status** | Disempurnakan dari Rancangan Awal (Draft) |
| **Standar Acuan** | ISO/IEC/IEEE 29148:2018 (Requirements Engineering), Sommerville — *Software Engineering*, Wiegers & Beatty — *Software Requirements* |
| **Tech Stack Utama** | Next.js, TypeScript, Tailwind CSS, shadcn/ui, MySQL/MariaDB, Prisma ORM |
| **Target Hosting** | Shared Hosting berbasis cPanel dengan dukungan **Node.js Selector (Phusion Passenger)** |

> **Catatan penyusunan:** Dokumen ini adalah versi PRD siap-pakai dari draf rancangan awal ("Rancangan Aplikasi Peminjaman Sarpras pada Politeknik Imipas"). Seluruh substansi inti pada draf — 9 aktor, 10 *use case* (UC‑01 s/d UC‑10), struktur *class diagram*, 8 entitas ERD, skrip DDL, 10 *activity diagram*, 10 *sequence diagram*, dan 10 layout UI — **dipertahankan tanpa perubahan signifikan**. Penyempurnaan yang dilakukan bersifat pelengkap dokumen PRD standar: penambahan tujuan/ruang lingkup, kebutuhan non-fungsional, arsitektur & tech stack, rancangan API, kriteria penerimaan, strategi pengujian, dan roadmap rilis. Diagram visual (gambar) pada draf asli direpresentasikan ulang dalam notasi **Mermaid** agar dapat dirender langsung di dalam berkas Markdown ini. Bagian yang merupakan **tambahan baru** (bukan berasal dari draf) ditandai dengan label *"(Tambahan PRD)"*. Arsitektur, pemilihan basis data, dan strategi *deployment* pada §8 dan §9 telah disesuaikan agar aplikasi dapat dijalankan pada **shared hosting berbasis cPanel yang mendukung Node.js App (Phusion Passenger)** — lingkungan hosting yang direncanakan institusi — dengan tetap mempertahankan tech stack inti Next.js, Tailwind CSS, dan shadcn/ui.

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Latar Belakang dan Tujuan](#2-latar-belakang-dan-tujuan)
3. [Ruang Lingkup](#3-ruang-lingkup)
4. [Definisi, Akronim, dan Istilah](#4-definisi-akronim-dan-istilah)
5. [Aktor dan Peran Pengguna (RBAC)](#5-aktor-dan-peran-pengguna-rbac)
6. [Kebutuhan Fungsional — Spesifikasi Use Case](#6-kebutuhan-fungsional--spesifikasi-use-case)
7. [Kebutuhan Non-Fungsional](#7-kebutuhan-non-fungsional)
8. [Arsitektur Sistem dan Tech Stack](#8-arsitektur-sistem-dan-tech-stack)
9. [Model Data](#9-model-data)
10. [Diagram Aktivitas (Activity Diagram)](#10-diagram-aktivitas-activity-diagram)
11. [Diagram Sekuens (Sequence Diagram)](#11-diagram-sekuens-sequence-diagram)
12. [Rancangan API](#12-rancangan-api)
13. [Rancangan Antarmuka Pengguna (UI/UX)](#13-rancangan-antarmuka-pengguna-uiux)
14. [Notifikasi dan Komunikasi](#14-notifikasi-dan-komunikasi)
15. [Kriteria Penerimaan (Acceptance Criteria)](#15-kriteria-penerimaan-acceptance-criteria)
16. [Strategi Pengujian](#16-strategi-pengujian)
17. [Roadmap dan Fase Pengembangan](#17-roadmap-dan-fase-pengembangan)
18. [Risiko dan Mitigasi](#18-risiko-dan-mitigasi)
19. [Asumsi dan Ketergantungan](#19-asumsi-dan-ketergantungan)
20. [Lampiran](#20-lampiran)

---

## 1. Ringkasan Eksekutif

Poltekimipas saat ini mengelola peminjaman sarana dan prasarana (ruangan, mobil operasional, dan perangkat kerja) secara manual/berbasis kertas, sehingga rawan bentrok jadwal, lambat dalam proses persetujuan, sulit dipantau oleh pimpinan, dan tidak meninggalkan jejak audit yang memadai.

**SIMASPRAS** adalah aplikasi web *full paperless* yang mendigitalisasi seluruh siklus peminjaman sarpras — mulai dari pengajuan, verifikasi jadwal & fisik, persetujuan berjenjang, penerbitan tiket digital/QR, hingga serah-terima pengembalian melalui **Berita Acara Serah Terima (BAST) Digital** — serta menyediakan **dashboard monitoring eksekutif** *real-time* bagi pimpinan.

Aplikasi dibangun di atas **Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui** sebagai fondasi antarmuka, dipadukan dengan **MySQL/MariaDB + Prisma ORM**, **Auth.js (RBAC)**, serta layanan pendukung (QR, PDF generator, email, penyimpanan berkas) agar aplikasi berjalan **profesional, stabil, aman, dan mudah digunakan** oleh 9 peran pengguna yang berbeda — dengan seluruh pilihan teknologi disesuaikan agar kompatibel dijalankan di atas **shared hosting berbasis cPanel dengan Node.js App Selector (Phusion Passenger)**, sesuai rencana hosting institusi.

---

## 2. Latar Belakang dan Tujuan

### 2.1 Latar Belakang

Berdasarkan analisis kebutuhan sistem operasional kampus, proses peminjaman sarpras Poltekimipas melibatkan banyak pemangku kepentingan (internal dan eksternal) dengan alur persetujuan berjenjang yang saat ini dilakukan manual. Hal ini menimbulkan beberapa masalah utama:

- Tidak ada visibilitas jadwal ketersediaan aset secara *real-time*, sehingga rawan bentrok jadwal.
- Proses pengajuan dan persetujuan berbasis kertas memperlambat layanan dan sulit dilacak.
- Verifikasi fisik dan serah-terima kembali tidak terdokumentasi secara sistemik.
- Pimpinan (Kepala Bagian Keuangan dan Umum) tidak memiliki dasbor pemantauan pemanfaatan aset untuk evaluasi dan perencanaan anggaran.
- Tidak ada *audit trail* yang memadai atas siapa melakukan apa dan kapan.

### 2.2 Tujuan

1. Mendigitalisasi 100% proses pengajuan, persetujuan, verifikasi, dan serah-terima peminjaman sarpras (*paperless*).
2. Mencegah bentrok jadwal melalui kalender ketersediaan *real-time* dan penguncian slot otomatis.
3. Menyediakan alur persetujuan berjenjang yang jelas (Kasubag Umum sebagai *approver* utama, Staf Bagian Umum sebagai verifikator teknis).
4. Menerbitkan dokumen resmi digital (Tiket/Kode QR, BAST Digital) yang sah tanpa proses manual.
5. Menyediakan dashboard monitoring eksekutif dan laporan rekapitulasi bagi Kepala Bagian Keuangan dan Umum untuk kebutuhan evaluasi dan penganggaran.
6. Menjamin keamanan akses melalui *Role-Based Access Control* (RBAC) dan *audit trail* menyeluruh.
7. Menghadirkan aplikasi yang stabil, cepat, dan mudah digunakan oleh seluruh peran pengguna kampus maupun eksternal.

### 2.3 Manfaat

| Bagi | Manfaat |
|---|---|
| Pemohon (Dosen, Taruna, BPSDM, Kementerian, Alumni) | Pengajuan mandiri kapan saja, transparansi status, tiket digital instan |
| Kasubag Umum | Dasbor persetujuan terpusat, keputusan lebih cepat dan terdokumentasi |
| Staf Bagian Umum | Alur kerja verifikasi & inspeksi yang terstruktur dan tercatat |
| Administrator | Kontrol penuh atas master data, RBAC, dan keamanan sistem |
| Kepala Bagian Keuangan dan Umum | Data okupansi aset *real-time* untuk evaluasi dan pengambilan keputusan |
| Institusi | Efisiensi operasional, jejak audit lengkap, citra digital yang profesional |

---

## 3. Ruang Lingkup

### 3.1 Dalam Lingkup (In-Scope) — sesuai draf rancangan

- Modul autentikasi, registrasi mandiri dengan aktivasi oleh Administrator, dan RBAC untuk 9 peran (Kabag Keuangan & Umum, Kasubag Umum, Staf Bagian Umum, Administrator, Dosen, Taruna, BPSDM, Kementerian, Alumni).
- Katalog dan kalender ketersediaan *real-time* untuk 3 kategori sarpras: Ruangan, Mobil Operasional, Perangkat Kerja.
- Pengajuan peminjaman digital *paperless* dengan Pakta Integritas digital.
- Pembatalan peminjaman mandiri oleh pemohon (tanpa denda finansial).
- Persetujuan/penolakan oleh Kasubag Umum dengan penerbitan Tiket Digital/Kode QR.
- Verifikasi jadwal dan inspeksi fisik oleh Staf Bagian Umum (pra-*approval* dan pasca-pengembalian).
- Konfirmasi serah-terima pengembalian melalui BAST Digital (tanpa denda finansial).
- Dashboard monitoring eksekutif dan ekspor Laporan Eksekutif (PDF/Excel) bagi Kabag Keuangan & Umum.
- Pengelolaan master data sarpras (CRUD + status *Maintenance*) oleh Administrator.
- Pengelolaan pengguna, konfigurasi RBAC, dan pemantauan *audit trail* oleh Administrator.

### 3.2 Di Luar Lingkup untuk Versi 1.0 *(Tambahan PRD — untuk kejelasan batasan proyek)*

- Pembayaran/denda finansial atas keterlambatan atau kerusakan barang (draf secara eksplisit menyatakan *tanpa pengenaan denda finansial*; mekanisme denda dapat menjadi fase lanjutan bila kebijakan institusi berubah).
- Aplikasi mobile native (Android/iOS). V1 berfokus pada web responsif (mobile-first web).
- Integrasi *Single Sign-On* (SSO) dengan sistem kepegawaian/SIMPEG Kementerian (dicatat sebagai kandidat integrasi di roadmap, lihat §17).
- Modul pemeliharaan/inventaris aset tingkat lanjut (jadwal servis berkala, riwayat perbaikan mendetail) — saat ini hanya status *Maintenance* sederhana sesuai draf.
- Integrasi pembayaran/e-katalog pengadaan.

### 3.3 Pengguna Sasaran

9 peran aktor sebagaimana dirinci pada Bagian 5, mencakup pengguna internal kampus dan pemohon eksternal (BPSDM, Kementerian, Alumni).

---

## 4. Definisi, Akronim, dan Istilah

| Istilah | Definisi |
|---|---|
| **Sarpras** | Sarana dan Prasarana (Ruangan, Mobil Operasional, Perangkat Kerja) |
| **BAST Digital** | Berita Acara Serah Terima Digital — dokumen resmi elektronik konfirmasi pengembalian aset |
| **RBAC** | *Role-Based Access Control* — kontrol akses berbasis peran pengguna |
| **Paperless** | Proses tanpa dokumen fisik, seluruhnya melalui sistem digital |
| **Pending Approval Kasubag** | Status transaksi menunggu keputusan Kasubag Umum |
| **Reserved** | Status slot jadwal terkunci sementara saat transaksi diajukan |
| **QR Signature** | Tanda tangan digital berbasis kode QR sebagai bukti keabsahan dokumen |
| **Audit Trail** | Rekam jejak aktivitas pengguna pada sistem untuk kebutuhan keamanan/audit |
| **BMN** | Barang Milik Negara — kode inventaris aset instansi pemerintah |
| **SLA** | *Service Level Agreement* — target tingkat layanan sistem *(Tambahan PRD)* |

---

## 5. Aktor dan Peran Pengguna (RBAC)

Berdasarkan analisis kebutuhan sistem operasional kampus, sistem memiliki **9 aktor** yang dikelompokkan ke dalam 5 kategori peran:

### 5.1 Matriks Aktor dan Tanggung Jawab

| # | Aktor | Kategori | Tanggung Jawab Utama |
|---|---|---|---|
| 1 | **Kepala Bagian Keuangan dan Umum** | Monitoring Eksekutif | Memantau seluruh pemanfaatan sarpras secara *real-time* melalui Dashboard Monitoring; mengunduh/mencetak Laporan Eksekutif untuk evaluasi manajemen dan penganggaran operasional. |
| 2 | **Kasubag Umum** | Approver Utama & BAST Digital | Meninjau dan memutuskan Persetujuan/Penolakan atas permohonan digital; memberikan Pernyataan Resmi & Konfirmasi Serah Terima Pengembalian melalui BAST Digital setelah verifikasi fisik oleh Staf Bagian Umum. |
| 3 | **Staf Bagian Umum** | Verifikator Fisik & Jadwal | Verifikator teknis ketersediaan fisik dan jadwal; inspeksi fisik lapangan saat serah-terima/pengembalian dan mengunggah catatan kondisi barang. |
| 4 | **Administrator** | Pengelola Fondasi Data & Sistem | Mengelola master data Ruangan, Mobil Operasional, dan Perangkat Kerja; mengonfigurasi RBAC dan memantau *audit trail*. |
| 5 | **Dosen** | Pemohon Internal | Mengajukan peminjaman fasilitas untuk perkuliahan, penelitian, atau pengabdian masyarakat. |
| 6 | **Taruna** | Pemohon Internal | Mengajukan peminjaman fasilitas untuk operasional kegiatan kemahasiswaan atau latihan akademik. |
| 7 | **BPSDM** | Pemohon Eksternal | Badan Pengembangan Sumber Daya Manusia untuk diklat/kegiatan kedinasan. |
| 8 | **Kementerian** | Pemohon Eksternal | Instansi kementerian eksternal untuk agenda resmi pemerintah. |
| 9 | **Alumni** | Pemohon Eksternal | Ikatan alumni untuk simposium atau kegiatan kealumnian. |

### 5.2 Matriks Hak Akses (RBAC) *(Tambahan PRD — turunan dari 9 aktor & 10 use case di atas)*

| Modul / Fitur | Pemohon (Dosen/Taruna/BPSDM/Kementerian/Alumni) | Staf Bagian Umum | Kasubag Umum | Kabag Keuangan & Umum | Administrator |
|---|:---:|:---:|:---:|:---:|:---:|
| Login & Registrasi | ✅ | ✅ | ✅ | ✅ | ✅ |
| Katalog & Kalender Ketersediaan | ✅ (baca) | ✅ (baca) | ✅ (baca) | ✅ (baca) | ✅ (kelola) |
| Ajukan/Batalkan Peminjaman | ✅ | ❌ | ❌ | ❌ | ❌ |
| Verifikasi Jadwal & Fisik | ❌ | ✅ | ✅ (baca) | ❌ | ✅ (baca) |
| Approval/Reject Peminjaman | ❌ | ❌ | ✅ | ❌ | ❌ |
| Konfirmasi BAST Digital | ❌ | ❌ | ✅ | ❌ | ❌ |
| Dashboard Eksekutif & Laporan | ❌ | ❌ | ✅ (baca) | ✅ | ✅ (baca) |
| Kelola Master Data Sarpras | ❌ | ❌ | ❌ | ❌ | ✅ |
| Kelola Pengguna, Role & Audit Trail | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 6. Kebutuhan Fungsional — Spesifikasi Use Case

### 6.1 Daftar Use Case

| ID | Nama Use Case | Aktor Utama |
|---|---|---|
| UC-01 | Login, Registrasi & Autentikasi Sistem (Gateway Entry Point) | Seluruh 9 Aktor |
| UC-02 | Cek Ketersediaan & Katalog Sarpras | Pemohon Sarpras |
| UC-03 | Pengajuan Peminjaman Digital (Full Paperless) | Dosen, Taruna, BPSDM, Kementerian, Alumni |
| UC-04 | Pembatalan Peminjaman Mandiri | Dosen, Taruna, BPSDM, Kementerian, Alumni |
| UC-05 | Persetujuan / Approval Peminjaman Sarpras | Kasubag Umum |
| UC-06 | Verifikasi Fisik & Jadwal Sarpras | Staf Bagian Umum |
| UC-07 | Konfirmasi Serah Terima Pengembalian Sarpras (BAST Digital) | Kasubag Umum |
| UC-08 | Monitoring Dashboard & Laporan Eksekutif | Kepala Bagian Keuangan dan Umum |
| UC-09 | Kelola Master Data Sarpras | Administrator |
| UC-10 | Kelola Pengguna, Role & Audit Trail | Administrator |

---

### UC-01 — Login & Autentikasi (Gateway Entry Point)

- **ID Use Case**: UC-01
- **Aktor**: Seluruh 9 Aktor (Kabag Keuangan & Umum, Kasubag Umum, Staf Bagian Umum, Administrator, Dosen, Taruna, BPSDM, Kementerian, Alumni).
- **Deskripsi**: Pintu masuk utama (*gateway*) untuk mengautentikasi kredensial pengguna sebelum mengizinkan akses ke fungsi aplikasi.
- **Precondition**: Pengguna membuka aplikasi peminjaman sarpras politeknik.
- **Postcondition**: Sesi autentikasi terverifikasi aktif dan pengguna diarahkan ke dasbor utama sesuai peran hak aksesnya (RBAC).

**Skenario Utama (Main Flow):**
1. Pengguna membuka aplikasi dan mengakses halaman login.
2. Pengguna menginput *Username/Email* dan *Password*.
3. Pengguna bisa registrasi dengan persetujuan administrator untuk aktivasi akun.
4. Sistem memvalidasi kredensial pengguna ke basis data.
5. Sistem membuka hak akses sesuai *role* pengguna dan menampilkan dasbor utama.

**Skenario Alternatif & Pengecualian:**
- Kredensial salah → sistem menampilkan pesan *"Username/Password Salah"*.
- Akun belum diaktivasi Admin → sistem menampilkan pesan *"Akun Anda Belum Diaktifkan oleh Administrator"* dan alur kembali ke halaman login.

---

### UC-02 — Cek Ketersediaan & Katalog Sarpras

- **ID Use Case**: UC-02
- **Aktor Utama**: Pemohon Sarpras (Dosen, Taruna, BPSDM, Kementerian, Alumni).
- **Deskripsi**: Pencarian, peninjauan katalog spesifikasi, dan pengecekan kalender ketersediaan *real-time* sarpras (Ruangan, Mobil Operasional, Perangkat Kerja). *(Detail dilengkapkan dari alur Activity Diagram & Sequence Diagram SD-02 pada draf.)*
- **Precondition**: Pemohon telah terautentikasi (UC-01).
- **Postcondition**: Pemohon memperoleh ID sarpras dan tanggal terpilih untuk diteruskan ke UC-03.

**Skenario Utama (Main Flow):**
1. Pemohon mengakses menu Katalog & Jadwal Sarpras.
2. Sistem menampilkan kategori fasilitas: Ruangan, Mobil Operasional, Perangkat Kerja.
3. Pemohon memilih kategori dan filter pencarian (tanggal, jam, kapasitas/spesifikasi).
4. Sistem mengambil data master aset dan data jadwal transaksi dari basis data.
5. Sistem menampilkan daftar sarpras beserta spesifikasi fisik dan Kalender Ketersediaan *Real-Time* (status: *Tersedia / Reserved / In Use / Maintenance*).
6. Pemohon memilih unit sarpras yang tersedia dan menekan **Lanjutkan Peminjaman**.
7. Sistem meneruskan ID sarpras dan tanggal terpilih ke formulir pengajuan digital (UC-03).

**Skenario Alternatif & Pengecualian:**
- Jadwal penuh/disesuaikan → pemohon mengubah filter tanggal atau memilih unit alternatif, alur kembali ke langkah 3.

---

### UC-03 — Pengajuan Peminjaman Digital (Full Paperless)

- **ID Use Case**: UC-03
- **Nama Use Case**: Pengajuan Peminjaman Digital Sarpras (Ruangan, Mobil, Perangkat)
- **Aktor Utama**: Dosen, Taruna, BPSDM, Kementerian, Alumni (*via Pemohon Sarpras*).
- **Aktor Pendukung**: Kasubag Umum, Staf Bagian Umum.
- **Deskripsi**: Prosedur pengajuan peminjaman fasilitas secara mandiri dan *100% paperless* melalui formulir digital terintegrasi tanpa berkas fisik.
- **Precondition**: Pemohon telah terautentikasi melalui UC-01 dan sarpras berstatus *Tersedia*.
- **Postcondition**: Permohonan tersimpan dengan status *Pending Approval Kasubag*, dan slot jadwal pada kalender sistem terkunci sementara (*reserved*).

**Skenario Utama (Main Flow):**
1. Pemohon memilih kategori sarpras: Ruangan (Aula/Laboratorium), Mobil Operasional (Bus/HiAce), atau Perangkat Kerja (Proyektor/Sound System/Laptop).
2. Sistem menampilkan data spesifikasi fisik dan kalender ketersediaan sarpras secara *real-time* (UC-02).
3. Pemohon mengisi formulir digital: Tanggal & Jam Peminjaman, Maksud Kegiatan Operasional, serta Jumlah Unit.
4. Pemohon menyetujui Pakta Integritas Peminjaman Digital (*paperless*) pada aplikasi.
5. Pemohon menekan tombol **Kirim Pengajuan**.
6. Sistem mengunci slot jadwal secara otomatis dan mengubah status transaksi menjadi **Pending Approval Kasubag**.
7. Sistem mengirim notifikasi *alert* pengajuan baru ke dasbor Kasubag Umum dan Staf Bagian Umum.

**Skenario Alternatif & Pengecualian:**
- **2a. Bentrok Jadwal**: Jika waktu yang dipilih telah terisi oleh transaksi lain, sistem menolak formulir, menampilkan pesan *"Jadwal Bentrok"*, dan menyarankan pilihan sarpras sejenis yang masih kosong.

---

### UC-04 — Pembatalan Peminjaman Mandiri

- **ID Use Case**: UC-04
- **Aktor Utama**: Dosen, Taruna, BPSDM, Kementerian, Alumni (*via Pemohon Sarpras*).
- **Deskripsi**: Pembatalan permohonan secara mandiri oleh pemohon sebelum kegiatan berlangsung.
- **Precondition**: Transaksi berstatus *Pending Approval* atau *Disetujui* (sebelum jadwal peminjaman berjalan).
- **Postcondition**: Status transaksi berubah menjadi *Dibatalkan*, dan slot jadwal pada kalender sistem dilepas secara otomatis.

**Skenario Utama (Main Flow):**
1. Pemohon membuka menu Riwayat Peminjaman Saya.
2. Sistem menampilkan transaksi aktif (*Pending Approval*/*Disetujui*).
3. Pemohon memilih transaksi dan menekan **Batalkan Peminjaman**, lalu mengisi alasan pembatalan.
4. Sistem memperbarui status menjadi **Dibatalkan** dan melepaskan kuncian slot jadwal secara otomatis.
5. Sistem mengirim notifikasi ke Pemohon, Kasubag Umum, dan Staf Bagian Umum.

**Skenario Alternatif & Pengecualian:**
- Jadwal sudah berjalan/lewat → sistem menolak pembatalan dan menampilkan pesan *"Peminjaman Sedang Berjalan"*.

---

### UC-05 — Persetujuan / Approval Peminjaman Sarpras

- **ID Use Case**: UC-05
- **Aktor Utama**: Kasubag Umum.
- **Aktor Pendukung**: Staf Bagian Umum, Pemohon.
- **Deskripsi**: Tinjauan kewenangan dan pengambilan keputusan oleh Kasubag Umum atas permohonan digital yang masuk.
- **Precondition**: Permohonan berstatus *Pending Approval Kasubag*.
- **Postcondition**: Status permohonan berubah menjadi *Disetujui* (menerbitkan Tiket Digital/Kode QR) atau *Ditolak*.

**Skenario Utama (Main Flow):**
1. Kasubag Umum mengakses dasbor persetujuan pada aplikasi.
2. Kasubag Umum memeriksa rincian permohonan (identitas pemohon, urgensi agenda, alokasi ruang/kendaraan/alat, serta catatan verifikasi jadwal dari Staf Bagian Umum UC-06).
3. Kasubag Umum memilih opsi **Disetujui (Approve)** dan membubuhkan persetujuan digital.
4. Sistem memperbarui status transaksi menjadi **Disetujui**.
5. Sistem menerbitkan **Tiket Digital Peminjaman / Kode QR Pengambilan** ke akun pemohon dan meneruskan tugas penyiapan ke Staf Bagian Umum.

**Skenario Alternatif & Pengecualian:**
- **3a. Penolakan Permohonan**: Kasubag Umum memilih opsi **Tolak (Reject)** dan memasukkan alasan penolakan (misal: fasilitas digunakan untuk agenda mendadak Pimpinan Politeknik). Sistem mengubah status menjadi **Ditolak**, membebaskan kuncian jadwal di kalender, dan mengirim notifikasi ke pemohon.

---

### UC-06 — Verifikasi Fisik & Jadwal Sarpras (Staf Bagian Umum)

- **ID Use Case**: UC-06
- **Aktor Utama**: Staf Bagian Umum.
- **Aktor Pendukung**: Kasubag Umum.
- **Deskripsi**: Verifikator teknis ketersediaan fisik dan jadwal sarpras, meliputi pengecekan kesiapan unit pra-*approval* maupun inspeksi fisik pasca-pengembalian. *(Detail dilengkapkan dari alur Activity Diagram & Sequence Diagram SD-06 pada draf.)*
- **Precondition**: Terdapat tugas verifikasi (pra-*approval* atau pasca-pengembalian) pada dasbor Staf Bagian Umum.
- **Postcondition**: Catatan verifikasi tersimpan dan diteruskan sebagai rekomendasi ke Kasubag Umum untuk UC-05 atau UC-07.

**Skenario Utama (Main Flow):**
1. Staf Bagian Umum membuka menu Verifikasi & Inspeksi Sarpras.
2. Sistem menampilkan daftar tugas verifikasi (Verifikasi Kelayakan Pra-*Approval* atau Inspeksi Fisik Pasca-Pengembalian).
3. Staf memilih ID Transaksi dan melakukan verifikasi teknis: pra-*approval* (kesiapan unit & tidak ada bentrok jadwal fisik) atau pasca-pengembalian (kelengkapan/kondisi barang).
4. Staf menginput hasil pemeriksaan fisik dan catatan verifikasi pada formulir digital sistem.
5. Sistem mengevaluasi hasil inspeksi dan menyimpan status kondisi: **Kondisi Baik/Layak/Sesuai** atau **Ada Catatan Fisik Khusus**.
6. Staf mengunggah dan menyimpan laporan verifikasi digital pada aplikasi.
7. Sistem meneruskan rekomendasi ke dasbor Kasubag Umum untuk alur persetujuan (UC-05) atau penandatanganan BAST Digital (UC-07).

---

### UC-07 — Konfirmasi Serah Terima Pengembalian Sarpras (BAST Digital)

- **ID Use Case**: UC-07
- **Aktor Utama**: Kasubag Umum.
- **Aktor Pendukung**: Staf Bagian Umum, Pemohon.
- **Deskripsi**: Pernyataan resmi oleh Kasubag Umum bahwa barang/fasilitas yang dipinjam telah selesai digunakan dan diserahterimakan kembali secara sah ke Bagian Umum setelah pemeriksaan fisik oleh Staf Bagian Umum, **tanpa pengenaan denda finansial**.
- **Precondition**: Masa peminjaman selesai dan Staf Bagian Umum telah menginput hasil verifikasi kondisi fisik barang ke sistem (UC-06).
- **Postcondition**: Status permohonan berubah menjadi *Selesai & Diserahterimakan Kembali*, dan sarpras berstatus *Tersedia*.

**Skenario Utama (Main Flow):**
1. Peminjam mengembalikan barang/kunci kendaraan/ruangan ke Bagian Umum.
2. Staf Bagian Umum melakukan inspeksi lapangan dan mengunggah laporan hasil verifikasi fisik barang ke aplikasi (UC-06).
3. Kasubag Umum meninjau laporan hasil inspeksi Staf Umum pada dasbor aplikasi.
4. Kasubag Umum menekan tombol **"Konfirmasi Serah Terima Pengembalian"** sebagai pernyataan resmi barang telah diterima kembali dalam kondisi sesuai.
5. Sistem menerbitkan **Berita Acara Serah Terima (BAST) Digital Pengembalian** yang terkonfirmasi secara sistemik (*paperless*).
6. Sistem memperbarui status transaksi menjadi **Selesai** dan mengembalikan status ketersediaan sarpras menjadi **Tersedia**.

---

### UC-08 — Monitoring Dashboard & Laporan Eksekutif

- **ID Use Case**: UC-08
- **Aktor Utama**: Kepala Bagian Keuangan dan Umum.
- **Deskripsi**: Penyediaan dasbor pemantauan *real-time* dan pembuatan laporan rekapitulasi penggunaan sarpras politeknik.
- **Precondition**: Kepala Bagian Keuangan dan Umum telah terautentikasi melalui UC-01.
- **Postcondition**: Laporan eksekutif grafik penggunaan sarpras dan tingkat pemanfaatan aset berhasil ditampilkan/diunduh.

**Skenario Utama (Main Flow):**
1. Kepala Bagian Keuangan dan Umum membuka menu Dashboard Monitoring Eksekutif.
2. Sistem menampilkan ringkasan visual *real-time*: persentase okupansi ruangan, tingkat penggunaan mobil operasional, dan status peminjaman perangkat.
3. Kepala Bagian Keuangan dan Umum menentukan filter periode (Bulanan/Semesteran/Tahunan) dan kategori pemohon (Internal/Eksternal).
4. Sistem menyajikan grafik rekapitulasi serta opsi **Cetak / Ekspor Laporan Eksekutif Digital** (PDF/Excel).

---

### UC-09 — Kelola Master Data Sarpras (Administrator)

- **ID Use Case**: UC-09
- **Aktor Utama**: Administrator.
- **Deskripsi**: Administrator mengelola data master Ruangan, Mobil Operasional, dan Perangkat Kerja (tambah, edit spesifikasi, hapus, atau atur status *Maintenance*).

**Skenario Utama (Main Flow):**
1. Administrator membuka menu "Kelola Master Data Sarpras".
2. Sistem menampilkan daftar lengkap master data aset beserta status operasionalnya (*Tersedia, Maintenance, Rusak, Non-Aktif*).
3. Administrator memilih operasi: **Tambah Sarpras Baru**, **Edit Data/Status**, atau **Hapus Sarpras**.
   - *Tambah*: mengisi form master data (Kategori, Nama Sarpras, Spesifikasi Teknik, Jumlah Unit, Lokasi/Plat Nomor) → sistem memvalidasi keunikan kode aset dan menyimpan.
   - *Edit*: mengubah spesifikasi atau status menjadi *Maintenance/Perbaikan* → sistem mengunci sementara aset dari katalog peminjaman (UC-02).
   - *Hapus*: sistem memeriksa keterikatan transaksi aktif — jika ada, aset diubah menjadi **Non-Aktif (Soft Delete)**; jika tidak ada, data dihapus permanen.
4. Sistem memperbarui tampilan daftar master data dan menampilkan notifikasi sukses.

---

### UC-10 — Kelola Pengguna, Role & Audit Trail (Administrator)

- **ID Use Case**: UC-10
- **Aktor Utama**: Administrator.
- **Deskripsi**: Administrator memverifikasi pendaftaran akun eksternal, mengelola kewenangan hak akses (RBAC), serta memantau log keamanan sistem agar operasional berjalan lancar.

**Skenario Utama (Main Flow):**
1. Administrator membuka menu "Kelola Pengguna, Role & Audit Trail" — dasbor menampilkan 3 tab utama: **Pending Aktivasi**, **Daftar User & Role**, dan **Log Audit Trail**.
2. Administrator memilih poin manajemen:
   - *Approval Aktivasi User*: meninjau berkas pendaftaran calon pengguna (NIP/NIM, Institusi, Kategori Peran) → **Setujui** (status Aktif + email notifikasi) atau **Tolak** (status Ditolak + email alasan).
   - *Konfigurasi Role RBAC*: memilih akun pengguna dan memperbarui matriks kewenangan hak akses (*role*).
   - *Pantau Audit Trail*: menentukan filter tanggal/aktor dan meninjau rekam jejak aktivitas login, perubahan data, serta transaksi sistem; tersedia opsi **Ekspor Log Audit Trail** (CSV/PDF).
3. Sistem memperbarui status data dan menampilkan konfirmasi sukses pemrosesan administrasi.

---

## 7. Kebutuhan Non-Fungsional
*(Tambahan PRD — melengkapi draf awal yang berfokus pada kebutuhan fungsional)*

| Kategori | Kebutuhan |
|---|---|
| **Kinerja** | Waktu muat halaman utama < 2 detik (P75, koneksi 4G); respons API kritikal (cek jadwal, submit pengajuan) < 500 ms pada beban normal. |
| **Ketersediaan** | Target uptime 99.5% di luar jendela pemeliharaan terjadwal; *health-check* endpoint untuk pemantauan. |
| **Skalabilitas** | Arsitektur *stateless* pada layer aplikasi agar dapat *horizontal scale*; agregasi dashboard dioptimasi dengan indeks & caching agar tetap responsif seiring pertumbuhan data transaksi. |
| **Keamanan** | Kata sandi di-*hash* (bcrypt/Argon2), sesi aman (HttpOnly, Secure cookie), proteksi CSRF, validasi input di sisi server untuk seluruh *mutation*, RBAC ditegakkan di *middleware* & API layer, audit trail untuk setiap aksi pengubahan status. |
| **Keandalan Data** | Operasi penguncian slot jadwal (*reserved*) bersifat atomik/transaksional untuk mencegah *race condition* saat dua pemohon mengajukan jadwal yang sama secara bersamaan. |
| **Usability** | Antarmuka konsisten berbasis *design system* shadcn/ui, alur maksimal 3–4 langkah untuk aksi utama (ajukan, setujui, verifikasi), responsif di desktop, tablet, dan mobile web. |
| **Aksesibilitas** | Mengikuti panduan WCAG 2.1 level AA (kontras warna, navigasi keyboard, label ARIA pada komponen interaktif). |
| **Kompatibilitas Peramban** | Mendukung Chrome, Edge, Firefox, Safari versi 2 rilis terakhir. |
| **Lokalisasi** | Antarmuka berbahasa Indonesia sebagai bahasa utama; format tanggal/waktu mengikuti zona waktu Indonesia (WIB). |
| **Maintainability** | Kode TypeScript *strict mode*, penamaan konsisten, komponen UI reusable (shadcn/ui), dokumentasi API, *linting* & *formatting* otomatis (ESLint, Prettier). |
| **Observability** | Pencatatan *error* terpusat, *log* aktivitas sistem tersimpan di tabel `audit_log`, pemantauan performa dan *uptime*. |
| **Kepatuhan Data** | Data sensitif (kata sandi, token) tidak pernah disimpan dalam bentuk teks polos; kebijakan retensi *audit log* mengikuti ketentuan institusi. |

---

## 8. Arsitektur Sistem dan Tech Stack

### 8.1 Prinsip Desain

Tech stack dipilih agar aplikasi **profesional, stabil, dan mudah digunakan**, dengan pendekatan *full-stack TypeScript* di atas Next.js sehingga tipe data konsisten dari database hingga antarmuka, mengurangi bug integrasi, serta mempercepat pengembangan dan pemeliharaan jangka panjang oleh tim IT kampus. Karena rencana hosting institusi adalah **shared hosting berbasis cPanel dengan fitur Node.js App Selector (Phusion Passenger)**, seluruh pilihan pada bagian ini secara khusus disaring agar **berjalan sebagai satu proses Node.js standar** (tanpa fungsi serverless/edge, tanpa *headless browser*, tanpa ketergantungan wajib pada layanan cloud eksternal berbayar), sehingga tetap dapat di-*deploy* penuh di lingkungan shared hosting tanpa mengorbankan stabilitas maupun profesionalitas aplikasi.

### 8.2 Gambaran Arsitektur (High-Level — disesuaikan untuk cPanel Node.js App)

```mermaid
flowchart TB
    subgraph Client["Klien (Browser / Mobile Web)"]
        UI["Next.js App Router UI<br/>Tailwind CSS + shadcn/ui"]
    end

    subgraph CPanel["cPanel Shared Hosting — Node.js App (Passenger)"]
        ENTRY["server.js<br/>(Passenger entry point)"]
        RSC["React Server Components<br/>& Server Actions"]
        API["Route Handlers (REST API)<br/>/app/api/*"]
        MW["Middleware: Auth & RBAC Guard"]
        VAL["Validasi: Zod Schema<br/>(shared client-server)"]
        CRON["cPanel Cron Jobs<br/>(memanggil script Node terjadwal)"]
    end

    subgraph Services["Layanan Pendukung (berjalan in-process)"]
        AUTH["Auth.js (NextAuth)<br/>Session/JWT + RBAC"]
        QR["QR Code Generator"]
        PDF["PDF Generator<br/>(@react-pdf/renderer)"]
        XLS["Excel Exporter"]
        MAIL["Email Service<br/>(SMTP Email Account cPanel)"]
    end

    subgraph Data["Lapisan Data (dalam akun cPanel yang sama)"]
        PRISMA["Prisma ORM"]
        MYSQL[("MySQL / MariaDB<br/>(cPanel MySQL Databases)")]
        FS[("Penyimpanan Berkas Lokal<br/>Filesystem Akun Hosting")]
    end

    subgraph Obs["Observability"]
        SENTRY["Sentry (opsional, via API eksternal)"]
        LOGS["Audit Log Table"]
    end

    UI -->|HTTPS via AutoSSL| ENTRY
    ENTRY --> RSC
    ENTRY --> API
    UI -->|fetch/TanStack Query| API
    RSC --> MW
    API --> MW
    MW --> VAL
    VAL --> PRISMA
    MW --> AUTH
    API --> QR
    API --> PDF
    API --> XLS
    API --> MAIL
    CRON --> API
    PRISMA --> MYSQL
    API --> FS
    API --> LOGS
    CPanel -.opsional.-> SENTRY
```

> **Catatan arsitektur:** Karena shared hosting cPanel menjalankan aplikasi sebagai **satu proses Node.js tunggal per akun** (dikelola Passenger, dengan jumlah proses/CPU/RAM terbatas sesuai paket hosting), Route Handlers, Server Components, dan tugas terjadwal (cron) berjalan **dalam proses yang sama** — bukan layanan serverless terpisah seperti pada platform *cloud-native* (mis. Vercel). Hal ini konsisten dengan kebutuhan §7 (Non-Fungsional) namun perlu diperhitungkan pada estimasi kapasitas beban (lihat §8.6 dan §18).

### 8.3 Frontend Stack

| Komponen | Pilihan Teknologi | Alasan |
|---|---|---|
| Framework | **Next.js 14+ (App Router)**, TypeScript (strict) | Sesuai permintaan; mendukung Server Components, Server Actions, dan *routing* modern yang stabil. |
| Styling | **Tailwind CSS** | Sesuai permintaan; utility-first, konsisten, dan efisien untuk *design system*. |
| Komponen UI | **shadcn/ui** (berbasis Radix UI + Tailwind) | Sesuai permintaan; komponen *accessible*, dapat dikustomisasi penuh, dan tidak mengunci ke satu *design vendor*. |
| Formulir & Validasi | **React Hook Form + Zod** | Validasi formulir performan dengan skema yang dapat dipakai bersama (*shared*) antara client & server (mis. validasi pengajuan peminjaman, master data). |
| Data Fetching / Cache | **TanStack Query** | Sinkronisasi data *real-time* kalender ketersediaan, status pengajuan, dan dasbor tanpa *full reload*. |
| Tabel Data | **TanStack Table** | Untuk tabel riwayat peminjaman, master data, dan log audit dengan *sorting/filtering/pagination*. |
| Grafik | **Recharts** | Visualisasi Dashboard Monitoring Eksekutif (okupansi, tren penggunaan). |
| Kalender | **react-day-picker / FullCalendar** | Menyajikan kalender ketersediaan *real-time* sarpras. |
| State Ringan | **Zustand** (opsional) | Untuk state UI lintas komponen (mis. filter dashboard) tanpa *boilerplate* berlebih. |
| Tema | **next-themes** | Mode terang/gelap demi kenyamanan pengguna. |

### 8.4 Backend & Layanan

| Komponen | Pilihan Teknologi | Alasan |
|---|---|---|
| API Layer | **Next.js Route Handlers** (REST) di `/app/api/**` | Berjalan sebagai bagian dari satu proses Node.js standar (`next start`), sesuai model eksekusi cPanel Node.js App — tidak memerlukan fungsi serverless/edge terpisah. |
| ORM & Migrasi | **Prisma ORM** | Skema tipe-aman, migrasi terkelola, memetakan langsung ke struktur tabel pada §9.3–9.5 draf awal. |
| Basis Data | **MySQL 8.0+ / MariaDB 10.5+** | Sesuai layanan basis data standar yang tersedia di paket **shared hosting cPanel** ("MySQL Databases"/phpMyAdmin); selaras 1:1 dengan dialek SQL DDL pada draf rancangan awal (§9.7), sehingga tidak memerlukan RDBMS eksternal tambahan. Mesin tabel **InnoDB** dipertahankan untuk transaksi ACID (kuncian slot jadwal). |
| Autentikasi | **Auth.js (NextAuth v5)** — Credentials Provider, sesi JWT, *middleware* RBAC | Mendukung alur Login/Registrasi/Aktivasi Admin (UC-01) dan RBAC 9 peran (UC-10); tidak memerlukan layanan Auth eksternal berbayar. |
| Hash Password | **bcrypt / Argon2** | Sesuai spesifikasi `password_hash` pada draf. |
| Validasi Server | **Zod** | Validasi seluruh *payload* mutation (pengajuan, approval, master data) sebelum menyentuh database. |
| QR Code | **`qrcode` (npm)** | Pure-JavaScript, tidak memerlukan *native binary* — aman dijalankan pada shared hosting; menerbitkan Kode QR Tiket Digital (UC-05) dan QR Signature BAST (UC-07). |
| PDF Generator | **`@react-pdf/renderer`** (utama) | Menghasilkan dokumen BAST Digital dan Laporan Eksekutif berformat PDF **tanpa *headless browser***. *Puppeteer/Chromium sengaja tidak dipakai* karena umumnya **tidak didukung** pada shared hosting cPanel (keterbatasan resource, proses anak, dan dependensi sistem yang biasanya diblokir penyedia hosting). |
| Ekspor Excel | **`exceljs`** | Pure-JavaScript; ekspor Laporan Eksekutif format Excel (UC-08) dan Log Audit Trail (UC-10). |
| Penyimpanan Berkas | **Filesystem lokal akun hosting** (folder di luar `public_html`, mis. `~/app-storage/`) untuk lampiran pengajuan, PDF BAST, dan Laporan Eksekutif hasil *generate* | Cocok untuk skala kampus dan sesuai keterbatasan shared hosting (umumnya tanpa layanan *object storage* S3 bawaan). Berkas diakses melalui *route handler* terproteksi RBAC, bukan tautan publik langsung. **Opsi peningkatan (opsional):** bila kuota disk mendekati batas paket hosting, arsipkan dokumen lama ke layanan S3-compatible eksternal (mis. Cloudflare R2) sebagai *object storage* tambahan — lihat §17 kandidat fase lanjutan. |
| Email | **SMTP Email Account cPanel** via **Nodemailer** | Memanfaatkan akun email institusi yang sudah tersedia di paket hosting (mis. `noreply@poltekimipas.ac.id`) — tidak memerlukan langganan layanan email transaksional pihak ketiga. Notifikasi aktivasi akun, hasil approval/reject, pengingat, dan penerbitan dokumen (lihat §14). |
| Cache & Rate Limit | **In-memory cache sederhana** (mis. `lru-cache`) di dalam proses Node, ditambah *rate limiting* berbasis tabel/`Map` untuk percobaan login | Menghindari ketergantungan pada layanan Redis eksternal yang umumnya tidak tersedia sebagai *add-on* cPanel standar. **Opsi peningkatan (opsional):** jika institusi berlangganan **Upstash Redis** (REST API berbasis HTTPS, tidak memerlukan koneksi *socket* persisten sehingga kompatibel dengan lingkungan shared hosting yang membatasi koneksi keluar), dapat diaktifkan untuk mempercepat agregasi dashboard eksekutif pada skala pengguna yang lebih besar. |
| Penjadwal Tugas | **cPanel Cron Jobs** memanggil skrip Node.js (mis. `node scripts/reminder.js`) atau endpoint API internal terproteksi *token* rahasia | Menggantikan *scheduler* berbasis platform cloud; digunakan untuk pengingat pengembalian dan pembersihan slot *reserved* kedaluwarsa (lihat §8.6). |

### 8.5 Keamanan Aplikasi

- **RBAC** ditegakkan berlapis: *middleware* Next.js (proteksi rute) + pemeriksaan peran pada setiap *handler* API (proteksi data).
- **Audit Trail otomatis**: setiap aksi pengubah status (login, approve/reject, edit master data, perubahan role) dicatat ke tabel `audit_log` melalui *hook* Prisma middleware, selaras dengan UC-10.
- **Proteksi endpoint sensitif**: *rate limiting* pada login & registrasi untuk mencegah *brute force*; validasi Zod pada seluruh *input* mencegah *injection*.
- **Sesi aman**: cookie `HttpOnly`, `Secure`, `SameSite=Lax`; token kedaluwarsa otomatis.
- **Enkripsi transport**: HTTPS wajib di seluruh lingkungan (produksi & staging), diaktifkan melalui **AutoSSL (Let's Encrypt)** bawaan cPanel.
- **Proteksi folder penyimpanan berkas**: folder penyimpanan lampiran/PDF ditempatkan **di luar `public_html`** (atau dilindungi `.htaccess`/`deny from all` bila terpaksa berada di dalamnya) agar tidak dapat diakses langsung tanpa melalui *route handler* yang menegakkan RBAC.
- **Prinsip Least Privilege**: akun Administrator hanya digunakan untuk administrasi sistem, bukan operasional harian; kredensial database cPanel dibuat khusus per aplikasi (bukan akun cPanel utama).

### 8.6 Infrastruktur & Deployment (Shared Hosting cPanel)

| Aspek | Rekomendasi |
|---|---|
| Hosting Aplikasi | **Shared Hosting cPanel dengan fitur "Setup Node.js App"** (Phusion Passenger). Next.js dijalankan melalui *custom entry file* (`server.js`) yang didaftarkan sebagai *Application Startup File* pada panel Node.js Selector, dengan output build Next.js mode **`standalone`** (`next.config.js` → `output: 'standalone'`) agar direktori yang di-*deploy* minimal dan efisien untuk kuota hosting. |
| Versi Node.js | Dipilih melalui **Node.js Selector** cPanel — gunakan versi **Node.js 20 LTS** (atau versi tertinggi yang tersedia ≥ 18) yang didukung paket hosting, selaras dengan kebutuhan Next.js 14+. |
| Basis Data | **MySQL Database** dibuat melalui menu **"MySQL® Databases"** di cPanel (nama database, user, dan *privileges* dibuat terpisah per aplikasi); koneksi Prisma menggunakan *connection string* `mysql://user:pass@localhost:3306/nama_db` (umumnya melalui `localhost`/*unix socket* karena aplikasi & database berjalan di server yang sama). |
| Proses Instalasi Dependensi | Dijalankan melalui tombol **"Run NPM Install"** pada panel Node.js Selector (setara `npm install --production`), atau via terminal SSH/Terminal bawaan cPanel jika tersedia. |
| Migrasi Basis Data | `npx prisma migrate deploy` dijalankan manual (via SSH/Terminal cPanel) setiap rilis skema baru — bukan otomatis pada *build* seperti platform *serverless*. |
| Build & Restart Aplikasi | `npm run build` dijalankan di server (via SSH/Terminal), lalu Passenger di-*restart* dengan menyentuh berkas `tmp/restart.txt` (mekanisme standar Passenger) atau tombol **"Restart"** pada panel Node.js Selector. |
| Alur Deployment | **Git Version Control** bawaan cPanel (*pull* dari repositori Git institusi/GitHub) — atau unggah manual via File Manager/FTP sebagai alternatif — dilanjutkan langkah *install → build → migrate → restart* di atas. Direkomendasikan dibungkus sebagai satu skrip *deploy* (`deploy.sh`) agar konsisten setiap rilis. |
| CI/CD | **GitHub Actions**: *lint → typecheck → unit test → build* dijalankan otomatis pada setiap *pull request*/`merge` ke `main` sebagai *quality gate*; langkah *deploy* ke cPanel dipicu melalui **SSH Deploy Action** (menjalankan `deploy.sh` di atas) bila institusi mengizinkan akses SSH pada paket hosting, atau dilakukan manual oleh Unit IT bila SSH tidak tersedia. |
| Manajemen Rahasia | Variabel lingkungan diatur melalui panel **"Environment Variables"** pada Node.js Selector cPanel, atau berkas `.env` di luar `public_html` dengan izin akses terbatas — tidak pernah dikomit ke repositori. |
| Domain & TLS | Subdomain resmi institusi (mis. `sarpras.poltekimipas.ac.id`) diarahkan ke aplikasi Node.js melalui *Application URL* pada Node.js Selector; sertifikat TLS diterbitkan otomatis melalui **AutoSSL** bawaan cPanel. |
| Backup & DR | Memanfaatkan fitur **cPanel Backup Wizard**/*Jetbackup* (bila tersedia dari penyedia hosting) untuk *backup* basis data & berkas terjadwal; ditambah `mysqldump` terjadwal via **Cron Jobs** sebagai lapisan cadangan kedua, disimpan di luar server (mis. diunduh berkala ke penyimpanan institusi). |
| Keterbatasan & Mitigasi Kapasitas | Shared hosting umumnya membatasi jumlah proses, CPU, dan memori per akun (*resource limits*, bukan *auto-scaling*). Aplikasi dioptimalkan agar ringan (mode `standalone`, tanpa Puppeteer/Redis wajib) sesuai §8.4; bila kebutuhan beban meningkat signifikan di masa depan, tersedia **jalur migrasi** ke VPS/*cloud hosting* tanpa perubahan besar pada kode aplikasi (lihat §18 Risiko). |

### 8.7 Observability & Kualitas

- **Sentry** (opsional) untuk pelacakan *error* frontend & backend secara *real-time* — diaktifkan sebagai panggilan API keluar (HTTPS) bila kebijakan hosting mengizinkan koneksi keluar; tidak wajib untuk rilis awal.
- **Log aplikasi**: keluaran `console`/*logger* Node.js diarahkan ke berkas log yang dapat ditinjau melalui **File Manager** atau **Terminal** cPanel (mis. `logs/app.log`), dilengkapi rotasi berkas log sederhana agar tidak membebani kuota disk.
- **Testing otomatis**: Vitest + React Testing Library (unit/komponen), Playwright (E2E alur kritikal: login, pengajuan, approval, BAST) — dijalankan di lingkungan CI (GitHub Actions), bukan di server hosting produksi.
- **Code quality gate**: ESLint, Prettier, `tsc --noEmit` dijalankan pada setiap *pull request* melalui CI.

---

## 9. Model Data

### 9.1 Class Diagram

Class Diagram ini terbagi menjadi 4 kelompok kelas utama (*class packages/domains*), dipertahankan sesuai draf rancangan awal.

```mermaid
classDiagram
    class User {
        -id_user: String [PK]
        -nama_lengkap: String
        -email: String
        -password_hash: String
        -no_hp: String
        -status_aktivasi: Enum "Pending|Aktif|Ditolak"
        -role: EnumRBAC
        +login() Boolean
        +logout() Void
        +updateProfile() Void
    }
    class Pemohon {
        -nomor_identitas: String
        -instansi_kategori: Enum "Dosen|Taruna|BPSDM|Kementerian|Alumni"
        +registrasiAkun() Void
        +ajukanPeminjaman() Void
        +batalkanPeminjaman() Void
    }
    class Administrator {
        +approveAktivasi() Void
        +kelolaMasterSarpras() Void
        +kelolaRoleRBAC() Void
    }
    class KasubagUmum {
        +reviewPengajuan() Void
        +approvePeminjaman() Void
        +konfirmasiBAST() Void
    }
    class StafBagianUmum {
        +verifikasiJadwal() Void
        +inputInspeksiFisik() Void
    }
    User <|-- Pemohon
    User <|-- Administrator
    User <|-- KasubagUmum
    User <|-- StafBagianUmum

    class Sarpras {
        <<abstract>>
        -id_sarpras: String [PK]
        -kode_aset: String
        -nama_sarpras: String
        -kategori: Enum "Ruangan|Mobil|Perangkat"
        -spesifikasi: Text
        -lokasi_plat: String
        -status_operasional: Enum "Tersedia|Maintenance|Rusak|Non-Aktif"
        +checkKetersediaan() Boolean
        +updateStatus() Void
        +setMaintenance() Void
    }
    class Ruangan {
        -kapasitas_orang: Integer
        -fasilitas_ruang: Text
    }
    class MobilOperasional {
        -plat_nomor: String
        -nama_driver: String
    }
    class PerangkatKerja {
        -jumlah_unit: Integer
        -nomor_seri: String
    }
    Sarpras <|-- Ruangan
    Sarpras <|-- MobilOperasional
    Sarpras <|-- PerangkatKerja

    class Peminjaman {
        -id_peminjaman: String [PK]
        -kode_transaksi: String
        -id_pemohon: String [FK]
        -id_sarpras: String [FK]
        -tgl_mulai: Date
        -tgl_selesai: Date
        -maksud_kegiatan: Text
        -status_transaksi: Enum
        +buatPengajuan() Void
        +batalkan() Void
        +setApprove() Void
        +setReject() Void
    }
    class TiketDigital {
        -id_tiket: String
        -kode_qr: String
        -status_tiket: Enum
        +generateQR() Image
    }
    class VerifikasiFisik {
        -id_verifikasi: String
        -id_staf: String
        -kondisi_fisik: Enum
        -catatan_inspeksi: Text
        +simpanInspeksi() Void
    }
    class BASTDigital {
        -id_bast: String
        -nomor_bast: String
        -tgl_serah_terima: Date
        -qr_signature: String
        +generateBAST() PDF
    }
    class AuditLog {
        -id_log: String
        -id_user: String
        -timestamp: DateTime
        -aktivitas: Text
        +catatLog() Void
    }
    class LaporanEksekutif {
        -id_laporan: String
        -periode_bulan: String
        -total_okupansi: Float
        +generateLaporan() File
    }

    Pemohon "1" --> "0..*" Peminjaman : mengajukan
    Sarpras "1" --> "0..*" Peminjaman : dipinjam pada
    KasubagUmum "1" --> "0..*" Peminjaman : menyetujui/menolak
    Peminjaman "1" --> "0..1" TiketDigital : menerbitkan
    StafBagianUmum "1" --> "0..*" VerifikasiFisik : melakukan
    Peminjaman "1" --> "0..1" BASTDigital : menghasilkan
```

**Relasi & Derajat Multiplisitas:**

1. **Generalisasi/Pewarisan**: Pemohon, Administrator, KasubagUmum, dan StafBagianUmum mewarisi properti dari `User`. Ruangan, MobilOperasional, dan PerangkatKerja mewarisi properti dari `Sarpras`.
2. **Asosiasi Transaksional**:
   - Pemohon → Peminjaman (1 ke 0..\*): satu pemohon dapat mengajukan banyak transaksi.
   - Sarpras → Peminjaman (1 ke 0..\*): satu unit sarpras dapat dipinjam dalam banyak transaksi (rentang waktu berbeda).
   - KasubagUmum → Peminjaman (1 ke 0..\*): Kasubag menyetujui/menolak transaksi.
   - Peminjaman → TiketDigital (1 ke 0..1): transaksi disetujui menerbitkan tepat 1 tiket QR digital.
   - StafBagianUmum → VerifikasiFisik (1 ke 0..\*): staf melakukan inspeksi kondisi fisik.
   - Peminjaman → BASTDigital (1 ke 0..1): transaksi selesai menghasilkan 1 dokumen BAST Digital resmi.

### 9.2 Entity Relationship Diagram (ERD)

Pemodelan skema basis data relasional disusun berdasarkan standar ISO/IEC/IEEE 29148, prinsip perancangan basis data relasional Sommerville, serta panduan spesifikasi kebutuhan Wiegers & Beatty. ERD memodelkan **8 entitas tabel utama**.

```mermaid
erDiagram
    USERS ||--o| PEMOHON_DETAIL : "1 : 0..1"
    USERS ||--o{ PEMINJAMAN : "sebagai pemohon (1 : 0..*)"
    USERS ||--o{ PEMINJAMAN : "sebagai approver (1 : 0..*)"
    USERS ||--o{ VERIFIKASI_FISIK : "sebagai staf (1 : 0..*)"
    USERS ||--o{ BAST_DIGITAL : "sebagai kasubag (1 : 0..*)"
    USERS ||--o{ AUDIT_LOG : "1 : 0..*"
    SARPRAS ||--o{ PEMINJAMAN : "1 : 0..*"
    PEMINJAMAN ||--o| TIKET_DIGITAL : "1 : 0..1"
    PEMINJAMAN ||--o{ VERIFIKASI_FISIK : "1 : 0..*"
    PEMINJAMAN ||--o| BAST_DIGITAL : "1 : 0..1"

    USERS {
        varchar36 id_user PK
        varchar100 nama_lengkap
        varchar100 email UK
        varchar255 password_hash
        varchar20 no_hp
        enum role
        enum status_aktivasi
        timestamp created_at
    }
    PEMOHON_DETAIL {
        varchar36 id_pemohon PK
        varchar36 id_user FK
        varchar50 nomor_identitas
        varchar100 instansi_kategori
    }
    SARPRAS {
        varchar36 id_sarpras PK
        varchar30 kode_aset UK
        varchar100 nama_sarpras
        enum kategori
        text spesifikasi
        varchar100 lokasi_plat
        enum status_operasional
    }
    PEMINJAMAN {
        varchar36 id_peminjaman PK
        varchar30 kode_transaksi UK
        varchar36 id_pemohon FK
        varchar36 id_sarpras FK
        varchar36 id_approver FK
        datetime tgl_mulai
        datetime tgl_selesai
        text maksud_kegiatan
        enum status_transaksi
        timestamp created_at
    }
    TIKET_DIGITAL {
        varchar36 id_tiket PK
        varchar36 id_peminjaman FK_UK
        varchar255 kode_qr UK
        enum status_tiket
    }
    VERIFIKASI_FISIK {
        varchar36 id_verifikasi PK
        varchar36 id_peminjaman FK
        varchar36 id_staf FK
        enum jenis_pemeriksaan
        enum kondisi_fisik
        text catatan_inspeksi
        timestamp created_at
    }
    BAST_DIGITAL {
        varchar36 id_bast PK
        varchar50 nomor_bast UK
        varchar36 id_peminjaman FK_UK
        varchar36 id_kasubag FK
        varchar255 qr_signature
        timestamp created_at
    }
    AUDIT_LOG {
        bigint id_log PK
        varchar36 id_user FK
        varchar255 aktivitas
        varchar45 ip_address
        timestamp timestamp
    }
```

**Kardinalitas & Relasi Antar-Tabel:**

1. USERS ke PEMOHON_DETAIL (1 : 0..1) — setiap *User* berperan pemohon memiliki tepat 0 atau 1 rincian detail profil tambahan.
2. USERS ke PEMINJAMAN (1 : 0..\*) — satu Pemohon dapat melakukan 0 atau banyak transaksi peminjaman.
3. SARPRAS ke PEMINJAMAN (1 : 0..\*) — satu unit Sarpras dapat dipinjam dalam 0 atau banyak transaksi pada rentang waktu berbeda.
4. PEMINJAMAN ke TIKET_DIGITAL (1 : 0..1) — transaksi yang disetujui secara eksklusif menerbitkan 0 atau 1 Tiket Digital QR.
5. PEMINJAMAN ke VERIFIKASI_FISIK (1 : 0..\*) — satu transaksi dapat melewati 0 atau beberapa kali proses inspeksi fisik.
6. PEMINJAMAN ke BAST_DIGITAL (1 : 0..1) — transaksi yang diselesaikan menghasilkan tepat 0 atau 1 BAST Digital resmi.
7. USERS ke AUDIT_LOG (1 : 0..\*) — satu User dapat menghasilkan 0 atau banyak catatan rekam jejak aktivitas.

### 9.3 Arsitektur Teknis dan Konvensi Basis Data

- **Tipe Basis Data**: Relational Database Management System (RDBMS) — **MySQL 8.0+ / MariaDB 10.5+**, sesuai layanan basis data standar pada shared hosting cPanel ("MySQL® Databases").
- **Enkoding Karakter**: UTF-8 (setara `utf8mb4`/`utf8mb4_unicode_ci` pada draf asli) untuk mendukung teks terstruktur dan karakter khusus.
- **Konvensi Penamaan**: nama tabel & kolom `snake_case` huruf kecil; setiap tabel memiliki *Primary Key* berawalan `id_`; *Foreign Key* memakai nama identik dengan *Primary Key* tabel acuan.

### 9.4 Kamus Data dan Spesifikasi Tabel Terperinci

#### A. Tabel `users`
Memodelkan entitas pengguna sistem untuk seluruh 9 peran (RBAC) beserta status persetujuan akun.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
|---|---|---|---|
| id_user | VARCHAR(36) | **PK**, NOT NULL | Identifier unik berupa UUID v4 |
| nama_lengkap | VARCHAR(100) | NOT NULL | Nama lengkap pengguna sesuai identitas |
| email | VARCHAR(100) | **UNIQUE**, NOT NULL | Alamat email resmi otentikasi login & notifikasi |
| password_hash | VARCHAR(255) | NOT NULL | Kata sandi terenkripsi (bcrypt/Argon2) |
| no_hp | VARCHAR(20) | NOT NULL | Nomor kontak WhatsApp/Telepon aktif |
| role | ENUM | NOT NULL | 'Dosen','Taruna','BPSDM','Kementerian','Alumni','Kabag','Kasubag','Staf','Admin' |
| status_aktivasi | ENUM | NOT NULL, DEFAULT 'Pending' | 'Pending','Aktif','Ditolak' |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now | Waktu registrasi akun |

#### B. Tabel `pemohon_detail`
Rincian profil tambahan pemohon internal maupun eksternal.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
|---|---|---|---|
| id_pemohon | VARCHAR(36) | **PK**, NOT NULL | Identifier unik profil pemohon |
| id_user | VARCHAR(36) | **FK, UNIQUE**, NOT NULL | Terhubung ke `users.id_user` (ON DELETE CASCADE) |
| nomor_identitas | VARCHAR(50) | NOT NULL | NIP / NIM / KTP / NIK |
| instansi_kategori | VARCHAR(100) | NOT NULL | Jurusan, Unit Kerja, atau Instansi Asal |

#### C. Tabel `sarpras`
Katalog master fasilitas dan peralatan politeknik.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
|---|---|---|---|
| id_sarpras | VARCHAR(36) | **PK**, NOT NULL | Identifier unik aset |
| kode_aset | VARCHAR(30) | **UNIQUE**, NOT NULL | Kode inventaris BMN/Politeknik |
| nama_sarpras | VARCHAR(100) | NOT NULL | Nama ruangan, kendaraan, atau alat |
| kategori | ENUM | NOT NULL | 'Ruangan','Mobil Operasional','Perangkat Kerja' |
| spesifikasi | TEXT | NULLABLE | Rincian kapasitas, fasilitas, atau spesifikasi mesin |
| lokasi_plat | VARCHAR(100) | NOT NULL | Gedung/Lantai atau Nomor Plat Kendaraan |
| status_operasional | ENUM | NOT NULL, DEFAULT 'Tersedia' | 'Tersedia','Maintenance','Rusak','Non-Aktif' |

#### D. Tabel `peminjaman`
Transaksi utama pengajuan, proses persetujuan, dan riwayat peminjaman.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
|---|---|---|---|
| id_peminjaman | VARCHAR(36) | **PK**, NOT NULL | Identifier transaksi |
| kode_transaksi | VARCHAR(30) | **UNIQUE**, NOT NULL | Nomor registrasi transaksi digital |
| id_pemohon | VARCHAR(36) | **FK**, NOT NULL | → `users.id_user` (RESTRICT) |
| id_sarpras | VARCHAR(36) | **FK**, NOT NULL | → `sarpras.id_sarpras` (RESTRICT) |
| id_approver | VARCHAR(36) | **FK**, NULLABLE | → `users.id_user` Kasubag Umum (SET NULL) |
| tgl_mulai / tgl_selesai | DATETIME | NOT NULL | Rentang waktu peminjaman |
| maksud_kegiatan | TEXT | NOT NULL | Tujuan/agenda penggunaan sarpras |
| status_transaksi | ENUM | NOT NULL, DEFAULT 'Pending' | 'Pending','Disetujui','Ditolak','Dibatalkan','Selesai' |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now | Waktu pengajuan dibuat |

#### E. Tabel `tiket_digital`
Tiket digital dan Kode QR penyiapan/pengambilan barang.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
|---|---|---|---|
| id_tiket | VARCHAR(36) | **PK**, NOT NULL | Identifier unik tiket digital |
| id_peminjaman | VARCHAR(36) | **FK, UNIQUE**, NOT NULL | → `peminjaman.id_peminjaman` (CASCADE) |
| kode_qr | VARCHAR(255) | **UNIQUE**, NOT NULL | String token terenkripsi Kode QR |
| status_tiket | ENUM | NOT NULL, DEFAULT 'Aktif' | 'Aktif','Digunakan','Kadaluarsa' |

#### F. Tabel `verifikasi_fisik`
Catatan pemeriksaan fisik dan jadwal oleh Staf Bagian Umum.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
|---|---|---|---|
| id_verifikasi | VARCHAR(36) | **PK**, NOT NULL | Identifier unik inspeksi |
| id_peminjaman | VARCHAR(36) | **FK**, NOT NULL | → `peminjaman.id_peminjaman` (CASCADE) |
| id_staf | VARCHAR(36) | **FK**, NOT NULL | → `users.id_user` (Staf Umum) |
| jenis_pemeriksaan | ENUM | NOT NULL | 'Pra-Approval','Pasca-Pengembalian' |
| kondisi_fisik | ENUM | NOT NULL | 'Baik/Sesuai','Ada Catatan Khusus' |
| catatan_inspeksi | TEXT | NULLABLE | Rincian hasil pemeriksaan fisik lapangan |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now | Waktu inspeksi dilakukan |

#### G. Tabel `bast_digital`
Dokumen resmi penyerahan dan pengembalian sarpras secara *paperless*.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
|---|---|---|---|
| id_bast | VARCHAR(36) | **PK**, NOT NULL | Identifier unik dokumen BAST |
| nomor_bast | VARCHAR(50) | **UNIQUE**, NOT NULL | Nomor surat resmi BAST |
| id_peminjaman | VARCHAR(36) | **FK, UNIQUE**, NOT NULL | → `peminjaman.id_peminjaman` (RESTRICT) |
| id_kasubag | VARCHAR(36) | **FK**, NOT NULL | → `users.id_user` (Kasubag Umum) |
| qr_signature | VARCHAR(255) | NOT NULL | Token tanda tangan digital resmi Kasubag Umum |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now | Waktu penandatanganan BAST |

#### H. Tabel `audit_log`
Rekam jejak aktivitas penting seluruh pengguna untuk keamanan data.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
|---|---|---|---|
| id_log | BIGINT | **PK**, AUTO_INCREMENT | Identifier urut rekam aktivitas |
| id_user | VARCHAR(36) | **FK**, NULLABLE | → `users.id_user` (SET NULL) |
| aktivitas | VARCHAR(255) | NOT NULL | Deskripsi aksi (Login, Approve, Registrasi, dsb.) |
| ip_address | VARCHAR(45) | NULLABLE | Alamat IP pengguna |
| timestamp | TIMESTAMP | NOT NULL, DEFAULT now | Waktu terjadinya aktivitas |

### 9.5 Strategi Pengindeksan

Untuk menjamin performa pencarian kalender ketersediaan *real-time* dan *query* eksekutif:

1. **idx_peminjaman_jadwal**: indeks komposit pada `peminjaman(id_sarpras, tgl_mulai, tgl_selesai, status_transaksi)` — mempercepat pengecekan bentrok jadwal (UC-02 & UC-03).
2. **idx_peminjaman_pemohon**: indeks pada `peminjaman(id_pemohon, status_transaksi)` — memuat daftar transaksi mandiri pemohon secara cepat (UC-04).
3. **idx_users_role_status**: indeks pada `users(role, status_aktivasi)` — mempercepat *query* dasbor approval Administrator (UC-10).
4. **idx_audit_log_timestamp**: indeks pada `audit_log(timestamp, id_user)` — mempercepat pencarian log audit trail (UC-10).

### 9.6 Keamanan dan Integritas Basis Data

1. **Integritas Referensial**: aturan `RESTRICT` pada transaksi utama (`peminjaman`, `bast_digital`) mencegah penghapusan data master aset (`sarpras`) atau pengguna (`users`) yang masih memiliki keterikatan transaksi aktif; `CASCADE` pada `pemohon_detail`, `tiket_digital`, dan `verifikasi_fisik` untuk pembersihan data anak secara otomatis.
2. **Perlindungan Data Sensitif**: kata sandi wajib dienkripsi menggunakan algoritma *hashing* aman (bcrypt/Argon2) sebelum disimpan di tabel `users`.
3. **Penyimpanan Transaksional (ACID)**: mesin basis data transaksional **InnoDB** pada MySQL/MariaDB memastikan operasi kuncian jadwal sementara (*reserved*) bersifat atomik dan aman dari *race condition*.

### 9.7 Skrip SQL DDL (MySQL 8.0+/MariaDB — implementasi utama, sesuai draf asli)

> Skrip berikut dipertahankan **sepenuhnya sesuai draf awal** sebagai struktur relasional resmi aplikasi. Karena tech stack final menggunakan **MySQL/MariaDB** (selaras dengan basis data yang tersedia pada shared hosting cPanel — lihat §8.4/§8.6), skrip DDL ini **langsung menjadi acuan implementasi**, bukan sekadar referensi lintas-RDBMS. Tim pengembang membuat **skema Prisma (`schema.prisma`)** dengan `provider = "mysql"` yang setara dengan struktur di bawah ini — lihat catatan pemetaan pada §9.8 — dan menjalankan migrasi Prisma terhadap database MySQL yang dibuat melalui menu "MySQL® Databases" di cPanel.

```sql
-- =============================================================================
-- SKRIP SQL DDL: SISTEM PEMINJAMAN SARANA DAN PRASARANA POLITEKNIK
-- Standar Acuan: ISO/IEC/IEEE 29148:2018 & Software Engineering (Sommerville)
-- Dialek SQL : MySQL 8.0+ / MariaDB 10.5+ (implementasi utama — sesuai basis data cPanel shared hosting)
-- Charset    : utf8mb4 / utf8mb4_unicode_ci
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `db_peminjaman_sarpras`
DEFAULT CHARACTER SET utf8mb4
DEFAULT COLLATE utf8mb4_unicode_ci;

USE `db_peminjaman_sarpras`;

-- Hapus tabel jika sudah ada (urut berdasarkan dependensi Foreign Key)
DROP TABLE IF EXISTS `audit_log`;
DROP TABLE IF EXISTS `bast_digital`;
DROP TABLE IF EXISTS `verifikasi_fisik`;
DROP TABLE IF EXISTS `tiket_digital`;
DROP TABLE IF EXISTS `peminjaman`;
DROP TABLE IF EXISTS `sarpras`;
DROP TABLE IF EXISTS `pemohon_detail`;
DROP TABLE IF EXISTS `users`;

-- =============================================================================
-- 1. TABEL USERS (Master Data Pengguna & RBAC)
-- =============================================================================
CREATE TABLE `users` (
  `id_user` VARCHAR(36) NOT NULL COMMENT 'Identifier Unik Pengguna (UUID v4)',
  `nama_lengkap` VARCHAR(100) NOT NULL COMMENT 'Nama Lengkap Resmi Pengguna',
  `email` VARCHAR(100) NOT NULL COMMENT 'Alamat Email Resmi (Login & Notifikasi)',
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'Password Terenkripsi (Bcrypt / Argon2)',
  `no_hp` VARCHAR(20) NOT NULL COMMENT 'Nomor Kontak WhatsApp / Telepon Aktif',
  `role` ENUM('Dosen', 'Taruna', 'BPSDM', 'Kementerian', 'Alumni', 'Kabag', 'Kasubag', 'Staf', 'Admin') NOT NULL COMMENT 'Peran RBAC Pengguna',
  `status_aktivasi` ENUM('Pending', 'Aktif', 'Ditolak') NOT NULL DEFAULT 'Pending' COMMENT 'Status Approval Registrasi Akun',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu Pendaftaran Akun',
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Master data pengguna dan peran akses RBAC';

-- =============================================================================
-- 2. TABEL PEMOHON_DETAIL (Rincian Identitas Pemohon)
-- =============================================================================
CREATE TABLE `pemohon_detail` (
  `id_pemohon` VARCHAR(36) NOT NULL COMMENT 'Identifier Unik Profil Pemohon',
  `id_user` VARCHAR(36) NOT NULL COMMENT 'Foreign Key ke USERS.id_user',
  `nomor_identitas` VARCHAR(50) NOT NULL COMMENT 'NIP / NIM / KTP / NIK Resmi',
  `instansi_kategori` VARCHAR(100) NOT NULL COMMENT 'Jurusan, Unit Kerja, atau Instansi Asal',
  PRIMARY KEY (`id_pemohon`),
  UNIQUE KEY `uk_pemohon_user` (`id_user`),
  CONSTRAINT `fk_pemohon_users`
    FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Detail identitas fisik pemohon internal/eksternal';

-- =============================================================================
-- 3. TABEL SARPRAS (Master Data Sarana dan Prasarana)
-- =============================================================================
CREATE TABLE `sarpras` (
  `id_sarpras` VARCHAR(36) NOT NULL COMMENT 'Identifier Unik Aset Sarpras',
  `kode_aset` VARCHAR(30) NOT NULL COMMENT 'Kode Inventaris BMN / Barang Politeknik',
  `nama_sarpras` VARCHAR(100) NOT NULL COMMENT 'Nama Resmi Ruangan, Kendaraan, atau Perangkat',
  `kategori` ENUM('Ruangan', 'Mobil Operasional', 'Perangkat Kerja') NOT NULL COMMENT 'Kelompok Kategori Sarpras',
  `spesifikasi` TEXT DEFAULT NULL COMMENT 'Deskripsi Fasilitas, Kapasitas, atau Mesin',
  `lokasi_plat` VARCHAR(100) NOT NULL COMMENT 'Gedung/Lantai atau Nomor Plat Kendaraan',
  `status_operasional` ENUM('Tersedia', 'Maintenance', 'Rusak', 'Non-Aktif') NOT NULL DEFAULT 'Tersedia' COMMENT 'Status Kelayakan Aset',
  PRIMARY KEY (`id_sarpras`),
  UNIQUE KEY `uk_sarpras_kode` (`kode_aset`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Master data inventaris sarana dan prasarana';

-- =============================================================================
-- 4. TABEL PEMINJAMAN (Tabel Transaksi Utama)
-- =============================================================================
CREATE TABLE `peminjaman` (
  `id_peminjaman` VARCHAR(36) NOT NULL COMMENT 'Identifier Unik Transaksi Peminjaman',
  `kode_transaksi` VARCHAR(30) NOT NULL COMMENT 'Nomor Registrasi Transaksi Digital',
  `id_pemohon` VARCHAR(36) NOT NULL COMMENT 'Foreign Key Pemohon (USERS.id_user)',
  `id_sarpras` VARCHAR(36) NOT NULL COMMENT 'Foreign Key Aset Sarpras (SARPRAS.id_sarpras)',
  `id_approver` VARCHAR(36) DEFAULT NULL COMMENT 'Foreign Key Kasubag Umum (USERS.id_user)',
  `tgl_mulai` DATETIME NOT NULL COMMENT 'Waktu Awal Peminjaman',
  `tgl_selesai` DATETIME NOT NULL COMMENT 'Waktu Selesai Peminjaman',
  `maksud_kegiatan` TEXT NOT NULL COMMENT 'Tujuan / Agenda Penggunaan Sarpras',
  `status_transaksi` ENUM('Pending', 'Disetujui', 'Ditolak', 'Dibatalkan', 'Selesai') NOT NULL DEFAULT 'Pending' COMMENT 'Status Transaksi Digital',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu Pengajuan Dibuat',
  PRIMARY KEY (`id_peminjaman`),
  UNIQUE KEY `uk_peminjaman_kode` (`kode_transaksi`),
  CONSTRAINT `fk_peminjaman_pemohon`
    FOREIGN KEY (`id_pemohon`) REFERENCES `users` (`id_user`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_peminjaman_sarpras`
    FOREIGN KEY (`id_sarpras`) REFERENCES `sarpras` (`id_sarpras`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_peminjaman_approver`
    FOREIGN KEY (`id_approver`) REFERENCES `users` (`id_user`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel transaksi peminjaman sarpras digital';

-- =============================================================================
-- 5. TABEL TIKET_DIGITAL (Pengambilan & Kode QR)
-- =============================================================================
CREATE TABLE `tiket_digital` (
  `id_tiket` VARCHAR(36) NOT NULL COMMENT 'Identifier Unik Tiket Digital',
  `id_peminjaman` VARCHAR(36) NOT NULL COMMENT 'Foreign Key Transaksi (PEMINJAMAN.id_peminjaman)',
  `kode_qr` VARCHAR(255) NOT NULL COMMENT 'String Token Terenkripsi Kode QR',
  `status_tiket` ENUM('Aktif', 'Digunakan', 'Kadaluarsa') NOT NULL DEFAULT 'Aktif' COMMENT 'Status Masa Berlaku Tiket',
  PRIMARY KEY (`id_tiket`),
  UNIQUE KEY `uk_tiket_peminjaman` (`id_peminjaman`),
  UNIQUE KEY `uk_tiket_kode_qr` (`kode_qr`),
  CONSTRAINT `fk_tiket_peminjaman`
    FOREIGN KEY (`id_peminjaman`) REFERENCES `peminjaman` (`id_peminjaman`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tiket digital dan Kode QR akses sarpras';

-- =============================================================================
-- 6. TABEL VERIFIKASI_FISIK (Inspeksi Staf Bagian Umum)
-- =============================================================================
CREATE TABLE `verifikasi_fisik` (
  `id_verifikasi` VARCHAR(36) NOT NULL COMMENT 'Identifier Unik Inspeksi Fisik',
  `id_peminjaman` VARCHAR(36) NOT NULL COMMENT 'Foreign Key Transaksi (PEMINJAMAN.id_peminjaman)',
  `id_staf` VARCHAR(36) NOT NULL COMMENT 'Foreign Key Staf Bagian Umum (USERS.id_user)',
  `jenis_pemeriksaan` ENUM('Pra-Approval', 'Pasca-Pengembalian') NOT NULL COMMENT 'Tahapan Inspeksi',
  `kondisi_fisik` ENUM('Baik/Sesuai', 'Ada Catatan Khusus') NOT NULL COMMENT 'Hasil Inspeksi Fisik',
  `catatan_inspeksi` TEXT DEFAULT NULL COMMENT 'Rincian Hasil Catatan Kondisi Fisik Lapangan',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu Inspeksi Dilakukan',
  PRIMARY KEY (`id_verifikasi`),
  CONSTRAINT `fk_verifikasi_peminjaman`
    FOREIGN KEY (`id_peminjaman`) REFERENCES `peminjaman` (`id_peminjaman`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_verifikasi_staf`
    FOREIGN KEY (`id_staf`) REFERENCES `users` (`id_user`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Laporan inspeksi fisik pra-approval dan pasca-pengembalian';

-- =============================================================================
-- 7. TABEL BAST_DIGITAL (Berita Acara Serah Terima)
-- =============================================================================
CREATE TABLE `bast_digital` (
  `id_bast` VARCHAR(36) NOT NULL COMMENT 'Identifier Unik BAST Digital',
  `nomor_bast` VARCHAR(50) NOT NULL COMMENT 'Nomor Surat BAST Resmi Politeknik',
  `id_peminjaman` VARCHAR(36) NOT NULL COMMENT 'Foreign Key Transaksi (PEMINJAMAN.id_peminjaman)',
  `id_kasubag` VARCHAR(36) NOT NULL COMMENT 'Foreign Key Kasubag Umum (USERS.id_user)',
  `qr_signature` VARCHAR(255) NOT NULL COMMENT 'Token Tanda Tangan Digital Kasubag Umum',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu Penandatanganan BAST Digital',
  PRIMARY KEY (`id_bast`),
  UNIQUE KEY `uk_bast_nomor` (`nomor_bast`),
  UNIQUE KEY `uk_bast_peminjaman` (`id_peminjaman`),
  CONSTRAINT `fk_bast_peminjaman`
    FOREIGN KEY (`id_peminjaman`) REFERENCES `peminjaman` (`id_peminjaman`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_bast_kasubag`
    FOREIGN KEY (`id_kasubag`) REFERENCES `users` (`id_user`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Dokumen BAST Digital resmi pengembalian sarpras';

-- =============================================================================
-- 8. TABEL AUDIT_LOG (Rekam Jejak Keamanan & Audit Trail)
-- =============================================================================
CREATE TABLE `audit_log` (
  `id_log` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Identifier Urut Auto Increment',
  `id_user` VARCHAR(36) DEFAULT NULL COMMENT 'Foreign Key Pengguna (USERS.id_user)',
  `aktivitas` VARCHAR(255) NOT NULL COMMENT 'Rincian Aksi (Login, Approve, Edit, Delete, dsb.)',
  `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'Alamat IP Perangkat Pengguna',
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu Terjadinya Aktivitas',
  PRIMARY KEY (`id_log`),
  CONSTRAINT `fk_audit_users`
    FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Log audit trail rekam jejak aktivitas sistem';

-- =============================================================================
-- INDEKS OPTIMASI PERFORMA QUERY
-- =============================================================================
CREATE INDEX `idx_peminjaman_jadwal`
  ON `peminjaman` (`id_sarpras`, `tgl_mulai`, `tgl_selesai`, `status_transaksi`);

CREATE INDEX `idx_peminjaman_pemohon`
  ON `peminjaman` (`id_pemohon`, `status_transaksi`);

CREATE INDEX `idx_users_role_status`
  ON `users` (`role`, `status_aktivasi`);

CREATE INDEX `idx_audit_log_timestamp`
  ON `audit_log` (`timestamp`, `id_user`);

-- =============================================================================
-- SEEDING DATA AWAL (ADMINISTRATOR & SAMPLE MASTER DATA)
-- =============================================================================
INSERT INTO `users` (`id_user`, `nama_lengkap`, `email`, `password_hash`, `no_hp`, `role`, `status_aktivasi`) VALUES
('usr-admin-001', 'System Administrator', 'admin@politeknik.ac.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.XLOaY21iO', '081234567890', 'Admin', 'Aktif'),
('usr-kasubag-001', 'Kasubag Bagian Umum', 'kasubag.umum@politeknik.ac.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.XLOaY21iO', '081234567891', 'Kasubag', 'Aktif'),
('usr-staf-001', 'Staf Verifikator Sarpras', 'staf.umum@politeknik.ac.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.XLOaY21iO', '081234567892', 'Staf', 'Aktif');

INSERT INTO `sarpras` (`id_sarpras`, `kode_aset`, `nama_sarpras`, `kategori`, `spesifikasi`, `lokasi_plat`, `status_operasional`) VALUES
('srp-ruang-001', 'BMN-R-101', 'Auditorium Utama Politeknik', 'Ruangan', 'Kapasitas 500 orang, Sound System, AC, Videotron LED', 'Gedung Rektorat Lt. 3', 'Tersedia'),
('srp-mobil-001', 'BMN-M-001', 'Toyota HiAce Premio Executive', 'Mobil Operasional', '15 Seat, Full AC, Reclining Seat, GPS Tracking', 'B 1234 POL (Pool Kendaraan)', 'Tersedia'),
('srp-alat-001', 'BMN-P-001', 'Proyektor High-Lumens & Screen', 'Perangkat Kerja', '5000 Lumens, HDMI/Wireless, Portable Tripod Screen', 'Gudang Sarpras Utama', 'Tersedia');
```

**Keunggulan Fitur Skrip DDL:**

1. **Integritas Referensial**: `RESTRICT` pada transaksi utama (PEMINJAMAN, BAST_DIGITAL) mencegah penghapusan data master aset/pengguna yang masih terikat; `CASCADE` pada PEMOHON_DETAIL, TIKET_DIGITAL, VERIFIKASI_FISIK untuk pembersihan data anak otomatis.
2. **Pengindeksan Performa**: `idx_peminjaman_jadwal` mengoptimalkan pengecekan bentrok jadwal *real-time*; `idx_users_role_status` mempercepat dasbor approval Administrator.
3. **ACID Compliance**: seluruh tabel dibentuk dengan *engine* transaksional (InnoDB), enkoding utf8mb4_unicode_ci.

### 9.8 Catatan Pemetaan ke Prisma Schema *(Tambahan PRD)*

Implementasi utama menggunakan **Prisma ORM** di atas **MySQL/MariaDB** (`datasource db { provider = "mysql" ... }`), sesuai basis data yang tersedia pada shared hosting cPanel. Ketentuan pemetaan:

- Setiap tabel di §9.4/9.7 dipetakan 1:1 menjadi `model` Prisma dengan nama `PascalCase` (mis. `users` → `model User`), memakai `@@map("users")` agar nama tabel fisik tetap konsisten dengan DDL asli.
- Kolom `ENUM` dipetakan menjadi `enum` Prisma native MySQL (mis. `enum StatusTransaksi { Pending Disetujui Ditolak Dibatalkan Selesai }`), sesuai definisi `ENUM(...)` pada DDL §9.7.
- `id_*` VARCHAR(36) dipetakan sebagai `String @id @default(uuid()) @db.VarChar(36)`.
- Relasi 1:0..1 dan 1:0..\* pada §9.2 dipetakan langsung menjadi relasi Prisma (`@relation`) dengan aturan `onDelete` yang sama seperti pada DDL (`Restrict`, `Cascade`, `SetNull`).
- `datasource url` diisi dari variabel lingkungan berisi *connection string* MySQL cPanel, mis. `mysql://cpaneluser_dbuser:••••@localhost:3306/cpaneluser_sarpras` (lihat §8.6 — nama database/prefix umumnya diawali nama akun cPanel).
- Migrasi dikelola melalui `prisma migrate dev` (pengembangan lokal) dan `prisma migrate deploy` (dijalankan manual di server melalui SSH/Terminal cPanel setiap rilis, lihat §8.6) — skrip DDL pada §9.7 tetap menjadi dokumentasi struktur data yang sah dan identik dengan hasil migrasi Prisma.

---

## 10. Diagram Aktivitas (Activity Diagram)

Sepuluh *activity diagram* berikut dipertahankan sesuai draf, direpresentasikan dalam notasi Mermaid dengan *swimlane* per aktor.

### UC-01 — Login, Registrasi & Autentikasi Sistem

```mermaid
flowchart TD
    Start([Mulai]) --> A1[Buka aplikasi & akses halaman Login]
    A1 --> A2{Pilih Jenis Akses}
    A2 -->|Login| L1[Input Username/Email & Password]
    L1 --> L2[Sistem validasi kredensial & status aktivasi]
    L2 --> L3{Kredensial & Status Valid?}
    L3 -->|Tidak Valid / Pending| L4[Tampilkan pesan error /\nAkun belum aktif] --> A1
    L3 -->|Valid & Aktif| L5[Buat sesi, tentukan role RBAC] --> L6([Tampilkan Dasbor Utama])

    A2 -->|Registrasi Baru| R1[Tampilkan Formulir Pendaftaran]
    R1 --> R2[Isi data diri: Nama, Email, Password, No HP,\nKategori Peran, No. Identitas]
    R2 --> R3[Simpan akun status Pending Aktivasi]
    R3 --> R4[Notifikasi ke dasbor Administrator]
    R4 --> AD1[Admin meninjau data pendaftaran]
    AD1 --> AD2{Keputusan Aktivasi}
    AD2 -->|Ditolak| AD3[Input alasan penolakan,\nemail notifikasi ke calon user] --> End1([Selesai])
    AD2 -->|Disetujui| AD4[Status akun menjadi Aktif,\nemail notifikasi aktivasi] --> R5[User menerima notifikasi,\nakun aktif untuk Login] --> End1
```

### UC-02 — Cek Ketersediaan & Katalog Sarpras

```mermaid
flowchart TD
    Start([Mulai]) --> P1[Akses menu Katalog & Jadwal Sarpras]
    P1 --> S1[Sistem tampilkan kategori: Ruangan, Mobil, Perangkat]
    S1 --> P2[Pilih kategori & filter: tanggal, jam, kapasitas]
    P2 --> S2[Ambil data master aset & jadwal transaksi]
    S2 --> S3[Tampilkan daftar sarpras + Kalender Ketersediaan Real-Time]
    S3 --> D1{Evaluasi Ketersediaan}
    D1 -->|Jadwal Penuh/Disesuaikan| P3[Ubah filter tanggal /\npilih unit alternatif] --> P2
    D1 -->|Sarpras Tersedia| P4[Pilih unit & tekan Lanjutkan Peminjaman]
    P4 --> S4[Teruskan ID sarpras & tanggal ke UC-03]
    S4 --> End([Selesai])
```

### UC-03 — Pengajuan Peminjaman Digital (Full Paperless)

```mermaid
flowchart TD
    Start([Mulai]) --> P1[Pilih kategori sarpras]
    P1 --> S1[Tampilkan spesifikasi & kalender ketersediaan (UC-02)]
    S1 --> P2[Isi formulir: Tanggal & Jam, Maksud Kegiatan, Jumlah Unit]
    P2 --> P3[Tekan Kirim Pengajuan]
    P3 --> S2{Cek Ketersediaan Jadwal}
    S2 -->|Jadwal Bentrok| S3[Tampilkan 'Jadwal Bentrok',\nsarankan slot/unit lain] --> P2
    S2 -->|Jadwal Kosong| S4[Kunci slot jadwal sementara/Reserved]
    S4 --> P4[Setujui Pakta Integritas Digital]
    P4 --> S5[Simpan transaksi: status Pending Approval Kasubag]
    S5 --> S6[Kirim notifikasi ke Kasubag Umum & Staf Bagian Umum]
    S6 --> End([Selesai])
```

### UC-04 — Pembatalan Peminjaman Mandiri

```mermaid
flowchart TD
    Start([Mulai]) --> P1[Buka menu Riwayat Peminjaman Saya]
    P1 --> S1[Tampilkan transaksi aktif: Pending/Disetujui]
    S1 --> P2[Pilih transaksi & tekan Batalkan Peminjaman]
    P2 --> S2{Cek waktu pembatalan vs jadwal}
    S2 -->|Sudah Lewat/Berjalan| S3[Tolak otomatis: 'Peminjaman Sedang Berjalan'] --> End1([Selesai])
    S2 -->|Belum Berjalan| S4[Tampilkan dialog konfirmasi & form alasan]
    S4 --> P3[Isi alasan & tekan Konfirmasi Batal]
    P3 --> S5[Update status: Dibatalkan]
    S5 --> S6[Lepaskan kuncian slot jadwal / re-open]
    S6 --> S7[Notifikasi ke Pemohon, Kasubag Umum, Staf Bagian Umum]
    S7 --> End1
```

### UC-05 — Persetujuan / Approval Peminjaman Sarpras

```mermaid
flowchart TD
    Start([Mulai]) --> K1[Kasubag buka dasbor persetujuan]
    K1 --> S1[Tampilkan daftar Pending Approval Kasubag]
    S1 --> K2[Pilih transaksi & tinjau rincian +\ncatatan verifikasi Staf Umum UC-06]
    K2 --> D1{Keputusan Persetujuan}
    D1 -->|Ditolak| K3[Input alasan penolakan]
    K3 --> S2[Update status: Ditolak]
    S2 --> S3[Bebaskan kuncian jadwal]
    S3 --> S4[Notifikasi penolakan ke Pemohon] --> End([Selesai])
    D1 -->|Disetujui| K4[Bubuhkan persetujuan digital]
    K4 --> S5[Update status: Disetujui]
    S5 --> S6[Terbitkan Tiket Digital / Kode QR]
    S6 --> S7[Kirim tiket ke Pemohon &\nteruskan penyiapan ke Staf Bagian Umum] --> End
```

### UC-06 — Verifikasi Fisik & Jadwal Sarpras (Staf Bagian Umum)

```mermaid
flowchart TD
    Start([Mulai]) --> St1[Buka menu Verifikasi & Inspeksi Sarpras]
    St1 --> S1[Tampilkan daftar tugas: Pra-Approval / Pasca-Pengembalian]
    S1 --> St2[Pilih ID Transaksi & lakukan verifikasi teknis]
    St2 --> St3[Input hasil pemeriksaan fisik & catatan verifikasi]
    St3 --> D1{Evaluasi hasil inspeksi}
    D1 -->|Ada Catatan Fisik Khusus| St4[Input rincian catatan kondisi khusus]
    D1 -->|Sesuai & Baik| St5[Pilih status 'Kondisi Baik/Layak/Sesuai']
    St4 --> St6[Unggah & simpan laporan verifikasi digital]
    St5 --> St6
    St6 --> S2[Simpan catatan & teruskan rekomendasi\nke dasbor Kasubag Umum: UC-05 / UC-07]
    S2 --> End([Selesai])
```

### UC-07 — Konfirmasi Serah Terima Pengembalian Sarpras (BAST Digital)

```mermaid
flowchart TD
    Start([Mulai]) --> P1[Pemohon serahkan fisik sarpras/kunci ke Bagian Umum]
    P1 --> St1[Staf Bagian Umum inspeksi fisik lapangan]
    St1 --> St2[Unggah laporan verifikasi kondisi fisik: UC-06]
    St2 --> K1[Kasubag buka dasbor pengembalian &\ntinjau laporan inspeksi Staf]
    K1 --> D1{Evaluasi kondisi hasil inspeksi}
    D1 -->|Ada Catatan Fisik Khusus| K2[Input catatan kondisi khusus pada draf BAST\n(tanpa denda finansial)]
    D1 -->|Sesuai & Baik / Catatan Selesai| K3[Tekan Konfirmasi Serah Terima Pengembalian]
    K2 --> K3
    K3 --> S1[Generate Berita Acara Serah Terima\nBAST Digital terkonfirmasi]
    S1 --> S2[Update status: Selesai & Diserahterimakan Kembali]
    S2 --> S3[Update status sarpras: Tersedia]
    S3 --> S4[Kirim dokumen BAST ke Pemohon & arsipkan]
    S4 --> End([Selesai])
```

### UC-08 — Monitoring Dashboard & Laporan Eksekutif

```mermaid
flowchart TD
    Start([Mulai]) --> Kb1[Kabag buka menu Dashboard Monitoring Eksekutif]
    Kb1 --> S1[Tampilkan ringkasan real-time: okupansi ruangan,\npenggunaan mobil, status perangkat]
    S1 --> Kb2[Tentukan filter periode & kategori pemohon]
    Kb2 --> S2[Ambil & agregasi data transaksi sesuai filter]
    S2 --> S3[Sajikan grafik rekapitulasi + tombol Cetak/Ekspor]
    S3 --> D1{Tindakan Laporan}
    D1 -->|Cetak/Ekspor| Kb3[Pilih format: PDF/Excel]
    Kb3 --> S4[Generate Laporan Eksekutif berstempel resmi\n& unduh ke perangkat] --> End([Selesai])
    D1 -->|Tutup Dasbor| End
```

### UC-09 — Kelola Master Data Sarpras (Administrator)

```mermaid
flowchart TD
    Start([Mulai]) --> Ad1[Buka menu Kelola Master Data Sarpras]
    Ad1 --> S1[Tampilkan daftar master aset + status operasional]
    S1 --> D1{Pilih Operasi Data}
    D1 -->|Tambah Sarpras Baru| Ad2[Isi form: Kategori, Nama, Spesifikasi,\nJumlah Unit, Lokasi/Plat]
    Ad2 --> S2[Validasi keunikan kode aset & simpan data baru] --> S5
    D1 -->|Edit Data/Status| Ad3[Ubah spesifikasi atau status jadi Maintenance]
    Ad3 --> S3[Update data & kunci sementara aset dari katalog UC-02] --> S5
    D1 -->|Hapus/Non-Aktifkan| Ad4[Tekan Hapus Sarpras]
    Ad4 --> S4{Ada transaksi aktif terkait?}
    S4 -->|Ya| S4a[Tolak hapus permanen,\nubah status jadi Non-Aktif/Soft Delete] --> S5
    S4 -->|Tidak| S4b[Hapus data aset permanen] --> S5
    S5[Perbarui tampilan daftar & notifikasi sukses] --> End([Selesai])
```

### UC-10 — Kelola Pengguna, Role & Audit Trail (Administrator)

```mermaid
flowchart TD
    Start([Mulai]) --> Ad1[Buka menu Kelola Pengguna, Role & Audit Trail]
    Ad1 --> S1[Tampilkan 3 tab: Pending Aktivasi, Daftar User & Role, Log Audit Trail]
    S1 --> D1{Pilih Poin Manajemen}
    D1 -->|Approval Aktivasi User| Ad2[Tinjau berkas pendaftaran: NIP/NIM, Institusi, Peran]
    Ad2 --> D2{Keputusan Aktivasi}
    D2 -->|Ditolak| Ad3[Input alasan, status Ditolak,\nemail notifikasi] --> S4
    D2 -->|Disetujui| Ad4[Status Aktif, email notifikasi aktivasi] --> S4
    D1 -->|Konfigurasi Role RBAC| Ad5[Pilih akun, perbarui matriks kewenangan] --> S2[Update RBAC pada basis data] --> S4
    D1 -->|Pantau Audit Trail| Ad6[Filter tanggal/aktor, tinjau log aktivitas]
    Ad6 --> S3[Sajikan log kronologis + opsi Ekspor CSV/PDF] --> S4
    S4[Update status data & konfirmasi sukses] --> End([Selesai])
```

---

## 11. Diagram Sekuens (Sequence Diagram)

Sepuluh *sequence diagram* (SD-01 s/d SD-10) berikut dipertahankan sesuai draf rancangan, direpresentasikan dalam notasi Mermaid `sequenceDiagram`. Objek boundary/control/entity mengikuti penamaan pada draf asli agar konsisten dengan implementasi (dipetakan ke komponen React/Server Action + Route Handler + Prisma Model pada tech stack terpilih).

### SD-01 (UC-01) — Login, Registrasi User Baru & Autentikasi Sistem

```mermaid
sequenceDiagram
    actor U as User/Pemohon
    participant LF as :LoginForm
    participant RF as :RegisterForm
    participant AC as :AuthController
    participant DB as :Database (UserEntity)
    actor Adm as Administrator

    U->>LF: aksesHalamanLogin()
    U->>LF: submitLogin(email, password)
    LF->>AC: authenticate()
    AC->>DB: findByEmail()
    alt Valid & Status = 'Aktif'
        AC->>AC: verifikasi password, buat sesi
        AC-->>LF: redirectDashboard(role)
        LF-->>U: Tampilkan Dasbor Utama
    else Valid & Status = 'Pending'
        AC-->>LF: returnError('Akun Belum Diaktifkan Admin')
    else Kredensial Tidak Valid
        AC-->>LF: returnError('Email/Password Salah')
    end

    U->>RF: clickRegistrasiBaru()
    RF-->>U: Tampilkan formulir pendaftaran
    U->>RF: submitRegistrasi()
    RF->>AC: checkEmailExist()
    AC->>DB: saveUser(status='Pending')
    RF-->>U: Notifikasi pendaftaran berhasil

    Adm->>AC: approveAktivasiUser(userId, decision)
    alt Decision = 'Setujui'
        AC->>DB: updateStatus('Aktif')
        AC-->>U: sendNotificationEmail('Akun Anda Telah Diaktifkan')
    else Decision = 'Tolak'
        AC->>DB: updateStatus('Ditolak')
        AC-->>U: sendNotificationEmail('Pendaftaran Ditolak')
    end
```

### SD-02 (UC-02) — Cek Ketersediaan & Katalog Sarpras Real-Time

```mermaid
sequenceDiagram
    actor P as Pemohon/User
    participant KU as :KatalogUI
    participant KC as :KatalogController
    participant SE as :SarprasEntity
    participant PE as :PeminjamanEntity

    P->>KU: aksesKatalogSarpras()
    KU->>KC: fetchKategoriSarpras()
    KC->>SE: getKategoriList()
    SE-->>KC: kategoriList [Ruangan, Mobil, Perangkat]
    KC-->>KU: renderKatalog()

    P->>KU: inputFilterPencarian(kategori, tglMulai, tglSelesai, kapasitas)
    KU->>KC: cariKetersediaan()
    KC->>SE: getSarprasByKategori()
    KC->>PE: checkJadwalBentrok()
    PE-->>KC: statusJadwalMap

    alt Jadwal Tersedia & Sesuai
        KC-->>KU: returnKatalogHasil(sarprasTersediaList, kalenderRealtime)
        KU-->>P: Tampilkan daftar aset & kalender
        P->>KU: pilihUnitSarpras(idSarpras)
        KU->>KC: teruskanKeUC03(idSarpras, tanggal)
    else Jadwal Penuh / Maintenance
        KC-->>KU: returnPeringatan('Jadwal Penuh / Dalam Maintenance')
        KU-->>P: 'Tidak Tersedia, Ubah Filter/Tanggal'
    end
```

### SD-03 (UC-03) — Pengajuan Peminjaman Digital (Full Paperless)

```mermaid
sequenceDiagram
    actor P as Pemohon/User
    participant BU as :BookingUI
    participant BC as :BookingController
    participant SE as :SarprasEntity
    participant PE as :PeminjamanEntity

    P->>BU: pilihSarprasDanTanggal(idSarpras, tglMulai, tglSelesai)
    BU->>BC: initFormPeminjaman()
    BC->>SE: getSarprasDetail()
    SE-->>BC: sarprasDetail
    BC-->>BU: renderFormPeminjaman()
    BU-->>P: Tampilkan formulir pengajuan

    P->>BU: submitPengajuan(maksudKegiatan, berkasLampiran)
    BU->>BC: prosesPengajuan()
    BC->>PE: validateJadwalOverlap()
    PE-->>BC: overlapStatus

    alt Jadwal Bebas & Data Lengkap
        BC->>PE: savePeminjaman(status='Pending')
        PE-->>BC: peminjamanRecord
        BC->>BC: sendNotificationAlert(role='Kasubag')
        BC-->>BU: returnSukses()
        BU-->>P: Konfirmasi Pengajuan Berhasil
    else Jadwal Bentrok / Data Tidak Lengkap
        BC-->>BU: returnError('Jadwal Sudah Terisi / Data Tidak Lengkap')
        BU-->>P: Tampilkan pesan error
    end
```

### SD-04 (UC-04) — Pembatalan Peminjaman Mandiri

```mermaid
sequenceDiagram
    actor P as Pemohon/User
    participant RU as :RiwayatPeminjamanUI
    participant PC as :PembatalanController
    participant PE as :PeminjamanEntity
    participant NS as :NotifikasiService

    P->>RU: aksesRiwayatPeminjaman()
    RU->>PC: getDaftarPeminjamanAktif(idPemohon)
    PC->>PE: fetchPeminjamanByPemohon(idPemohon, status=[Pending, Disetujui])
    PE-->>PC: peminjamanList
    RU-->>P: Tampilkan daftar transaksi

    P->>RU: submitPembatalan(idPeminjaman, alasanPembatalan)
    RU->>PC: prosesPembatalan()
    PC->>PE: checkWaktuPeminjaman(idPeminjaman)
    PE-->>PC: waktuPeminjamanStatus

    alt Waktu Belum Berjalan (Valid)
        PC->>PE: updateStatus(status='Dibatalkan', alasan)
        PE-->>PC: statusUpdated (slot re-opened)
        PC->>NS: kirimNotifikasiBatal(roles=[Kasubag, Staf])
        PC-->>RU: returnSukses()
        RU-->>P: Konfirmasi Pembatalan Berhasil
    else Waktu Sudah Berjalan/Lewat (Invalid)
        PC-->>RU: returnError('Pembatalan Gagal: Peminjaman Sedang Berjalan')
        RU-->>P: Tampilkan peringatan
    end
```

### SD-05 (UC-05) — Persetujuan / Approval Peminjaman Sarpras

```mermaid
sequenceDiagram
    actor K as Kasubag Umum
    participant AU as :ApprovalUI
    participant AC as :ApprovalController
    participant PE as :PeminjamanEntity
    participant TS as :TiketService
    participant NS as :NotifikasiService

    K->>AU: aksesDashboardApproval()
    AU->>AC: getDaftarPengajuanPending()
    AC->>PE: fetchPendingList(status='Pending')
    PE-->>AC: pendingListRecord
    AU-->>K: Tampilkan daftar transaksi pending

    K->>AU: pilihDetailPengajuan(idPeminjaman)
    AC->>PE: fetchDetailAndInspeksiCatatan()
    AU-->>K: Tampilkan form evaluasi lengkap

    K->>AU: submitKeputusan(idPeminjaman, keputusan, catatan)
    alt Keputusan = 'Disetujui'
        AC->>PE: updateStatus(status='Disetujui', idKasubag)
        AC->>TS: generateTiketQR(idPeminjaman)
        AC->>NS: kirimNotifikasiDisetujui(idPemohon, TiketQR)
        AU-->>K: Konfirmasi Persetujuan Berhasil
    else Keputusan = 'Ditolak'
        AC->>PE: updateStatus(status='Ditolak', alasanPenolakan)
        AC->>NS: kirimNotifikasiDitolak(idPemohon, alasan)
        AU-->>K: Konfirmasi penolakan
    end
```

### SD-06 (UC-06) — Verifikasi Fisik & Jadwal Sarpras (Staf Bagian Umum)

```mermaid
sequenceDiagram
    actor S as Staf Bagian Umum
    participant VU as :VerifikasiUI
    participant VC as :VerifikasiController
    participant PE as :PeminjamanEntity
    participant VE as :VerifikasiEntity
    participant NS as :NotifikasiService

    S->>VU: aksesMenuVerifikasi()
    VU->>VC: getDaftarTugasVerifikasi()
    VC->>PE: fetchPendingVerifikasiList()
    VU-->>S: Tampilkan daftar tugas

    S->>VU: pilihTransaksi(idPeminjaman)
    VC->>PE: fetchDetailAndJadwal()
    VU-->>S: Sajikan formulir inspeksi digital

    S->>VU: inspeksiFisikDiLapangan()
    S->>VU: submitHasilVerifikasi(jenisPemeriksaan, kondisiFisik, catatan)
    VU->>VC: prosesVerifikasi()
    VC->>VE: saveVerifikasiRecord()

    alt Kondisi = 'Baik/Sesuai'
        VC->>PE: updateStatusVerifikasi('Sesuai')
        VC->>NS: kirimNotifikasiRekomendasi(role='Kasubag', status='Layak')
    else Kondisi = 'Ada Catatan Khusus'
        VC->>PE: updateStatusVerifikasi('Ada Catatan Khusus')
        VC->>NS: kirimNotifikasiCatatan(role='Kasubag', catatan)
    end
    VU-->>S: Konfirmasi Verifikasi Selesai
```

### SD-07 (UC-07) — Konfirmasi Serah Terima Pengembalian (BAST Digital)

```mermaid
sequenceDiagram
    actor K as Kasubag Umum
    participant BU2 as :BASTUI
    participant BC as :BASTController
    participant PE as :PeminjamanEntity
    participant BE as :BASTEntity
    participant PDF as :PDFService

    K->>BU2: aksesMenuBASTDigital()
    BU2->>BC: getDaftarPengembalianSelesaiInspeksi()
    BC->>PE: fetchInspeksiPascaPengembalian(status='Pengembalian')
    PE-->>BC: transaksiInspeksiList
    BU2-->>K: Tampilkan daftar pengembalian

    K->>BU2: pilihTransaksiDanTTD(idPeminjaman, passkeySignature)
    BU2->>BC: prosesPenandatangananBAST(idPeminjaman, passkey)
    BC->>BC: verifikasiPasskeySignature()

    alt Passkey Valid & Kondisi Sesuai
        BC->>PE: updateStatusTransaksi(status='Selesai')
        BC->>BE: generateBASTRecord(nomorBAST, qrSignature)
        BC->>PDF: createPDFDocument(idBAST)
        PDF-->>BC: bastPDFFile
        BU2-->>K: Konfirmasi + tautan unduh BAST Digital
    else Passkey Invalid / Ada Sengketa Kerusakan
        BC-->>BU2: returnError('Signature Gagal / Butuh Klaim Kerusakan')
        BU2-->>K: Tampilkan peringatan
    end
```

### SD-08 (UC-08) — Dashboard Monitoring & Laporan Eksekutif

```mermaid
sequenceDiagram
    actor Kb as Kabag Keuangan & Umum
    participant DU as :DashboardUI
    participant MC as :MonitoringController
    participant SE as :SarprasEntity
    participant PE as :PeminjamanEntity
    participant RS as :ReportService

    Kb->>DU: aksesDashboardEksekutif()
    DU->>MC: getKinerjaPemanfaatanData()
    MC->>SE: getKapasitasDanMasterAset()
    MC->>PE: fetchStatistikOkupansi()
    MC-->>DU: renderDashboardRealtime(grafik, matriks)
    DU-->>Kb: Tampilkan grafik & tabel rekapitulasi

    Kb->>DU: inputFilterDanCetak(periode, kategori, format)
    DU->>MC: generateLaporanEksekutif(filterParams)
    alt Format = 'PDF/Excel'
        MC->>RS: compileExecutiveReport(agregatData, format)
        RS->>RS: buildDokumenStempelDigital()
        RS-->>DU: fileLaporanDigital
        DU-->>Kb: Tautan unduh Laporan Eksekutif
    else Selesai Pemantauan / Non-Ekspor
        MC-->>DU: refreshView()
        DU-->>Kb: Tampilan selesai pemantauan
    end
```

### SD-09 (UC-09) — Kelola Master Data Sarpras

```mermaid
sequenceDiagram
    actor Ad as Administrator
    participant MU as :MasterDataUI
    participant MC as :MasterDataController
    participant SE as :SarprasEntity
    participant PE as :PeminjamanEntity

    Ad->>MU: aksesMenuMasterSarpras()
    MU->>MC: getSarprasMasterList()
    MC->>SE: fetchAllSarprasData()
    SE-->>MC: sarprasDataList[]
    MU-->>Ad: Render antarmuka master data

    alt Tambah Sarpras
        Ad->>MU: submitTambahSarpras(dataForm)
        MC->>SE: validateAndSaveNewSarpras()
        SE-->>MU: Notifikasi sukses
    else Edit Data/Status Maintenance
        Ad->>MU: submitEditSarpras(idSarpras, updatedData, status)
        MC->>SE: updateSarprasRecord(status='Maintenance')
        Note right of SE: Otomatis kunci aset dari katalog UC-02
    else Hapus/Non-Aktifkan
        Ad->>MU: requestHapusSarpras(idSarpras)
        MC->>PE: checkActiveTransactions(idSarpras)
        alt activeTxCount > 0
            MC->>SE: setStatus('Non-Aktif') Soft Delete
        else activeTxCount = 0
            MC->>SE: deleteSarprasRecord()
        end
    end
```

### SD-10 (UC-10) — Kelola Pengguna, Role (RBAC) & Audit Trail

```mermaid
sequenceDiagram
    actor Ad as Administrator
    participant UU as :UserMgmtUI
    participant UC as :UserMgmtController
    participant UE as :UserEntity
    participant AL as :AuditLogEntity
    participant NS as :NotifikasiService

    Ad->>UU: aksesMenuKelolaPenggunaAndAudit()
    UU->>UC: getDashboardAdminData()
    UC->>UE: fetchPendingUsersAndRoleList()
    UC->>AL: fetchRecentAuditLogs()
    UU-->>Ad: Render dasbor 3 tab utama

    alt Approval Aktivasi Registrasi User Baru
        Ad->>UU: reviewDetailPemohonAndSubmit(userId, decision, alasan)
        alt decision = 'Setujui'
            UC->>UE: updateStatus('Aktif')
            UC->>NS: sendEmail('Aktivasi Berhasil')
        else decision = 'Tolak'
            UC->>UE: updateStatus('Ditolak')
            UC->>NS: sendEmail('Pendaftaran Ditolak')
        end
        UC->>AL: catatLog(keputusanAktivasi)
    else Konfigurasi Role & Hak Akses (RBAC)
        Ad->>UU: updateRoleUser(userId, newRoleRBAC)
        UC->>UE: updateRole()
        UC->>AL: catatLog(perubahanRole)
    else Pantau & Ekspor Audit Trail
        Ad->>UU: inputFilterAuditLogs(periode, user, actionType)
        UC->>AL: executeQueryAuditLog()
        AL-->>UU: fileLaporanAuditCSVPDF
    end
```

---

## 12. Rancangan API
*(Tambahan PRD — memetakan setiap Use Case ke endpoint REST agar frontend Next.js dan backend Route Handlers memiliki kontrak yang jelas. Seluruh endpoint berada di bawah `/api` dan dilindungi middleware Auth + RBAC, kecuali dinyatakan publik.)*

| Endpoint | Method | Deskripsi | Use Case | Role yang Diizinkan |
|---|---|---|---|---|
| `/api/auth/register` | POST | Registrasi akun baru (status Pending) | UC-01 | Publik |
| `/api/auth/[...nextauth]` | GET/POST | Login, logout, sesi (Auth.js) | UC-01 | Publik |
| `/api/sarpras` | GET | Daftar katalog sarpras + filter kategori/kapasitas | UC-02 | Semua peran terautentikasi |
| `/api/sarpras/:id/ketersediaan` | GET | Kalender ketersediaan *real-time* per aset | UC-02 | Semua peran terautentikasi |
| `/api/sarpras` | POST | Tambah master data sarpras baru | UC-09 | Administrator |
| `/api/sarpras/:id` | PUT | Edit spesifikasi/status sarpras (termasuk Maintenance) | UC-09 | Administrator |
| `/api/sarpras/:id` | DELETE | Hapus / *soft delete* (Non-Aktif) sarpras | UC-09 | Administrator |
| `/api/peminjaman` | POST | Ajukan peminjaman baru (cek bentrok + kunci slot) | UC-03 | Dosen, Taruna, BPSDM, Kementerian, Alumni |
| `/api/peminjaman` | GET | Riwayat peminjaman milik pemohon (atau semua, untuk Kasubag/Staf/Admin) | UC-04, UC-05 | Sesuai peran |
| `/api/peminjaman/:id/batalkan` | PATCH | Pembatalan mandiri oleh pemohon | UC-04 | Pemohon pemilik transaksi |
| `/api/peminjaman/:id/approval` | PATCH | Setujui/tolak pengajuan + terbitkan Tiket QR | UC-05 | Kasubag Umum |
| `/api/verifikasi-fisik` | POST | Input hasil verifikasi jadwal/inspeksi fisik | UC-06 | Staf Bagian Umum |
| `/api/peminjaman/:id/bast` | POST | Konfirmasi serah terima & generate BAST Digital (PDF) | UC-07 | Kasubag Umum |
| `/api/dashboard/eksekutif` | GET | Data agregat okupansi untuk dasbor eksekutif | UC-08 | Kepala Bagian Keuangan & Umum, Kasubag, Admin (baca) |
| `/api/dashboard/eksekutif/export` | GET | Ekspor Laporan Eksekutif (PDF/Excel) | UC-08 | Kepala Bagian Keuangan & Umum |
| `/api/admin/users` | GET | Daftar pengguna & status aktivasi (3 tab UC-10) | UC-10 | Administrator |
| `/api/admin/users/:id/aktivasi` | PATCH | Setujui/tolak aktivasi akun baru | UC-10 | Administrator |
| `/api/admin/users/:id/role` | PATCH | Perbarui *role* RBAC pengguna | UC-10 | Administrator |
| `/api/admin/audit-log` | GET | Query log audit trail (filter tanggal/aktor/aksi) | UC-10 | Administrator |
| `/api/admin/audit-log/export` | GET | Ekspor log audit trail (CSV/PDF) | UC-10 | Administrator |

**Konvensi API:**
- Format respons konsisten: `{ success, data, message, errors? }`.
- Validasi *request body* menggunakan skema Zod yang sama dengan skema formulir di frontend.
- Setiap *mutation* (POST/PUT/PATCH/DELETE) otomatis menulis entri ke `audit_log` melalui Prisma middleware.
- Paginasi standar (`page`, `limit`) untuk seluruh endpoint daftar (`GET` list).
- Kode status HTTP konsisten: `200/201` sukses, `400` validasi gagal, `401` belum login, `403` peran tidak diizinkan, `404` data tidak ditemukan, `409` konflik (mis. bentrok jadwal), `500` kesalahan server.

---

## 13. Rancangan Antarmuka Pengguna (UI/UX)

### 13.1 Metodologi Perancangan (sesuai draf)

1. **Tahap Analisis & Spesifikasi Kebutuhan** — *Low-Fidelity Wireframe*, dilakukan bersamaan/setelah pendefinisian *Use Case* dan *Activity Diagram*, untuk memvalidasi alur kerja bersama *stakeholder*.
2. **Tahap Perancangan Detail Sistem** — *High-Fidelity UI Mockup/Prototype*, dilakukan setelah diagram struktur & perilaku teknis (*Sequence Diagram*, *Class Diagram*, *ERD*, Spesifikasi Basis Data) selesai, sebagai panduan visual resmi (*visual blueprint*) bagi *frontend developer*.

### 13.2 Prinsip Desain *(Tambahan PRD)*

- **Design system tunggal**: seluruh layar dibangun dari komponen **shadcn/ui** (Button, Card, Dialog, Table, Form, Tabs, Badge, Calendar, Sheet, Toast) di atas **Tailwind CSS**, agar tampilan konsisten dan mudah dipelihara.
- **Mobile-first & responsif**: prioritas alur Pemohon (pengajuan, riwayat) dioptimalkan untuk layar kecil karena kerap diakses saat mobile.
- **Status jelas via Badge berwarna**: `Pending` (kuning), `Disetujui` (biru), `Ditolak` (merah), `Dibatalkan` (abu-abu), `Selesai` (hijau) — konsisten di semua layar.
- **Feedback instan**: gunakan komponen `Toast`/`Sonner` untuk konfirmasi aksi (submit, approve, reject, batal).

### 13.3 Rincian 10 Layout UI Utama

| ID | Layout | Use Case Terkait | Komponen shadcn/ui Kunci |
|---|---|---|---|
| UI-01 | Autentikasi & Registrasi User | UC-01 / SD-01 | `Form`, `Input`, `Select` (Kategori Pemohon), `Alert` (status Pending Aktivasi) |
| UI-02 | Katalog Sarpras & Kalender Ketersediaan | UC-02 / SD-02 | `Tabs` (kategori), `Card` (aset), `Calendar`, `Badge` (Tersedia/Reserved/Maintenance) |
| UI-03 | Form Pengajuan Peminjaman Digital | UC-03 / SD-03 | `Form`, `DatePicker`/`Calendar`, `Textarea`, `Checkbox` (Pakta Integritas), `Dialog` konfirmasi |
| UI-04 | Riwayat Peminjaman & Pembatalan Mandiri | UC-04 / SD-04 | `Table`/`Card` list, `Badge` status, `AlertDialog` konfirmasi pembatalan |
| UI-05 | Dasbor Persetujuan / Approval Kasubag Umum | UC-05 / SD-05 | `Table` antrean, `Sheet`/`Dialog` evaluasi detail, tombol `Setujui`/`Tolak` |
| UI-06 | Dasbor Verifikasi & Form Inspeksi Fisik | UC-06 / SD-06 | `Tabs` (Pra-Approval/Pasca-Pengembalian), `RadioGroup` kondisi fisik, `Textarea` catatan |
| UI-07 | BAST Digital & Serah Terima Pengembalian | UC-07 / SD-07 | `Form` *passkey/signature*, `Button` pratinjau/unduh PDF BAST |
| UI-08 | Executive Monitoring Dashboard & Laporan | UC-08 / SD-08 | `Card` KPI, grafik Recharts, `Select` filter periode, `Button` Export PDF/Excel |
| UI-09 | Kelola Master Data Sarpras | UC-09 / SD-09 | `DataTable` (TanStack Table), `Dialog` Tambah/Edit, `Switch` status operasional |
| UI-10 | Dasbor Manajemen Pengguna, RBAC & Audit Trail | UC-10 / SD-10 | `Tabs` (3 tab), `DataTable`, `Select` role, filter tanggal untuk Audit Trail |

---

## 14. Notifikasi dan Komunikasi
*(Tambahan PRD — merangkum seluruh notifikasi yang disebut pada spesifikasi Use Case/Sequence Diagram draf, agar konsisten diimplementasikan)*

| Event | Penerima | Kanal | Sumber |
|---|---|---|---|
| Registrasi akun baru masuk | Administrator | Notifikasi dasbor | UC-01 |
| Akun disetujui/ditolak Admin | Pemohon | Email | UC-01 |
| Pengajuan peminjaman baru | Kasubag Umum, Staf Bagian Umum | Notifikasi dasbor | UC-03 |
| Pembatalan peminjaman | Pemohon, Kasubag Umum, Staf Bagian Umum | Notifikasi dasbor + Email (Pemohon) | UC-04 |
| Pengajuan disetujui (+ Tiket QR) | Pemohon | Email + Notifikasi dasbor | UC-05 |
| Pengajuan ditolak (+ alasan) | Pemohon | Email + Notifikasi dasbor | UC-05 |
| Rekomendasi hasil verifikasi fisik | Kasubag Umum | Notifikasi dasbor | UC-06 |
| BAST Digital terbit | Pemohon | Email (lampiran PDF) | UC-07 |
| Log aktivitas signifikan (login gagal berulang, perubahan RBAC) | Administrator | Notifikasi dasbor | UC-10 |

---

## 15. Kriteria Penerimaan (Acceptance Criteria)
*(Tambahan PRD — kriteria minimum agar setiap Use Case dianggap "Done")*

| Use Case | Kriteria Penerimaan |
|---|---|
| UC-01 | Pengguna baru dapat registrasi, akun berstatus *Pending* hingga disetujui Admin; login gagal menampilkan pesan yang sesuai; sesi menetapkan *role* dengan benar. |
| UC-02 | Kalender ketersediaan menampilkan status akurat (*Tersedia/Reserved/Maintenance*) sesuai data transaksi terbaru; filter berfungsi tanpa *reload* penuh. |
| UC-03 | Pengajuan pada slot bentrok ditolak sistem (validasi server, bukan hanya client); slot terkunci otomatis begitu pengajuan valid tersimpan. |
| UC-04 | Pembatalan hanya berhasil untuk transaksi berstatus *Pending*/*Disetujui* dan sebelum waktu mulai; slot terbuka kembali otomatis. |
| UC-05 | Approve menerbitkan Tiket QR unik yang tervalidasi; Reject menyimpan alasan dan membebaskan slot; notifikasi terkirim < 1 menit. |
| UC-06 | Setiap catatan verifikasi tersimpan dengan `jenis_pemeriksaan` yang benar dan terhubung ke transaksi terkait. |
| UC-07 | BAST Digital hanya dapat diterbitkan setelah verifikasi fisik pasca-pengembalian tersimpan; dokumen PDF memuat nomor BAST unik & QR signature; tidak ada field/alur denda finansial. |
| UC-08 | Dashboard menampilkan data konsisten dengan basis data transaksi; ekspor PDF/Excel menghasilkan berkas yang dapat dibuka dan datanya sesuai filter. |
| UC-09 | Penghapusan aset dengan transaksi aktif otomatis menjadi *Non-Aktif* (bukan hapus permanen); status *Maintenance* langsung menyembunyikan aset dari katalog UC-02. |
| UC-10 | Perubahan *role* langsung memengaruhi hak akses pada permintaan berikutnya; setiap aksi administratif tercatat di *audit trail*. |

---

## 16. Strategi Pengujian
*(Tambahan PRD)*

| Jenis Pengujian | Cakupan | Alat |
|---|---|---|
| Unit Test | Fungsi bisnis kritikal: validasi bentrok jadwal, perhitungan status transaksi, generator kode transaksi/nomor BAST | Vitest |
| Component Test | Komponen UI interaktif (form pengajuan, tabel approval) | React Testing Library |
| Integration Test | Endpoint API terhadap database uji (migrasi Prisma + *seed*) | Vitest + Prisma Test Environment |
| End-to-End (E2E) Test | Alur kritikal lintas peran: registrasi→aktivasi→login→ajukan→approve→verifikasi→BAST | Playwright |
| Uji Keamanan | RBAC *bypass* attempt, validasi input, proteksi CSRF/XSS dasar | Manual + `npm audit`/Dependabot |
| Uji Performa | Waktu respons endpoint kalender ketersediaan & dashboard di bawah beban simulasi | k6 / Lighthouse CI |
| User Acceptance Test (UAT) | Skenario nyata bersama perwakilan tiap peran (Dosen, Kasubag, Staf, Kabag, Admin) sebelum go-live | Manual, checklist §15 |

---

## 17. Roadmap dan Fase Pengembangan
*(Tambahan PRD — usulan pentahapan agar aplikasi dapat dirilis bertahap dan stabil)*

| Fase | Cakupan | Target |
|---|---|---|
| **Fase 0 — Fondasi** | Setup repo Next.js + TypeScript + Tailwind + shadcn/ui, skema Prisma & migrasi awal, Auth.js + RBAC dasar, CI/CD pipeline | Minggu 1–2 |
| **Fase 1 — MVP Inti** | UC-01, UC-02, UC-03, UC-04 (Login, Katalog, Pengajuan, Pembatalan) | Minggu 3–6 |
| **Fase 2 — Alur Persetujuan & Verifikasi** | UC-05, UC-06, UC-07 (Approval, Verifikasi Fisik, BAST Digital) + generator QR & PDF | Minggu 7–10 |
| **Fase 3 — Monitoring & Administrasi** | UC-08 (Dashboard Eksekutif + Ekspor), UC-09 (Master Data), UC-10 (User/RBAC/Audit Trail) | Minggu 11–13 |
| **Fase 4 — Pengerasan (Hardening)** | Pengujian menyeluruh (§16), perbaikan performa, aksesibilitas, *security review*, UAT | Minggu 14–15 |
| **Fase 5 — Go-Live & Stabilisasi** | Deployment produksi, pelatihan pengguna, pemantauan pasca-rilis, perbaikan cepat (*hotfix*) | Minggu 16 |
| **Kandidat Fase Lanjutan** | Integrasi SSO/SIMPEG, mekanisme denda finansial (jika kebijakan berubah), aplikasi mobile native, notifikasi WhatsApp/Push | Pasca V1.0 |

---

## 18. Risiko dan Mitigasi
*(Tambahan PRD)*

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Bentrok jadwal akibat *race condition* saat dua pengajuan bersamaan | Data tidak konsisten, dua pemohon mendapat slot yang sama | Transaksi database atomik (§9.6) + *unique constraint*/`SELECT ... FOR UPDATE` pada validasi jadwal |
| Keterlambatan approval oleh Kasubag Umum menghambat operasional | Pemohon menunggu lama, kegiatan tertunda | Notifikasi *real-time* + pengingat otomatis (cron) untuk pengajuan yang mendekati tanggal pelaksanaan |
| Penyalahgunaan akun eksternal (BPSDM/Kementerian/Alumni) tanpa verifikasi memadai | Akses tidak sah ke sistem | Proses aktivasi manual oleh Administrator wajib untuk seluruh akun baru (UC-01/UC-10) |
| Kehilangan data pada kegagalan server | Gangguan layanan, kehilangan riwayat transaksi | Backup harian otomatis (cPanel Backup Wizard + `mysqldump` terjadwal via Cron Jobs, disimpan juga di luar server), uji pemulihan berkala |
| Resistensi pengguna terhadap sistem digital baru | Adopsi rendah, kembali ke proses manual | Pelatihan pengguna per peran, antarmuka sederhana (shadcn/ui), masa transisi paralel bila diperlukan |
| Ketergantungan pada satu penyedia hosting | Downtime saat gangguan penyedia | Arsitektur berbasis Next.js standar (`output: 'standalone'`) tetap portabel — basis data (skema MySQL/MariaDB via Prisma) dan kode aplikasi dapat dipindah ke penyedia shared hosting/VPS lain tanpa perubahan arsitektur besar |
| **Keterbatasan sumber daya shared hosting cPanel** (kuota CPU/RAM/proses per akun, tanpa *auto-scaling*, potensi *rate limit* koneksi keluar) | Performa menurun atau layanan tersendat saat beban tinggi (mis. musim ramai pengajuan awal semester) | Optimasi beban sesuai §8.4 (hindari Puppeteer/Redis wajib, gunakan `@react-pdf/renderer` & cache in-memory ringan); pantau penggunaan resource via metrik cPanel; siapkan **jalur migrasi ke VPS/cloud hosting** sebagai fase lanjutan bila trafik bertumbuh melampaui kapasitas paket shared hosting |
| Proses Node.js di-*restart* Passenger karena idle/kebijakan hosting (*sleep* pada beberapa paket shared hosting) | Permintaan pertama setelah idle terasa lambat (*cold start*) | Cron Jobs *keep-alive* ringan (ping periodik ke *health-check* endpoint) bila diizinkan kebijakan hosting; komunikasikan potensi *cold start* pada SLA internal (§7) |

---

## 19. Asumsi dan Ketergantungan
*(Tambahan PRD)*

**Asumsi:**
- Institusi menyediakan domain resmi dan akses email institusi (`@poltekimipas.ac.id` atau setara) untuk notifikasi sistem.
- Paket **shared hosting cPanel** yang digunakan menyediakan fitur **Node.js App Selector (Passenger)** dengan minimal Node.js 18+ (idealnya 20 LTS), akses **MySQL® Databases**, **Cron Jobs**, **AutoSSL**, serta akses **SSH/Terminal** untuk menjalankan `npm install`, `npm run build`, dan `prisma migrate deploy` — bila SSH tidak tersedia, langkah tersebut dilakukan melalui fitur bawaan panel Node.js Selector ("Run NPM Install", "Restart").
- Kuota disk dan bandwidth paket hosting mencukupi untuk penyimpanan lampiran pengajuan serta dokumen PDF BAST/Laporan Eksekutif yang di-*generate* (estimasi kebutuhan disiapkan bersama Unit IT sebelum pengadaan paket hosting).
- Data master awal sarpras (ruangan, mobil, perangkat) akan diinput oleh Administrator setelah sistem *live*, mengikuti contoh *seed data* pada §9.7.
- Tidak ada kebijakan denda finansial pada versi 1.0, sesuai penegasan eksplisit dalam draf rancangan (UC-07).
- Seluruh pengguna memiliki akses internet dan perangkat (desktop/mobile) yang memadai untuk mengakses aplikasi web.

**Ketergantungan:**
- Ketersediaan dan stabilitas layanan **shared hosting cPanel** terpilih (fitur Node.js App, MySQL Databases, Cron Jobs, AutoSSL) beserta akun email SMTP institusi untuk notifikasi.
- Bila CI/CD otomatis ke server digunakan (§8.6), diperlukan akses SSH dari lingkungan GitHub Actions ke server hosting — bergantung pada kebijakan keamanan penyedia hosting.
- Persetujuan kebijakan institusi terkait alur persetujuan berjenjang (Kasubag Umum sebagai *approver* tunggal) tidak berubah selama pengembangan.
- Ketersediaan tim IT kampus (termasuk sekretaris unit IT) untuk pengujian UAT dan pengelolaan operasional pasca-rilis, termasuk operasional rutin di panel cPanel (restart aplikasi, migrasi database, monitoring kuota).

---

## 20. Lampiran

### 20.1 Referensi Standar

- ISO/IEC/IEEE 29148:2018 — *Systems and software engineering — Life cycle processes — Requirements engineering*.
- Sommerville, I. — *Software Engineering* (prinsip rekayasa perangkat lunak modern & perancangan basis data relasional).
- Wiegers, K. & Beatty, J. — *Software Requirements* (kerangka kerja rekayasa kebutuhan perangkat lunak).

### 20.2 Ringkasan Perubahan dari Draf Rancangan Awal

| Aspek | Draf Awal | PRD Ini |
|---|---|---|
| 9 Aktor & 10 Use Case | Dipertahankan | **Tidak berubah** |
| Class Diagram, ERD (8 tabel), DDL | Dipertahankan | **Tidak berubah** (direpresentasikan ulang dalam Mermaid + tetap disertakan SQL DDL asli) |
| 10 Activity Diagram & 10 Sequence Diagram | Berupa gambar (image) | Direpresentasikan ulang sebagai diagram **Mermaid** agar dapat dirender langsung dari Markdown, isi alur **tidak diubah** |
| 10 Layout UI | Deskripsi naratif | Dipertahankan + dipetakan ke komponen shadcn/ui konkret |
| Tech Stack | Belum ditentukan (hanya menyebut RDBMS MySQL/PostgreSQL) | **Next.js + TypeScript + Tailwind CSS + shadcn/ui**, Prisma ORM, **MySQL/MariaDB**, Auth.js, dan layanan pendukung (§8) |
| Strategi Hosting & Deployment | Belum ditentukan | Disesuaikan khusus untuk **shared hosting cPanel dengan Node.js App Selector (Passenger)**: basis data MySQL/MariaDB (bukan PostgreSQL) agar selaras dengan layanan standar cPanel, PDF digenerate tanpa *headless browser* (`@react-pdf/renderer`, bukan Puppeteer), penyimpanan berkas di filesystem lokal akun hosting (bukan *object storage* S3), penjadwalan tugas via **cPanel Cron Jobs**, dan alur *deployment* via Git Version Control/SSH + Passenger restart (§8.6) |
| Kebutuhan Non-Fungsional, API Design, Acceptance Criteria, Testing, Roadmap, Risiko | Belum ada | **Ditambahkan** sebagai pelengkap standar PRD |

### 20.3 Status Dokumen

Dokumen ini siap dijadikan acuan pengembangan (*development-ready*). Perubahan lingkup di luar batasan §3.2 memerlukan pembaruan dokumen ini melalui proses *change request* yang disetujui pemangku kepentingan (Kasubag Umum, Kepala Bagian Keuangan dan Umum, dan Unit IT).

---
*Dokumen ini disusun sebagai penyempurnaan dari "Rancangan Aplikasi Peminjaman Sarpras pada Politeknik Imipas" menjadi Product Requirements Document (PRD) yang siap digunakan untuk pengembangan aplikasi.*
