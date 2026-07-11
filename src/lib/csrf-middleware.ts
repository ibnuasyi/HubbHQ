import { NextRequest, NextResponse } from 'next/server'
import { validateCsrf, csrfErrorResponse } from '@/lib/csrf'

/**
 * CSRF Protection Middleware for Next.js API routes
 *
 * Usage in API routes:
 * ```typescript
 * import { withCsrfProtection } from '@/lib/csrf-middleware'
 *
 * export const POST = withCsrfProtection(async (request) => {
 *   // Your handler code here
 * })
 * ```
 */

/**
 * Safe HTTP methods (don't need CSRF protection)
 */
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']

/**
 * Public API paths that don't require CSRF (already have their own protection)
 */
const PUBLIC_PATHS = [
  '/api/auth',           // NextAuth handles its own CSRF
  '/api/contact',        // Public contact form
  '/api/newsletter',     // Public newsletter subscription
  '/api/verify',        // Public verification endpoints
]

/**
 * Check if path is public
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname.startsWith(path))
}

/**
 * Check if method is safe
 */
function isSafeMethod(method: string): boolean {
  return SAFE_METHODS.includes(method)
}

/**
 * Wrap an API handler with CSRF protection
 *
 * @param handler - The API route handler function
 * @param options - Configuration options
 * @returns Wrapped handler with CSRF protection
 */
export function withCsrfProtection<T = unknown>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>,
  options: {
    publicPaths?: string[]
    safeMethods?: string[]
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse<T>> => {
    // Merge options with defaults
    const publicPaths = [...PUBLIC_PATHS, ...(options.publicPaths || [])]
    const safeMethods = [...SAFE_METHODS, ...(options.safeMethods || [])]

    // Skip CSRF for safe methods
    if (safeMethods.includes(request.method)) {
      return handler(request)
    }

    // Skip CSRF for public paths
    const pathname = request.nextUrl.pathname
    if (publicPaths.some(path => pathname.startsWith(path))) {
      return handler(request)
    }

    // Validate CSRF for mutating requests
    const csrfResult = validateCsrf(request)
    if (!csrfResult.valid) {
      console.warn(`CSRF validation failed for ${request.method} ${pathname}: ${csrfResult.error}`)
      return csrfErrorResponse(csrfResult.error || 'CSRF validation failed') as unknown as NextResponse<T>
    }

    return handler(request)
  }
}

/**
 * Create a simple CORS headers check middleware
 * This adds an extra layer of protection
 */
export function withCorsProtection<T = unknown>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>,
  allowedOrigins: string[] = []
) {
  return async (request: NextRequest): Promise<NextResponse<T>> => {
    const origin = request.headers.get('origin')

    // If there's an origin header, validate it
    if (origin) {
      const requestHost = request.headers.get('host')
      let isAllowed = false

      // Allow same origin
      if (requestHost) {
        try {
          const originUrl = new URL(origin)
          isAllowed = originUrl.host === requestHost
        } catch {
          isAllowed = false
        }
      }

      // Check against allowed origins list
      if (!isAllowed && allowedOrigins.length > 0) {
        isAllowed = allowedOrigins.includes(origin)
      }

      // Allow localhost in development
      if (!isAllowed && origin.includes('localhost')) {
        isAllowed = true
      }

      if (!isAllowed) {
        return NextResponse.json(
          { error: 'CORS validation failed' },
          { status: 403 }
        ) as unknown as NextResponse<T>
      }
    }

    return handler(request)
  }
}

/**
 * Combined middleware with both CSRF and CORS protection
 */
export function withSecurityHeaders<T = unknown>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse<T>> => {
    const response = await handler(request)

    // Add security headers
    const headers = new Headers(response.headers)
    headers.set('X-Content-Type-Options', 'nosniff')
    headers.set('X-Frame-Options', 'DENY')
    headers.set('X-XSS-Protection', '1; mode=block')
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    })
  }
}

/**
 * Example usage in an API route
 *
 * ```typescript
 * // POST /api/keuangan
 * import { withCsrfProtection } from '@/lib/csrf-middleware'
 *
 * export const POST = withCsrfProtection(async (request) => {
 *   // Your protected code here
 *   const body = await request.json()
 *   // ... process the request
 *   return NextResponse.json({ success: true })
 * })
 * ```
 */

/**
 * Example for admin-only routes with full security
 *
 * ```typescript
 * // POST /api/anggota
 * import { withCsrfProtection, withCorsProtection } from '@/lib/csrf-middleware'
 * import { auth } from '@/lib/auth'
 *
 * export const POST = withSecurityHeaders(
 *   withCorsProtection(
 *     withCsrfProtection(async (request) => {
 *       const session = await auth()
 *       if (!session) {
 *         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 *       }
 *       // ... your protected code
 *     })
 *   )
 * )
 * ```
 */
