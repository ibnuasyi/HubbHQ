export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth, hasPermission } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { status, catatanTindakLanjut, tglSelesai } = body

    const existing = await prisma.disposisiSurat.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Data lembar disposisi tidak ditemukan' },
        { status: 404 }
      )
    }

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const isLeadership =
      ['admin', 'ketua', 'sekretaris'].includes(roleName) ||
      (await hasPermission(session.user.id, 'surat.edit'))

    const isAssignedUser = Boolean(existing.tujuanUserId && existing.tujuanUserId === session.user.id)
    let isAssignedDivisiMember = false
    if (existing.tujuanDivisiId) {
      const membership = await prisma.divisiMember.findFirst({
        where: {
          divisiId: existing.tujuanDivisiId,
          userId: session.user.id,
          isActive: true,
        },
      })
      isAssignedDivisiMember = Boolean(membership)
    }

    if (!isLeadership && !isAssignedUser && !isAssignedDivisiMember) {
      return NextResponse.json(
        { error: 'Forbidden: Anda tidak memiliki wewenang untuk menindaklanjuti lembar disposisi ini' },
        { status: 403 }
      )
    }

    const updateData: any = {}

    if (status) {
      updateData.status = status
      if (status === 'SELESAI') {
        updateData.tglSelesai = tglSelesai ? new Date(tglSelesai) : new Date()
      } else {
        updateData.tglSelesai = null
      }
    }

    if (catatanTindakLanjut !== undefined) {
      updateData.catatanTindakLanjut = catatanTindakLanjut?.trim() || null
    }

    const updated = await prisma.disposisiSurat.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'Status tindak lanjut disposisi berhasil diperbarui',
      data: updated,
    })
  } catch (error) {
    console.error('Error updating disposisi:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui status tindak lanjut disposisi' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const canDelete =
      ['admin', 'ketua', 'sekretaris'].includes(roleName) ||
      (await hasPermission(session.user.id, 'surat.delete'))

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Forbidden: Hanya Pimpinan atau Admin yang dapat menghapus lembar disposisi' },
        { status: 403 }
      )
    }

    const { id } = await context.params

    await prisma.disposisiSurat.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Lembar disposisi berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting disposisi:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus lembar disposisi' },
      { status: 500 }
    )
  }
}

