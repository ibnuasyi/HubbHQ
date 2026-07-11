export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'

// GET /api/divisi - Get all divisions
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('isActive')

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortName: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const divisi = await prisma.divisi.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
    })

    return NextResponse.json({ data: divisi })
  } catch (error) {
    console.error('Error fetching divisi:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/divisi - Create new division
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await hasPermission(session.user.id, 'divisi.create')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, shortName, description, color } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Nama divisi diperlukan' },
        { status: 400 }
      )
    }

    const divisi = await prisma.divisi.create({
      data: {
        name,
        shortName: shortName || null,
        description: description || null,
        color: color || '#6366f1',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Divisi berhasil dibuat',
      data: divisi,
    })
  } catch (error) {
    console.error('Error creating divisi:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
