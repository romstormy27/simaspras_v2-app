import prisma from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function testFase3() {
  console.log('=== STARTING FASE 3 E2E VERIFICATION ===\n');

  // 1. Check or prepare user Dosen
  let user = await prisma.user.findUnique({
    where: { email: 'dosen@politeknik.ac.id' },
  });

  if (!user) {
    const pwHash = await bcrypt.hash('password123', 10);
    user = await prisma.user.create({
      data: {
        nama_lengkap: 'Dr. H. Ahmad Sudrajat, M.Si',
        email: 'dosen@politeknik.ac.id',
        password_hash: pwHash,
        no_hp: '081234567894',
        role: 'Dosen',
        status_aktivasi: 'Aktif',
      },
    });
  }

  console.log(`[USER] Pemohon: ${user.nama_lengkap} (${user.role} - ID: ${user.id_user})`);

  // 2. Fetch available Sarpras
  const sarpras = await prisma.sarpras.findFirst({
    where: {
      status_operasional: 'Tersedia',
    },
  });

  if (!sarpras) {
    throw new Error('No available sarpras found for testing');
  }

  console.log(`[SARPRAS] Testing with: ${sarpras.nama_sarpras} (Kategori: ${sarpras.kategori}, ID: ${sarpras.id_sarpras})`);

  // Clean up any test transactions for this sarpras on test date (2028-10-15)
  const testDateStart = new Date('2028-10-15T08:00:00.000Z');
  const testDateEnd = new Date('2028-10-15T12:00:00.000Z');
  const testDateOverlapStart = new Date('2028-10-15T10:00:00.000Z');
  const testDateOverlapEnd = new Date('2028-10-15T14:00:00.000Z');

  await prisma.peminjaman.deleteMany({
    where: {
      id_sarpras: sarpras.id_sarpras,
      tgl_mulai: { gte: new Date('2028-10-15T00:00:00.000Z') },
      tgl_selesai: { lte: new Date('2028-10-15T23:59:59.000Z') },
    },
  });

  // 3. Test Booking API via HTTP POST /api/peminjaman
  // We need cookie login first to get the session cookie
  const loginRes = await fetch('http://127.0.0.1:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'dosen@politeknik.ac.id',
      password: 'password123',
    }),
  });

  const cookieHeader = loginRes.headers.get('set-cookie');
  if (!cookieHeader) {
    throw new Error('Failed to get session cookie from login');
  }

  const sessionCookie = cookieHeader.split(';')[0];
  console.log(`[AUTH] Successfully logged in. Session cookie: ${sessionCookie.slice(0, 30)}...`);

  // 4. Test TASK-3.1 & TASK-3.2: Create booking 1
  console.log('\n--- TEST 1: Create Booking (ACID Slot Lock) ---');
  const bookRes1 = await fetch('http://127.0.0.1:3000/api/peminjaman', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      id_sarpras: sarpras.id_sarpras,
      tgl_mulai: testDateStart.toISOString(),
      tgl_selesai: testDateEnd.toISOString(),
      maksud_kegiatan: 'Kuliah Umum Manajemen Keimigrasian & Pemasyarakatan',
      jumlah_unit: 1,
      catatan_teknis: 'Harap siapkan microphone wireless 2 unit',
      pakta_integritas: true,
    }),
  });

  const bookData1 = await bookRes1.json();
  console.log(`HTTP Status: ${bookRes1.status}`);
  console.log(`Response: ${JSON.stringify(bookData1, null, 2)}`);

  if (bookRes1.status !== 201 || !bookData1.success) {
    throw new Error(`Failed to create booking 1: ${bookData1.message}`);
  }

  const booking1 = bookData1.data;
  console.log(`✅ TEST 1 PASSED: Booking created with Kode: ${booking1.kode_transaksi}, Status: ${booking1.status_transaksi}`);

  // 5. Test ACID Overlap prevention: Attempt overlapping slot
  console.log('\n--- TEST 2: Attempt Overlapping Booking (Conflict Prevention) ---');
  const bookResOverlap = await fetch('http://127.0.0.1:3000/api/peminjaman', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      id_sarpras: sarpras.id_sarpras,
      tgl_mulai: testDateOverlapStart.toISOString(),
      tgl_selesai: testDateOverlapEnd.toISOString(),
      maksud_kegiatan: 'Seminar Nasional Pengawasan Orang Asing',
      jumlah_unit: 1,
      pakta_integritas: true,
    }),
  });

  const bookDataOverlap = await bookResOverlap.json();
  console.log(`HTTP Status: ${bookResOverlap.status} (Expected: 409 Conflict)`);
  console.log(`Response message: ${bookDataOverlap.message}`);
  console.log(`Conflict items: ${bookDataOverlap.conflicts?.length}`);
  console.log(`Suggested alternatives: ${bookDataOverlap.saran_alternatif?.length}`);

  if (bookResOverlap.status === 409 && bookDataOverlap.error === 'JADWAL_BENTROK') {
    console.log('✅ TEST 2 PASSED: Double-booking successfully prevented with HTTP 409 Conflict & alternative suggestions!');
  } else {
    throw new Error(`Expected 409 Conflict, got ${bookResOverlap.status}`);
  }

  // 6. Test Self-Cancellation & Slot Release (TASK-3.4)
  console.log('\n--- TEST 3: Self-Cancellation & Slot Release ---');
  const cancelRes = await fetch(`http://127.0.0.1:3000/api/peminjaman/${booking1.id_peminjaman}/batalkan`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      alasan_pembatalan: 'Agenda perkuliahan dialihkan menjadi sesi daring via Zoom.',
    }),
  });

  const cancelData = await cancelRes.json();
  console.log(`HTTP Status: ${cancelRes.status}`);
  console.log(`Response message: ${cancelData.message}`);

  if (cancelRes.status !== 200 || !cancelData.success) {
    throw new Error(`Failed to cancel booking: ${cancelData.message}`);
  }
  console.log('✅ TEST 3 PASSED: Booking cancelled successfully.');

  // 7. Verify slot is now unlocked and available again
  console.log('\n--- TEST 4: Re-booking After Slot Released ---');
  const bookResRebook = await fetch('http://127.0.0.1:3000/api/peminjaman', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      id_sarpras: sarpras.id_sarpras,
      tgl_mulai: testDateOverlapStart.toISOString(),
      tgl_selesai: testDateOverlapEnd.toISOString(),
      maksud_kegiatan: 'Seminar Pengawasan Orang Asing (Slot telah bebas)',
      jumlah_unit: 1,
      pakta_integritas: true,
    }),
  });

  const bookDataRebook = await bookResRebook.json();
  console.log(`HTTP Status: ${bookResRebook.status} (Expected: 201 Created)`);
  if (bookResRebook.status === 201 && bookDataRebook.success) {
    console.log(`✅ TEST 4 PASSED: Slot successfully re-opened! New Kode: ${bookDataRebook.data.kode_transaksi}`);
  } else {
    throw new Error(`Failed to re-book after cancellation: ${bookDataRebook.message}`);
  }

  // 8. Test GET /api/peminjaman (TASK-3.3)
  console.log('\n--- TEST 5: GET /api/peminjaman ---');
  const listRes = await fetch('http://127.0.0.1:3000/api/peminjaman', {
    method: 'GET',
    headers: { Cookie: sessionCookie },
  });
  const listData = await listRes.json();
  console.log(`HTTP Status: ${listRes.status}`);
  console.log(`Total transactions returned for user: ${listData.total}`);
  if (listRes.status === 200 && listData.success && listData.total >= 2) {
    console.log('✅ TEST 5 PASSED: List of transactions retrieved with relations.');
  } else {
    throw new Error('Failed to retrieve transactions list');
  }

  // Clean up test booking
  await prisma.peminjaman.deleteMany({
    where: {
      id_sarpras: sarpras.id_sarpras,
      tgl_mulai: { gte: new Date('2028-10-15T00:00:00.000Z') },
      tgl_selesai: { lte: new Date('2028-10-15T23:59:59.000Z') },
    },
  });

  console.log('\n🎉 ALL FASE 3 TESTS PASSED PERFECTLY!\n');
}

testFase3()
  .catch((e) => {
    console.error('Test failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
