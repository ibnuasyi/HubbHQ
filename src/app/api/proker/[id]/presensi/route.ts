export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import crypto from 'crypto'
import { canManageProker } from '@/lib/proker-auth'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: prokerId } = await context.params

    const sesiList = await prisma.presensiSesi.findMany({
      where: { programKerjaId: prokerId },
      include: {
        createdBy: {
          select: { id: true, name: true, avatar: true },
        },
        _count: {
          select: { kehadiran: true },
        },
        kehadiran: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { tanggal: 'desc' },
    })

    const data = sesiList.map((sesi: any) => {
      const hadirCount = sesi.kehadiran.filter((k: any) => k.status === 'HADIR').length
      const izinCount = sesi.kehadiran.filter((k: any) => k.status === 'IZIN').length
      const sakitCount = sesi.kehadiran.filter((k: any) => k.status === 'SAKIT').length
      const alpaCount = sesi.kehadiran.filter((k: any) => k.status === 'ALPA').length

      return {
        id: sesi.id,
        programKerjaId: sesi.programKerjaId,
        judul: sesi.judul,
        tipe: sesi.tipe,
        deskripsi: sesi.deskripsi,
        lokasi: sesi.lokasi,
        tanggal: sesi.tanggal,
        isActive: sesi.isActive,
        allowManualCheckin: sesi.allowManualCheckin,
        isDitarikKeLpj: sesi.isDitarikKeLpj,
        tokenTtlSeconds: sesi.tokenTtlSeconds,
        createdBy: sesi.createdBy,
        totalPeserta: sesi._count.kehadiran,
        stats: {
          hadir: hadirCount,
          izin: izinCount,
          sakit: sakitCount,
          alpa: alpaCount,
        },
        createdAt: sesi.createdAt,
      }
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching presensi sesi:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data sesi presensi' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: prokerId } = await context.params
    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const canManage = await canManageProker(session.user.id, roleName, prokerId)
    if (!canManage) {
      return NextResponse.json(
        { error: 'Forbidden: Hanya panitia proker atau admin yang dapat membuat sesi presensi' },
        { status: 403 }
      )
    }
    const body = await request.json()
    const { judul, tipe, deskripsi, lokasi, tanggal, tokenTtlSeconds, allowManualCheckin } = body

    if (!judul || !judul.trim()) {
      return NextResponse.json(
        { error: 'Nama sesi pertemuan/kegiatan wajib diisi' },
        { status: 400 }
      )
    }

    // Buat qrSecret acak untuk HMAC per sesi
    const qrSecret = crypto.randomBytes(24).toString('hex')

    const newSesi = await prisma.presensiSesi.create({
      data: {
        programKerjaId: prokerId,
        judul: judul.trim(),
        tipe: tipe || 'RAPAT',
        deskripsi: deskripsi?.trim() || null,
        lokasi: lokasi?.trim() || null,
        tanggal: tanggal ? new Date(tanggal) : new Date(),
        qrSecret,
        tokenTtlSeconds: Number(tokenTtlSeconds) || 20,
        isActive: true,
        allowManualCheckin: allowManualCheckin !== false,
        createdById: session.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Sesi presensi digital berhasil dibuat',
      data: newSesi,
    })
  } catch (error) {
    console.error('Error creating presensi sesi:', error)
    return NextResponse.json(
      { error: 'Gagal membuat sesi presensi baru' },
      { status: 500 }
    )
  }
}
