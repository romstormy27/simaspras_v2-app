import prisma from './prisma';

interface LogAuditParams {
  id_user?: string | null;
  aktivitas: string;
  ip_address?: string | null;
}

export async function logAudit({ id_user, aktivitas, ip_address }: LogAuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        id_user: id_user || null,
        aktivitas,
        ip_address: ip_address || null,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
    return null;
  }
}
