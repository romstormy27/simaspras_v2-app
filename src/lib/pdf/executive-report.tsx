import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export interface ExecutiveReportPdfData {
  periodeLabel: string;
  generatedAt: string;
  generatedBy: string;
  kabagNama?: string;
  kpi: {
    totalSarpras: number;
    totalRuangan: number;
    totalMobil: number;
    totalPerangkat: number;
    totalPeminjaman: number;
    countPending: number;
    countDisetujui: number;
    countSelesai: number;
    countDibatalkan: number;
    countDitolak: number;
    roomOccupancyRate: number;
    carUtilizationRate: number;
    deviceTurnoverRate: number;
  };
  distribusiPemohon: {
    internalCount: number;
    externalCount: number;
    internalPercentage: number;
    externalPercentage: number;
    breakdown: Record<string, number>;
  };
  sarprasStats: Array<{
    kode_aset: string;
    nama_sarpras: string;
    kategori: string;
    lokasi_plat: string;
    total_dipinjam: number;
  }>;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 35,
    paddingHorizontal: 40,
    fontSize: 8.5,
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
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  kopLine2: {
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    marginTop: 1,
    textTransform: 'uppercase',
  },
  kopLine3: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#034275',
    marginTop: 2,
    letterSpacing: 0.8,
  },
  kopAddress: {
    fontSize: 7.5,
    color: '#64748b',
    marginTop: 2,
  },
  docTitleContainer: {
    textAlign: 'center',
    marginBottom: 10,
  },
  docTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    textDecoration: 'underline',
    color: '#0f172a',
  },
  docNumber: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    marginTop: 2,
    color: '#334155',
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#034275',
    backgroundColor: '#f1f5f9',
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginBottom: 5,
    marginTop: 5,
    borderRadius: 2,
  },
  kpiGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  kpiCard: {
    width: '23%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 3,
    padding: 5,
    textAlign: 'center',
  },
  kpiCardValue: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#034275',
    marginTop: 2,
  },
  kpiCardLabel: {
    fontSize: 7,
    color: '#64748b',
  },
  table: {
    flexDirection: 'column',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#034275',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  tableCell: {
    fontSize: 7.5,
  },
  signContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
    paddingRight: 10,
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
  },
  signInstitution: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 35,
  },
  signName: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textDecoration: 'underline',
  },
  footerText: {
    position: 'absolute',
    bottom: 15,
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

export function ExecutiveReportDocument({ data }: { data: ExecutiveReportPdfData }) {
  return (
    <Document title="Laporan-Eksekutif-SIMASPRAS" author="SIMASPRAS Poltekimipas">
      <Page size="A4" style={styles.page}>
        {/* Kop Resmi */}
        <View style={styles.kopContainer}>
          <Text style={styles.kopLine1}>KEMENTERIAN IMIGRASI DAN PEMASYARAKATAN RI</Text>
          <Text style={styles.kopLine2}>BADAN PENGEMBANGAN SUMBER DAYA MANUSIA IMIGRASI DAN PEMASYARAKATAN</Text>
          <Text style={styles.kopLine3}>POLITEKNIK IMIGRASI DAN PEMASYARAKATAN</Text>
          <Text style={styles.kopAddress}>
            Jl. Satria - Sudirman, RT.001/RW.014, Tanah Tinggi, Kec. Tangerang, Kota Tangerang, Banten 15119
          </Text>
          <Text style={styles.kopAddress}>
            Laman: https://poltekimipas.ac.id | Pos-el: info@poltekimipas.ac.id | Sistem SIMASPRAS
          </Text>
        </View>

        {/* Title */}
        <View style={styles.docTitleContainer}>
          <Text style={styles.docTitle}>
            LAPORAN EKSEKUTIF PEMANFAATAN & OKUPANSI SARANA PRASARANA
          </Text>
          <Text style={styles.docNumber}>
            Periode Analisis: {data.periodeLabel} • Dicetak: {data.generatedAt}
          </Text>
        </View>

        {/* Section 1: KPI Utama */}
        <Text style={styles.sectionTitle}>I. INDIKATOR KINERJA UTAMA (KPI) UTILISASI SARPRAS</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiCardLabel}>OKUPANSI RUANGAN</Text>
            <Text style={styles.kpiCardValue}>{data.kpi.roomOccupancyRate}%</Text>
            <Text style={styles.kpiCardLabel}>{data.kpi.totalRuangan} Unit Ruang</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiCardLabel}>UTILISASI MOBIL</Text>
            <Text style={styles.kpiCardValue}>{data.kpi.carUtilizationRate}%</Text>
            <Text style={styles.kpiCardLabel}>{data.kpi.totalMobil} Armada Dinas</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiCardLabel}>PERPUTARAN PERANGKAT</Text>
            <Text style={styles.kpiCardValue}>{data.kpi.deviceTurnoverRate}%</Text>
            <Text style={styles.kpiCardLabel}>{data.kpi.totalPerangkat} Unit Alat Kerja</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiCardLabel}>SELESAI (BAST)</Text>
            <Text style={styles.kpiCardValue}>{data.kpi.countSelesai}</Text>
            <Text style={styles.kpiCardLabel}>Dari {data.kpi.totalPeminjaman} Transaksi</Text>
          </View>
        </View>

        {/* Section 2: Ringkasan Pengguna & Transaksi */}
        <Text style={styles.sectionTitle}>II. DEMOGRAFI PEMINJAM & STATUS TRANSAKSI</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: '40%' }]}>KATEGORI / METRIK</Text>
            <Text style={[styles.tableHeaderCell, { width: '25%' }]}>JUMLAH</Text>
            <Text style={[styles.tableHeaderCell, { width: '35%' }]}>KETERANGAN</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: '40%' }]}>Pemohon Internal (Dosen & Taruna)</Text>
            <Text style={[styles.tableCell, { width: '25%' }]}>{data.distribusiPemohon.internalCount} ({data.distribusiPemohon.internalPercentage}%)</Text>
            <Text style={[styles.tableCell, { width: '35%' }]}>Civitas Akademika Utama</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: '40%' }]}>Pemohon Eksternal (BPSDM / Kemen / Alumni)</Text>
            <Text style={[styles.tableCell, { width: '25%' }]}>{data.distribusiPemohon.externalCount} ({data.distribusiPemohon.externalPercentage}%)</Text>
            <Text style={[styles.tableCell, { width: '35%' }]}>Mitra Kedinasan & Alumni</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: '40%' }]}>Transaksi Berstatus Selesai (BAST Sah)</Text>
            <Text style={[styles.tableCell, { width: '25%' }]}>{data.kpi.countSelesai} Transaksi</Text>
            <Text style={[styles.tableCell, { width: '35%' }]}>Serah terima tuntas tanpa sengketa</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: '40%' }]}>Transaksi Berjalan / Disetujui</Text>
            <Text style={[styles.tableCell, { width: '25%' }]}>{data.kpi.countDisetujui} Transaksi</Text>
            <Text style={[styles.tableCell, { width: '35%' }]}>Fasilitas sedang dalam penggunaan</Text>
          </View>
        </View>

        {/* Section 3: Rekapitulasi Fasilitas */}
        <Text style={styles.sectionTitle}>III. REKAPITULASI PEMANFAATAN FASILITAS SARPRAS</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: '20%' }]}>KODE BMN</Text>
            <Text style={[styles.tableHeaderCell, { width: '35%' }]}>NAMA FASILITAS</Text>
            <Text style={[styles.tableHeaderCell, { width: '20%' }]}>KATEGORI</Text>
            <Text style={[styles.tableHeaderCell, { width: '25%' }]}>TOTAL PINJAM</Text>
          </View>
          {data.sarprasStats.slice(0, 10).map((s, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '20%' }]}>{s.kode_aset}</Text>
              <Text style={[styles.tableCell, { width: '35%' }]}>{s.nama_sarpras}</Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>{s.kategori.replace('_', ' ')}</Text>
              <Text style={[styles.tableCell, { width: '25%' }]}>{s.total_dipinjam} Kali Dipinjam</Text>
            </View>
          ))}
        </View>

        {/* Tanda Tangan */}
        <View style={styles.signContainer}>
          <View style={styles.signColumn}>
            <Text style={styles.signRole}>Mengetahui,</Text>
            <Text style={styles.signInstitution}>Kepala Bagian Keuangan dan Umum</Text>
            <Text style={styles.signName}>{data.kabagNama || 'Drs. Bambang Irawan, M.M.'}</Text>
            <Text style={{ fontSize: 7.5, color: '#64748b', marginTop: 1 }}>
              NIP. 197805122002121002
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          Dokumen Laporan Eksekutif ini dihasilkan secara otomatis oleh SIMASPRAS Poltekimipas.
        </Text>
      </Page>
    </Document>
  );
}
