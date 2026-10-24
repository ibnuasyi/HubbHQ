export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
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

    const notulaList = await prisma.notulaRapat.findMany({
      where: { programKerjaId: prokerId },
      include: {
        notulis: {
          select: { id: true, name: true, avatar: true },
        },
        presensiSesi: {
          select: {
            id: true,
            judul: true,
            tanggal: true,
            _count: { select: { kehadiran: true } },
          },
        },
      },
      orderBy: { tanggal: 'desc' },
    })

    return NextResponse.json({ success: true, data: notulaList })
  } catch (error) {
    console.error('Error fetching notula rapat:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil daftar notula rapat' },
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
        { error: 'Forbidden: Hanya panitia proker atau admin yang dapat membuat notula rapat' },
        { status: 403 }
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

    if (!judul || !judul.trim()) {
      return NextResponse.json(
        { error: 'Judul rapat / pertemuan wajib diisi' },
        { status: 400 }
      )
    }

    if (!pimpinanRapat || !pimpinanRapat.trim()) {
      return NextResponse.json(
        { error: 'Nama pimpinan rapat / pimpinan sidang wajib diisi' },
        { status: 400 }
      )
    }

    if (!pembahasan || !pembahasan.trim()) {
      return NextResponse.json(
        { error: 'Uraian hasil pembahasan rapat wajib diisi' },
        { status: 400 }
      )
    }

    if (!kesimpulan || !kesimpulan.trim()) {
      return NextResponse.json(
        { error: 'Kesimpulan atau kesepakatan rapat wajib diisi' },
        { status: 400 }
      )
    }

    const notula = await prisma.notulaRapat.create({
      data: {
        programKerjaId: prokerId,
        presensiSesiId: presensiSesiId || null,
        judul: judul.trim(),
        tanggal: tanggal ? new Date(tanggal) : new Date(),
        tempat: tempat?.trim() || null,
        pimpinanRapat: pimpinanRapat.trim(),
        notulisId: notulisId || session.user.id,
        notulisName: notulisName?.trim() || session.user.name || null,
        agenda: agenda?.trim() || null,
        pembahasan: pembahasan.trim(),
        kesimpulan: kesimpulan.trim(),
        actionItems: actionItems?.trim() || null,
        lampiranUrl: lampiranUrl?.trim() || null,
        isDitarikKeLpj: isDitarikKeLpj !== false,
      },
      include: {
        notulis: {
          select: { id: true, name: true, avatar: true },
        },
        presensiSesi: {
          select: { id: true, judul: true },
        },
      },
    })

    // Jika ditarik ke LPJ, otomatis tandai checklistBeritaAcara = true di LPJ
    if (isDitarikKeLpj !== false) {
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
      message: 'Notula rapat berhasil dicatat dan terintegrasi',
      data: notula,
    })
  } catch (error) {
    console.error('Error creating notula rapat:', error)
    return NextResponse.json(
      { error: 'Gagal membuat notula rapat' },
      { status: 500 }
    )
  }
}

