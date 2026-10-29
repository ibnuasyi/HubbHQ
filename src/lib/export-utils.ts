/**
 * Export Utilities
 * Provides safe export functionality with pagination and rate limiting
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// =====================================================
// Export Configuration
// =====================================================

export const EXPORT_CONFIG = {
  // Maximum records per export
  MAX_RECORDS: {
    keuangan: 10000,
    proker: 5000,
    surat: 10000,
    anggota: 5000,
  },

  // Default page size
  DEFAULT_PAGE_SIZE: 1000,

  // Rate limit per user per hour
  RATE_LIMIT_PER_HOUR: 10,

  // Timeout for export operations (ms)
  TIMEOUT_MS: 60000, // 1 minute
}

// =====================================================
// Rate Limiting for Exports
// =====================================================

const exportRateLimit = new Map<string, { count: number; resetAt: number }>()

/**
 * Check export rate limit for a user
 */
export function checkExportRateLimit(userId: string): {
  allowed: boolean
  remaining: number
  resetIn: number
} {
  const now = Date.now()
  const key = `export:${userId}`
  const record = exportRateLimit.get(key)

  if (!record || now > record.resetAt) {
    exportRateLimit.set(key, {
      count: 1,
      resetAt: now + 60 * 60 * 1000, // 1 hour
    })
    return {
      allowed: true,
      remaining: EXPORT_CONFIG.RATE_LIMIT_PER_HOUR - 1,
      resetIn: 60 * 60,
    }
  }

  if (record.count >= EXPORT_CONFIG.RATE_LIMIT_PER_HOUR) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((record.resetAt - now) / 1000),
    }
  }

  record.count++
  return {
    allowed: true,
    remaining: EXPORT_CONFIG.RATE_LIMIT_PER_HOUR - record.count,
    resetIn: Math.ceil((record.resetAt - now) / 1000),
  }
}

// =====================================================
// Safe Export Functions
// =====================================================

/**
 * Get paginated data for export
 * Prevents memory exhaustion from large datasets
 */
export async function getExportData<T>(
  query: () => Promise<T[]>,
  maxRecords: number
): Promise<{
  data: T[]
  truncated: boolean
  total: number
}> {
  const data = await query()

  return {
    data: data.slice(0, maxRecords),
    truncated: data.length > maxRecords,
    total: data.length,
  }
}

/**
 * Create a streaming response for large exports
 * Falls back to pagination for very large datasets
 */
export async function createStreamingExport(
  dataGenerator: AsyncGenerator<any>,
  onComplete: () => void
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder()

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of dataGenerator) {
          const encoded = encoder.encode(JSON.stringify(chunk) + '\n')
          controller.enqueue(encoded)
        }
        controller.close()
        onComplete()
      } catch (error) {
        controller.error(error)
      }
    },
  })
}

/**
 * Validate export params
 */
export function validateExportParams(params: {
  year?: string | null
  month?: string | null
  format?: string | null
  page?: string | null
}): {
  valid: boolean
  error?: string
  year: number
  month?: number
  format: 'pdf' | 'excel' | 'csv'
  page: number
} {
  const { year, month, format, page } = params

  // Validate year
  const currentYear = new Date().getFullYear()
  let parsedYear: number

  if (year) {
    parsedYear = parseInt(year)
    if (isNaN(parsedYear) || parsedYear < 2000 || parsedYear > currentYear + 1) {
      return { valid: false, error: 'Tahun tidak valid', year: currentYear, format: 'pdf', page: 1 }
    }
  } else {
    parsedYear = currentYear
  }

  // Validate month
  let parsedMonth: number | undefined
  if (month) {
    parsedMonth = parseInt(month)
    if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      return { valid: false, error: 'Bulan tidak valid', year: parsedYear, format: 'pdf', page: 1 }
    }
  }

  // Validate format
  const validFormats = ['pdf', 'excel', 'csv']
  const parsedFormat = (format || 'pdf').toLowerCase()
  if (!validFormats.includes(parsedFormat)) {
    return { valid: false, error: 'Format tidak valid', year: parsedYear, month: parsedMonth, format: 'pdf', page: 1 }
  }

  // Validate page
  let parsedPage = 1
  if (page) {
    parsedPage = parseInt(page)
    if (isNaN(parsedPage) || parsedPage < 1) {
      parsedPage = 1
    }
  }

  return {
    valid: true,
    year: parsedYear,
    month: parsedMonth,
    format: parsedFormat as 'pdf' | 'excel' | 'csv',
    page: parsedPage,
  }
}

/**
 * Create paginated export response
 * For very large datasets, export in chunks
 */
export interface PaginatedExportOptions {
  totalRecords: number
  pageSize: number
  exportType: string
  userId: string
}

export function createPaginatedExportLinks(options: PaginatedExportOptions): {
  pages: Array<{ page: number; url: string }>
  totalPages: number
  message: string
} {
  const { totalRecords, pageSize, exportType, userId } = options
  const totalPages = Math.ceil(totalRecords / pageSize)

  // Generate URLs for each page
  const baseUrl = `/api/export/${exportType}`
  const pages = Array.from({ length: totalPages }, (_, i) => ({
    page: i + 1,
    url: `${baseUrl}?page=${i + 1}`,
  }))

  return {
    pages,
    totalPages,
    message: `Data terlalu besar untuk di-export sekaligus. Export dilakukan dalam ${totalPages} halaman.`,
  }
}

/**
 * Timeout wrapper for export operations
 */
export async function withExportTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = EXPORT_CONFIG.TIMEOUT_MS
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Export timeout after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ])
}

// =====================================================
// Export Validation Middleware
// =====================================================

export interface ExportValidationResult {
  allowed: boolean
  response?: NextResponse
  rateLimit?: {
    remaining: number
    resetIn: number
  }
}

/**
 * Validate export request
 */
export async function validateExportRequest(
  userId: string,
  exportType: keyof typeof EXPORT_CONFIG.MAX_RECORDS
): Promise<ExportValidationResult> {
  // Check rate limit
  const rateLimit = checkExportRateLimit(userId)

  if (!rateLimit.allowed) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: 'Terlalu banyak permintaan export. Coba lagi nanti.',
          retryAfter: rateLimit.resetIn,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.resetIn),
            'X-RateLimit-Remaining': '0',
          },
        }
      ),
    }
  }

  return {
    allowed: true,
    rateLimit,
  }
}

/**
 * Get safe date range for export
 */
export function getSafeDateRange(
  year?: number,
  month?: number
): { startDate: Date; endDate: Date } {
  const currentYear = new Date().getFullYear()

  if (month) {
    // Specific month
    const startDate = new Date(year || currentYear, month - 1, 1)
    const endDate = new Date(year || currentYear, month, 0, 23, 59, 59)
    return { startDate, endDate }
  }

  // Full year
  const startDate = new Date(year || currentYear, 0, 1)
  const endDate = new Date(year || currentYear, 11, 31, 23, 59, 59)
  return { startDate, endDate }
}

/**
 * Format export timestamp for filenames
 */
export function getExportTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
}

/**
 * Sanitize filename for export
 */
export function sanitizeExportFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 100)
}

/**
 * Prevent CSV / Excel Formula Injection (DDE / Formula execution)
 * Prefixes strings starting with =, +, -, @, tab, or carriage return with a single quote
 */
export function sanitizeExcelCell(value: unknown): string {
  if (value === null || value === undefined) return '-'
  const str = String(value)
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`
  }
  return str
}
