import { prisma } from '@/lib/db'
import { hasPermission, isSuperAdminRole } from '@/lib/auth'

/**
 * Check if a user can manage or edit a specific program kerja
 * (super admin, admin, ketua, sekretaris, holder of proker.edit, PIC of the proker, or active committee member)
 */
export async function canManageProker(
  userId: string,
  roleName: string,
  prokerId: string
): Promise<boolean> {
  const normalizedRole = (roleName || '').toLowerCase()
  if (isSuperAdminRole(normalizedRole) || ['admin', 'ketua', 'sekretaris'].includes(normalizedRole)) {
    return true
  }

  if (await hasPermission(userId, 'proker.edit')) {
    return true
  }

  const proker = await prisma.programKerja.findUnique({
    where: { id: prokerId },
    select: { picId: true },
  })

  if (proker && proker.picId === userId) {
    return true
  }

  const isPanitia = await prisma.panitiaProker.findFirst({
    where: { programKerjaId: prokerId, userId },
  })

  return Boolean(isPanitia)
}

/**
 * Check if a user can approve/review financial proposals or LPJ
 * Super Admin, admin, ketua, bendahara, or holder of proposal.review / keuangan.approve
 */
export async function canReviewProkerFinance(
  userId: string,
  roleName: string
): Promise<boolean> {
  const normalizedRole = (roleName || '').toLowerCase()
  if (isSuperAdminRole(normalizedRole) || ['admin', 'ketua', 'bendahara'].includes(normalizedRole)) {
    return true
  }

  if (
    (await hasPermission(userId, 'proposal.review')) ||
    (await hasPermission(userId, 'keuangan.approve'))
  ) {
    return true
  }

  return false
}

