export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'

// GET /api/surat - List all surat
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || '' // MASUK or KELUAR
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    const where: any = {}

    if (type) {
      where.type = type
    }

    if (status) {
      where.status = status
    }

    const [surat, total] = await Promise.all([
      prisma.surat.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          requester: {
            select: {
              id: true,
              name: true,
            },
          },
          approver: {
            select: {
              id: true,
              name: true,
            },
          },
          jenisSurat: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          disposisi: {
            include: {
              tujuanDivisi: { select: { id: true, name: true, color: true } },
              tujuanUser: { select: { id: true, name: true, phone: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.surat.count({ where }),
    ])

    return NextResponse.json({
      data: surat,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching surat:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/surat - Create surat
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      type,
      letterNumber,
      subject,
      content,
      sender,
      senderContact,
      receivedDate,
      jenisSuratId,
      formData,
      status,
    } = body

    if (!type || !subject) {
      return NextResponse.json(
        { error: 'Tipe dan subjek diperlukan' },
        { status: 400 }
      )
    }

    // Get next letter number for KELUAR type
    let finalLetterNumber = letterNumber
    if (type === 'KELUAR' && !letterNumber) {
      const lastSurat = await prisma.surat.findFirst({
        where: { type: 'KELUAR' },
        orderBy: { createdAt: 'desc' },
      })

      // Simple counter - in production would be more sophisticated
      const lastNumber = lastSurat?.letterNumber?.match(/\/(\d+)\//)?.[1] || '0'
      const nextNumber = parseInt(lastNumber) + 1
      const year = new Date().getFullYear()
      finalLetterNumber = `${nextNumber}/${year}`
    }

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const canApprove =
      ['admin', 'ketua', 'sekretaris'].includes(roleName) ||
      (await hasPermission(session.user.id, 'surat.approve'))

    const finalStatus =
      (status === 'APPROVED' || status === 'ACTIVE') && canApprove
        ? status
        : 'DRAFT'

    const surat = await prisma.surat.create({
      data: {
        type,
        letterNumber: finalLetterNumber,
        subject,
        content,
        sender,
        senderContact,
        receivedDate: receivedDate ? new Date(receivedDate) : null,
        jenisSuratId,
        formData,
        status: finalStatus,
        requesterId: session.user.id,
        approverId: finalStatus === 'APPROVED' ? session.user.id : null,
        approvedAt: finalStatus === 'APPROVED' ? new Date() : null,
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
          },
        },
        jenisSurat: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Surat berhasil dibuat',
      data: surat,
    })
  } catch (error) {
    console.error('Error creating surat:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
