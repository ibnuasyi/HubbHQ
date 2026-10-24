export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateBallotVerificationHash } from '@/lib/voting'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: votingEventId } = await context.params
    const body = await request.json()
    const { kandidatId, votingToken } = body

    // 1. Validasi Sesi Pemilihan
    const event = await prisma.votingEvent.findFirst({
      where: {
        OR: [{ id: votingEventId }, { slug: votingEventId }],
      },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Sesi pemilihan tidak ditemukan' },
        { status: 404 }
      )
    }

    if (event.status !== 'AKTIF') {
      return NextResponse.json(
        {
          error:
            event.status === 'DRAFT'
              ? 'Sesi pemilihan ini belum dibuka oleh panitia musyawarah.'
              : 'Sesi pemilihan ini telah resmi ditutup atau selesai.',
        },
        { status: 400 }
      )
    }

    const now = new Date()
    if (now < event.startDate) {
      return NextResponse.json(
        { error: `Pemilihan baru akan dibuka pada ${new Date(event.startDate).toLocaleString('id-ID')}` },
        { status: 400 }
      )
    }

    if (now > event.endDate) {
      return NextResponse.json(
        { error: 'Waktu pemungutan suara telah berakhir' },
        { status: 400 }
      )
    }

    // 2. Cari & Validasi Hak Pemilih (DPT)
    let dptEntry = null

    if (votingToken?.trim()) {
      // Pemilih mencoblos menggunakan Token Bilik Suara
      dptEntry = await prisma.votingDPT.findFirst({
        where: {
          votingEventId: event.id,
          votingToken: votingToken.trim().toUpperCase(),
        },
      })
    } else if (session?.user?.id) {
      // Pemilih mencoblos menggunakan akun terautentikasi
      dptEntry = await prisma.votingDPT.findUnique({
        where: {
          votingEventId_userId: {
            votingEventId: event.id,
            userId: session.user.id,
          },
        },
      })
    }

    if (!dptEntry) {
      return NextResponse.json(
        {
          error:
            'Anda tidak terdaftar dalam Daftar Pemilih Tetap (DPT) atau token bilik suara tidak valid.',
        },
        { status: 403 }
      )
    }

    if (dptEntry.hasVoted) {
      return NextResponse.json(
        {
          error: `Hak suara atas nama "${dptEntry.nama}" telah digunakan sebelumnya pada ${
            dptEntry.votedAt
              ? new Date(dptEntry.votedAt).toLocaleString('id-ID')
              : 'sesi ini'
          }. Setiap pemilih hanya berhak mencoblos 1 kali.`,
        },
        { status: 400 }
      )
    }

    // 3. Validasi Pilihan Kandidat
    if (kandidatId) {
      const kandidat = await prisma.votingKandidat.findFirst({
        where: {
          id: kandidatId,
          votingEventId: event.id,
        },
      })

      if (!kandidat) {
        return NextResponse.json(
          { error: 'Pilihan kandidat tidak sah atau tidak terdaftar pada sesi ini' },
          { status: 400 }
        )
      }
    } else {
      // Pilihan Kosong / Abstain
      if (!event.allowAbstain) {
        return NextResponse.json(
          { error: 'Pemilihan ini mewajibkan memilih salah satu kandidat paslon' },
          { status: 400 }
        )
      }
    }

    // 4. Eksekusi Kotak Suara Anonim & Catat Kehadiran DPT secara Transaksional
    const voteTimestamp = new Date()
    const verificationHash = generateBallotVerificationHash(
      event.id,
      kandidatId || null,
      voteTimestamp
    )

    await prisma.$transaction(async (tx) => {
      // A. Tandai DPT telah mencoblos (atomic check-and-set untuk mencegah race condition double-voting)
      const updateResult = await tx.votingDPT.updateMany({
        where: {
          id: dptEntry.id,
          hasVoted: false,
        },
        data: {
          hasVoted: true,
          votedAt: voteTimestamp,
        },
      })

      if (updateResult.count === 0) {
        throw new Error('Hak suara ini telah digunakan sebelumnya pada sesi ini')
      }

      // B. Tambahkan suara sah kandidat jika memilih kandidat
      if (kandidatId) {
        await tx.votingKandidat.update({
          where: { id: kandidatId },
          data: {
            suaraSah: { increment: 1 },
          },
        })
      }

      // C. Masukkan lembar suara anonim ke kotak suara digital (TANPA relasi ke DPT/User)
      await tx.votingBallot.create({
        data: {
          votingEventId: event.id,
          kandidatId: kandidatId || null,
          hashVerification: verificationHash,
          timestamp: voteTimestamp,
        },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Hak suara Anda berhasil dimasukkan ke kotak suara digital secara sah dan rahasia.',
      data: {
        voterName: dptEntry.nama,
        timestamp: voteTimestamp.toISOString(),
        verificationHash,
      },
    })
  } catch (error) {
    console.error('Error casting vote:', error)
    return NextResponse.json(
      { error: 'Gagal memasukkan suara ke kotak suara digital' },
      { status: 500 }
    )
  }
}

