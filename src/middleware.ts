import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Public API routes (exact or prefix) that don't require authentication
const PUBLIC_API_PREFIXES = [
  '/api/auth',
  '/api/health',
  '/api/contact',
  '/api/newsletter',
  '/api/revalidate',
  '/api/setup',
  '/api/website-config',
  '/api/aspirasi/kirim',
  '/api/aspirasi/track',
  '/api/oprec/public',
  '/api/sertifikat/verify',
  '/api/kta/verify',
  '/api/webhooks',
]

// API routes where GET method is public
const PUBLIC_GET_API_PREFIXES = [
  '/api/posts',
  '/api/categories',
  '/api/pages',
  '/api/gallery',
  '/api/events',
  '/api/documents',
  '/api/faq',
  '/api/menu',
  '/api/files',
  '/api/themes',
]

async function hasValidSession(request: NextRequest): Promise<boolean> {
  // 1. Izinkan Bearer token jika cocok dengan INTERNAL_API_KEY yang dikonfigurasi
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ') && process.env.INTERNAL_API_KEY) {
    const token = authHeader.substring(7)
    if (token.length > 0 && token === process.env.INTERNAL_API_KEY) {
      return true
    }
  }

  // 2. Verifikasi kriptografis token sesi NextAuth / Auth.js (JWE/JWT)
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) {
    return false
  }

  try {
    const isHttps =
      request.nextUrl.protocol === 'https:' ||
      request.headers.get('x-forwarded-proto') === 'https'

    let decoded = await getToken({
      req: request,
      secret,
      secureCookie: isHttps,
    })

    if (!decoded && isHttps) {
      decoded = await getToken({
        req: request,
        secret,
        secureCookie: false,
      })
    } else if (!decoded && !isHttps && request.cookies.has('__Secure-authjs.session-token')) {
      decoded = await getToken({
        req: request,
        secret,
        secureCookie: true,
      })
    }

    return Boolean(decoded && (decoded.id || decoded.sub || decoded.email))
  } catch {
    return false
  }
}

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Frame-Options', 'SAMEORIGIN')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  return res
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Dashboard routes require authentication
  if (pathname.startsWith('/dashboard')) {
    if (!(await hasValidSession(request))) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return applySecurityHeaders(NextResponse.redirect(loginUrl))
    }
    return applySecurityHeaders(NextResponse.next())
  }

  // 2. API routes authentication check
  if (pathname.startsWith('/api/')) {
    // Check if route is always public
    if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      return applySecurityHeaders(NextResponse.next())
    }

    // Check if GET method is public for this route
    if (request.method === 'GET' && PUBLIC_GET_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      return applySecurityHeaders(NextResponse.next())
    }

    // Protected API route requires valid session
    if (!(await hasValidSession(request))) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: 'Unauthorized - Sesi tidak valid atau belum masuk' },
          { status: 401 }
        )
      )
    }

    return applySecurityHeaders(NextResponse.next())
  }

  // 3. All other pages (public homepage, berita, galeri, kontak, verify, login, register, setup) are public
  return applySecurityHeaders(NextResponse.next())
}

// Configure which routes the middleware applies to
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
