import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import ExcelJS from 'exceljs';
import { formatDateTime } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const admin = await getSession();
    if (!admin || admin.role !== 'Admin') {
      return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const roleFilter = searchParams.get('role')?.trim() || '';
    const startDateStr = searchParams.get('start_date');
    const endDateStr = searchParams.get('end_date');
    const exportFormat = searchParams.get('export')?.toLowerCase();
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 1000);

    const where: any = {};

    // Search query
    if (search) {
      where.OR = [
        { aktivitas: { contains: search } },
        { ip_address: { contains: search } },
        { user: { nama_lengkap: { contains: search } } },
        { user: { email: { contains: search } } },
      ];
    }

    // Role filter
    if (roleFilter && roleFilter !== 'Semua') {
      where.user = { role: roleFilter };
    }

    // Date range filter
    if (startDateStr || endDateStr) {
      where.timestamp = {};
      if (startDateStr) {
        where.timestamp.gte = new Date(startDateStr);
      }
      if (endDateStr) {
        where.timestamp.lte = new Date(endDateStr);
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      take: exportFormat ? 5000 : limit,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            nama_lengkap: true,
            email: true,
            role: true,
          },
        },
      },
    });

    const serialized = logs.map((l) => ({
      id_log: l.id_log.toString(),
      id_user: l.id_user,
      aktivitas: l.aktivitas,
      ip_address: l.ip_address,
      timestamp: l.timestamp,
      user_nama: l.user?.nama_lengkap || 'Sistem / Anonim',
      user_email: l.user?.email || '-',
      user_role: l.user?.role || '-',
    }));

    // Handle Export to Excel
    if (exportFormat === 'excel' || exportFormat === 'xlsx') {
      const wb = new ExcelJS.Workbook();
      wb.creator = 'SIMASPRAS Poltekimipas';
      wb.created = new Date();

      const ws = wb.addWorksheet('Audit Trail Log');
      ws.views = [{ showGridLines: true }];

      // Institution Header
      ws.mergeCells('A1:F1');
      ws.getCell('A1').value = 'KEMENTERIAN IMIGRASI DAN PEMASYARAKATAN RI';
      ws.getCell('A1').font = { name: 'Calibri', size: 12, bold: true, color: { argb: '034275' } };

      ws.mergeCells('A2:F2');
      ws.getCell('A2').value = 'BADAN PENGEMBANGAN SUMBER DAYA MANUSIA IMIGRASI DAN PEMASYARAKATAN';
      ws.getCell('A2').font = { name: 'Calibri', size: 10, bold: true };

      ws.mergeCells('A3:F3');
      ws.getCell('A3').value = 'POLITEKNIK IMIGRASI DAN PEMASYARAKATAN - REKAM JEJAK LOG AUDIT TRAIL';
      ws.getCell('A3').font = { name: 'Calibri', size: 11, bold: true, color: { argb: '034275' } };

      ws.mergeCells('A4:F4');
      ws.getCell('A4').value = `Diekspor pada: ${new Date().toLocaleString('id-ID')} oleh Administrator (${admin.nama_lengkap})`;
      ws.getCell('A4').font = { name: 'Calibri', size: 9, italic: true, color: { argb: '64748B' } };

      ws.addRow([]);

      // Table Header
      const headerRow = ws.addRow([
        'ID LOG',
        'WAKTU (WIB)',
        'AKTOR PENGGUNA',
        'EMAIL',
        'ROLE RBAC',
        'DESKRIPSI AKTIVITAS',
        'ALAMAT IP',
      ]);
      headerRow.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFF' } };
      headerRow.eachCell((c) => {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '034275' } };
        c.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      const borderStyle: Partial<ExcelJS.Borders> = {
        top: { style: 'thin', color: { argb: 'E2E8F0' } },
        left: { style: 'thin', color: { argb: 'E2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
        right: { style: 'thin', color: { argb: 'E2E8F0' } },
      };

      serialized.forEach((log) => {
        const row = ws.addRow([
          log.id_log,
          formatDateTime(log.timestamp),
          log.user_nama,
          log.user_email,
          log.user_role,
          log.aktivitas,
          log.ip_address || '-',
        ]);
        row.font = { name: 'Calibri', size: 9.5 };
        row.eachCell((c) => (c.border = borderStyle));
      });

      ws.columns = [
        { width: 12 },
        { width: 22 },
        { width: 28 },
        { width: 28 },
        { width: 16 },
        { width: 55 },
        { width: 18 },
      ];

      const buffer = await wb.xlsx.writeBuffer();
      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="Audit_Trail_SIMASPRAS_${new Date().toISOString().slice(0, 10)}.xlsx"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: serialized,
      totalCount: serialized.length,
    });
  } catch (error) {
    console.error('Fetch audit log error:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil log audit' },
      { status: 500 }
    );
  }
}
