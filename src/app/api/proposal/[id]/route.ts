export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth, hasPermission, isSuperAdminRole } from '@/lib/auth'

// PATCH /api/proposal/[id] - Update proposal status or submit revision
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

    const proposal = await prisma.proposalDana.findUnique({
      where: { id },
      include: {
        requester: {
          select: { id: true, name: true }
        },
        programKerja: {
          select: { id: true, picId: true }
        }
      }
    })

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal tidak ditemukan' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { action, note, revisionFile, title, amount, description } = body

    const isReviewAction = ['approve', 'reject', 'request_revision'].includes(action)

    if (isReviewAction) {
      const hasAccess = await hasPermission(session.user.id, 'keuangan.approve')
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Forbidden: Anda tidak memiliki wewenang persetujuan proposal keuangan' },
          { status: 403 }
        )
      }

      // SECURITY: Prevent self-approval (Separation of Duties)
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
        // Check ownership or admin (BOLA protection)
        const userRole = (session.user as any)?.role?.name?.toLowerCase() || ''
        const isRequester = proposal.requester.id === session.user.id
        const isPic = proposal.programKerja?.picId === session.user.id
        const isAdminOrLead = isSuperAdminRole(userRole) || ['admin', 'ketua'].includes(userRole)

        if (!isRequester && !isPic && !isAdminOrLead) {
          return NextResponse.json(
            { error: 'Forbidden: Hanya pemohon asli atau PIC yang dapat mengajukan revisi proposal ini' },
            { status: 403 }
          )
        }

        // Archive current version to ProposalHistory
        const currentVersion = proposal.version || 1
        await prisma.proposalHistory.create({
          data: {
            proposalDanaId: proposal.id,
            version: currentVersion,
            title: proposal.title,
            description: proposal.description,
            amount: proposal.amount,
            proposalFile: proposal.proposalFile,
            status: proposal.status,
            reviewedNote: proposal.reviewedNote || proposal.revisionNote,
            reviewedById: proposal.reviewedById,
            reviewedAt: proposal.reviewedAt,
          },
        })

        const newVersion = currentVersion + 1
        updateData = {
          title: title || proposal.title,
          description: description !== undefined ? description : proposal.description,
          amount: amount ? parseFloat(amount) : proposal.amount,
          proposalFile: revisionFile || proposal.proposalFile,
          revisionFile: revisionFile || proposal.revisionFile,
          status: 'PENDING',
          version: newVersion,
          reviewedById: null,
          reviewedAt: null,
          reviewedNote: null,
          revisionNote: null,
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
          select: { id: true, name: true, avatar: true },
        },
        programKerja: {
          select: { id: true, title: true },
        },
        reviewedBy: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Proposal berhasil diperbarui',
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
          select: { id: true, name: true, email: true, avatar: true },
        },
        programKerja: {
          select: {
            id: true,
            title: true,
            description: true,
            startDate: true,
            endDate: true,
            divisi: { select: { id: true, name: true, color: true } },
            pic: { select: { id: true, name: true } },
          },
        },
        reviewedBy: {
          select: { id: true, name: true, email: true },
        },
        history: {
          orderBy: { version: 'desc' },
          include: {
            reviewedBy: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: proposal })
  } catch (error) {
    console.error('Error fetching proposal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
