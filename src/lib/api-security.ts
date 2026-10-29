/**
 * API Security Utilities
 * Centralized security helpers for all API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// =====================================================
// Rate Limiting
// =====================================================

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

const DEFAULT_WINDOW_MS = 60 * 1000 // 1 minute
const DEFAULT_MAX_REQUESTS = 100

interface RateLimitConfig {
  windowMs?: number
  maxRequests?: number
}

/**
 * Check rate limit for an IP or user
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = {}
): { allowed: boolean; remaining: number; resetIn: number } {
  const { windowMs = DEFAULT_WINDOW_MS, maxRequests = DEFAULT_MAX_REQUESTS } = config

  const now = Date.now()
  const record = rateLimitStore.get(key)

  // Clean up old entries periodically
  if (rateLimitStore.size > 10000) {
    const entries = Array.from(rateLimitStore.entries())
    for (const [k, v] of entries) {
      if (now > v.resetAt) {
        rateLimitStore.delete(k)
      }
    }
  }

  if (!record || now > record.resetAt) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    })
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetIn: windowMs,
    }
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: record.resetAt - now,
    }
  }

  record.count++
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetIn: record.resetAt - now,
  }
}

/**
 * Extract normalized client IP address
 */
export function extractClientIp(request: NextRequest): string {
  const raw =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  const cleaned = raw.trim().slice(0, 64).replace(/[^a-fA-F0-9.:]/g, '')
  return cleaned || 'unknown'
}

/**
 * Rate limit middleware for API routes
 */
export async function withRateLimit(
  request: NextRequest,
  config: RateLimitConfig = {}
): Promise<{ allowed: boolean; response?: NextResponse }> {
  // Get identifier (prefer user ID if authenticated)
  const session = await auth()
  const key = session?.user?.id
    ? `user:${session.user.id}`
    : `ip:${extractClientIp(request)}`

  const result = checkRateLimit(key, config)

  if (!result.allowed) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: 'Terlalu banyak permintaan. Coba lagi nanti.',
          retryAfter: Math.ceil(result.resetIn / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(result.resetIn / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        }
      ),
    }
  }

  return { allowed: true }
}

// =====================================================
// IDOR Protection
// =====================================================

/**
 * Check if a user has access to a resource
 * Implements IDOR protection pattern
 */
export async function checkResourceAccess(params: {
  userId: string
  resourceId: string
  resourceType: 'user' | 'surat' | 'proker' | 'transaction' | 'divisi'
  permission?: string
  ownershipField?: string // Field name that links resource to user
}): Promise<boolean> {
  const { userId, resourceId, resourceType, permission, ownershipField } = params

  // Admin bypass
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  })

  if (user?.role?.name === 'admin') {
    return true
  }

  // Check explicit permission if provided
  if (permission) {
    const { hasPermission } = await import('@/lib/auth')
    if (await hasPermission(userId, permission)) {
      return true
    }
  }

  // Check ownership via field
  if (ownershipField) {
    const ownerId = await getResourceOwner(resourceType, resourceId, ownershipField)
    if (ownerId === userId) {
      return true
    }
  }

  return false
}

/**
 * Get the owner ID of a resource
 */
async function getResourceOwner(
  resourceType: string,
  resourceId: string,
  ownershipField: string
): Promise<string | null> {
  try {
    switch (resourceType) {
      case 'user':
        return resourceId // For users, the ID is the owner

      case 'surat': {
        const surat = await prisma.surat.findUnique({
          where: { id: resourceId },
          select: { [ownershipField]: true } as Record<string, true>,
        })
        return (surat?.[ownershipField] as unknown as string | null) ?? null
      }

      case 'proker': {
        const proker = await prisma.programKerja.findUnique({
          where: { id: resourceId },
          select: { [ownershipField]: true } as Record<string, true>,
        })
        return (proker?.[ownershipField] as unknown as string | null) ?? null
      }

      case 'transaction': {
        const transaction = await prisma.transaction.findUnique({
          where: { id: resourceId },
          select: { [ownershipField]: true } as Record<string, true>,
        })
        return (transaction?.[ownershipField] as unknown as string | null) ?? null
      }

      default:
        return null
    }
  } catch {
    return null
  }
}

