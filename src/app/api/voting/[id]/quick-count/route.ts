export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: votingEventId } = await context.params

    const event = await prisma.votingEvent.findFirst({
      where: {
        OR: [{ id: votingEventId }, { slug: votingEventId }],
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
        { error: 'Sesi pemilihan tidak ditemukan' },
        { status: 404 }
      )
    }

    const totalDpt = event._count.dpt
    const totalSuaraMasuk = event._count.ballots
    const partisipasi =
      totalDpt > 0 ? Math.round((totalSuaraMasuk / totalDpt) * 100) : 0

    // Hitung suara per kandidat
    const isLiveAllowed = event.showLiveCount || event.status === 'SELESAI'

    const totalSuaraSah = event.kandidat.reduce((sum, k) => sum + k.suaraSah, 0)
    const suaraAbstain = Math.max(0, totalSuaraMasuk - totalSuaraSah)

    const kandidatStats = event.kandidat.map((k) => {
      const persentase =
        totalSuaraMasuk > 0
          ? Math.round((k.suaraSah / totalSuaraMasuk) * 1000) / 10
          : 0

      return {
        id: k.id,
        nomorUrut: k.nomorUrut,
        namaKetua: k.namaKetua,
        namaWakil: k.namaWakil,
        fotoUrl: k.fotoUrl,
        suaraSah: isLiveAllowed ? k.suaraSah : null,
        persentase: isLiveAllowed ? persentase : null,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        eventId: event.id,
        title: event.title,
        status: event.status,
        showLiveCount: event.showLiveCount,
        isLiveAllowed,
        totalDpt,
        totalSuaraMasuk,
        partisipasi,
        totalSuaraSah: isLiveAllowed ? totalSuaraSah : null,
        suaraAbstain: isLiveAllowed ? suaraAbstain : null,
        kandidat: kandidatStats,
        updatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error fetching quick count:', error)
    return NextResponse.json(
      { error: 'Gagal memuat hasil perhitungan suara' },
      { status: 500 }
    )
  }
}

