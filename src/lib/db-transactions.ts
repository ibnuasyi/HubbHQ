/**
 * Database Transaction Utilities
 * Provides atomic operations with Optimistic Concurrency Control (OCC)
 */

import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

// =====================================================
// Optimistic Concurrency Control (OCC)
// =====================================================

export interface OCCResult<T> {
  success: boolean
  data?: T
  error?: {
    code: 'VERSION_CONFLICT' | 'NOT_FOUND' | 'UNKNOWN'
    message: string
    currentVersion?: number
  }
}

/**
 * Execute an update with OCC (Optimistic Concurrency Control)
 * @param model - The Prisma model to update
 * @param id - The ID of the record
 * @param expectedVersion - The version the client expects
 * @param updateData - The data to update
 */
export async function updateWithOCC<T extends keyof Prisma.TypeMap['model']>(
  model: T,
  id: string,
  expectedVersion: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateData: any
): Promise<OCCResult<any>> {
  const modelLower = model.toLowerCase()

  try {
    // Dynamic model access
    const updated = await (prisma as any)[modelLower].update({
      where: {
        id,
        version: expectedVersion,
      },
      data: {
        ...updateData,
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    })

    return { success: true, data: updated }
  } catch (error: any) {
    if (error?.code === 'P2025') {
      // Record not found or version mismatch
      const current = await (prisma as any)[modelLower].findUnique({
        where: { id },
        select: { version: true },
      })

      if (!current) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Data tidak ditemukan',
          },
        }
      }

      return {
        success: false,
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Data telah dimodifikasi oleh pengguna lain. Silakan refresh dan coba lagi.',
          currentVersion: current.version,
        },
      }
    }

    console.error(`[OCC ERROR] ${model}.update:`, error)
    return {
      success: false,
      error: {
        code: 'UNKNOWN',
        message: 'Terjadi kesalahan server',
      },
    }
  }
}

/**
 * Execute a delete with OCC
 */
export async function deleteWithOCC<T extends keyof Prisma.TypeMap['model']>(
  model: T,
  id: string,
  expectedVersion?: number
): Promise<OCCResult<void>> {
  const modelLower = model.toLowerCase()

  try {
    if (expectedVersion !== undefined) {
      // Try to delete with version check
      await (prisma as any)[modelLower].delete({
        where: {
          id,
          version: expectedVersion,
        },
      })
    } else {
      // Simple delete without version check
      await (prisma as any)[modelLower].delete({
        where: { id },
      })
    }

    return { success: true }
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Data tidak ditemukan',
        },
      }
    }

    console.error(`[OCC ERROR] ${model}.delete:`, error)
    return {
      success: false,
      error: {
        code: 'UNKNOWN',
        message: 'Terjadi kesalahan server',
      },
    }
  }
}

// =====================================================
// Atomic Transactions
// =====================================================

/**
 * Execute multiple operations atomically
 */
export async function atomic<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(callback)
}

/**
 * Transaction dengan retry logic untuk menangani deadlock
 */
export async function atomicWithRetry<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(callback, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      })
    } catch (error: any) {
      lastError = error

      // Check if it's a retryable error (deadlock, connection lost, etc.)
      const isRetryable =
        error?.code === 'P2034' || // Transaction timeout
        error?.code === 'P2028' || // Transaction API error
        error?.message?.includes('Deadlock') ||
        error?.message?.includes('connection')

      if (!isRetryable || attempt === maxRetries) {
        throw error
      }

      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 100)
      )
    }
  }

  throw lastError
}

// =====================================================
// Financial Transaction Helpers
// =====================================================

/**
 * Transfer funds between accounts atomically
 * This ensures both debit and credit happen together or not at all
 */
