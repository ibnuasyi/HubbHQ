export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'

// GET /api/keuangan/kas - List all kas payments
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || ''
    const month = searchParams.get('month') || ''
    const year = searchParams.get('year') || ''

    const skip = (page - 1) * limit

    const where: any = {}

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const canViewAll =
      ['admin', 'ketua', 'bendahara'].includes(roleName) ||
      (await hasPermission(session.user.id, 'keuangan.view'))

    if (!canViewAll) {
      where.userId = session.user.id
    }

    if (status) {
      where.status = status
    }

    if (month) {
      where.month = parseInt(month)
    }

    if (year) {
      where.year = parseInt(year)
    }

    const [kasPayments, total] = await Promise.all([
      prisma.kasPayment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.kasPayment.count({ where }),
    ])

    return NextResponse.json({
      data: kasPayments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching kas payments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/keuangan/kas - Create kas payment
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { month, year, amount, proof, proofType, notes } = body

    if (!month || !year || !amount) {
      return NextResponse.json(
        { error: 'Bulan, tahun, dan jumlah diperlukan' },
        { status: 400 }
      )
    }

    // Check if already exists
    const existing = await prisma.kasPayment.findUnique({
      where: {
        userId_month_year: {
          userId: session.user.id,
          month: parseInt(month),
          year: parseInt(year),
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Pembayaran kas untuk bulan ini sudah ada' },
        { status: 400 }
      )
    }

    const kasPayment = await prisma.kasPayment.create({
      data: {
        userId: session.user.id,
        month: parseInt(month),
        year: parseInt(year),
        amount: parseFloat(amount),
        proof,
        proofType,
        notes,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Pembayaran kas berhasil diajukan',
      data: kasPayment,
    })
  } catch (error) {
    console.error('Error creating kas payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
