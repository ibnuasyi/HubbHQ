export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'

// GET /api/proker/[id] - Get single program kerja
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

    const proker = await prisma.programKerja.findUnique({
      where: { id },
      include: {
        divisi: true,
        pic: true,
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        checkpoints: {
          orderBy: { order: 'asc' },
        },
        calendarEvents: true,
      },
    })

    if (!proker) {
      return NextResponse.json(
        { error: 'Program kerja tidak ditemukan' },
        { status: 404 }
      )
    }

    // Calculate progress
    const totalCheckpoints = proker.checkpoints.length
    const completedCheckpoints = proker.checkpoints.filter(
      (c) => c.isCompleted
    ).length
    const progress =
      totalCheckpoints > 0
        ? Math.round((completedCheckpoints / totalCheckpoints) * 100)
        : 0

    return NextResponse.json({
      data: {
        ...proker,
        progress,
        completedCheckpoints,
        totalCheckpoints,
      },
    })
  } catch (error) {
    console.error('Error fetching program kerja:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/proker/[id] - Update program kerja
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

    const hasAccess = await hasPermission(session.user.id, 'proker.edit')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      divisiId,
      picId,
      status,
      startDate,
      endDate,
    } = body

    const updateData: any = {}

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (divisiId !== undefined) updateData.divisiId = divisiId
    if (picId !== undefined) updateData.picId = picId
    if (status !== undefined) updateData.status = status
    if (startDate !== undefined)
      updateData.startDate = startDate ? new Date(startDate) : null
    if (endDate !== undefined)
      updateData.endDate = endDate ? new Date(endDate) : null

    const proker = await prisma.programKerja.update({
      where: { id },
      data: updateData,
      include: {
        divisi: true,
        pic: true,
        checkpoints: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Program kerja berhasil diupdate',
      data: proker,
    })
  } catch (error) {
    console.error('Error updating program kerja:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/proker/[id] - Delete program kerja
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

    const hasAccess = await hasPermission(session.user.id, 'proker.delete')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.programKerja.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Program kerja berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting program kerja:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
