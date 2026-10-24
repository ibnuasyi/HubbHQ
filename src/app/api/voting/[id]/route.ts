export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await context.params

    const event = await prisma.votingEvent.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        kandidat: {
          orderBy: { nomorUrut: 'asc' },
        },
        _count: {
          select: {
            dpt: true,
            ballots: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Sesi musyawarah / pemilihan tidak ditemukan' },
        { status: 404 }
      )
    }

    // Periksa status pemilih user yang sedang login
    let userDptStatus = null
    if (session?.user?.id) {
      const dptEntry = await prisma.votingDPT.findUnique({
        where: {
          votingEventId_userId: {
            votingEventId: event.id,
            userId: session.user.id,
          },
        },
      })
      if (dptEntry) {
        userDptStatus = {
          isDpt: true,
          hasVoted: dptEntry.hasVoted,
          votedAt: dptEntry.votedAt,
          votingToken: dptEntry.votingToken,
        }
      } else {
        userDptStatus = { isDpt: false }
      }
    }

    const totalDpt = event._count.dpt
    const totalSuara = event._count.ballots
    const partisipasi =
      totalDpt > 0 ? Math.round((totalSuara / totalDpt) * 100) : 0

    return NextResponse.json({
      success: true,
      data: {
        ...event,
        totalDpt,
        totalSuara,
        partisipasi,
        userDptStatus,
      },
    })
  } catch (error) {
    console.error('Error fetching voting detail:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil detail musyawarah' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const {
      title,
      description,
      rules,
      startDate,
      endDate,
      status,
      showLiveCount,
      allowAbstain,
    } = body

    const existing = await prisma.votingEvent.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Sesi pemilihan tidak ditemukan' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (title) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description ? description.trim() : null
    if (rules !== undefined) updateData.rules = rules ? rules.trim() : null
    if (startDate) updateData.startDate = new Date(startDate)
    if (endDate) updateData.endDate = new Date(endDate)
    if (status) updateData.status = status
    if (showLiveCount !== undefined) updateData.showLiveCount = Boolean(showLiveCount)
    if (allowAbstain !== undefined) updateData.allowAbstain = Boolean(allowAbstain)

    const updated = await prisma.votingEvent.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'Pengaturan sesi pemilihan berhasil diperbarui',
      data: updated,
    })
  } catch (error) {
    console.error('Error updating voting event:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui sesi pemilihan' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    await prisma.votingEvent.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Sesi musyawarah berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting voting event:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus sesi pemilihan' },
      { status: 500 }
    )
  }
}

