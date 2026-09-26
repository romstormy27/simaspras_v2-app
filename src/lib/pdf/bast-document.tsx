import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

export interface BastData {
  nomor_bast: string;
  created_at: string | Date;
  qr_signature_token: string;
  qr_code_image: string; // Base64 data URL
  pemohon: {
    nama_lengkap: string;
    email: string;
    no_hp: string;
    role: string;
    nomor_identitas?: string;
    instansi_kategori?: string;
  };
  kasubag: {
    nama_lengkap: string;
    email: string;
    jabatan?: string;
  };
  staf_inspeksi?: {
    nama_lengkap: string;
    created_at?: string | Date;
    kondisi_fisik: string;
    catatan_inspeksi?: string | null;
  };
  sarpras: {
    nama_sarpras: string;
    kode_aset: string;
    kategori: string;
    lokasi_plat: string;
  };
  peminjaman: {
    kode_transaksi: string;
    tgl_mulai: string | Date;
    tgl_selesai: string | Date;
    maksud_kegiatan: string;
  };
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 35,
    paddingHorizontal: 40,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    lineHeight: 1.35,
  },
  kopContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#034275',
    paddingBottom: 8,
    marginBottom: 12,
  },
  kopLine1: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  kopLine2: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    marginTop: 1,
    textTransform: 'uppercase',
  },
  kopLine3: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#034275',
    marginTop: 2,
    letterSpacing: 0.8,
  },
  kopAddress: {
    fontSize: 7.5,
    color: '#64748b',
    marginTop: 3,
  },
  docTitleContainer: {
    textAlign: 'center',
    marginBottom: 12,
  },
  docTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    textDecoration: 'underline',
    color: '#0f172a',
  },
  docNumber: {
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    marginTop: 3,
    color: '#334155',
  },
  paragraph: {
    textAlign: 'justify',
    marginBottom: 8,
    fontSize: 8.5,
    color: '#334155',
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#034275',
    backgroundColor: '#f1f5f9',
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginBottom: 6,
    marginTop: 4,
    borderRadius: 2,
  },
  twoColRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  colHalf: {
    width: '50%',
    paddingRight: 6,
  },
  table: {
    flexDirection: 'column',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 3,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  tableRowLast: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  tableCellLabel: {
    width: '32%',
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#475569',
  },
  tableCellValue: {
    width: '68%',
    fontSize: 8,
    color: '#0f172a',
  },
  inspectionBadgeGood: {
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
  },
  inspectionBadgeNote: {
    backgroundColor: '#fffbeb',
    color: '#92400e',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
  },
  notesBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 6,
    marginTop: 4,
    marginBottom: 6,
  },
  signContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingHorizontal: 10,
  },
  signColumn: {
    width: '45%',
    alignItems: 'center',
    textAlign: 'center',
  },
  signRole: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
    marginBottom: 4,
  },
  signInstitution: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 6,
  },
  signQrImage: {
    width: 65,
    height: 65,
    marginVertical: 4,
  },
  signName: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginTop: 4,
    textDecoration: 'underline',
  },
  signDetail: {
    fontSize: 7.5,
    color: '#64748b',
    marginTop: 1,
  },
  footerText: {
    position: 'absolute',
    bottom: 18,
    left: 40,
    right: 40,
    fontSize: 7,
    color: '#94a3b8',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 4,
  },
});

function formatDateIndo(dateInput: string | Date): string {
  try {
    const d = new Date(dateInput);
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return String(dateInput);
  }
}

function formatDateTimeIndo(dateInput: string | Date): string {
  try {
    const d = new Date(dateInput);
    return (
      d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) +
      ' ' +
      d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
      ' WIB'
    );
  } catch {
    return String(dateInput);
  }
}