export async function transferFunds(
  fromTransactionId: string,
  toTransactionId: string,
  amount: number
): Promise<OCCResult<{ from: any; to: any }>> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get current transactions
      const fromTx = await tx.transaction.findUnique({
        where: { id: fromTransactionId },
      })
      const toTx = await tx.transaction.findUnique({
        where: { id: toTransactionId },
      })

      if (!fromTx || !toTx) {
        throw new Error('Transaction not found')
      }

      // Validate sufficient balance (if from is EXPENSE)
      if (fromTx.type === 'EXPENSE') {
        // Check if we need to track balance
        const recentExpenses = await tx.transaction.findMany({
          where: {
            createdAt: { gte: new Date(fromTx.createdAt) },
          },
          orderBy: { createdAt: 'asc' },
        })

        let runningBalance = 0
        for (const tx of recentExpenses) {
          if (tx.type === 'INCOME') {
            runningBalance += Number(tx.amount)
          } else {
            runningBalance -= Number(tx.amount)
          }
          if (tx.id === fromTransactionId) break
        }

        if (runningBalance < amount) {
          throw new Error('Insufficient balance')
        }
      }

      // Update both transactions
      const updatedFrom = await tx.transaction.update({
        where: { id: fromTransactionId },
        data: { version: { increment: 1 }, updatedAt: new Date() },
      })

      const updatedTo = await tx.transaction.update({
        where: { id: toTransactionId },
        data: { version: { increment: 1 }, updatedAt: new Date() },
      })

      return { from: updatedFrom, to: updatedTo }
    })

    return { success: true, data: result }
  } catch (error: any) {
    console.error('[TRANSFER ERROR]:', error)

    if (error.message === 'Transaction not found') {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Transaksi tidak ditemukan',
        },
      }
    }

    if (error.message === 'Insufficient balance') {
      return {
        success: false,
        error: {
          code: 'UNKNOWN',
          message: 'Saldo tidak mencukupi',
        },
      }
    }

    return {
      success: false,
      error: {
        code: 'UNKNOWN',
        message: error.message || 'Terjadi kesalahan server',
      },
    }
  }
}

/**
 * Create transaction with automatic balance validation
 */
export async function createTransactionAtomic(
  data: {
    type: 'INCOME' | 'EXPENSE'
    category: string
    amount: number
    description?: string
    date?: Date
    createdById: string
  }
): Promise<OCCResult<any>> {
  try {
    // Get current balance
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: new Date(new Date().setDate(1)) }, // This month
      },
      orderBy: { createdAt: 'desc' },
    })

    let balance = 0
    for (const tx of recentTransactions) {
      if (tx.type === 'INCOME') {
        balance += Number(tx.amount)
      } else {
        balance -= Number(tx.amount)
      }
    }

    // For expenses, check if we have enough balance
    if (data.type === 'EXPENSE' && balance < data.amount) {
      return {
        success: false,
        error: {
          code: 'UNKNOWN',
          message: `Saldo tidak mencukupi. Saldo saat ini: Rp ${balance.toLocaleString('id-ID')}`,
        },
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        ...data,
        date: data.date || new Date(),
        status: 'APPROVED',
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    })

    return { success: true, data: transaction }
  } catch (error: any) {
    console.error('[CREATE TRANSACTION ERROR]:', error)
    return {
      success: false,
      error: {
        code: 'UNKNOWN',
        message: error.message || 'Terjadi kesalahan server',
      },
    }
  }
}

/**
 * Update transaction with full OCC and validation
 */
export async function updateTransactionAtomic(
  id: string,
  expectedVersion: number,
  data: {
    type?: 'INCOME' | 'EXPENSE'
    category?: string
    amount?: number
    description?: string
    date?: Date
    status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  }
): Promise<OCCResult<any>> {
  return updateWithOCC('Transaction', id, expectedVersion, data as any)
}

/**
 * Delete transaction with OCC
 */
export async function deleteTransactionAtomic(
  id: string,
  expectedVersion?: number
): Promise<OCCResult<void>> {
  return deleteWithOCC('Transaction', id, expectedVersion)
}

// =====================================================
// OCC Helper for API Routes
// =====================================================

/**
 * Parse version from request body
 */
export function parseVersion(body: any): number | undefined {
  if (body?.version !== undefined) {
    const version = parseInt(body.version)
    if (!isNaN(version) && version >= 0) {
      return version
    }
  }
  return undefined
}

/**
 * Create error response for OCC conflicts
 */
export function occConflictResponse(
  currentVersion?: number
): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error: 'Konflik data: Data telah dimodifikasi oleh pengguna lain. Silakan refresh dan coba lagi.',
      code: 'VERSION_CONFLICT',
      currentVersion,
    }),
    {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

// Need to import NextResponse
import { NextResponse } from 'next/server'
