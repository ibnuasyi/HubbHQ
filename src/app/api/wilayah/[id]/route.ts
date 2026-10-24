export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth, isAdmin } from '@/lib/auth'

// PATCH /api/wilayah/[id] - Update wilayah
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

    // Check if user is admin
    const admin = await isAdmin(session.user.id)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const body = await request.json()
    const { name, shortName, level, parentId, isActive } = body

    // Get existing wilayah
    const existing = await prisma.wilayah.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Wilayah not found' }, { status: 404 })
    }

    // Prevent changing Pusat level to non-zero
    if (existing.name === 'Pusat' && level !== 0) {
      return NextResponse.json(
        { error: 'Cannot change Pusat level' },
        { status: 400 }
      )
    }

    const wilayah = await prisma.wilayah.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        shortName: shortName !== undefined ? shortName : existing.shortName,
        level: level ?? existing.level,
        parentId: parentId !== undefined ? parentId : existing.parentId,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Wilayah berhasil diupdate',
      data: wilayah,
    })
  } catch (error) {
    console.error('Error updating wilayah:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/wilayah/[id] - Delete wilayah
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

    // Check if user is admin
    const admin = await isAdmin(session.user.id)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Get existing wilayah
    const existing = await prisma.wilayah.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, children: true } },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Wilayah not found' }, { status: 404 })
    }

    // Prevent deleting Pusat
    if (existing.name === 'Pusat') {
      return NextResponse.json(
        { error: 'Cannot delete Pusat wilayah' },
        { status: 400 }
      )
    }

    // Check if wilayah has users
    if (existing._count.users > 0) {
      return NextResponse.json(
        { error: `Wilayah has ${existing._count.users} users. Please reassign them first.` },
        { status: 400 }
      )
    }

    await prisma.wilayah.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Wilayah berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting wilayah:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
