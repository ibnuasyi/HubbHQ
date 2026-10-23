export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'

// POST /api/proker/[id]/checkpoints - Add checkpoint
export async function POST(
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
    const { title, description } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Judul checkpoint diperlukan' },
        { status: 400 }
      )
    }

    // Get max order
    const maxOrder = await prisma.checkpoint.aggregate({
      where: { programKerjaId: id },
      _max: { order: true },
    })

    const checkpoint = await prisma.checkpoint.create({
      data: {
        programKerjaId: id,
        title,
        description,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Checkpoint berhasil ditambahkan',
      data: checkpoint,
    })
  } catch (error) {
    console.error('Error creating checkpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/proker/[id]/checkpoints - Update checkpoint (toggle complete, edit, delete)
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
    const { checkpointId, action, title, description, isCompleted } = body

    if (!checkpointId) {
      return NextResponse.json(
        { error: 'Checkpoint ID diperlukan' },
        { status: 400 }
      )
    }

    let result;

    switch (action) {
      case 'toggle': {
        // Toggle completion status
        const current = await prisma.checkpoint.findUnique({
          where: { id: checkpointId },
        })
        result = await prisma.checkpoint.update({
          where: { id: checkpointId },
          data: {
            isCompleted: !current?.isCompleted,
            completedAt: !current?.isCompleted ? new Date() : null,
            completedById: !current?.isCompleted ? session.user.id : null,
          },
        })
        break
      }

      case 'update':
        // Update checkpoint details
        result = await prisma.checkpoint.update({
          where: { id: checkpointId },
          data: {
            title,
            description,
          },
        })
        break

      case 'delete':
        // Delete checkpoint
        await prisma.checkpoint.delete({
          where: { id: checkpointId },
        })
        return NextResponse.json({
          success: true,
          message: 'Checkpoint berhasil dihapus',
        })

      case 'complete':
        // Mark as completed
        result = await prisma.checkpoint.update({
          where: { id: checkpointId },
          data: {
            isCompleted: true,
            completedAt: new Date(),
            completedById: session.user.id,
          },
        })
        break

      case 'uncomplete':
        // Mark as not completed
        result = await prisma.checkpoint.update({
          where: { id: checkpointId },
          data: {
            isCompleted: false,
            completedAt: null,
            completedById: null,
          },
        })
        break

      default:
        return NextResponse.json(
          { error: 'Action tidak valid' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: 'Checkpoint berhasil diupdate',
      data: result,
    })
  } catch (error) {
    console.error('Error updating checkpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
