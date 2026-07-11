export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'

// GET /api/jenis-surat/[id] - Get single jenis surat
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jenisSurat = await prisma.jenisSurat.findUnique({
      where: { id },
      include: {
        _count: {
          select: { surat: true },
        },
      },
    })

    if (!jenisSurat) {
      return NextResponse.json(
        { error: 'Jenis surat tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: jenisSurat,
    })
  } catch (error) {
    console.error('Error fetching jenis surat:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/jenis-surat/[id] - Update jenis surat
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

    const hasAccess = await hasPermission(session.user.id, 'surat.edit')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      code,
      templateUrl,
      formSchema,
      autoNumber,
      numberPrefix,
      numberFormat,
      isActive,
    } = body

    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (code !== undefined) updateData.code = code.toUpperCase()
    if (templateUrl !== undefined) updateData.templateUrl = templateUrl
    if (formSchema !== undefined) updateData.formSchema = formSchema
    if (autoNumber !== undefined) updateData.autoNumber = autoNumber
    if (numberPrefix !== undefined) updateData.numberPrefix = numberPrefix
    if (numberFormat !== undefined) updateData.numberFormat = numberFormat
    if (isActive !== undefined) updateData.isActive = isActive

    const jenisSurat = await prisma.jenisSurat.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'Jenis surat berhasil diupdate',
      data: jenisSurat,
    })
  } catch (error) {
    console.error('Error updating jenis surat:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/jenis-surat/[id] - Delete jenis surat
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

    const hasAccess = await hasPermission(session.user.id, 'surat.delete')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if jenis surat has related surat
    const relatedCount = await prisma.surat.count({
      where: { jenisSuratId: id },
    })

    if (relatedCount > 0) {
      // Soft delete - just mark as inactive
      await prisma.jenisSurat.update({
        where: { id },
        data: { isActive: false },
      })

      return NextResponse.json({
        success: true,
        message: `Jenis surat dinonaktifkan (memiliki ${relatedCount} surat terkait)`,
      })
    }

    // Hard delete if no related surat
    await prisma.jenisSurat.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Jenis surat berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting jenis surat:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
