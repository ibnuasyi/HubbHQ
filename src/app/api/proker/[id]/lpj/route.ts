export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'

// GET /api/proker/[id]/lpj - Get LPJ details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: prokerId } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const lpj = await prisma.lpjProker.findUnique({
      where: { programKerjaId: prokerId },
      include: {
        reviewedBy: { select: { id: true, name: true } },
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    return NextResponse.json({ success: true, data: lpj })
  } catch (error) {
    console.error('Error fetching LPJ:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST / PATCH /api/proker/[id]/lpj - Create or update LPJ narrative & submit
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

    const hasAccess = await hasPermission(session.user.id, 'proker.edit')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      ringkasanKegiatan,
      pesertaHadir,
      ketercapaianTarget,
      kendala,
      solusi,
      rekomendasi,
      dokumenFinalLpj,
      dokumenFinalName,
      submitForReview, // boolean: if true, set status = 'SUBMITTED'
    } = body

    const status = submitForReview ? 'SUBMITTED' : 'DRAFT'

    // Upsert LPJ record
    const lpj = await prisma.lpjProker.upsert({
      where: { programKerjaId: prokerId },
      create: {
        programKerjaId: prokerId,
        ringkasanKegiatan: ringkasanKegiatan || null,
        pesertaHadir: pesertaHadir ? parseInt(pesertaHadir) : 0,
        ketercapaianTarget: ketercapaianTarget || null,
        kendala: kendala || null,
        solusi: solusi || null,
        rekomendasi: rekomendasi || null,
        dokumenFinalLpj: dokumenFinalLpj || null,
        dokumenFinalName: dokumenFinalName || null,
        status,
      },
      update: {
        ringkasanKegiatan: ringkasanKegiatan !== undefined ? ringkasanKegiatan : undefined,
        pesertaHadir: pesertaHadir !== undefined ? parseInt(pesertaHadir) : undefined,
        ketercapaianTarget: ketercapaianTarget !== undefined ? ketercapaianTarget : undefined,
        kendala: kendala !== undefined ? kendala : undefined,
        solusi: solusi !== undefined ? solusi : undefined,
        rekomendasi: rekomendasi !== undefined ? rekomendasi : undefined,
        dokumenFinalLpj: dokumenFinalLpj !== undefined ? dokumenFinalLpj : undefined,
        dokumenFinalName: dokumenFinalName !== undefined ? dokumenFinalName : undefined,
        status: submitForReview ? 'SUBMITTED' : undefined,
      },
      include: {
        items: true,
        reviewedBy: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({
      success: true,
      message: submitForReview
        ? 'Laporan Pertanggungjawaban (LPJ) berhasil diajukan untuk ditinjau oleh pengurus.'
        : 'Draf Laporan Pertanggungjawaban (LPJ) berhasil disimpan.',
      data: lpj,
    })
  } catch (error) {
    console.error('Error saving LPJ:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

