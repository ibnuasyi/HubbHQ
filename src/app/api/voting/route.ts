export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth, hasPermission } from '@/lib/auth'
import { prisma } from '@/lib/db'

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
}

export async function GET(_request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const events = await prisma.votingEvent.findMany({
      include: {
        _count: {
          select: {
            kandidat: true,
            dpt: true,
            ballots: true,
          },
        },
        kandidat: {
          orderBy: { nomorUrut: 'asc' },
          select: {
            id: true,
            nomorUrut: true,
            namaKetua: true,
            namaWakil: true,
            fotoUrl: true,
            suaraSah: true,
          },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const data = events.map((ev) => {
      const totalDpt = ev._count.dpt
      const totalSuara = ev._count.ballots
      const partisipasi =
        totalDpt > 0 ? Math.round((totalSuara / totalDpt) * 100) : 0

      return {
        ...ev,
        totalKandidat: ev._count.kandidat,
        totalDpt,
        totalSuara,
        partisipasi,
      }
    })

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error fetching voting events:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil daftar musyawarah / pemilihan' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const canCreateVoting =
      ['admin', 'ketua'].includes(roleName) ||
      (await hasPermission(session.user.id, 'settings.edit')) ||
      (await hasPermission(session.user.id, 'voting.admin'))

    if (!canCreateVoting) {
      return NextResponse.json(
        { error: 'Forbidden: Hanya Admin atau Panitia Musyawarah yang berwenang membuat sesi pemilihan' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      slug,
      description,
      rules,
      startDate,
      endDate,
      showLiveCount = true,
      allowAbstain = false,
    } = body

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Judul musyawarah / pemilihan wajib diisi' },
        { status: 400 }
      )
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Jadwal mulai dan berakhir pemilihan wajib ditentukan' },
        { status: 400 }
      )
    }

    const finalSlug = slug?.trim()
      ? slugify(slug.trim())
      : `${slugify(title)}-${Date.now().toString().slice(-4)}`

    // Pastikan slug unik
    const existing = await prisma.votingEvent.findUnique({
      where: { slug: finalSlug },
    })
    if (existing) {
      return NextResponse.json(
        { error: `Slug "${finalSlug}" sudah digunakan, silakan pilih slug lain.` },
        { status: 400 }
      )
    }

    const event = await prisma.votingEvent.create({
      data: {
        title: title.trim(),
        slug: finalSlug,
        description: description?.trim() || null,
        rules: rules?.trim() || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'DRAFT',
        showLiveCount: Boolean(showLiveCount),
        allowAbstain: Boolean(allowAbstain),
        createdById: session.user.id || null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Sesi musyawarah / pemilihan berhasil dibuat',
      data: event,
    })
  } catch (error) {
    console.error('Error creating voting event:', error)
    return NextResponse.json(
      { error: 'Gagal membuat sesi musyawarah / pemilihan' },
      { status: 500 }
    )
  }
}

