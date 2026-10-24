export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ sesiId: string }> }
) {
  try {
    const { sesiId } = await context.params

    const sesi = await prisma.presensiSesi.findUnique({
      where: { id: sesiId },
      select: {
        id: true,
        programKerjaId: true,
        judul: true,
        tipe: true,
        deskripsi: true,
        lokasi: true,
        tanggal: true,
        isActive: true,
        allowManualCheckin: true,
        programKerja: {
          select: {
            id: true,
            title: true,
            divisi: { select: { name: true, color: true } },
          },
        },
      },
    })

    if (!sesi) {
      return NextResponse.json(
        { error: 'Sesi presensi tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: sesi })
  } catch (error) {
    console.error('Error fetching presensi info:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil informasi sesi presensi' },
      { status: 500 }
    )
  }
}

