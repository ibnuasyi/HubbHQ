export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'

// GET /api/jabatan - List all jabatan
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jabatan = await prisma.jabatan.findMany({
      orderBy: [{ level: 'asc' }],
    })

    return NextResponse.json({
      success: true,
      data: jabatan,
    })
  } catch (error) {
    console.error('Error fetching jabatan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/jabatan - Create new jabatan
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
    const { name, shortName, level } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Nama diperlukan' },
        { status: 400 }
      )
    }

    const jabatan = await prisma.jabatan.create({
      data: {
        name,
        shortName,
        level: level ?? 0,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Jabatan berhasil dibuat',
      data: jabatan,
    })
  } catch (error) {
    console.error('Error creating jabatan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
