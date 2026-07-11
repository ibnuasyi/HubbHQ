export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'

// GET /api/keuangan - List all transactions
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    const skip = (page - 1) * limit

    const where: any = {}

    if (type) {
      where.type = type
    }

    if (category) {
      where.category = category
    }

    if (status) {
      where.status = status
    }

    if (startDate) {
      where.date = {
        ...where.date,
        gte: new Date(startDate),
      }
    }

    if (endDate) {
      where.date = {
        ...where.date,
        lte: new Date(endDate + 'T23:59:59'),
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          kasPayment: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ])

    return NextResponse.json({
      data: transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/keuangan - Create new transaction
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await hasPermission(session.user.id, 'keuangan.create')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      type,
      category,
      amount,
      description,
      date,
      receipt,
      receiptType,
      kasPaymentId,
    } = body

    if (!type || !category || !amount) {
      return NextResponse.json(
        { error: 'Tipe, kategori, dan jumlah diperlukan' },
        { status: 400 }
      )
    }

    const transaction = await prisma.transaction.create({
      data: {
        type,
        category,
        amount: parseFloat(amount),
        description,
        date: date ? new Date(date) : new Date(),
        receipt,
        receiptType,
        kasPaymentId,
        createdById: session.user.id,
        status: 'APPROVED', // Langsung approved jika dibuat oleh bendahara
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Transaksi berhasil dibuat',
      data: transaction,
    })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
