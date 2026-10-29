/**
 * Rate Limiting System
 * Token bucket algorithm with sliding window
 */

import { NextResponse } from 'next/server'

// =====================================================
// Types
// =====================================================

export interface RateLimitConfig {
  windowMs: number       // Time window in milliseconds
  maxRequests: number    // Max requests per window
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfter?: number
}

// =====================================================
// In-Memory Store (Use Redis in production)
// =====================================================

interface RateLimitEntry {
  tokens: number
  lastRefill: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries periodically
const CLEANUP_INTERVAL = 60 * 1000 // 1 minute
const MAX_STORE_SIZE = 100000

setInterval(() => {
  const now = Date.now()
  const entriesToDelete: string[] = []

  for (const [key, entry] of Array.from(rateLimitStore.entries())) {
    // Remove entries that haven't been accessed in 10 minutes
    if (now - entry.lastRefill > 10 * 60 * 1000) {
      entriesToDelete.push(key)
    }
  }

  entriesToDelete.forEach((key) => rateLimitStore.delete(key))

  // Also limit store size if needed
  if (rateLimitStore.size > MAX_STORE_SIZE) {
    const keys = Array.from(rateLimitStore.keys())
    keys.slice(0, 10000).forEach((key) => rateLimitStore.delete(key))
  }
}, CLEANUP_INTERVAL)

// =====================================================
// Predefined Rate Limit Configurations
// =====================================================

export const RATE_LIMITS = {
  // Strict limits for sensitive endpoints
  AUTH: {
    LOGIN: { windowMs: 15 * 60 * 1000, maxRequests: 5 },      // 5 attempts per 15 min
    REGISTER: { windowMs: 60 * 60 * 1000, maxRequests: 3 },   // 3 per hour
    FORGOT_PASSWORD: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 per hour
    CHANGE_PASSWORD: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 per 15 min
  },

  // API endpoints
  API: {
    DEFAULT: { windowMs: 60 * 1000, maxRequests: 100 },       // 100 per minute
    READ: { windowMs: 60 * 1000, maxRequests: 200 },        // 200 per minute
    WRITE: { windowMs: 60 * 1000, maxRequests: 30 },        // 30 per minute
    DELETE: { windowMs: 60 * 1000, maxRequests: 10 },      // 10 per minute
  },

  // File uploads
  UPLOAD: {
    DEFAULT: { windowMs: 60 * 60 * 1000, maxRequests: 20 },  // 20 per hour
    LARGE: { windowMs: 60 * 60 * 1000, maxRequests: 5 },    // 5 large files per hour
  },

  // Export operations
  EXPORT: {
    DEFAULT: { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 per hour
  },

  // Search
  SEARCH: {
    DEFAULT: { windowMs: 60 * 1000, maxRequests: 30 },     // 30 searches per minute
  },

  // Public endpoints
  PUBLIC: {
    CONTACT: { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 per hour
    NEWSLETTER: { windowMs: 60 * 60 * 1000, maxRequests: 5 }, // 5 per hour
    VERIFY: { windowMs: 60 * 1000, maxRequests: 60 },       // 60 per minute
  },
} as const

// =====================================================
// Token Bucket Algorithm
// =====================================================

/**
 * Token bucket rate limiter
 * - Tokens refill at a constant rate
 * - Each request consumes one token
 * - Requests are allowed if tokens are available
 */
export class TokenBucketRateLimiter {
  private tokens: number
  private maxTokens: number
  private refillRate: number // tokens per millisecond
  private lastRefill: number

  constructor(config: RateLimitConfig) {
    this.tokens = config.maxRequests
    this.maxTokens = config.maxRequests
    this.refillRate = config.maxRequests / config.windowMs
    this.lastRefill = Date.now()
  }

  private refill(): void {
    const now = Date.now()
    const elapsed = now - this.lastRefill
    const newTokens = elapsed * this.refillRate

    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens)
    this.lastRefill = now
  }

  tryConsume(tokens: number = 1): RateLimitResult {
    this.refill()

    if (this.tokens >= tokens) {
      this.tokens -= tokens
      return {
        allowed: true,
        remaining: Math.floor(this.tokens),
        resetAt: this.lastRefill + Math.ceil((this.maxTokens - this.tokens) / this.refillRate),
      }
    }

    const retryAfter = Math.ceil((tokens - this.tokens) / this.refillRate)

    return {
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + retryAfter,
      retryAfter,
    }
  }

  getStatus(): { tokens: number; maxTokens: number } {
    this.refill()
    return {
      tokens: this.tokens,
      maxTokens: this.maxTokens,
    }
  }
}

// =====================================================
// Rate Limit Store
// =====================================================

const limiters = new Map<string, TokenBucketRateLimiter>()

/**
 * Get or create a rate limiter for a key
 */
export function getRateLimiter(key: string, config: RateLimitConfig): TokenBucketRateLimiter {
  let limiter = limiters.get(key)

  if (!limiter) {
    limiter = new TokenBucketRateLimiter(config)
    limiters.set(key, limiter)
  }

  return limiter
}

/**
 * Check rate limit for a user
 */
export function checkRateLimit(
  userId: string,
  action: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `user:${userId}:${action}`
  const limiter = getRateLimiter(key, config)
  return limiter.tryConsume()
}

/**
 * Check rate limit by IP
 */
export function checkRateLimitByIP(
  ip: string,
  action: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `ip:${ip}:${action}`
  const limiter = getRateLimiter(key, config)
  return limiter.tryConsume()
}

/**
 * Check rate limit by user or IP (fallback)
 */
export function checkRateLimitFlexible(
  identifier: string | null,
  action: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = identifier
    ? `user:${identifier}:${action}`
    : `ip:anonymous:${action}`
  const limiter = getRateLimiter(key, config)
  return limiter.tryConsume()
}

// =====================================================
// Middleware Helper
// =====================================================

export interface RateLimitMiddlewareOptions {
  action: string
  getIdentifier: (request: Request) => string | null
  config: RateLimitConfig
  addHeaders?: boolean
}

/**
 * Create rate limit middleware
 */
export function createRateLimitMiddleware(options: RateLimitMiddlewareOptions) {
  return async function rateLimitMiddleware(
    request: Request
  ): Promise<{ allowed: boolean; response?: NextResponse }> {
    const identifier = options.getIdentifier(request)
    const result = checkRateLimitFlexible(identifier, options.action, options.config)

    if (!result.allowed) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfter || Math.ceil((result.resetAt - Date.now()) / 1000)),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
      }

      return {
        allowed: false,
        response: NextResponse.json(
          {
            error: 'Terlalu banyak permintaan. Coba lagi nanti.',
            retryAfter: result.retryAfter,
          },
          {
            status: 429,
            headers,
          }
        ),
      }
    }

