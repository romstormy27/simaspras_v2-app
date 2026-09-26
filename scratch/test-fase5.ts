import prisma from '../src/lib/prisma';

async function testFase5() {
  console.log('=== STARTING FASE 5 E2E VERIFICATION (UC-05 / UI-05 / Tiket QR) ===\n');

  // 1. Prepare users: Dosen, Staf, Kasubag
  const dosen = await prisma.user.findUnique({ where: { email: 'dosen@politeknik.ac.id' } });
  const staf = await prisma.user.findUnique({ where: { email: 'staf.umum@politeknik.ac.id' } });
  const kasubag = await prisma.user.findUnique({ where: { email: 'kasubag.umum@politeknik.ac.id' } });

  if (!dosen || !staf || !kasubag) throw new Error('Missing seed users');

  console.log(`[USER] Pemohon: ${dosen.nama_lengkap} (${dosen.role})`);
  console.log(`[USER] Staf: ${staf.nama_lengkap} (${staf.role})`);
  console.log(`[USER] Kasubag Approver: ${kasubag.nama_lengkap} (${kasubag.role})`);

  // 2. Select available Sarpras
  const sarpras = await prisma.sarpras.findFirst({ where: { status_operasional: 'Tersedia' } });
  if (!sarpras) throw new Error('No sarpras available');

  // 3. Create test pending booking 1
  const booking1 = await prisma.peminjaman.create({
    data: {
      kode_transaksi: `TRX-TEST-APP1-${Date.now()}`,
      id_pemohon: dosen.id_user,
      id_sarpras: sarpras.id_sarpras,
      tgl_mulai: new Date('2028-12-01T08:00:00.000Z'),
      tgl_selesai: new Date('2028-12-01T14:00:00.000Z'),
      maksud_kegiatan: 'Simulasi Sidang Akademik & Ujian Kompetensi Keimigrasian',
      status_transaksi: 'Pending',
    },
  });
  console.log(`\n[BOOKING 1] Created: ${booking1.kode_transaksi} (${booking1.id_peminjaman})`);

  // Staf performs Pra-Approval verification
  await prisma.verifikasiFisik.create({
    data: {
      id_peminjaman: booking1.id_peminjaman,
      id_staf: staf.id_user,
      jenis_pemeriksaan: 'Pra_Approval',
      kondisi_fisik: 'Baik_Sesuai',
      catatan_inspeksi: 'Fasilitas dan kelengkapan audio-visual telah siap pakai.',
    },
  });
  console.log('[VERIFIKASI] Staf Pra-Approval record saved.');

  // 4. Test RBAC: Non-Kasubag (Dosen) attempts to approve (Must be 403 Forbidden)
  console.log('\n--- TEST 1: RBAC Guard on Approval Endpoint ---');
  const loginDosenRes = await fetch('http://127.0.0.1:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dosen@politeknik.ac.id', password: 'password123' }),
  });
  const dosenCookie = loginDosenRes.headers.get('set-cookie')?.split(';')[0] || '';

  const unauthorizedApproval = await fetch(`http://127.0.0.1:3000/api/peminjaman/${booking1.id_peminjaman}/approval`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: dosenCookie },
    body: JSON.stringify({ decision: 'Setujui' }),
  });
  console.log(`HTTP Status: ${unauthorizedApproval.status} (Expected: 403 Forbidden)`);
  if (unauthorizedApproval.status === 403) {
    console.log('✅ TEST 1 PASSED: Dosen forbidden from approving bookings.');
  } else {
    throw new Error(`Expected 403, got ${unauthorizedApproval.status}`);
  }

  // 5. Log in as Kasubag Umum
  console.log('\n--- Logging in as Kasubag Umum ---');
  const loginKasubagRes = await fetch('http://127.0.0.1:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'kasubag.umum@politeknik.ac.id', password: 'password123' }),
  });
  const kasubagCookie = loginKasubagRes.headers.get('set-cookie')?.split(';')[0] || '';
  console.log(`[AUTH] Kasubag logged in successfully. Cookie: ${kasubagCookie.slice(0, 30)}...`);

  // 6. Test Approval Flow (TASK-5.1 & TASK-5.2)
  console.log('\n--- TEST 2: Kasubag Approval & QR Ticket Issuance ---');
  const approveRes = await fetch(`http://127.0.0.1:3000/api/peminjaman/${booking1.id_peminjaman}/approval`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: kasubagCookie },
    body: JSON.stringify({
      decision: 'Setujui',
      catatan_approver: 'Disetujui. Harap menjaga kebersihan dan berkoordinasi dengan Staf Sarpras.',
    }),
  });
  const approveData = await approveRes.json();
  console.log(`HTTP Status: ${approveRes.status} (Expected: 200 OK)`);
  console.log(`Response message: ${approveData.message}`);

  if (approveRes.status !== 200 || !approveData.success) {
    throw new Error(`Approval failed: ${approveData.message}`);
  }

  // Verify in Database
  const updatedBooking1 = await prisma.peminjaman.findUnique({
    where: { id_peminjaman: booking1.id_peminjaman },
    include: { tiket_digital: true },
  });

  if (
    updatedBooking1?.status_transaksi === 'Disetujui' &&
    updatedBooking1.id_approver === kasubag.id_user &&
    updatedBooking1.tiket_digital?.status_tiket === 'Aktif'
  ) {
    console.log(`✅ TEST 2 PASSED: Booking approved! Ticket QR Token: ${updatedBooking1.tiket_digital.kode_qr}`);
  } else {
    throw new Error('Database verification failed for approval');
  }

  // 7. Test Tiket Digital & QR Image Generation Endpoint (TASK-5.3)
  console.log('\n--- TEST 3: Digital Ticket & QR Code Data URL Generation ---');
  const tiketRes = await fetch(`http://127.0.0.1:3000/api/peminjaman/${booking1.id_peminjaman}/tiket`, {
    headers: { Cookie: dosenCookie },
  });
  const tiketData = await tiketRes.json();
  console.log(`HTTP Status: ${tiketRes.status} (Expected: 200 OK)`);
  console.log(`Kode Tiket: ${tiketData.data?.kode_qr}`);
  console.log(`QR Image format: ${tiketData.data?.qr_image?.slice(0, 35)}...`);

  if (tiketRes.status === 200 && tiketData.data?.qr_image?.startsWith('data:image/png;base64,')) {
    console.log('✅ TEST 3 PASSED: High-resolution QR Code base64 image generated successfully!');
  } else {
    throw new Error('Digital ticket QR image generation failed');
  }

  // 8. Test Rejection Flow & Automatic Slot Release (TASK-5.2)
  console.log('\n--- TEST 4: Kasubag Rejection & Calendar Slot Release ---');
  const booking2 = await prisma.peminjaman.create({
    data: {
      kode_transaksi: `TRX-TEST-REJ2-${Date.now()}`,
      id_pemohon: dosen.id_user,
      id_sarpras: sarpras.id_sarpras,
      tgl_mulai: new Date('2028-12-05T08:00:00.000Z'),
      tgl_selesai: new Date('2028-12-05T12:00:00.000Z'),
      maksud_kegiatan: 'Rapat Internal Taruna',
      status_transaksi: 'Pending',
    },
  });

  const rejectRes = await fetch(`http://127.0.0.1:3000/api/peminjaman/${booking2.id_peminjaman}/approval`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: kasubagCookie },
    body: JSON.stringify({
      decision: 'Tolak',
      alasan_penolakan: 'Fasilitas digunakan untuk kegiatan mendadak Pimpinan Politeknik.',
    }),
  });
  const rejectData = await rejectRes.json();
  console.log(`HTTP Status: ${rejectRes.status} (Expected: 200 OK)`);
  console.log(`Response message: ${rejectData.message}`);

  if (rejectRes.status !== 200 || !rejectData.success) {
    throw new Error(`Rejection failed: ${rejectData.message}`);
  }

  // Verify slot is now unlocked: new booking on same slot must succeed!
  const rebookRes = await fetch('http://127.0.0.1:3000/api/peminjaman', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: dosenCookie },
    body: JSON.stringify({
      id_sarpras: sarpras.id_sarpras,
      tgl_mulai: new Date('2028-12-05T08:00:00.000Z').toISOString(),
      tgl_selesai: new Date('2028-12-05T12:00:00.000Z').toISOString(),
      maksud_kegiatan: 'Rapat Pengganti setelah slot ditolak',
      pakta_integritas: true,
    }),
  });
  const rebookData = await rebookRes.json();
  console.log(`Re-booking HTTP Status: ${rebookRes.status} (Expected: 201 Created)`);

  if (rebookRes.status === 201 && rebookData.success) {
    console.log('✅ TEST 4 PASSED: Rejection updated status to Ditolak and freed calendar slot successfully!');
  } else {
    throw new Error(`Expected slot to be freed after rejection, but got: ${rebookData.message}`);
  }

  // 9. Clean up test records
  await prisma.peminjaman.deleteMany({
    where: {
      id_peminjaman: {
        in: [booking1.id_peminjaman, booking2.id_peminjaman, rebookData.data?.id_peminjaman].filter(Boolean),
      },
    },
  });

  console.log('\n🎉 ALL FASE 5 TESTS PASSED PERFECTLY!\n');
}

testFase5()
  .catch((e) => {
    console.error('Test failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
