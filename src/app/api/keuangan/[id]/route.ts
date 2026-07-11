export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth, hasPermission } from '@/lib/auth'
import { isValidId, sanitizeInput } from '@/lib/api-security'
import {
  updateTransactionAtomic,
  deleteTransactionAtomic,
  parseVersion,
  occConflictResponse,
} from '@/lib/db-transactions'

// GET /api/keuangan/[id] - Get single transaction
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate ID format
    if (!isValidId(id)) {
      return NextResponse.json({ error: 'Invalid transaction ID' }, { status: 400 })
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id },
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
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: transaction,
    })
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/keuangan/[id] - Update transaction with OCC
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

    // Check permission
    const hasAccess = await hasPermission(session.user.id, 'keuangan.edit')
    if (!hasAccess) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { role: true },
      })
      if (user?.role?.name !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Validate ID format
    if (!isValidId(id)) {
      return NextResponse.json({ error: 'Invalid transaction ID' }, { status: 400 })
    }

    const body = await request.json()
    const {
      type,
      category,
      amount,
      description,
      date,
      status,
      version,
    } = body

    // Build update data with sanitization
    const updateData: Record<string, any> = {}

    if (type !== undefined) {
      if (type === 'INCOME' || type === 'EXPENSE') {
        updateData.type = type
      }
    }

    if (category !== undefined) {
      updateData.category = sanitizeInput(category, 100)
    }

    if (amount !== undefined) {
      const parsedAmount = parseFloat(amount)
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        updateData.amount = parsedAmount
      }
    }

    if (description !== undefined) {
      updateData.description = description ? sanitizeInput(description, 1000) : null
    }

    if (date !== undefined) {
      const parsedDate = new Date(date)
      if (!isNaN(parsedDate.getTime())) {
        updateData.date = parsedDate
      }
    }

    if (status !== undefined) {
      if (status === 'PENDING' || status === 'APPROVED' || status === 'REJECTED') {
        updateData.status = status
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada data yang diupdate' },
        { status: 400 }
      )
    }

    // Parse version for OCC
    const expectedVersion = parseVersion(body)

    // If version is provided, use OCC
    if (expectedVersion !== undefined) {
      const result = await updateTransactionAtomic(
        id,
        expectedVersion,
        updateData
      )

      if (!result.success) {
        if (result.error?.code === 'VERSION_CONFLICT') {
          return occConflictResponse(result.error.currentVersion)
        }
        return NextResponse.json(
          { error: result.error?.message || 'Update failed' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Transaksi berhasil diupdate',
        data: result.data,
      })
    }

    // Without version - simple update (less safe)
    // First check if transaction exists
    const existing = await prisma.transaction.findUnique({
      where: { id },
      select: { id: true, version: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      )
    }

    // Update with version increment
    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        ...updateData,
        version: { increment: 1 },
        updatedAt: new Date(),
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Transaksi berhasil diupdate',
      data: updated,
    })
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/keuangan/[id] - Delete transaction with OCC
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const hasAccess = await hasPermission(session.user.id, 'keuangan.edit')
    if (!hasAccess) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { role: true },
      })
      if (user?.role?.name !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Validate ID format
    if (!isValidId(id)) {
      return NextResponse.json({ error: 'Invalid transaction ID' }, { status: 400 })
    }

    // Get version from query params if provided
    const { searchParams } = new URL(request.url)
    const versionParam = searchParams.get('version')
    const expectedVersion = versionParam ? parseInt(versionParam) : undefined

    // Delete with OCC if version provided
    if (expectedVersion !== undefined) {
      const result = await deleteTransactionAtomic(id, expectedVersion)

      if (!result.success) {
        if (result.error?.code === 'VERSION_CONFLICT') {
          return occConflictResponse()
        }
        return NextResponse.json(
          { error: result.error?.message || 'Delete failed' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Transaksi berhasil dihapus',
      })
    }

    // Without version - simple delete
    await prisma.transaction.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Transaksi berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