/**
 * Validate resource ownership for authenticated user
 */
export async function validateOwnership(params: {
  session: { user: { id: string } }
  resourceId: string
  resourceType: 'user' | 'surat' | 'proker' | 'transaction'
  ownershipFields: { requester?: string; approver?: string; createdBy?: string; pic?: string; creator?: string }
}): Promise<{ valid: boolean; error?: string }> {
  const { session, resourceId, resourceType, ownershipFields } = params

  try {
    let resource: any

    switch (resourceType) {
      case 'surat':
        resource = await prisma.surat.findUnique({
          where: { id: resourceId },
          select: {
            requesterId: true,
            approverId: true,
          },
        })
        break

      case 'proker':
        resource = await prisma.programKerja.findUnique({
          where: { id: resourceId },
          select: {
            picId: true,
            creatorId: true,
          },
        })
        break

      case 'transaction':
        resource = await prisma.transaction.findUnique({
          where: { id: resourceId },
          select: {
            createdById: true,
          },
        })
        break

      default:
        return { valid: false, error: 'Unknown resource type' }
    }

    if (!resource) {
      return { valid: false, error: 'Resource not found' }
    }

    // Check if user is owner or has any role
    const userId = session.user.id
    const isOwner = Object.values(ownershipFields).some(
      (field) => resource[field as keyof typeof resource] === userId
    )

    if (isOwner) {
      return { valid: true }
    }

    // Check permission
    const { hasPermission } = await import('@/lib/auth')
    const permissionMap: Record<string, string> = {
      surat: 'surat.edit',
      proker: 'proker.edit',
      transaction: 'keuangan.edit',
    }

    if (await hasPermission(userId, permissionMap[resourceType])) {
      return { valid: true }
    }

    return { valid: false, error: 'Access denied' }
  } catch (error) {
    console.error('[IDOR CHECK ERROR]', error)
    return { valid: false, error: 'Internal server error' }
  }
}

// =====================================================
// Input Validation
// =====================================================

/**
 * Validate ID format (CUID)
 */
export function isValidId(id: string): boolean {
  if (!id || typeof id !== 'string') return false
  // CUID pattern
  return /^c[a-z0-9]{24}$/.test(id)
}

/**
 * Sanitize string input
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') return ''

  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML
}

/**
 * Validate pagination params
 */
export function validatePagination(params: {
  page?: string | null
  limit?: string | null
  maxLimit?: number
}): { page: number; limit: number; error?: string } {
  let page = parseInt(params.page || '1')
  let limit = parseInt(params.limit || '10')
  const maxLimit = params.maxLimit || 100

  if (isNaN(page) || page < 1) page = 1
  if (isNaN(limit) || limit < 1) limit = 10
  if (limit > maxLimit) limit = maxLimit

  return { page, limit }
}

// =====================================================
// Error Handling
// =====================================================

/**
 * Create a sanitized error response
 * Never expose internal details in production
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: Record<string, unknown>
): NextResponse {
  const isDev = process.env.NODE_ENV === 'development'

  const response: Record<string, unknown> = {
    error: message,
  }

  // Only include details in development
  if (isDev && details) {
    response.details = details
  }

  return NextResponse.json(response, { status })
}

/**
 * Log security events
 */
export function logSecurityEvent(
  type: 'IDOR_ATTEMPT' | 'RATE_LIMIT' | 'AUTH_FAILURE' | 'PERMISSION_DENIED' | 'INVALID_INPUT',
  details: {
    userId?: string
    ip?: string
    path?: string
    resourceId?: string
    message?: string
  }
): void {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    type,
    ...details,
  }

  // Log to console in all environments
  const logLevel =
    type === 'IDOR_ATTEMPT' ? 'warn' : type === 'RATE_LIMIT' ? 'warn' : 'error'

  console[logLevel](`[SECURITY] ${JSON.stringify(logEntry)}`)
}

