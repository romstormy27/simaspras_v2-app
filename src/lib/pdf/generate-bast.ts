import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import prisma from '@/lib/prisma';
import { BastDocument, BastData } from './bast-document';

export async function generateBastPdfBuffer(idBastOrBooking: string): Promise<{ buffer: Buffer; nomor_bast: string }> {
  // Find BAST record either by id_bast, nomor_bast, or id_peminjaman
  const bast = await prisma.bASTDigital.findFirst({
    where: {
      OR: [
        { id_bast: idBastOrBooking },
        { nomor_bast: idBastOrBooking },
        { id_peminjaman: idBastOrBooking },
      ],
    },
    include: {
      kasubag: true,
      peminjaman: {
        include: {
          pemohon: {
            include: {
              pemohon_detail: true,
            },
          },
          sarpras: true,
          verifikasi_fisik: {
            include: {
              staf: true,
            },
            orderBy: { created_at: 'desc' },
          },
        },
      },
    },
  });

  if (!bast) {
    throw new Error('Dokumen BAST Digital tidak ditemukan di database.');
  }

  // Get the latest Pasca_Pengembalian inspection or the latest inspection
  const pascaVerif = bast.peminjaman.verifikasi_fisik.find(
    (v) => v.jenis_pemeriksaan === 'Pasca_Pengembalian'
  ) || bast.peminjaman.verifikasi_fisik[0];

  // Generate QR Code data URL for Kasubag signature
  // Encodes: URL or verification token
  const qrSignaturePayload = `BAST-VERIFIED|NO:${bast.nomor_bast}|KASUBAG:${bast.kasubag.nama_lengkap}|SIG:${bast.qr_signature}|DATE:${bast.created_at.toISOString()}`;
  const qrCodeImage = await QRCode.toDataURL(qrSignaturePayload, {
    width: 250,
    margin: 1,
    color: {
      dark: '#034275',
      light: '#ffffff',
    },
  });

  const bastData: BastData = {
    nomor_bast: bast.nomor_bast,
    created_at: bast.created_at,
    qr_signature_token: bast.qr_signature,
    qr_code_image: qrCodeImage,
    pemohon: {
      nama_lengkap: bast.peminjaman.pemohon.nama_lengkap,
      email: bast.peminjaman.pemohon.email,
      no_hp: bast.peminjaman.pemohon.no_hp,
      role: bast.peminjaman.pemohon.role,
      nomor_identitas: bast.peminjaman.pemohon.pemohon_detail?.nomor_identitas,
      instansi_kategori: bast.peminjaman.pemohon.pemohon_detail?.instansi_kategori,
    },
    kasubag: {
      nama_lengkap: bast.kasubag.nama_lengkap,
      email: bast.kasubag.email,
      jabatan: 'Kepala Sub Bagian Umum Poltekimipas',
    },
    staf_inspeksi: pascaVerif
      ? {
          nama_lengkap: pascaVerif.staf?.nama_lengkap || 'Tim Teknis Sarpras',
          created_at: pascaVerif.created_at,
          kondisi_fisik: pascaVerif.kondisi_fisik,
          catatan_inspeksi: pascaVerif.catatan_inspeksi,
        }
      : undefined,
    sarpras: {
      nama_sarpras: bast.peminjaman.sarpras.nama_sarpras,
      kode_aset: bast.peminjaman.sarpras.kode_aset,
      kategori: bast.peminjaman.sarpras.kategori,
      lokasi_plat: bast.peminjaman.sarpras.lokasi_plat,
    },
    peminjaman: {
      kode_transaksi: bast.peminjaman.kode_transaksi,
      tgl_mulai: bast.peminjaman.tgl_mulai,
      tgl_selesai: bast.peminjaman.tgl_selesai,
      maksud_kegiatan: bast.peminjaman.maksud_kegiatan,
    },
  };

  const doc = React.createElement(BastDocument, { data: bastData });
  const buffer = await renderToBuffer(doc as any);

  return {
    buffer,
    nomor_bast: bast.nomor_bast,
  };
}
