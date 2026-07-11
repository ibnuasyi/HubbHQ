import { NextRequest, NextResponse } from 'next/server'

/**
 * CSRF Protection Middleware
 * Validates requests against CSRF attacks
 */

/**
 * Check if request is a safe CORS preflight
 */
function isCorsPreflight(request: NextRequest): boolean {
  return request.method === 'OPTIONS' && request.headers.has('access-control-request-method')
}

/**
 * Get the origin from the request
 */
function getOrigin(request: NextRequest): string | null {
  return request.headers.get('origin') || request.headers.get('referer')
}

/**
 * Check if the request is from the same origin
 */
function isSameOrigin(request: NextRequest): boolean {
  const origin = getOrigin(request)
  if (!origin) return false

  // Check against the request's own URL
  const requestHost = request.headers.get('host')
  try {
    const originUrl = new URL(origin)
    return originUrl.host === requestHost
  } catch {
    return false
  }
}

/**
 * CSRF Protection configuration
 * Paths that don't require CSRF check (GET, HEAD, OPTIONS are inherently safe)
 */
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']
const PUBLIC_PATHS = [
  '/api/auth',           // NextAuth handles its own CSRF
  '/api/contact',        // Public contact form
  '/api/newsletter',     // Public newsletter subscription
]

/**
 * Validate CSRF token for mutating requests
 * Uses the Origin/Referer check as primary method
 */
export function validateCsrf(request: NextRequest): { valid: boolean; error?: string } {
  // Skip safe methods
  if (SAFE_METHODS.includes(request.method)) {
    return { valid: true }
  }

  // Skip public paths (they should have their own protection)
  const pathname = request.nextUrl.pathname
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return { valid: true }
  }

  // For mutating requests, validate origin
  const origin = getOrigin(request)

  // If no origin/referer header, reject (could be CSRF)
  if (!origin) {
    return {
      valid: false,
      error: 'Missing origin header. Cross-site requests are not allowed.'
    }
  }

  // Validate origin matches the server's host
  const host = request.headers.get('host')
  if (!host) {
    return {
      valid: false,
      error: 'Missing host header'
    }
  }

  try {
    const originUrl = new URL(origin)

    // Allow localhost in development
    const isLocalhost = originUrl.hostname === 'localhost' ||
                        originUrl.hostname === '127.0.0.1' ||
                        originUrl.hostname === '::1'

    if (isLocalhost) {
      return { valid: true }
    }

    // Check if origin matches host
    if (originUrl.host !== host) {
      return {
        valid: false,
        error: 'Origin does not match server. Cross-site requests are not allowed.'
      }
    }
  } catch {
    return {
      valid: false,
      error: 'Invalid origin URL'
    }
  }

  return { valid: true }
}

/**
 * Create a CSRF error response
 */
export function csrfErrorResponse(error: string): NextResponse {
  return NextResponse.json(
    { error: 'CSRF validation failed', details: error },
    { status: 403 }
  )
}

/**
 * Create a CSRF token for form submissions (optional advanced usage)
 * This is a simple implementation - for production, consider using a proper library
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else {
    // Fallback for older environments
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Verify a CSRF token (if using token-based validation)
 */
export function verifyCsrfToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) return false

  // Use timing-safe comparison to prevent timing attacks
  if (token.length !== expectedToken.length) return false

  let result = 0
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i)
  }
  return result === 0
}
