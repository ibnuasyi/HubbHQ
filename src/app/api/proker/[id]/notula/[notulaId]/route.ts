export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { canManageProker } from '@/lib/proker-auth'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string; notulaId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: prokerId, notulaId } = await context.params

    const notula = await prisma.notulaRapat.findFirst({
      where: { id: notulaId, programKerjaId: prokerId },
      include: {
        notulis: {
          select: { id: true, name: true, avatar: true },
        },
        presensiSesi: {
          include: {
            kehadiran: {
              select: { id: true, namaPeserta: true, instansi: true, status: true },
            },
          },
        },
      },
    })

    if (!notula) {
      return NextResponse.json(
        { error: 'Notula rapat tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: notula })
  } catch (error) {
    console.error('Error fetching notula detail:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil detail notula rapat' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; notulaId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: prokerId, notulaId } = await context.params
    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const canManage = await canManageProker(session.user.id, roleName, prokerId)
    if (!canManage) {
      return NextResponse.json(
        { error: 'Forbidden: Anda tidak memiliki wewenang untuk mengubah notula rapat proker ini' },
        { status: 403 }
      )
    }

    const existingNotula = await prisma.notulaRapat.findFirst({
      where: { id: notulaId, programKerjaId: prokerId },
    })

    if (!existingNotula) {
      return NextResponse.json(
        { error: 'Notula rapat tidak ditemukan pada proker ini' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      judul,
      tanggal,
      tempat,
      pimpinanRapat,
      notulisId,
      notulisName,
      agenda,
      pembahasan,
      kesimpulan,
      actionItems,
      presensiSesiId,
      lampiranUrl,
      isDitarikKeLpj,
    } = body

    const updateData: any = {}
    if (judul) updateData.judul = judul.trim()
    if (tanggal) updateData.tanggal = new Date(tanggal)
    if (tempat !== undefined) updateData.tempat = tempat ? tempat.trim() : null
    if (pimpinanRapat) updateData.pimpinanRapat = pimpinanRapat.trim()
    if (notulisId !== undefined) updateData.notulisId = notulisId || null
    if (notulisName !== undefined) updateData.notulisName = notulisName ? notulisName.trim() : null
    if (agenda !== undefined) updateData.agenda = agenda ? agenda.trim() : null
    if (pembahasan) updateData.pembahasan = pembahasan.trim()
    if (kesimpulan) updateData.kesimpulan = kesimpulan.trim()
    if (actionItems !== undefined) updateData.actionItems = actionItems ? actionItems.trim() : null
    if (presensiSesiId !== undefined) updateData.presensiSesiId = presensiSesiId || null
    if (lampiranUrl !== undefined) updateData.lampiranUrl = lampiranUrl ? lampiranUrl.trim() : null
    if (typeof isDitarikKeLpj === 'boolean') updateData.isDitarikKeLpj = isDitarikKeLpj

    const updated = await prisma.notulaRapat.update({
      where: { id: notulaId },
      data: updateData,
    })

    if (isDitarikKeLpj === true) {
      const lpj = await prisma.lpjProker.findUnique({
        where: { programKerjaId: prokerId },
      })
      if (lpj) {
        await prisma.lpjProker.update({
          where: { programKerjaId: prokerId },
          data: { checklistBeritaAcara: true },
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Notula rapat berhasil diperbarui',
      data: updated,
    })
  } catch (error) {
    console.error('Error updating notula rapat:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui notula rapat' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; notulaId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: prokerId, notulaId } = await context.params
    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const canManage = await canManageProker(session.user.id, roleName, prokerId)
    if (!canManage) {
      return NextResponse.json(
        { error: 'Forbidden: Anda tidak memiliki wewenang untuk menghapus notula rapat proker ini' },
        { status: 403 }
      )
    }

    const existingNotula = await prisma.notulaRapat.findFirst({
      where: { id: notulaId, programKerjaId: prokerId },
    })

    if (!existingNotula) {
      return NextResponse.json(
        { error: 'Notula rapat tidak ditemukan pada proker ini' },
        { status: 404 }
      )
    }

    await prisma.notulaRapat.delete({
      where: { id: notulaId },
    })

    return NextResponse.json({
      success: true,
      message: 'Notula rapat berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting notula rapat:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus notula rapat' },
      { status: 500 }
    )
  }
}
