export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// Debug endpoint to check session and user (Disabled in production & restricted to Admin)
export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 })
    }

    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({
        error: 'No session',
        session: null
      }, { status: 401 })
    }

    const isAdmin =
      (session.user as any)?.role?.name?.toLowerCase() === 'admin' ||
      (session.user as any)?.role === 'admin'

    // Try to find user by the session ID
    const userFromSessionId = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      include: { role: true },
    })

    // Only administrators can inspect all users in dev mode
    const allUsers = isAdmin
      ? await prisma.user.findMany({
          select: { id: true, email: true, name: true, roleId: true, role: { select: { name: true } } },
          take: 20,
        })
      : []

    const allRoles = isAdmin
      ? await prisma.role.findMany({
          select: { id: true, name: true },
        })
      : []

    return NextResponse.json({
      session: {
        userId: session.user.id,
        userEmail: session.user.email,
        userName: session.user.name,
        role: session.user.role,
      },
      databaseUser: userFromSessionId ? {
        id: userFromSessionId.id,
        email: userFromSessionId.email,
        name: userFromSessionId.name,
        role: userFromSessionId.role,
      } : null,
      allUsers,
      allRoles,
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({
      error: String(error)
    }, { status: 500 })
  }
}
