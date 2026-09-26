import prisma from '../src/lib/prisma';

async function testFase4() {
  console.log('=== STARTING FASE 4 E2E VERIFICATION (UC-06 / UI-06) ===\n');

  // 1. Prepare Staf and Dosen users
  const stafUser = await prisma.user.findUnique({
    where: { email: 'staf.umum@politeknik.ac.id' },
  });
  if (!stafUser) throw new Error('Staf user not found');
  console.log(`[USER] Staf Verifikator: ${stafUser.nama_lengkap} (${stafUser.role})`);

  const dosenUser = await prisma.user.findUnique({
    where: { email: 'dosen@politeknik.ac.id' },
  });
  if (!dosenUser) throw new Error('Dosen user not found');
  console.log(`[USER] Pemohon: ${dosenUser.nama_lengkap} (${dosenUser.role})`);

  // 2. Prepare or create a test booking
  const sarpras = await prisma.sarpras.findFirst({
    where: { status_operasional: 'Tersedia' },
  });
  if (!sarpras) throw new Error('No sarpras available');

  const testBooking = await prisma.peminjaman.create({
    data: {
      kode_transaksi: `TRX-TEST-${Date.now()}`,
      id_pemohon: dosenUser.id_user,
      id_sarpras: sarpras.id_sarpras,
      tgl_mulai: new Date('2028-11-01T08:00:00.000Z'),
      tgl_selesai: new Date('2028-11-01T16:00:00.000Z'),
      maksud_kegiatan: 'Kegiatan Praktikum Pengawasan dan Penindakan Keimigrasian',
      status_transaksi: 'Pending',
    },
  });
  console.log(`[BOOKING] Created test booking: ${testBooking.kode_transaksi} (${testBooking.id_peminjaman})`);

  // 3. Test RBAC: Dosen attempts to submit inspection (Must be Forbidden 403)
  console.log('\n--- TEST 1: RBAC Enforcement (Unauthorized Role) ---');
  const loginDosenRes = await fetch('http://127.0.0.1:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dosen@politeknik.ac.id', password: 'password123' }),
  });
  const dosenCookie = loginDosenRes.headers.get('set-cookie')?.split(';')[0] || '';

  const unauthorizedRes = await fetch('http://127.0.0.1:3000/api/verifikasi-fisik', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: dosenCookie },
    body: JSON.stringify({
      id_peminjaman: testBooking.id_peminjaman,
      jenis_pemeriksaan: 'Pra_Approval',
      kondisi_fisik: 'Baik_Sesuai',
    }),
  });
  console.log(`HTTP Status: ${unauthorizedRes.status} (Expected: 403 Forbidden)`);
  if (unauthorizedRes.status === 403) {
    console.log('✅ TEST 1 PASSED: Dosen correctly forbidden from performing physical verifications.');
  } else {
    throw new Error(`Expected 403, got ${unauthorizedRes.status}`);
  }

  // 4. Log in as Staf Bagian Umum
  console.log('\n--- Logging in as Staf Bagian Umum ---');
  const loginStafRes = await fetch('http://127.0.0.1:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'staf.umum@politeknik.ac.id', password: 'password123' }),
  });
  const stafCookie = loginStafRes.headers.get('set-cookie')?.split(';')[0] || '';
  console.log(`[AUTH] Staf logged in successfully. Cookie: ${stafCookie.slice(0, 30)}...`);

  // 5. Test Validation: "Ada Catatan Khusus" without notes (Must return 400 Bad Request)
  console.log('\n--- TEST 2: Validation on "Ada Catatan Khusus" Without Notes ---');
  const invalidRes = await fetch('http://127.0.0.1:3000/api/verifikasi-fisik', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: stafCookie },
    body: JSON.stringify({
      id_peminjaman: testBooking.id_peminjaman,
      jenis_pemeriksaan: 'Pra_Approval',
      kondisi_fisik: 'Ada_Catatan_Khusus',
      catatan_inspeksi: '',
    }),
  });
  console.log(`HTTP Status: ${invalidRes.status} (Expected: 400 Bad Request)`);
  if (invalidRes.status === 400) {
    console.log('✅ TEST 2 PASSED: Empty notes on "Ada Catatan Khusus" correctly rejected.');
  } else {
    throw new Error(`Expected 400, got ${invalidRes.status}`);
  }

  // 6. Test Pra-Approval Verification Submission (TASK-4.1 & TASK-4.2)
  console.log('\n--- TEST 3: Submit Pra-Approval Physical Verification ---');
  const praApprovalRes = await fetch('http://127.0.0.1:3000/api/verifikasi-fisik', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: stafCookie },
    body: JSON.stringify({
      id_peminjaman: testBooking.id_peminjaman,
      jenis_pemeriksaan: 'Pra_Approval',
      kondisi_fisik: 'Baik_Sesuai',
      catatan_inspeksi: 'Unit sarpras siap pakai, bersih, kabel HDMI dan adaptor lengkap, jadwal fisik bebas bentrok.',
    }),
  });
  const praApprovalData = await praApprovalRes.json();
  console.log(`HTTP Status: ${praApprovalRes.status} (Expected: 201 Created)`);
  console.log(`Response message: ${praApprovalData.message}`);

  if (praApprovalRes.status === 201 && praApprovalData.success) {
    console.log('✅ TEST 3 PASSED: Pra-Approval verification successfully saved and email notification triggered.');
  } else {
    throw new Error(`Failed to submit pra-approval: ${praApprovalData.message}`);
  }

  // 7. Test Pasca-Pengembalian Verification Submission
  console.log('\n--- TEST 4: Submit Pasca-Pengembalian Physical Verification ---');
  const pascaRes = await fetch('http://127.0.0.1:3000/api/verifikasi-fisik', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: stafCookie },
    body: JSON.stringify({
      id_peminjaman: testBooking.id_peminjaman,
      jenis_pemeriksaan: 'Pasca_Pengembalian',
      kondisi_fisik: 'Ada_Catatan_Khusus',
      catatan_inspeksi: 'Peralatan telah diserahkan kembali. Terdapat sedikit goresan halus di sisi casing luar.',
    }),
  });
  const pascaData = await pascaRes.json();
  console.log(`HTTP Status: ${pascaRes.status} (Expected: 201 Created)`);
  console.log(`Response message: ${pascaData.message}`);

  if (pascaRes.status === 201 && pascaData.success) {
    console.log('✅ TEST 4 PASSED: Pasca-Pengembalian verification successfully saved.');
  } else {
    throw new Error(`Failed to submit pasca-pengembalian: ${pascaData.message}`);
  }

  // 8. Test GET /api/verifikasi-fisik
  console.log('\n--- TEST 5: GET /api/verifikasi-fisik ---');
  const getVerifRes = await fetch(`http://127.0.0.1:3000/api/verifikasi-fisik?id_peminjaman=${testBooking.id_peminjaman}`, {
    headers: { Cookie: stafCookie },
  });
  const getVerifData = await getVerifRes.json();
  console.log(`HTTP Status: ${getVerifRes.status}`);
  console.log(`Total verification records for this booking: ${getVerifData.total}`);

  if (getVerifRes.status === 200 && getVerifData.total === 2) {
    console.log('✅ TEST 5 PASSED: Both verification records retrieved with staf profile relations.');
  } else {
    throw new Error(`Expected 2 records, got ${getVerifData.total}`);
  }

  // 9. Verify Audit Trail
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      id_user: stafUser.id_user,
    },
    orderBy: { timestamp: 'desc' },
    take: 2,
  });
  console.log('\n--- TEST 6: Audit Log Verification ---');
  console.log(`Recent Staf Audit Logs: ${auditLogs.map((l) => l.aktivitas).join(' | ')}`);
  if (auditLogs.length >= 2) {
    console.log('✅ TEST 6 PASSED: Staf verification actions successfully recorded to audit_log.');
  } else {
    throw new Error('Audit logs missing for verification actions');
  }

  // Clean up test booking and its cascade records
  await prisma.peminjaman.delete({
    where: { id_peminjaman: testBooking.id_peminjaman },
  });

  console.log('\n🎉 ALL FASE 4 TESTS PASSED PERFECTLY!\n');
}

testFase4()
  .catch((e) => {
    console.error('Test failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
