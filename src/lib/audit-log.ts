/**
 * Audit Log System
 * Tracks all significant actions for compliance and debugging
 */

import { prisma } from '@/lib/db'

// =====================================================
// Types
// =====================================================

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET'
  | 'PERMISSION_CHANGE'
  | 'APPROVE'
  | 'REJECT'
  | 'DOWNLOAD'
  | 'UPLOAD'
  | 'EXPORT'
  | 'IMPORT'

export type AuditEntity =
  | 'USER'
  | 'ANGGOTA'
  | 'ROLE'
  | 'PERMISSION'
  | 'DIVISI'
  | 'PROGRAM_KERJA'
  | 'CHECKPOINT'
  | 'TRANSACTION'
  | 'KAS_PAYMENT'
  | 'SURAT'
  | 'JENIS_SURAT'
  | 'CALENDAR_EVENT'
  | 'LIBRARY_BOOK'
  | 'WEBSITE_CONFIG'
  | 'THEME'
  | 'PAGE'
  | 'PAGE_SECTION'
  | 'POST'
  | 'GALLERY'
  | 'FAQ'
  | 'DOCUMENT'
  | 'PROPOSAL_DANA'
  | 'WILAYAH'
  | 'JABATAN'
  | 'MENU_ITEM'
  | 'NEWSLETTER'
  | 'CONTACT'

export interface AuditLogEntry {
  userId?: string | null
  action: AuditAction
  entity: AuditEntity
  entityId?: string | null
  details?: Record<string, any>
  ipAddress?: string | null
  userAgent?: string | null
  metadata?: Record<string, any>
}

// =====================================================
// Singleton In-Memory Store (for batch processing)
// =====================================================

const auditQueue: AuditLogEntry[] = []
const MAX_QUEUE_SIZE = 100
const FLUSH_INTERVAL_MS = 5000 // 5 seconds

let flushTimeout: NodeJS.Timeout | null = null

// =====================================================
// Core Functions
// =====================================================

/**
 * Log an audit event
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  // Add to queue
  auditQueue.push(entry)

  // Flush if queue is full
  if (auditQueue.length >= MAX_QUEUE_SIZE) {
    await flushAuditQueue()
  } else if (!flushTimeout) {
    // Schedule flush
    flushTimeout = setTimeout(() => {
      flushAuditQueue().catch(console.error)
      flushTimeout = null
    }, FLUSH_INTERVAL_MS)
  }
}

// Alias for backward compatibility
export const createAuditLog = logAuditEvent

/**
 * Flush the audit queue to database
 */
async function flushAuditQueue(): Promise<void> {
  if (auditQueue.length === 0) return

  const entries = auditQueue.splice(0, auditQueue.length)

  try {
    // Batch insert - convert null to undefined for Prisma JSON fields
    await prisma.auditLog.createMany({
      data: entries.map((entry) => ({
        userId: entry.userId ?? undefined,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? undefined,
        details: entry.details ?? undefined,
        ipAddress: entry.ipAddress ?? undefined,
        userAgent: entry.userAgent ?? undefined,
        metadata: entry.metadata ?? undefined,
      })),
    })
  } catch (error) {
    console.error('[AUDIT LOG ERROR] Failed to write audit logs:', error)
    // Re-add failed entries back to queue
    auditQueue.unshift(...entries)
  }
}

/**
 * Force flush audit queue (for shutdown)
 */
export async function flushAuditLogs(): Promise<void> {
  if (flushTimeout) {
    clearTimeout(flushTimeout)
    flushTimeout = null
  }
  await flushAuditQueue()
}

// =====================================================
// Convenience Functions
// =====================================================

/**
 * Log a CREATE action
 */
export async function logCreate(
  userId: string,
  entity: AuditEntity,
  entityId: string,
  details?: Record<string, any>,
  request?: Request
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'CREATE',
    entity,
    entityId,
    details,
    ...extractRequestInfo(request),
  })
}

/**
 * Log an UPDATE action
 */
export async function logUpdate(
  userId: string,
  entity: AuditEntity,
  entityId: string,
  changes?: Record<string, any>,
  request?: Request
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'UPDATE',
    entity,
    entityId,
    details: changes,
    ...extractRequestInfo(request),
  })
}

/**
 * Log a DELETE action
 */
export async function logDelete(
  userId: string,
  entity: AuditEntity,
  entityId: string,
  details?: Record<string, any>,
  request?: Request
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'DELETE',
    entity,
    entityId,
    details,
    ...extractRequestInfo(request),
  })
}

/**
 * Log a VIEW action (for sensitive data access)
 */
export async function logView(
  userId: string,
  entity: AuditEntity,
  entityId: string,
  request?: Request
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'VIEW',
    entity,
    entityId,
    ...extractRequestInfo(request),
  })
}

