export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'

// GET /api/proker/[id] - Get single program kerja
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

    const proker = await prisma.programKerja.findUnique({
      where: { id },
      include: {
        divisi: true,
        pic: true,
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        checkpoints: {
          orderBy: { order: 'asc' },
        },
        panitia: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                phone: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        proposals: {
          orderBy: { createdAt: 'desc' },
          include: {
            history: {
              orderBy: { version: 'asc' },
              include: {
                reviewedBy: {
                  select: { id: true, name: true },
                },
              },
            },
            requester: {
              select: { id: true, name: true },
            },
            reviewedBy: {
              select: { id: true, name: true },
            },
          },
        },
        lpj: {
          include: {
            items: {
              orderBy: { createdAt: 'asc' },
            },
            reviewedBy: {
              select: { id: true, name: true },
            },
          },
        },
        calendarEvents: true,
        presensiSesi: {
          orderBy: { tanggal: 'desc' },
          select: {
            id: true,
            judul: true,
            tipe: true,
            tanggal: true,
            isActive: true,
            isDitarikKeLpj: true,
            _count: { select: { kehadiran: true } },
          },
        },
        notulaRapat: {
          orderBy: { tanggal: 'desc' },
          select: {
            id: true,
            judul: true,
            tanggal: true,
            pimpinanRapat: true,
            isDitarikKeLpj: true,
          },
        },
      },
    })

    if (!proker) {
      return NextResponse.json(
        { error: 'Program kerja tidak ditemukan' },
        { status: 404 }
      )
    }

    // Calculate progress
    const totalCheckpoints = proker.checkpoints.length
    const completedCheckpoints = proker.checkpoints.filter(
      (c) => c.isCompleted
    ).length
    const progress =
      totalCheckpoints > 0
        ? Math.round((completedCheckpoints / totalCheckpoints) * 100)
        : 0

    return NextResponse.json({
      data: {
        ...proker,
        progress,
        completedCheckpoints,
        totalCheckpoints,
      },
    })
  } catch (error) {
    console.error('Error fetching program kerja:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/proker/[id] - Update program kerja
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

    const hasAccess = await hasPermission(session.user.id, 'proker.edit')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      divisiId,
      picId,
      status,
      startDate,
      endDate,
      kategori,
      sasaran,
      indikator,
      anggaranEstimasi,
      sumberDana,
      lokasi,
      sertifikatTemplate,
      sertifikatPrefix,
      sertifikatSigner1Name,
      sertifikatSigner1Role,
      sertifikatSigner2Name,
      sertifikatSigner2Role,
    } = body

    const updateData: any = {}

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (divisiId !== undefined) updateData.divisiId = divisiId
    if (picId !== undefined) updateData.picId = picId || null
    if (status !== undefined) updateData.status = status
    if (startDate !== undefined)
      updateData.startDate = startDate ? new Date(startDate) : null
    if (endDate !== undefined)
      updateData.endDate = endDate ? new Date(endDate) : null
    if (kategori !== undefined) updateData.kategori = kategori
    if (sasaran !== undefined) updateData.sasaran = sasaran
    if (indikator !== undefined) updateData.indikator = indikator
    if (anggaranEstimasi !== undefined)
      updateData.anggaranEstimasi = anggaranEstimasi ? parseFloat(anggaranEstimasi) : null
    if (sumberDana !== undefined) updateData.sumberDana = sumberDana
    if (lokasi !== undefined) updateData.lokasi = lokasi
    if (sertifikatTemplate !== undefined) updateData.sertifikatTemplate = sertifikatTemplate
    if (sertifikatPrefix !== undefined) updateData.sertifikatPrefix = sertifikatPrefix
    if (sertifikatSigner1Name !== undefined) updateData.sertifikatSigner1Name = sertifikatSigner1Name
    if (sertifikatSigner1Role !== undefined) updateData.sertifikatSigner1Role = sertifikatSigner1Role
    if (sertifikatSigner2Name !== undefined) updateData.sertifikatSigner2Name = sertifikatSigner2Name
    if (sertifikatSigner2Role !== undefined) updateData.sertifikatSigner2Role = sertifikatSigner2Role

    const proker = await prisma.programKerja.update({
      where: { id },
      data: updateData,
      include: {
        divisi: true,
        pic: true,
        checkpoints: true,
        panitia: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        proposals: true,
        lpj: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Program kerja berhasil diupdate',
      data: proker,
    })
  } catch (error) {
    console.error('Error updating program kerja:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/proker/[id] - Delete program kerja
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

    const hasAccess = await hasPermission(session.user.id, 'proker.delete')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.programKerja.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Program kerja berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting program kerja:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
