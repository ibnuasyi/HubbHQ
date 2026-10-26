import { NextRequest, NextResponse } from 'next/server'
import { auth, isSuperAdminRole } from '@/lib/auth'

/**
 * Auth middleware for API routes
 * Returns unauthorized response if user is not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<{ authorized: boolean; session?: any; response?: NextResponse }> {
  const session = await auth()

  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      )
    }
  }

  return { authorized: true, session }
}

/**
 * Auth middleware that also checks for admin / super admin role
 */
export async function requireAdmin(request: NextRequest): Promise<{ authorized: boolean; session?: any; response?: NextResponse }> {
  const { authorized, session, response } = await requireAuth(request)

  if (!authorized) {
    return { authorized: false, response }
  }

  // Check if user has super admin / admin role
  const userRole = session.user?.role?.name?.toLowerCase()
  const isSuper = isSuperAdminRole(session.user?.role) || isSuperAdminRole(userRole)
  if (!isSuper && userRole !== 'admin' && userRole !== 'ketua') {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }
  }

  return { authorized: true, session }
}
