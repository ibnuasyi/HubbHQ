export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// GET /api/proker/[id]/proposal - Get active proposal and history for this proker
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

    const proposal = await prisma.proposalDana.findFirst({
      where: { programKerjaId: id },
      include: {
        requester: { select: { id: true, name: true, email: true, avatar: true } },
        reviewedBy: { select: { id: true, name: true } },
        history: {
          orderBy: { version: 'desc' },
          include: {
            reviewedBy: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: proposal })
  } catch (error) {
    console.error('Error fetching proker proposal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/proker/[id]/proposal - Submit or Revise proposal for this proker
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: prokerId } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Verify Proker and PIC requirement
    const proker = await prisma.programKerja.findUnique({
      where: { id: prokerId },
      include: { pic: true },
    })

    if (!proker) {
      return NextResponse.json({ error: 'Program kerja tidak ditemukan' }, { status: 404 })
    }

    if (!proker.picId) {
      return NextResponse.json(
        { error: 'Proposal dana hanya dapat dinaikkan setelah PIC (Penanggung Jawab) ditentukan pada program kerja ini.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { title, description, amount, proposalFile } = body

    if (!title || !amount) {
      return NextResponse.json(
        { error: 'Judul proposal dan nominal anggaran wajib diisi' },
        { status: 400 }
      )
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Nominal anggaran harus berupa angka positif' },
        { status: 400 }
      )
    }

    // 2. Check if a proposal already exists for this proker
    const existingProposal = await prisma.proposalDana.findFirst({
      where: { programKerjaId: prokerId },
      include: { history: true },
      orderBy: { createdAt: 'desc' },
    })

    if (existingProposal) {
      // If existing proposal is currently PENDING, don't allow duplicate submission
      if (existingProposal.status === 'PENDING') {
        return NextResponse.json(
          { error: 'Proposal saat ini masih dalam status Menunggu Review. Harap tunggu keputusan peninjau.' },
          { status: 400 }
        )
      }

      // If existing proposal is APPROVED, don't allow overwriting
      if (existingProposal.status === 'APPROVED') {
        return NextResponse.json(
          { error: 'Proposal untuk program kerja ini sudah disetujui (APPROVED).' },
          { status: 400 }
        )
      }

      // If REJECTED or NEEDS_REVISION: archive the current state to ProposalHistory (Git-like commit)
      const currentVersion = existingProposal.version || 1
      await prisma.proposalHistory.create({
        data: {
          proposalDanaId: existingProposal.id,
          version: currentVersion,
          title: existingProposal.title,
          description: existingProposal.description,
          amount: existingProposal.amount,
          proposalFile: existingProposal.proposalFile,
          status: existingProposal.status,
          reviewedNote: existingProposal.reviewedNote,
          reviewedById: existingProposal.reviewedById,
          reviewedAt: existingProposal.reviewedAt,
        },
      })

      // Update proposal with incremented version and reset review fields
      const newVersion = currentVersion + 1
      const updatedProposal = await prisma.proposalDana.update({
        where: { id: existingProposal.id },
        data: {
          title,
          description: description || null,
          amount: parsedAmount,
          proposalFile: proposalFile || existingProposal.proposalFile,
          status: 'PENDING',
          version: newVersion,
          requesterId: session.user.id,
          reviewedById: null,
          reviewedAt: null,
          reviewedNote: null,
        },
        include: {
          requester: { select: { id: true, name: true, avatar: true } },
          history: { orderBy: { version: 'desc' } },
        },
      })

      return NextResponse.json({
        success: true,
        message: `Proposal revisi (Versi ${newVersion}) berhasil dinaikkan. Riwayat versi sebelumnya tetap diarsipkan.`,
        data: updatedProposal,
      })
    }

    // 3. Create fresh new proposal (Version 1)
    const newProposal = await prisma.proposalDana.create({
      data: {
        programKerjaId: prokerId,
        title,
        description: description || null,
        amount: parsedAmount,
        proposalFile: proposalFile || null,
        status: 'PENDING',
        version: 1,
        requesterId: session.user.id,
      },
      include: {
        requester: { select: { id: true, name: true, avatar: true } },
      },
    })

    // Record initial history snapshot
    await prisma.proposalHistory.create({
      data: {
        proposalDanaId: newProposal.id,
        version: 1,
        title: newProposal.title,
        description: newProposal.description,
        amount: newProposal.amount,
        proposalFile: newProposal.proposalFile,
        status: 'PENDING',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Proposal dana berhasil dinaikkan untuk ditinjau oleh pimpinan/bendahara.',
      data: newProposal,
    })
  } catch (error) {
    console.error('Error submitting proker proposal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

