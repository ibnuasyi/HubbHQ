import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public API routes (exact or prefix) that don't require authentication
const PUBLIC_API_PREFIXES = [
  '/api/auth',
  '/api/health',
  '/api/contact',
  '/api/newsletter',
  '/api/revalidate',
  '/api/setup',
  '/api/website-config',
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
]

function hasValidSession(request: NextRequest): boolean {
  const sessionToken =
    request.cookies.get('next-auth.session-token') ||
    request.cookies.get('__Secure-next-auth.session-token') ||
    request.cookies.get('authjs.session-token') ||
    request.cookies.get('__Host-authjs.session-token')

  if (sessionToken?.value) {
    return true
  }

  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return true
  }

  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Dashboard routes require authentication
  if (pathname.startsWith('/dashboard')) {
    if (!hasValidSession(request)) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // 2. API routes authentication check
  if (pathname.startsWith('/api/')) {
    // Check if route is always public
    if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.next()
    }

    // Check if GET method is public for this route
    if (request.method === 'GET' && PUBLIC_GET_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.next()
    }

    // Protected API route requires session or Bearer token
    if (!hasValidSession(request)) {
      return NextResponse.json(
        { error: 'Unauthorized - Sesi tidak valid atau belum masuk' },
        { status: 401 }
      )
    }

    return NextResponse.next()
  }

  // 3. All other pages (public homepage, berita, galeri, kontak, verify, login, register, setup) are public
  return NextResponse.next()
}

// Configure which routes the middleware applies to
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
