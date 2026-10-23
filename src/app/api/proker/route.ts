export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'

// GET /api/proker - List all program kerja
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const divisiId = searchParams.get('divisiId') || ''
    const status = searchParams.get('status') || ''
    const picId = searchParams.get('picId') || ''

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (divisiId) {
      where.divisiId = divisiId
    }

    if (status) {
      where.status = status
    }

    if (picId) {
      where.picId = picId
    }

    const [proker, total] = await Promise.all([
      prisma.programKerja.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          divisi: true,
          pic: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          checkpoints: {
            orderBy: { order: 'asc' },
          },
          panitia: {
            include: {
              user: {
                select: { id: true, name: true, avatar: true },
              },
            },
          },
          proposals: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              title: true,
              amount: true,
              status: true,
              version: true,
              reviewedNote: true,
            },
          },
          lpj: {
            select: {
              id: true,
              status: true,
              totalPemasukan: true,
              totalPengeluaran: true,
              saldoAkhir: true,
            },
          },
          _count: {
            select: {
              checkpoints: true,
              panitia: true,
            },
          },
        },
      }),
      prisma.programKerja.count({ where }),
    ])

    // Calculate progress for each proker
    const prokerWithProgress = proker.map((p) => {
      const totalCheckpoints = p._count.checkpoints
      const completedCheckpoints = p.checkpoints.filter((c) => c.isCompleted).length
      const progress =
        totalCheckpoints > 0
          ? Math.round((completedCheckpoints / totalCheckpoints) * 100)
          : 0

      return {
        ...p,
        progress,
        completedCheckpoints,
        totalCheckpoints,
      }
    })

    return NextResponse.json({
      data: prokerWithProgress,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching program kerja:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/proker - Create new program kerja
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await hasPermission(session.user.id, 'proker.create')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      divisiId,
      picId,
      startDate,
      endDate,
      status,
      kategori,
      sasaran,
      indikator,
      anggaranEstimasi,
      sumberDana,
      lokasi,
      checkpoints,
      panitia,
    } = body

    if (!title || !divisiId) {
      return NextResponse.json(
        { error: 'Judul dan divisi diperlukan' },
        { status: 400 }
      )
    }

    // Create proker with checkpoints and panitia
    const proker = await prisma.programKerja.create({
      data: {
        title,
        description,
        divisiId,
        picId: picId || null,
        creatorId: session.user.id,
        status: status || 'DRAFT',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        kategori: kategori || 'INSIDENTAL',
        sasaran: sasaran || null,
        indikator: indikator || null,
        anggaranEstimasi: anggaranEstimasi ? parseFloat(anggaranEstimasi) : null,
        sumberDana: sumberDana || null,
        lokasi: lokasi || null,
        checkpoints: checkpoints?.length
          ? {
              create: checkpoints.map((cp: any, index: number) => ({
                title: cp.title,
                description: cp.description,
                order: index,
              })),
            }
          : undefined,
        panitia: panitia?.length
          ? {
              create: panitia.map((p: any) => ({
                userId: p.userId,
                roleJabatan: p.roleJabatan || 'Anggota Panitia',
              })),
            }
          : undefined,
      },
      include: {
        divisi: true,
        pic: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        checkpoints: true,
        panitia: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    })

    // Auto schedule calendar event if startDate provided
    if (startDate) {
      try {
        await prisma.calendarEvent.create({
          data: {
            title: `[PROKER] ${title}`,
            description: description || `Agenda kegiatan: ${title}`,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : new Date(startDate),
            allDay: true,
            location: lokasi || null,
            programKerjaId: proker.id,
            creatorId: session.user.id,
            color: '#2563eb',
            isPublic: true,
          },
        })
      } catch (calErr) {
        console.error('Error creating calendar event for proker:', calErr)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Program kerja berhasil dibuat',
      data: proker,
    })
  } catch (error) {
    console.error('Error creating program kerja:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