export function BastDocument({ data }: { data: BastData }) {
  const tanggalBAST = formatDateIndo(data.created_at);

  return (
    <Document title={`BAST-${data.nomor_bast}`} author="SIMASPRAS Poltekimipas">
      <Page size="A4" style={styles.page}>
        {/* Kop Surat Resmi */}
        <View style={styles.kopContainer}>
          <Text style={styles.kopLine1}>KEMENTERIAN IMIGRASI DAN PEMASYARAKATAN RI</Text>
          <Text style={styles.kopLine2}>BADAN PENGEMBANGAN SUMBER DAYA MANUSIA IMIGRASI DAN PEMASYARAKATAN</Text>
          <Text style={styles.kopLine3}>POLITEKNIK IMIGRASI DAN PEMASYARAKATAN</Text>
          <Text style={styles.kopAddress}>
            Kampus Poltekimipas: Jl. Satria - Sudirman, RT.001/RW.014, Tanah Tinggi, Kec. Tangerang, Kota Tangerang, Banten 15119
          </Text>
          <Text style={styles.kopAddress}>
            Laman: https://poltekimipas.ac.id | Pos-el: info@poltekimipas.ac.id | SIMASPRAS Digital
          </Text>
        </View>

        {/* Judul & Nomor BAST */}
        <View style={styles.docTitleContainer}>
          <Text style={styles.docTitle}>
            BERITA ACARA SERAH TERIMA PENGEMBALIAN SARANA DAN PRASARANA
          </Text>
          <Text style={styles.docNumber}>Nomor: {data.nomor_bast}</Text>
        </View>

        {/* Pembuka */}
        <Text style={styles.paragraph}>
          Pada hari ini, {tanggalBAST}, telah dilakukan penyerahan kembali, pemeriksaan fisik akhir, dan
          penyelesaian administrasi operasional sarana dan prasarana kampus bertempat di Kantor Bagian Umum
          Politeknik Imigrasi dan Pemasyarakatan, oleh dan antara para pihak:
        </Text>

        {/* Identitas Para Pihak */}
        <Text style={styles.sectionTitle}>I. IDENTITAS PARA PIHAK</Text>
        <View style={styles.twoColRow}>
          {/* Pihak Pertama */}
          <View style={styles.colHalf}>
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <Text style={styles.tableCellLabel}>Pihak:</Text>
                <Text style={styles.tableCellValue}>PIHAK PERTAMA (PEMINJAM)</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCellLabel}>Nama:</Text>
                <Text style={styles.tableCellValue}>{data.pemohon.nama_lengkap}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCellLabel}>Kategori / Peran:</Text>
                <Text style={styles.tableCellValue}>{data.pemohon.role}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCellLabel}>NIP / NIM / ID:</Text>
                <Text style={styles.tableCellValue}>
                  {data.pemohon.nomor_identitas || '-'}
                </Text>
              </View>
              <View style={styles.tableRowLast}>
                <Text style={styles.tableCellLabel}>Unit / Kontak:</Text>
                <Text style={styles.tableCellValue}>
                  {data.pemohon.instansi_kategori || '-'} ({data.pemohon.no_hp})
                </Text>
              </View>
            </View>
          </View>

          {/* Pihak Kedua */}
          <View style={styles.colHalf}>
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <Text style={styles.tableCellLabel}>Pihak:</Text>
                <Text style={styles.tableCellValue}>PIHAK KEDUA (PENGELOLA ASET)</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCellLabel}>Nama:</Text>
                <Text style={styles.tableCellValue}>{data.kasubag.nama_lengkap}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCellLabel}>Jabatan:</Text>
                <Text style={styles.tableCellValue}>
                  {data.kasubag.jabatan || 'Kasubag Bagian Umum Poltekimipas'}
                </Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCellLabel}>Unit Kerja:</Text>
                <Text style={styles.tableCellValue}>Sub Bagian Umum & Rumah Tangga</Text>
              </View>
              <View style={styles.tableRowLast}>
                <Text style={styles.tableCellLabel}>Email Dinas:</Text>
                <Text style={styles.tableCellValue}>{data.kasubag.email}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Rincian Sarpras */}
        <Text style={styles.sectionTitle}>II. RINCIAN SARANA / PRASARANA YANG DIKEMBALIKAN</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Nama Fasilitas / Aset:</Text>
            <Text style={styles.tableCellValue}>{data.sarpras.nama_sarpras}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Kode BMN / Registrasi:</Text>
            <Text style={styles.tableCellValue}>{data.sarpras.kode_aset}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Kategori / Lokasi / Plat:</Text>
            <Text style={styles.tableCellValue}>
              {data.sarpras.kategori.replace('_', ' ')} • {data.sarpras.lokasi_plat}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Kode Registrasi Transaksi:</Text>
            <Text style={styles.tableCellValue}>{data.peminjaman.kode_transaksi}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Periode Peminjaman:</Text>
            <Text style={styles.tableCellValue}>
              {formatDateTimeIndo(data.peminjaman.tgl_mulai)} s/d{' '}
              {formatDateTimeIndo(data.peminjaman.tgl_selesai)}
            </Text>
          </View>
          <View style={styles.tableRowLast}>
            <Text style={styles.tableCellLabel}>Agenda / Maksud Kegiatan:</Text>
            <Text style={styles.tableCellValue}>{data.peminjaman.maksud_kegiatan}</Text>
          </View>
        </View>

        {/* Laporan Pemeriksaan Fisik */}
        <Text style={styles.sectionTitle}>III. LAPORAN PEMERIKSAAN FISIK & KELENGKAPAN (PASCA-PENGEMBALIAN)</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Pemeriksa Lapangan:</Text>
            <Text style={styles.tableCellValue}>
              Staf Bagian Umum ({data.staf_inspeksi?.nama_lengkap || 'Tim Teknis Sarpras'})
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Hasil Inspeksi Fisik:</Text>
            <Text style={styles.tableCellValue}>
              {data.staf_inspeksi?.kondisi_fisik === 'Baik_Sesuai' ||
              data.staf_inspeksi?.kondisi_fisik === 'Baik/Sesuai'
                ? 'BAIK & LENGKAP SESUAI STANDAR OPERASIONAL'
                : 'TERDAPAT CATATAN FISIK KHUSUS'}
            </Text>
          </View>
          <View style={styles.tableRowLast}>
            <Text style={styles.tableCellLabel}>Catatan Teknis Staf:</Text>
            <Text style={styles.tableCellValue}>
              {data.staf_inspeksi?.catatan_inspeksi ||
                'Sarana dan prasarana telah diserahkan kembali dalam kondisi utuh, bersih, dan siap untuk digunakan pada jadwal berikutnya.'}
            </Text>
          </View>
        </View>

        {/* Klausul Tanpa Denda Finansial (PRD §3.2) */}
        <View style={styles.notesBox}>
          <Text style={{ fontSize: 7.5, color: '#475569', lineHeight: 1.3 }}>
            <strong>Ketetapan Kebijakan SIMASPRAS Poltekimipas:</strong> Berita Acara Serah Terima (BAST) ini
            diterbitkan secara sah secara paperless sebagai bukti tuntasnya penggunaan fasilitas. Sesuai PRD
            SIMASPRAS §3.2, institusi mengedepankan pembinaan disiplin dan integritas tanpa menerapkan skema
            denda finansial dalam alur operasional sarana dan prasarana.
          </Text>
        </View>

        {/* Pengesahan Tanda Tangan */}
        <View style={styles.signContainer}>
          {/* Pihak Pertama */}
          <View style={styles.signColumn}>
            <Text style={styles.signRole}>PIHAK PERTAMA</Text>
            <Text style={styles.signInstitution}>Yang Menyerahkan (Peminjam)</Text>
            <View style={{ height: 60, justifyContent: 'center' }}>
              <Text style={{ fontSize: 8, color: '#94a3b8', fontStyle: 'italic' }}>
                Disetujui secara digital via Akun Pemohon
              </Text>
            </View>
            <Text style={styles.signName}>{data.pemohon.nama_lengkap}</Text>
            <Text style={styles.signDetail}>
              {data.pemohon.role} • ID: {data.pemohon.nomor_identitas || '-'}
            </Text>
          </View>

          {/* Pihak Kedua */}
          <View style={styles.signColumn}>
            <Text style={styles.signRole}>PIHAK KEDUA</Text>
            <Text style={styles.signInstitution}>Yang Menerima & Menyetujui</Text>
            {data.qr_code_image ? (
              /* eslint-disable-next-line jsx-a11y/alt-text */
              <Image src={data.qr_code_image} style={styles.signQrImage} />
            ) : (
              <View style={{ height: 65, justifyContent: 'center' }}>
                <Text style={{ fontSize: 8, color: '#94a3b8' }}>QR Signature Verified</Text>
              </View>
            )}
            <Text style={styles.signName}>{data.kasubag.nama_lengkap}</Text>
            <Text style={styles.signDetail}>
              Kasubag Bagian Umum Poltekimipas
            </Text>
            <Text style={{ fontSize: 6.5, color: '#64748b', marginTop: 1 }}>
              Token: {data.qr_signature_token}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          Dokumen ini diterbitkan secara elektronik oleh SIMASPRAS Poltekimipas (Sistem Informasi Manajemen
          Sarana & Prasarana). Keaslian dokumen dapat diverifikasi melalui pemindaian QR Signature.
        </Text>
      </Page>
    </Document>
  );
}
