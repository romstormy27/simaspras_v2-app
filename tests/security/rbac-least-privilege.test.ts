import { describe, it, expect } from 'vitest';

/**
 * Matriks Hak Akses & Penegakan Least Privilege (PRD §3.2 & Seksi 15, 18)
 */
type Role = 'Dosen' | 'Taruna' | 'BPSDM' | 'Kementerian' | 'Alumni' | 'Kabag' | 'Kasubag' | 'Staf' | 'Admin';

interface AccessRule {
  canManageSarpras: boolean;
  canVerifyPhysical: boolean;
  canApproveBooking: boolean;
  canIssueBAST: boolean;
  canViewExecutiveDashboard: boolean;
  canManageUsersAndRBAC: boolean;
}

function getPermissions(role: Role): AccessRule {
  const isPemohon = ['Dosen', 'Taruna', 'BPSDM', 'Kementerian', 'Alumni'].includes(role);

  return {
    canManageSarpras: role === 'Admin',
    canVerifyPhysical: role === 'Staf' || role === 'Admin',
    canApproveBooking: role === 'Kasubag' || role === 'Admin',
    canIssueBAST: role === 'Kasubag' || role === 'Admin',
    canViewExecutiveDashboard: role === 'Kabag' || role === 'Kasubag' || role === 'Admin',
    canManageUsersAndRBAC: role === 'Admin',
  };
}

function canRevokeAdminRole(currentAdminId: string, targetId: string, newRole: Role, activeAdminCount: number): { allowed: boolean; reason?: string } {
  if (currentAdminId === targetId && newRole !== 'Admin') {
    if (activeAdminCount <= 1) {
      return {
        allowed: false,
        reason: 'Tidak dapat mencabut role Admin tunggal pada sistem',
      };
    }
  }
  return { allowed: true };
}

describe('TASK-9.3 / Seksi 18: Audit Keamanan & Prinsip Least Privilege', () => {
  describe('Penegakan Pembatasan Akses Role Pemohon', () => {
    const pemohonRoles: Role[] = ['Dosen', 'Taruna', 'BPSDM', 'Kementerian', 'Alumni'];

    it.each(pemohonRoles)('role %s TIDAK BOLEH mengelola master sarpras (tambah/edit/hapus)', (role) => {
      const perms = getPermissions(role);
      expect(perms.canManageSarpras).toBe(false);
    });

    it.each(pemohonRoles)('role %s TIDAK BOLEH memproses approval/rejection transaksi', (role) => {
      const perms = getPermissions(role);
      expect(perms.canApproveBooking).toBe(false);
    });

    it.each(pemohonRoles)('role %s TIDAK BOLEH menginput verifikasi fisik lapangan', (role) => {
      const perms = getPermissions(role);
      expect(perms.canVerifyPhysical).toBe(false);
    });

    it.each(pemohonRoles)('role %s TIDAK BOLEH menandatangani dan menerbitkan dokumen BAST Digital', (role) => {
      const perms = getPermissions(role);
      expect(perms.canIssueBAST).toBe(false);
    });

    it.each(pemohonRoles)('role %s TIDAK BOLEH mengelola akun pengguna atau mutasi role RBAC', (role) => {
      const perms = getPermissions(role);
      expect(perms.canManageUsersAndRBAC).toBe(false);
    });
  });

  describe('Pemisahan Tugas Operasional (Separation of Duties)', () => {
    it('Staf Umum memiliki wewenang verifikasi fisik tetapi TIDAK memiliki hak Approval peminjaman', () => {
      const stafPerms = getPermissions('Staf');
      expect(stafPerms.canVerifyPhysical).toBe(true);
      expect(stafPerms.canApproveBooking).toBe(false);
    });

    it('Kasubag Umum memiliki hak Approval dan BAST tetapi TIDAK mengelola RBAC Admin', () => {
      const kasubagPerms = getPermissions('Kasubag');
      expect(kasubagPerms.canApproveBooking).toBe(true);
      expect(kasubagPerms.canIssueBAST).toBe(true);
      expect(kasubagPerms.canManageUsersAndRBAC).toBe(false);
    });

    it('Kabag Keuangan & Umum memiliki hak akses Dasbor Eksekutif Monitoring', () => {
      const kabagPerms = getPermissions('Kabag');
      expect(kabagPerms.canViewExecutiveDashboard).toBe(true);
    });
  });

  describe('Integritas Tata Kelola: Pencegahan Self-Lockout Admin', () => {
    it('harus menolak pencabutan hak Admin oleh dirinya sendiri jika merupakan satu-satunya Admin aktif', () => {
      const check = canRevokeAdminRole('usr-admin-1', 'usr-admin-1', 'Dosen', 1);
      expect(check.allowed).toBe(false);
      expect(check.reason).toBe('Tidak dapat mencabut role Admin tunggal pada sistem');
    });

    it('harus mengizinkan pencabutan role Admin jika masih ada Admin aktif lain di sistem', () => {
      const check = canRevokeAdminRole('usr-admin-1', 'usr-admin-1', 'Dosen', 2);
      expect(check.allowed).toBe(true);
    });

    it('harus mengizinkan pengubahan role pengguna lain oleh Admin', () => {
      const check = canRevokeAdminRole('usr-admin-1', 'usr-dosen-1', 'BPSDM', 1);
      expect(check.allowed).toBe(true);
    });
  });
});
