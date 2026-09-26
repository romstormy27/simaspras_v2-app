import ExcelJS from 'exceljs';

interface ExecutiveReportData {
  periodeLabel: string;
  generatedAt: string;
  generatedBy: string;
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
  bookings: Array<{
    kode_transaksi: string;
    sarpras_nama: string;
    sarpras_kode: string;
    sarpras_kategori: string;
    pemohon_nama: string;
    pemohon_role: string;
    tgl_mulai: string | Date;
    tgl_selesai: string | Date;
    maksud_kegiatan: string;
    status_transaksi: string;
    nomor_bast?: string | null;
  }>;
  sarprasStats: Array<{
    kode_aset: string;
    nama_sarpras: string;
    kategori: string;
    lokasi_plat: string;
    status_operasional: string;
    total_dipinjam: number;
  }>;
}

export async function generateExecutiveExcelBuffer(data: ExecutiveReportData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'SIMASPRAS Poltekimipas';
  wb.created = new Date();

  const headerFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '034275' },
  };

  const headerFont: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFF' },
  };

  const borderStyle: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'CBD5E1' } },
    left: { style: 'thin', color: { argb: 'CBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'CBD5E1' } },
    right: { style: 'thin', color: { argb: 'CBD5E1' } },
  };

  // ==========================================
  // SHEET 1: RINGKASAN EKSEKUTIF & KPI
  // ==========================================
  const ws1 = wb.addWorksheet('Ringkasan Eksekutif');
  ws1.views = [{ showGridLines: true }];

  // Institution Title Header
  ws1.mergeCells('A1:E1');
  ws1.getCell('A1').value = 'KEMENTERIAN IMIGRASI DAN PEMASYARAKATAN RI';
  ws1.getCell('A1').font = { name: 'Calibri', size: 12, bold: true, color: { argb: '034275' } };

  ws1.mergeCells('A2:E2');
  ws1.getCell('A2').value = 'BADAN PENGEMBANGAN SUMBER DAYA MANUSIA IMIGRASI DAN PEMASYARAKATAN';
  ws1.getCell('A2').font = { name: 'Calibri', size: 10, bold: true };

  ws1.mergeCells('A3:E3');
  ws1.getCell('A3').value = 'POLITEKNIK IMIGRASI DAN PEMASYARAKATAN (POLTEKIMIPAS)';
  ws1.getCell('A3').font = { name: 'Calibri', size: 11, bold: true, color: { argb: '034275' } };

  ws1.mergeCells('A4:E4');
  ws1.getCell('A4').value = 'Jl. Satria - Sudirman, RT.001/RW.014, Tanah Tinggi, Kec. Tangerang, Kota Tangerang, Banten 15119';
  ws1.getCell('A4').font = { name: 'Calibri', size: 9, italic: true, color: { argb: '64748B' } };

  ws1.mergeCells('A5:E5');
  ws1.getCell('A5').value = `LAPORAN EKSEKUTIF PEMANFAATAN DAN OKUPANSI SARPRAS (Periode: ${data.periodeLabel})`;
  ws1.getCell('A5').font = { name: 'Calibri', size: 11, bold: true };

  ws1.addRow([]);

  // KPI Metrics Table
  ws1.addRow(['INDIKATOR KINERJA UTAMA (KPI)', 'NILAI', 'SATUAN / KETERANGAN']);
  const kpiHeaderRow = ws1.lastRow!;
  kpiHeaderRow.font = headerFont;
  kpiHeaderRow.eachCell((c) => {
    c.fill = headerFill;
    c.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const kpiRows = [
    ['Tingkat Okupansi Ruangan', `${data.kpi.roomOccupancyRate}%`, 'Persentase jam pemanfaatan vs kapasitas operasional'],
    ['Tingkat Utilisasi Mobil Operasional', `${data.kpi.carUtilizationRate}%`, 'Rasio unit kendaraan terpakai per periode'],
    ['Rasio Perputaran Perangkat Kerja', `${data.kpi.deviceTurnoverRate}%`, 'Tingkat utilisasi proyektor, laptop, dan sound'],
    ['Total Inventaris Sarpras Aktif', data.kpi.totalSarpras, 'Total fasilitas terdaftar di kampus'],
    ['- Kategori Ruangan', data.kpi.totalRuangan, 'Ruang kuliah, auditorium, rapat, aula'],
    ['- Kategori Mobil Operasional', data.kpi.totalMobil, 'Armada mobil kedinasan'],
    ['- Kategori Perangkat Kerja', data.kpi.totalPerangkat, 'Proyektor, laptop kerja, audio'],
    ['Total Transaksi Peminjaman', data.kpi.totalPeminjaman, 'Seluruh permohonan pada periode'],
    ['Transaksi Selesai (BAST Terbit)', data.kpi.countSelesai, 'Tuntas serah terima tanpa sengketa'],
    ['Transaksi Sedang Berjalan (Disetujui)', data.kpi.countDisetujui, 'Aktif digunakan saat ini'],
    ['Transaksi Pending Approval', data.kpi.countPending, 'Menunggu persetujuan kasubag'],
    ['Transaksi Ditolak / Dibatalkan', data.kpi.countDitolak + data.kpi.countDibatalkan, 'Slot jadwal dibebaskan'],
  ];

  kpiRows.forEach((r) => {
    const row = ws1.addRow(r);
    row.font = { name: 'Calibri', size: 10 };
    row.eachCell((c) => {
      c.border = borderStyle;
    });
  });

  ws1.addRow([]);
  ws1.addRow(['DISTRIBUSI PEMOHON', 'JUMLAH', 'PERSENTASE']);
  const distHeader = ws1.lastRow!;
  distHeader.font = headerFont;
  distHeader.eachCell((c) => {
    c.fill = headerFill;
  });

  ws1.addRow(['Pemohon Internal (Dosen & Taruna)', data.distribusiPemohon.internalCount, `${data.distribusiPemohon.internalPercentage}%`]);
  ws1.addRow(['Pemohon Eksternal (BPSDM, Kemen, Alumni)', data.distribusiPemohon.externalCount, `${data.distribusiPemohon.externalPercentage}%`]);
  Object.entries(data.distribusiPemohon.breakdown).forEach(([role, count]) => {
    ws1.addRow([`  - Peran ${role}`, count, '-']);
  });

  ws1.columns = [
    { width: 45 },
    { width: 18 },
    { width: 45 },
    { width: 15 },
    { width: 15 },
  ];

  // ==========================================
  // SHEET 2: REKAPITULASI FASILITAS SARPRAS
  // ==========================================
  const ws2 = wb.addWorksheet('Rekapitulasi Sarpras');
  ws2.views = [{ showGridLines: true }];

  ws2.addRow(['KODE BMN', 'NAMA FASILITAS', 'KATEGORI', 'LOKASI / PLAT', 'STATUS OPERASIONAL', 'TOTAL PEMINJAMAN']);
  const sarprasHeader = ws2.lastRow!;
  sarprasHeader.font = headerFont;
  sarprasHeader.eachCell((c) => {
    c.fill = headerFill;
    c.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  data.sarprasStats.forEach((s) => {
    const row = ws2.addRow([
      s.kode_aset,
      s.nama_sarpras,
      s.kategori.replace('_', ' '),
      s.lokasi_plat,
      s.status_operasional,
      s.total_dipinjam,
    ]);
    row.font = { name: 'Calibri', size: 10 };
    row.eachCell((c) => (c.border = borderStyle));
  });

  ws2.columns = [
    { width: 18 },
    { width: 35 },
    { width: 22 },
    { width: 28 },
    { width: 20 },
    { width: 18 },
  ];

  // ==========================================
  // SHEET 3: DATA TRANSAKSI PEMINJAMAN
  // ==========================================
  const ws3 = wb.addWorksheet('Data Transaksi');
  ws3.views = [{ showGridLines: true }];

  ws3.addRow([
    'KODE TRANSAKSI',
    'NAMA FASILITAS',
    'KODE BMN',
    'KATEGORI',
    'NAMA PEMINJAM',
    'PERAN',
    'WAKTU MULAI',
    'WAKTU SELESAI',
    'STATUS',
    'NOMOR BAST',
    'AGENDA KEGIATAN',
  ]);
  const trxHeader = ws3.lastRow!;
  trxHeader.font = headerFont;
  trxHeader.eachCell((c) => {
    c.fill = headerFill;
    c.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  data.bookings.forEach((b) => {
    const row = ws3.addRow([
      b.kode_transaksi,
      b.sarpras_nama,
      b.sarpras_kode,
      b.sarpras_kategori.replace('_', ' '),
      b.pemohon_nama,
      b.pemohon_role,
      new Date(b.tgl_mulai).toLocaleString('id-ID'),
      new Date(b.tgl_selesai).toLocaleString('id-ID'),
      b.status_transaksi,
      b.nomor_bast || '-',
      b.maksud_kegiatan,
    ]);
    row.font = { name: 'Calibri', size: 9.5 };
    row.eachCell((c) => (c.border = borderStyle));
  });

  ws3.columns = [
    { width: 20 },
    { width: 30 },
    { width: 16 },
    { width: 18 },
    { width: 25 },
    { width: 15 },
    { width: 20 },
    { width: 20 },
    { width: 14 },
    { width: 26 },
    { width: 35 },
  ];

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
