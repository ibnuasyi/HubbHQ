export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'

// GET /api/surat/[id] - Get single surat
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

    const surat = await prisma.surat.findUnique({
      where: { id },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
          },
        },
        jenisSurat: true,
      },
    })

    if (!surat) {
      return NextResponse.json(
        { error: 'Surat tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: surat,
    })
  } catch (error) {
    console.error('Error fetching surat:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/surat/[id] - Update surat
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

    const hasAccess = await hasPermission(session.user.id, 'surat.edit')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      subject,
      content,
      sender,
      senderContact,
      receivedDate,
      status,
      approverId,
      approvedAt,
    } = body

    const updateData: any = {}

    if (subject !== undefined) updateData.subject = subject
    if (content !== undefined) updateData.content = content
    if (sender !== undefined) updateData.sender = sender
    if (senderContact !== undefined) updateData.senderContact = senderContact
    if (receivedDate !== undefined) updateData.receivedDate = receivedDate ? new Date(receivedDate) : null
    if (status !== undefined) {
      updateData.status = status
      if (status === 'APPROVED') {
        updateData.approverId = session.user.id
        updateData.approvedAt = new Date()
      }
    }

    const surat = await prisma.surat.update({
      where: { id },
      data: updateData,
      include: {
        requester: {
          select: {
            id: true,
            name: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
          },
        },
        jenisSurat: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Surat berhasil diupdate',
      data: surat,
    })
  } catch (error) {
    console.error('Error updating surat:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/surat/[id] - Delete surat
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

    const hasAccess = await hasPermission(session.user.id, 'surat.delete')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.surat.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Surat berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting surat:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
