export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'

// GET /api/wilayah - List all wilayah
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const wilayah = await prisma.wilayah.findMany({
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json({
      success: true,
      data: wilayah,
    })
  } catch (error) {
    console.error('Error fetching wilayah:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/wilayah - Create new wilayah
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await hasPermission(session.user.id, 'settings.edit')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, shortName, parentId, level } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Nama diperlukan' },
        { status: 400 }
      )
    }

    const wilayah = await prisma.wilayah.create({
      data: {
        name,
        shortName,
        parentId,
        level: level ?? 0,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Wilayah berhasil dibuat',
      data: wilayah,
    })
  } catch (error) {
    console.error('Error creating wilayah:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
