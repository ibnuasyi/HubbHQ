export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// Debug endpoint to check session and user
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({
        error: 'No session',
        session: null
      }, { status: 401 })
    }

    // Try to find user by the session ID
    const userFromSessionId = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      include: { role: true },
    })

    // Also get all users to see what's in the database
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, name: true, roleId: true, role: { select: { name: true } } },
      take: 20,
    })

    // Get all roles
    const allRoles = await prisma.role.findMany({
      select: { id: true, name: true },
    })

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