    // Add headers if enabled
    if (options.addHeaders) {
      // Headers will be added by the route handler
    }

    return { allowed: true }
  }
}

// =====================================================
// Expressive API for Common Patterns
// =====================================================

/**
 * Check login rate limit
 */
export function checkLoginRateLimit(identifier: string | null): RateLimitResult {
  return checkRateLimitFlexible(
    identifier,
    'login',
    RATE_LIMITS.AUTH.LOGIN
  )
}

/**
 * Check API rate limit
 */
export function checkApiRateLimit(
  identifier: string | null,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
): RateLimitResult {
  const config =
    method === 'GET'
      ? RATE_LIMITS.API.READ
      : method === 'DELETE'
        ? RATE_LIMITS.API.DELETE
        : method === 'PATCH'
          ? RATE_LIMITS.API.WRITE
          : RATE_LIMITS.API.DEFAULT

  return checkRateLimitFlexible(identifier, `api:${method.toLowerCase()}`, config)
}

/**
 * Check upload rate limit
 */
export function checkUploadRateLimit(identifier: string | null): RateLimitResult {
  return checkRateLimitFlexible(identifier, 'upload', RATE_LIMITS.UPLOAD.DEFAULT)
}

/**
 * Check export rate limit
 */
export function checkExportRateLimit(identifier: string | null): RateLimitResult {
  return checkRateLimitFlexible(identifier, 'export', RATE_LIMITS.EXPORT.DEFAULT)
}

/**
 * Check search rate limit
 */
export function checkSearchRateLimit(identifier: string | null): RateLimitResult {
  return checkRateLimitFlexible(identifier, 'search', RATE_LIMITS.SEARCH.DEFAULT)
}

/**
 * Check public endpoint rate limit
 */
export function checkPublicRateLimit(
  ip: string,
  endpoint: 'contact' | 'newsletter' | 'verify'
): RateLimitResult {
  const config =
    endpoint === 'contact'
      ? RATE_LIMITS.PUBLIC.CONTACT
      : endpoint === 'newsletter'
        ? RATE_LIMITS.PUBLIC.NEWSLETTER
        : RATE_LIMITS.PUBLIC.VERIFY

  return checkRateLimitByIP(ip, `public:${endpoint}`, config)
}

// =====================================================
// Utility Functions
// =====================================================

/**
 * Get client IP from request with format normalization
 */
export function getClientIP(request: Request): string {
  const rawIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'

  const sanitizedIp = rawIp.trim().slice(0, 64).replace(/[^a-fA-F0-9.:]/g, '')
  return sanitizedIp || 'unknown'
}

/**
 * Get identifier from session
 */
export async function getSessionIdentifier(): Promise<string | null> {
  try {
    const { auth } = await import('@/lib/auth')
    const session = await auth()
    return session?.user?.id || null
  } catch {
    return null
  }
}

/**
 * Get identifier with fallback to IP
 */
export function getIdentifierWithFallback(
  userId: string | null,
  ip: string
): string {
  return userId || `ip:${ip}`
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    ...(result.retryAfter
      ? { 'Retry-After': String(result.retryAfter) }
      : {}),
  }
}
