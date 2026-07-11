/**
 * Soft Delete Utilities
 * Provides soft delete functionality for Prisma models
 */

import { prisma } from '@/lib/db'
import { logDelete } from './audit-log'

// =====================================================
// Soft Delete Types
// =====================================================

export interface SoftDeleteResult {
  success: boolean
  restored?: boolean
  error?: string
}

// =====================================================
// Generic Soft Delete Functions
// =====================================================

/**
 * Soft delete a record by setting isActive to false
 */
export async function softDelete<T extends keyof Prisma.TypeMap['model']>(
  model: T,
  id: string,
  userId?: string,
  auditEntity?: string
): Promise<SoftDeleteResult> {
  const modelLower = model.toLowerCase()

  try {
    const record = await (prisma as any)[modelLower].findUnique({
      where: { id },
    })

    if (!record) {
      return { success: false, error: 'Record not found' }
    }

    // Check if already deleted
    if (record.isActive === false) {
      return { success: false, error: 'Already deleted' }
    }

    // Soft delete
    await (prisma as any)[modelLower].update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    })

    // Audit log
    if (userId && auditEntity) {
      await logDelete(userId, auditEntity as any, id, { softDelete: true })
    }

    return { success: true }
  } catch (error) {
    console.error(`[SOFT DELETE ERROR] ${model}.update:`, error)
    return { success: false, error: 'Failed to delete' }
  }
}

/**
 * Restore a soft-deleted record
 */
export async function softRestore<T extends keyof Prisma.TypeMap['model']>(
  model: T,
  id: string,
  userId?: string,
  auditEntity?: string
): Promise<SoftDeleteResult> {
  const modelLower = model.toLowerCase()

  try {
    const record = await (prisma as any)[modelLower].findUnique({
      where: { id },
    })

    if (!record) {
      return { success: false, error: 'Record not found' }
    }

    // Check if not deleted
    if (record.isActive !== false) {
      return { success: false, error: 'Not deleted' }
    }

    // Restore
    await (prisma as any)[modelLower].update({
      where: { id },
      data: {
        isActive: true,
        deletedAt: null,
      },
    })

    // Audit log
    if (userId && auditEntity) {
      await logDelete(userId, auditEntity as any, id, { restored: true })
    }

    return { success: true, restored: true }
  } catch (error) {
    console.error(`[SOFT RESTORE ERROR] ${model}.update:`, error)
    return { success: false, error: 'Failed to restore' }
  }
}

/**
 * Hard delete a record (permanent)
 */
export async function hardDelete<T extends keyof Prisma.TypeMap['model']>(
  model: T,
  id: string,
  userId?: string,
  auditEntity?: string
): Promise<SoftDeleteResult> {
  const modelLower = model.toLowerCase()

  try {
    await (prisma as any)[modelLower].delete({
      where: { id },
    })

    // Audit log
    if (userId && auditEntity) {
      await logDelete(userId, auditEntity as any, id, { hardDelete: true })
    }

    return { success: true }
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return { success: false, error: 'Record not found' }
    }
    console.error(`[HARD DELETE ERROR] ${model}.delete:`, error)
    return { success: false, error: 'Failed to delete' }
  }
}

// =====================================================
// Model-Specific Soft Delete
// =====================================================

/**
 * Soft delete user
 */
export async function softDeleteUser(
  id: string,
  userId: string
): Promise<SoftDeleteResult> {
  return softDelete('User', id, userId, 'USER')
}

/**
 * Soft delete anggota (user)
 */
export async function softDeleteAnggota(
  id: string,
  userId: string
): Promise<SoftDeleteResult> {
  return softDelete('User', id, userId, 'ANGGOTA')
}

/**
 * Soft delete divisi
 */
export async function softDeleteDivisi(
  id: string,
  userId: string
): Promise<SoftDeleteResult> {
  return softDelete('Divisi', id, userId, 'DIVISI')
}

/**
 * Soft delete program kerja
 */
export async function softDeleteProker(
  id: string,
  userId: string
): Promise<SoftDeleteResult> {
  return softDelete('ProgramKerja', id, userId, 'PROGRAM_KERJA')
}

/**
 * Soft delete surat
 */
export async function softDeleteSurat(
  id: string,
  userId: string
): Promise<SoftDeleteResult> {
  return softDelete('Surat', id, userId, 'SURAT')
}

/**
 * Soft delete calendar event
 */
export async function softDeleteCalendarEvent(
  id: string,
  userId: string
): Promise<SoftDeleteResult> {
  return softDelete('CalendarEvent', id, userId, 'CALENDAR_EVENT')
}

/**
 * Soft delete library book
 */
export async function softDeleteLibraryBook(
  id: string,
  userId: string
): Promise<SoftDeleteResult> {
  return softDelete('LibraryBook', id, userId, 'LIBRARY_BOOK')
}

/**
 * Soft delete post
 */
export async function softDeletePost(
  id: string,
  userId: string
): Promise<SoftDeleteResult> {
  return softDelete('Post', id, userId, 'POST')
}

// =====================================================
// Query Helpers (Auto-Filter Deleted)
// =====================================================

/**
 * Find many with automatic soft delete filter
 */
export async function findManyWithSoftDelete<T extends keyof Prisma.TypeMap['model']>(
  model: T,
  where: any = {},
  include?: any,
  options?: { includeDeleted?: boolean }
): Promise<any[]> {
  const modelLower = model.toLowerCase()

  if (!options?.includeDeleted) {
    where.isActive = where.isActive !== undefined ? where.isActive : true
  }

  return (prisma as any)[modelLower].findMany({
    where,
    include,
  })
}

/**
 * Find unique with automatic soft delete filter
 */
export async function findUniqueWithSoftDelete<T extends keyof Prisma.TypeMap['model']>(
  model: T,
  where: any,
  include?: any,
  options?: { includeDeleted?: boolean }
): Promise<any | null> {
  const modelLower = model.toLowerCase()

  if (!options?.includeDeleted) {
    where.isActive = where.isActive !== undefined ? where.isActive : true
  }

  return (prisma as any)[modelLower].findUnique({
    where,
    include,
  })
}

// =====================================================
// Prisma Client Extension
// =====================================================

/**
 * Extended Prisma client with soft delete methods
 */
export const extendedPrisma = prisma.$extends({
  model: {
    $allModels: {
      async softDelete(this: any, where: any, userId?: string) {
        const context = Prisma.getExtensionContext(this)
        const modelName = context.name

        const record = await this.findUnique({ where })
        if (!record) throw new Error('Record not found')

        return this.update({
          where,
          data: {
            isActive: false,
            deletedAt: new Date(),
          },
        })
      },

      async softRestore(this: any, where: any) {
        return this.update({
          where,
          data: {
            isActive: true,
            deletedAt: null,
          },
        })
      },

      async findManyWithDeleted(this: any, where: any = {}) {
        return this.findMany({ where })
      },

      async findUniqueWithDeleted(this: any, where: any) {
        return this.findUnique({ where })
      },
    },
  },
})

// Need Prisma for the type
import { Prisma } from '@prisma/client'
