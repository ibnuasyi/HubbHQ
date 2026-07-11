export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'

// GET /api/divisi/[id] - Get single division
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const divisi = await prisma.divisi.findUnique({
      where: { id },
      include: {
        members: {
          where: { isActive: true },
          include: {
            user: {
              include: { role: true },
            },
          },
        },
        programKerja: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!divisi) {
      return NextResponse.json({ error: 'Divisi tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ data: divisi })
  } catch (error) {
    console.error('Error fetching divisi:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/divisi/[id] - Update division
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await hasPermission(session.user.id, 'divisi.edit')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, shortName, description, color, isActive } = body

    const divisi = await prisma.divisi.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(shortName !== undefined && { shortName }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Divisi berhasil diupdate',
      data: divisi,
    })
  } catch (error) {
    console.error('Error updating divisi:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/divisi/[id] - Delete division
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await hasPermission(session.user.id, 'divisi.delete')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.divisi.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Divisi berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting divisi:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
