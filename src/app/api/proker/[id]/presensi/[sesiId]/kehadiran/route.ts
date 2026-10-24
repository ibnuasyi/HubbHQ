export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth, hasPermission } from '@/lib/auth'
import prisma from '@/lib/prisma'

async function canManagePresensi(userId: string, roleName: string, prokerId: string): Promise<boolean> {
  if (['admin', 'ketua', 'sekretaris'].includes(roleName)) return true
  if (await hasPermission(userId, 'proker.edit')) return true

  const isPanitia = await prisma.panitiaProker.findFirst({
    where: { programKerjaId: prokerId, userId },
  })
  return Boolean(isPanitia)
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; sesiId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: prokerId, sesiId } = await context.params
    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const canManage = await canManagePresensi(session.user.id, roleName, prokerId)
    if (!canManage) {
      return NextResponse.json(
        { error: 'Forbidden: Hanya panitia proker atau admin yang dapat mencatat presensi manual' },
        { status: 403 }
      )
    }
    const body = await request.json()
    const { userId, namaPeserta, nomorIdentitas, instansi, status, keterangan } = body

    let finalNama = namaPeserta?.trim()
    let finalInstansi = instansi?.trim() || null

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          divisiMembers: { include: { divisi: true } },
        },
      })
      if (user) {
        finalNama = user.fullName || user.name || finalNama
        if (!finalInstansi && user.divisiMembers?.[0]?.divisi?.name) {
          finalInstansi = user.divisiMembers[0].divisi.name
        }
      }
    }

    if (!finalNama) {
      return NextResponse.json(
        { error: 'Nama peserta wajib diisi' },
        { status: 400 }
      )
    }

    // Upsert kehadiran
    let record
    if (userId) {
      record = await prisma.presensiKehadiran.upsert({
        where: {
          presensiSesiId_userId: {
            presensiSesiId: sesiId,
            userId,
          },
        },
        update: {
          status: status || 'HADIR',
          keterangan: keterangan?.trim() || null,
          metodeScan: 'MANUAL_PANITIA',
        },
        create: {
          presensiSesiId: sesiId,
          userId,
          namaPeserta: finalNama,
          nomorIdentitas: nomorIdentitas?.trim() || null,
          instansi: finalInstansi,
          status: status || 'HADIR',
          metodeScan: 'MANUAL_PANITIA',
          keterangan: keterangan?.trim() || null,
          waktuHadir: new Date(),
        },
      })
    } else {
      record = await prisma.presensiKehadiran.create({
        data: {
          presensiSesiId: sesiId,
          namaPeserta: finalNama,
          nomorIdentitas: nomorIdentitas?.trim() || null,
          instansi: finalInstansi,
          status: status || 'HADIR',
          metodeScan: 'MANUAL_PANITIA',
          keterangan: keterangan?.trim() || null,
          waktuHadir: new Date(),
        },
      })
    }

    // Sinkronkan ke LPJ jika sesi aktif ditarik
    const sesi = await prisma.presensiSesi.findUnique({
      where: { id: sesiId },
    })
    if (sesi?.isDitarikKeLpj) {
      const lpj = await prisma.lpjProker.findUnique({
        where: { programKerjaId: prokerId },
      })
      if (lpj) {
        const totalHadir = await prisma.presensiKehadiran.count({
          where: {
            presensiSesi: { programKerjaId: prokerId, isDitarikKeLpj: true },
            status: 'HADIR',
          },
        })
        await prisma.lpjProker.update({
          where: { programKerjaId: prokerId },
          data: {
            checklistPresensi: true,
            pesertaHadir: Math.max(lpj.pesertaHadir || 0, totalHadir),
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Kehadiran peserta berhasil dicatat secara manual',
      data: record,
    })
  } catch (error) {
    console.error('Error recording manual attendance:', error)
    return NextResponse.json(
      { error: 'Gagal mencatat kehadiran peserta' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; sesiId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: prokerId } = await context.params
    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const canManage = await canManagePresensi(session.user.id, roleName, prokerId)
    if (!canManage) {
      return NextResponse.json(
        { error: 'Forbidden: Hanya panitia proker atau admin yang dapat mengubah kehadiran' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { kehadiranId, status, keterangan } = body

    if (!kehadiranId) {
      return NextResponse.json(
        { error: 'ID Kehadiran wajib diisi' },
        { status: 400 }
      )
    }

    const updated = await prisma.presensiKehadiran.update({
      where: { id: kehadiranId },
      data: {
        status: status || undefined,
        keterangan: keterangan !== undefined ? keterangan?.trim() || null : undefined,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Status kehadiran berhasil diperbarui',
      data: updated,
    })
  } catch (error) {
    console.error('Error updating attendance status:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui data kehadiran' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; sesiId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: prokerId } = await context.params
    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const canManage = await canManagePresensi(session.user.id, roleName, prokerId)
    if (!canManage) {
      return NextResponse.json(
        { error: 'Forbidden: Hanya panitia proker atau admin yang dapat menghapus presensi' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const kehadiranId = searchParams.get('kehadiranId')

    if (!kehadiranId) {
      return NextResponse.json(
        { error: 'ID Kehadiran wajib disertakan' },
        { status: 400 }
      )
    }

    await prisma.presensiKehadiran.delete({
      where: { id: kehadiranId },
    })

    return NextResponse.json({
      success: true,
      message: 'Catatan presensi berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting attendance record:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus data kehadiran' },
      { status: 500 }
    )
  }
}

