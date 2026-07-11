export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// GET /api/permissions - Get all permissions
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = await prisma.permission.findMany({
      orderBy: [{ group: 'asc' }, { label: 'asc' }],
    })

    return NextResponse.json({
      success: true,
      data: permissions,
    })
  } catch (error) {
    console.error('Error fetching permissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