/**
 * Log a login event
 */
export async function logLogin(
  userId: string,
  success: boolean,
  request?: Request
): Promise<void> {
  await logAuditEvent({
    userId: success ? userId : null,
    action: 'LOGIN',
    entity: 'USER',
    entityId: success ? userId : null,
    details: { success },
    ...extractRequestInfo(request),
  })
}

/**
 * Log a logout event
 */
export async function logLogout(
  userId: string,
  request?: Request
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'LOGOUT',
    entity: 'USER',
    entityId: userId,
    ...extractRequestInfo(request),
  })
}

/**
 * Log a password change
 */
export async function logPasswordChange(
  userId: string,
  byAdmin: boolean = false,
  request?: Request
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'PASSWORD_CHANGE',
    entity: 'USER',
    entityId: userId,
    details: { byAdmin },
    ...extractRequestInfo(request),
  })
}

/**
 * Log a permission change
 */
export async function logPermissionChange(
  adminId: string,
  targetUserId: string,
  changes: { added?: string[]; removed?: string[] },
  request?: Request
): Promise<void> {
  await logAuditEvent({
    userId: adminId,
    action: 'PERMISSION_CHANGE',
    entity: 'USER',
    entityId: targetUserId,
    details: changes,
    ...extractRequestInfo(request),
  })
}

/**
 * Log an approval action
 */
export async function logApproval(
  userId: string,
  entity: AuditEntity,
  entityId: string,
  request?: Request
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'APPROVE',
    entity,
    entityId,
    ...extractRequestInfo(request),
  })
}

/**
 * Log a rejection action
 */
export async function logRejection(
  userId: string,
  entity: AuditEntity,
  entityId: string,
  reason?: string,
  request?: Request
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'REJECT',
    entity,
    entityId,
    details: reason ? { reason } : undefined,
    ...extractRequestInfo(request),
  })
}

/**
 * Log a file download
 */
export async function logDownload(
  userId: string,
  entity: AuditEntity,
  entityId: string,
  request?: Request
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'DOWNLOAD',
    entity,
    entityId,
    ...extractRequestInfo(request),
  })
}

/**
 * Log a file upload
 */
export async function logUpload(
  userId: string,
  entity: AuditEntity,
  entityId: string,
  details?: { filename?: string; size?: number },
  request?: Request
): Promise<void> {
  await logAuditEvent({
    userId,
    action: 'UPLOAD',
    entity,
    entityId,
    details,
    ...extractRequestInfo(request),
  })
}

// =====================================================
// Query Functions
// =====================================================

/**
 * Query audit logs
 */
export async function queryAuditLogs(params: {
  userId?: string
  action?: AuditAction
  entity?: AuditEntity
  entityId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const {
    userId,
    action,
    entity,
    entityId,
    startDate,
    endDate,
    limit = 100,
    offset = 0,
  } = params

  const where: any = {}

  if (userId) where.userId = userId
  if (action) where.action = action
  if (entity) where.entity = entity
  if (entityId) where.entityId = entityId

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = startDate
    if (endDate) where.createdAt.lte = endDate
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ])

  return { logs, total }
}

/**
 * Get recent activity for a user
 */
export async function getUserActivity(userId: string, limit: number = 10) {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

/**
 * Get activity history for an entity
 */
export async function getEntityHistory(
  entity: AuditEntity,
  entityId: string,
  limit: number = 50
) {
  return prisma.auditLog.findMany({
    where: { entity, entityId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })
}

// =====================================================
// Helper Functions
// =====================================================

function extractRequestInfo(request?: Request): {
  ipAddress: string | null
  userAgent: string | null
} {
  if (!request) {
    return { ipAddress: null, userAgent: null }
  }

  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null

  const userAgent = request.headers.get('user-agent') || null

  return { ipAddress, userAgent }
}

/**
 * Create audit middleware for API routes
 * Wraps a handler and automatically logs the action
 */
export function withAuditLog<T>(
  action: AuditAction,
  entity: AuditEntity,
  getEntityId?: (body: T, params: Record<string, string>) => string
) {
  return async function auditedHandler(
    handler: (request: Request, body: T) => Promise<Response>,
    request: Request,
    body: T,
    userId: string,
    params?: Record<string, string>
  ): Promise<Response> {
    const startTime = Date.now()
    const entityId = getEntityId ? getEntityId(body, params || {}) : undefined

    // Execute handler
    const response = await handler(request, body)

    // Log if successful
    if (response.ok) {
      const duration = Date.now() - startTime

      await logAuditEvent({
        userId,
        action,
        entity,
        entityId: entityId || null,
        details: {
          duration,
          status: response.status,
        },
        ...extractRequestInfo(request),
      })
    }

    return response
  }
}
