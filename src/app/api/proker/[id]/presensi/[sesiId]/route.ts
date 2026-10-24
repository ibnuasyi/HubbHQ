export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { canManageProker } from '@/lib/proker-auth'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string; sesiId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: prokerId, sesiId } = await context.params

    const sesi = await prisma.presensiSesi.findFirst({
      where: { id: sesiId, programKerjaId: prokerId },
      include: {
        createdBy: {
          select: { id: true, name: true, avatar: true },
        },
        kehadiran: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, email: true, phone: true },
            },
          },
          orderBy: { waktuHadir: 'desc' },
        },
      },
    })

    if (!sesi) {
      return NextResponse.json(
        { error: 'Sesi presensi tidak ditemukan' },
        { status: 404 }
      )
    }

    // Hitung ringkasan
    const stats = {
      total: sesi.kehadiran.length,
      hadir: sesi.kehadiran.filter((k: any) => k.status === 'HADIR').length,
      izin: sesi.kehadiran.filter((k: any) => k.status === 'IZIN').length,
      sakit: sesi.kehadiran.filter((k: any) => k.status === 'SAKIT').length,
      alpa: sesi.kehadiran.filter((k: any) => k.status === 'ALPA').length,
    }

    return NextResponse.json({
      success: true,
      data: {
        ...sesi,
        qrSecret: undefined, // Jangan ekspos secret ke umum
        stats,
      },
    })
  } catch (error) {
    console.error('Error fetching presensi sesi detail:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil rincian sesi presensi' },
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

    const { id: prokerId, sesiId } = await context.params
    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const canManage = await canManageProker(session.user.id, roleName, prokerId)
    if (!canManage) {
      return NextResponse.json(
        { error: 'Forbidden: Anda tidak memiliki akses mengelola sesi presensi proker ini' },
        { status: 403 }
      )
    }

    const existingSesi = await prisma.presensiSesi.findFirst({
      where: { id: sesiId, programKerjaId: prokerId },
    })

    if (!existingSesi) {
      return NextResponse.json(
        { error: 'Sesi presensi tidak ditemukan pada program kerja ini' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { isActive, isDitarikKeLpj, judul, lokasi, deskripsi, tanggal } = body

    const updateData: any = {}
    if (typeof isActive === 'boolean') updateData.isActive = isActive
    if (typeof isDitarikKeLpj === 'boolean') updateData.isDitarikKeLpj = isDitarikKeLpj
    if (judul) updateData.judul = judul.trim()
    if (lokasi !== undefined) updateData.lokasi = lokasi ? lokasi.trim() : null
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi ? deskripsi.trim() : null
    if (tanggal) updateData.tanggal = new Date(tanggal)

    const updated = await prisma.presensiSesi.update({
      where: { id: sesiId },
      data: updateData,
    })

    // Jika ditandai ditarik ke LPJ, periksa LPJ proker dan sinkronkan checklist & jumlah peserta
    if (isDitarikKeLpj === true) {
      const activeSessions = await prisma.presensiSesi.findMany({
        where: { programKerjaId: prokerId, isDitarikKeLpj: true },
        include: {
          kehadiran: {
            where: { status: 'HADIR' },
            select: { id: true, userId: true, namaPeserta: true },
          },
        },
      })

      // Hitung peserta unik
      const uniqueParticipants = new Set<string>()
      activeSessions.forEach((s: any) => {
        s.kehadiran.forEach((k: any) => {
          uniqueParticipants.add(k.userId || k.namaPeserta.toLowerCase())
        })
      })

      const totalHadirUnik = uniqueParticipants.size

      // Update atau create checklist di LpjProker jika ada
      const lpj = await prisma.lpjProker.findUnique({
        where: { programKerjaId: prokerId },
      })

      if (lpj && lpj.status !== 'APPROVED') {
        await prisma.lpjProker.update({
          where: { programKerjaId: prokerId },
          data: {
            checklistPresensi: true,
            pesertaHadir: Math.max(lpj.pesertaHadir || 0, totalHadirUnik),
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sesi presensi berhasil diperbarui',
      data: updated,
    })
  } catch (error) {
    console.error('Error updating presensi sesi:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui sesi presensi' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; sesiId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: prokerId, sesiId } = await context.params
    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const canManage = await canManageProker(session.user.id, roleName, prokerId)
    if (!canManage) {
      return NextResponse.json(
        { error: 'Forbidden: Anda tidak memiliki akses menghapus sesi presensi proker ini' },
        { status: 403 }
      )
    }

    const existingSesi = await prisma.presensiSesi.findFirst({
      where: { id: sesiId, programKerjaId: prokerId },
    })

    if (!existingSesi) {
      return NextResponse.json(
        { error: 'Sesi presensi tidak ditemukan pada program kerja ini' },
        { status: 404 }
      )
    }

    await prisma.presensiSesi.delete({
      where: { id: sesiId },
    })

    return NextResponse.json({
      success: true,
      message: 'Sesi presensi berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting presensi sesi:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus sesi presensi' },
      { status: 500 }
    )
  }
}
