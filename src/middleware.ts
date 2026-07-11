import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public API routes that don't require authentication
const PUBLIC_API_ROUTES = [
  '/api/auth',
  '/api/contact',
  '/api/newsletter',
  '/api/revalidate',
  '/api/setup',
]

// Public pages that don't require authentication
const PUBLIC_PAGES = [
  '/login',
  '/register',
  '/setup',
]

// Check if the request needs authentication
function needsAuth(pathname: string): boolean {
  // Public pages don't need auth
  if (PUBLIC_PAGES.some((page) => pathname === page || pathname.startsWith(page + '/'))) {
    return false
  }

  // API routes check handled separately
  if (pathname.startsWith('/api/')) {
    return !PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route))
  }

  // All other pages need auth (dashboard, etc.)
  return true
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if page needs authentication
  if (needsAuth(pathname)) {
    // Check for session cookie
    const sessionToken =
      request.cookies.get('next-auth.session-token') ||
      request.cookies.get('__Secure-next-auth.session-token') ||
      request.cookies.get('authjs.session-token') ||
      request.cookies.get('__Host-authjs.session-token')

    // If no session, redirect to login or setup
    if (!sessionToken) {
      // Check if database is empty (needs setup)
      // For now, redirect to login - the login page will check for setup needed
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check for Bearer token in Authorization header for API routes
    if (pathname.startsWith('/api/')) {
      const authHeader = request.headers.get('Authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Unauthorized - No valid session' },
          { status: 401 }
        )
      }
    }
  }

  return NextResponse.next()
}

// Configure which routes the middleware applies to
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
