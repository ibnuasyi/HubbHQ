export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth, hasPermission } from '@/lib/auth'

// PATCH /api/proposal/[id] - Update proposal status
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

    const hasAccess = await hasPermission(session.user.id, 'keuangan.approve')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { action, note, revisionFile } = body

    const proposal = await prisma.proposalDana.findUnique({
      where: { id },
      include: {
        requester: {
          select: { id: true, name: true }
        }
      }
    })

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal tidak ditemukan' },
        { status: 404 }
      )
    }

    // SECURITY: Prevent self-approval (Separation of Duties)
    // The person who created the proposal cannot approve/reject it
    if (['approve', 'reject', 'request_revision'].includes(action)) {
      if (proposal.requester.id === session.user.id) {
        return NextResponse.json(
          {
            error: 'Konflik Kepentingan: Anda tidak bisa menyetujui atau menolak proposal Anda sendiri.',
            code: 'SELF_APPROVAL_FORBIDDEN'
          },
          { status: 403 }
        )
      }
    }

    let updateData: any = {}

    switch (action) {
      case 'approve':
        updateData = {
          status: 'APPROVED',
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          reviewedNote: note || null,
        }
        break

      case 'reject':
        updateData = {
          status: 'REJECTED',
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          reviewedNote: note || null,
        }
        break

      case 'request_revision':
        updateData = {
          status: 'NEEDS_REVISION',
          reviewedById: session.user.id,
          reviewedAt: new Date(),
          revisionNote: note || null,
        }
        break

      case 'submit_revision':
        if (!revisionFile) {
          return NextResponse.json(
            { error: 'File revision diperlukan' },
            { status: 400 }
          )
        }
        updateData = {
          status: 'REVISED',
          revisionFile,
        }
        break

      default:
        return NextResponse.json(
          { error: 'Action tidak valid' },
          { status: 400 }
        )
    }

    const updated = await prisma.proposalDana.update({
      where: { id },
      data: updateData,
      include: {
        requester: {
          select: { id: true, name: true },
        },
        programKerja: {
          select: { id: true, title: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Proposal berhasil diupdate',
      data: updated,
    })
  } catch (error) {
    console.error('Error updating proposal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/proposal/[id] - Get single proposal
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const proposal = await prisma.proposalDana.findUnique({
      where: { id },
      include: {
        requester: {
          select: { id: true, name: true, email: true },
        },
        programKerja: {
          select: { id: true, title: true },
        },
        reviewedBy: {
          select: { id: true, name: true },
        },
      },
    })

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: proposal })
  } catch (error) {
    console.error('Error fetching proposal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
