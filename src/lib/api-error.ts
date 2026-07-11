/**
 * Centralized API Error Handler
 * Prevents information disclosure through error messages
 *
 * In production:
 * - Never expose internal error details (stack traces, DB errors, file paths)
 * - Log detailed errors server-side
 * - Return generic messages to clients
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

// Environment check
const isProduction = process.env.NODE_ENV === 'production'

/**
 * Error codes for client-side handling
 */
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resource
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Operations
  INVALID_OPERATION: 'INVALID_OPERATION',
  OPERATION_FAILED: 'OPERATION_FAILED',

  // Rate limiting
  RATE_LIMITED: 'RATE_LIMITED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]

/**
 * API Error Response format
 */
export interface APIError {
  error: string
  code: ErrorCode
  message: string
  // Only include in development
  details?: any
  // Only include in development
  stack?: string
}

/**
 * Log error with context (server-side only)
 */
export function logError(
  context: string,
  error: unknown,
  metadata?: Record<string, any>
): void {
  const timestamp = new Date().toISOString()
  const errorId = generateErrorId()

  // Log to console with structured format
  console.error(JSON.stringify({
    timestamp,
    errorId,
    context,
    error: serializeError(error),
    metadata,
  }))
}

/**
 * Serialize error for logging
 */
function serializeError(error: unknown): Record<string, any> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  if (typeof error === 'object' && error !== null) {
    return { type: 'object', value: JSON.stringify(error) }
  }

  return { type: typeof error, value: String(error) }
}

/**
 * Generate short error ID for correlation
 */
function generateErrorId(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

/**
 * Get user-friendly error message based on error type
 */
function getSafeErrorMessage(code: ErrorCode): string {
  const messages: Record<ErrorCode, string> = {
    [ErrorCodes.UNAUTHORIZED]: 'Anda harus masuk untuk mengakses sumber daya ini.',
    [ErrorCodes.FORBIDDEN]: 'Anda tidak memiliki izin untuk melakukan operasi ini.',
    [ErrorCodes.INVALID_TOKEN]: 'Token tidak valid atau sudah kadaluarsa.',
    [ErrorCodes.VALIDATION_ERROR]: 'Data yang diberikan tidak valid. Silakan periksa input Anda.',
    [ErrorCodes.INVALID_INPUT]: 'Input yang diberikan tidak valid.',
    [ErrorCodes.NOT_FOUND]: 'Sumber daya yang diminta tidak ditemukan.',
    [ErrorCodes.ALREADY_EXISTS]: 'Sumber daya dengan identitas ini sudah ada.',
    [ErrorCodes.CONFLICT]: 'Terjadi konflik dengan sumber daya yang ada.',
    [ErrorCodes.INVALID_OPERATION]: 'Operasi tidak valid untuk status sumber daya saat ini.',
    [ErrorCodes.OPERATION_FAILED]: 'Operasi gagal dilakukan. Silakan coba lagi.',
    [ErrorCodes.RATE_LIMITED]: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
    [ErrorCodes.TOO_MANY_REQUESTS]: 'Batas permintaan tercapai. Harap tunggu sebentar.',
    [ErrorCodes.INTERNAL_ERROR]: 'Terjadi kesalahan pada server. Tim kami sudah diberitahu.',
    [ErrorCodes.SERVICE_UNAVAILABLE]: 'Layanan sementara tidak tersedia. Silakan coba lagi nanti.',
  }

  return messages[code] || 'Terjadi kesalahan yang tidak diketahui.'
}

/**
 * Extract safe details from error for development
 */
function getErrorDetails(error: unknown): any {
  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return {
      type: 'Prisma',
      code: error.code,
      meta: error.meta,
    }
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    return {
      type: 'Validation',
      errors: error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    }
  }

  // Standard errors
  if (error instanceof Error) {
    return {
      type: 'Error',
      name: error.name,
      message: error.message,
    }
  }

  return { type: typeof error, value: String(error) }
}

/**
 * Known error patterns and their safe responses
 */
export function handleKnownError(error: unknown): NextResponse | null {
  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      // Record not found
      case 'P2025':
        return createErrorResponse(
          ErrorCodes.NOT_FOUND,
          'Record not found',
          404,
          error
        )

      // Unique constraint violation
      case 'P2002':
        return createErrorResponse(
          ErrorCodes.ALREADY_EXISTS,
          'A record with this value already exists',
          409,
          error
        )

      // Foreign key violation
      case 'P2003':
        return createErrorResponse(
          ErrorCodes.INVALID_INPUT,
          'Referenced record does not exist',
          400,
          error
        )

      // Required field not provided
      case 'P2011':
        return createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Required field is missing',
          400,
          error
        )

      default:
        return null // Let it be handled by generic error handler
    }
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    return createErrorResponse(
      ErrorCodes.VALIDATION_ERROR,
      'Invalid input data',
      400,
      error
    )
  }

  // Syntax errors in JSON body
  if (error instanceof SyntaxError && 'body' in (error as any)) {
    return createErrorResponse(
      ErrorCodes.INVALID_INPUT,
      'Invalid JSON in request body',
      400,
      error
    )
  }

  return null
}

/**
 * Create safe error response for client
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  originalError?: unknown
): NextResponse {
  const errorId = generateErrorId()

  // Log detailed error server-side
  logError('API_ERROR', originalError || new Error(message), {
    code,
    message,
    status,
    errorId,
  })

  const response: APIError = {
    error: message,
    code,
    message: getSafeErrorMessage(code),
  }

  // Add request ID for debugging (can be used to search logs)
  const headers: Record<string, string> = {
    'X-Error-Id': errorId,
    'X-Content-Type-Options': 'nosniff',
  }

  // Only include details in development
  if (!isProduction && originalError) {
    response.details = getErrorDetails(originalError)
  }

  return NextResponse.json(response, { status, headers })
}

/**
 * Generic error handler for catch blocks
 * Usage: wrap your try-catch with this
 */
export function handleError(error: unknown, context?: string): NextResponse {
  // Log the original error
  logError(context || 'Unhandled Error', error)

  // Try known error patterns first
  const knownResponse = handleKnownError(error)
  if (knownResponse) return knownResponse

  // Return generic error to client
  return createErrorResponse(
    ErrorCodes.INTERNAL_ERROR,
    'An unexpected error occurred',
    500,
    error
  )
}

/**
 * Validate required fields and return error if missing
 */
export function validateRequiredFields(
  data: Record<string, any>,
  fields: string[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = []

  for (const field of fields) {
    const value = data[field]
    if (value === undefined || value === null || value === '') {
      missing.push(field)
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

/**
 * Create validation error response
 */
export function createValidationError(missingFields: string[]): NextResponse {
  return createErrorResponse(
    ErrorCodes.VALIDATION_ERROR,
    `Missing required fields: ${missingFields.join(', ')}`,
    400
  )
}
