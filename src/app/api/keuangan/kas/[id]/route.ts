export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'

// PATCH /api/keuangan/kas/[id] - Approve/reject kas payment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await hasPermission(session.user.id, 'keuangan.approve')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    const kasPayment = await prisma.kasPayment.findUnique({
      where: { id },
    })

    if (!kasPayment) {
      return NextResponse.json(
        { error: 'Kas payment tidak ditemukan' },
        { status: 404 }
      )
    }

    if (action === 'approve') {
      // Approve and create transaction
      await prisma.$transaction(async (tx) => {
        // Update kas payment status
        await tx.kasPayment.update({
          where: { id },
          data: { status: 'APPROVED' },
        })

        // Create transaction
        await tx.transaction.create({
          data: {
            type: 'INCOME',
            category: 'kas_anggota',
            amount: kasPayment.amount,
            description: `Kas anggota bulan ${kasPayment.month}/${kasPayment.year}`,
            kasPaymentId: id,
            createdById: session.user.id,
            status: 'APPROVED',
          },
        })
      })

      return NextResponse.json({
        success: true,
        message: 'Kas payment berhasil disetujui',
      })
    } else if (action === 'reject') {
      await prisma.kasPayment.update({
        where: { id },
        data: { status: 'REJECTED' },
      })

      return NextResponse.json({
        success: true,
        message: 'Kas payment berhasil ditolak',
      })
    }

    return NextResponse.json(
      { error: 'Action tidak valid' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error approving kas payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
