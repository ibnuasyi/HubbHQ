export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth, isAdmin } from '@/lib/auth'

// PATCH /api/jabatan/[id] - Update jabatan
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
    const { name, shortName, level, isActive } = body

    // Get existing jabatan
    const existing = await prisma.jabatan.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Jabatan not found' }, { status: 404 })
    }

    const jabatan = await prisma.jabatan.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        shortName: shortName !== undefined ? shortName : existing.shortName,
        level: level ?? existing.level,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Jabatan berhasil diupdate',
      data: jabatan,
    })
  } catch (error) {
    console.error('Error updating jabatan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/jabatan/[id] - Delete jabatan
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

    // Get existing jabatan
    const existing = await prisma.jabatan.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true } },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Jabatan not found' }, { status: 404 })
    }

    // Check if jabatan has users
    if (existing._count.users > 0) {
      return NextResponse.json(
        { error: `Jabatan has ${existing._count.users} users. Please reassign them first.` },
        { status: 400 }
      )
    }

    await prisma.jabatan.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Jabatan berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting jabatan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
