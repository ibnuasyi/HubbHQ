export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'

// PATCH /api/proker/[id]/proposal/review - Approve or Reject proposal
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: prokerId } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission to review proposals
    const canReview =
      (await hasPermission(session.user.id, 'proposal.review')) ||
      (await hasPermission(session.user.id, 'proker.edit')) ||
      session.user.role?.name === 'ADMIN' ||
      (session.user as any).role === 'ADMIN'

    if (!canReview) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki hak akses untuk meninjau/menyetujui proposal.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, note, proposalId } = body // action: 'APPROVED' | 'REJECTED'

    if (!action || !['APPROVED', 'REJECTED'].includes(action)) {
      return NextResponse.json(
        { error: 'Aksi peninjauan tidak valid. Gunakan APPROVED atau REJECTED.' },
        { status: 400 }
      )
    }

    if (action === 'REJECTED' && (!note || !note.trim())) {
      return NextResponse.json(
        { error: 'Catatan alasan penolakan wajib diisi untuk pembelajaran dan perbaikan proposal tim.' },
        { status: 400 }
      )
    }

    // Find proposal
    const proposal = await prisma.proposalDana.findFirst({
      where: proposalId
        ? { id: proposalId, programKerjaId: prokerId }
        : { programKerjaId: prokerId },
      orderBy: { createdAt: 'desc' },
    })

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal tidak ditemukan' }, { status: 404 })
    }

    const now = new Date()

    // 1. Update Proposal status
    const updatedProposal = await prisma.proposalDana.update({
      where: { id: proposal.id },
      data: {
        status: action,
        reviewedById: session.user.id,
        reviewedAt: now,
        reviewedNote: note || (action === 'APPROVED' ? 'Proposal disetujui untuk dilaksanakan' : null),
      },
    })

    // 2. Record this decision into ProposalHistory (Git-like historical trail)
    await prisma.proposalHistory.create({
      data: {
        proposalDanaId: proposal.id,
        version: proposal.version,
        title: proposal.title,
        description: proposal.description,
        amount: proposal.amount,
        proposalFile: proposal.proposalFile,
        status: action,
        reviewedNote: note || (action === 'APPROVED' ? 'Proposal disetujui' : null),
        reviewedById: session.user.id,
        reviewedAt: now,
      },
    })

    // 3. If APPROVED: Auto-activate proker to ON_PROGRESS
    if (action === 'APPROVED') {
      await prisma.programKerja.update({
        where: { id: prokerId },
        data: { status: 'ON_PROGRESS' },
      })
    }

    return NextResponse.json({
      success: true,
      message:
        action === 'APPROVED'
          ? 'Proposal berhasil disetujui (ACC). Program kerja otomatis aktif berjalan (ON_PROGRESS).'
          : 'Proposal telah ditolak dengan catatan evaluasi. Riwayat versi ini tetap tersimpan untuk perbaikan.',
      data: updatedProposal,
    })
  } catch (error) {
    console.error('Error reviewing proposal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