// =====================================================
// Authenticated Request Handler
// =====================================================

interface AuthenticatedHandlerOptions {
  requirePermission?: string
  allowSelf?: boolean
}

/**
 * Create an authenticated request handler with common security checks
 */
export async function withAuth<T>(
  request: NextRequest,
  handler: (session: { user: { id: string; role?: { name: string } } }, body?: T) => Promise<NextResponse>,
  options: AuthenticatedHandlerOptions = {}
): Promise<NextResponse> {
  const { requirePermission, allowSelf } = options

  // Check authentication
  const session = await auth()
  if (!session?.user) {
    logSecurityEvent('AUTH_FAILURE', {
      path: request.url,
      ip: request.headers.get('x-forwarded-for') || undefined,
    })
    return errorResponse('Unauthorized', 401)
  }

  // Check permission if required
  if (requirePermission) {
    const { hasPermission } = await import('@/lib/auth')
    const hasAccess = await hasPermission(session.user.id, requirePermission)

    if (!hasAccess) {
      // Check if user is admin (admins have all permissions)
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { role: true },
      })

      if (user?.role?.name !== 'admin') {
        logSecurityEvent('PERMISSION_DENIED', {
          userId: session.user.id,
          path: request.url,
          message: `Missing permission: ${requirePermission}`,
        })
        return errorResponse('Forbidden', 403)
      }
    }
  }

  // Parse body if present
  let body: T | undefined
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      body = await request.json()
    } catch {
      return errorResponse('Invalid JSON body', 400)
    }
  }

  return handler(session as any, body)
}

// =====================================================
// API Route Template
// =====================================================

/**
 * Template for creating secure API routes
 *
 * Usage:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   return secureApiHandler(request, {
 *     GET: async (session) => { ... },
 *     POST: async (session, body) => { ... },
 *   }, { rateLimit: { maxRequests: 30 } })
 * }
 * ```
 */
export async function secureApiHandler(
  request: NextRequest,
  handlers: {
    GET?: (session: { user: { id: string; role?: { name: string } } }) => Promise<NextResponse>
    POST?: (session: { user: { id: string; role?: { name: string } } }, body: any) => Promise<NextResponse>
    PATCH?: (session: { user: { id: string; role?: { name: string } } }, body: any) => Promise<NextResponse>
    DELETE?: (session: { user: { id: string; role?: { name: string } } }) => Promise<NextResponse>
  },
  config: {
    rateLimit?: RateLimitConfig
    requirePermission?: string
  } = {}
): Promise<NextResponse> {
  // Rate limiting
  if (config.rateLimit) {
    const rateLimitResult = await withRateLimit(request, config.rateLimit)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }
  }

  // Authentication
  const session = await auth()
  if (!session?.user) {
    return errorResponse('Unauthorized', 401)
  }

  // Permission check
  if (config.requirePermission) {
    const { hasPermission } = await import('@/lib/auth')
    const hasAccess = await hasPermission(session.user.id, config.requirePermission)

    if (!hasAccess) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { role: true },
      })

      if (user?.role?.name !== 'admin') {
        return errorResponse('Forbidden', 403)
      }
    }
  }

  // Route to appropriate handler
  const method = request.method as keyof typeof handlers

  if (!handlers[method]) {
    return errorResponse('Method not allowed', 405)
  }

  try {
    if (method === 'GET' || method === 'DELETE') {
      return handlers[method]!(session as any)
    } else {
      const body = await request.json()
      return handlers[method]!(session as any, body)
    }
  } catch (error) {
    console.error(`[API ERROR] ${method} ${request.url}:`, error)
    return errorResponse('Internal server error', 500)
  }
}
