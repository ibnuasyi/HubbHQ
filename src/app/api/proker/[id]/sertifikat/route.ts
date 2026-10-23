export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth, hasPermission } from '@/lib/auth'

function getRomanMonth(monthIndex: number): string {
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
  return roman[monthIndex] || 'I'
}

// GET /api/proker/[id]/sertifikat - Ambil daftar sertifikat panitia
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: prokerId } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const proker = await prisma.programKerja.findUnique({
      where: { id: prokerId },
      select: {
        id: true,
        title: true,
        sertifikatTemplate: true,
        sertifikatPrefix: true,
        sertifikatSigner1Name: true,
        sertifikatSigner1Role: true,
        sertifikatSigner2Name: true,
        sertifikatSigner2Role: true,
        divisi: { select: { id: true, name: true, shortName: true } },
        panitia: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!proker) {
      return NextResponse.json({ error: 'Program kerja tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: proker })
  } catch (error) {
    console.error('Error fetching proker certificates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/proker/[id]/sertifikat - Simpan konfigurasi template sertifikat per proker
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: prokerId } = await params
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
      sertifikatTemplate,
      sertifikatPrefix,
      sertifikatSigner1Name,
      sertifikatSigner1Role,
      sertifikatSigner2Name,
      sertifikatSigner2Role,
    } = body

    const updated = await prisma.programKerja.update({
      where: { id: prokerId },
      data: {
        sertifikatTemplate: sertifikatTemplate || null,
        sertifikatPrefix: sertifikatPrefix || null,
        sertifikatSigner1Name: sertifikatSigner1Name || null,
        sertifikatSigner1Role: sertifikatSigner1Role || 'Ketua Pelaksana',
        sertifikatSigner2Name: sertifikatSigner2Name || null,
        sertifikatSigner2Role: sertifikatSigner2Role || 'Ketua Umum',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Konfigurasi template sertifikat program kerja berhasil disimpan',
      data: updated,
    })
  } catch (error) {
    console.error('Error updating certificate config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/proker/[id]/sertifikat - Generate otomatis nomor sertifikat panitia proker
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: prokerId } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await hasPermission(session.user.id, 'proker.edit')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const proker = await prisma.programKerja.findUnique({
      where: { id: prokerId },
      include: {
        divisi: true,
        panitia: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!proker) {
      return NextResponse.json({ error: 'Program kerja tidak ditemukan' }, { status: 404 })
    }

    const now = new Date()
    const year = now.getFullYear()
    const romanMonth = getRomanMonth(now.getMonth())
    const divCode = proker.divisi?.shortName || 'DIV'
    // Singkatan proker dari inisial title
    const prokerCode = proker.title
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 6)

    // Prefix pola atau custom
    const pattern = proker.sertifikatPrefix || `[NO]/SERT-OC/${divCode}/${prokerCode}/${romanMonth}/${year}`

    let counter = 1
    for (const p of proker.panitia) {
      const formattedNo = String(counter).padStart(3, '0')
      const nomorSertifikat = pattern.replace('[NO]', formattedNo)

      await prisma.panitiaProker.update({
        where: { id: p.id },
        data: {
          nomorSertifikat,
          sertifikatGeneratedAt: now,
        },
      })
      counter++
    }

    const updatedPanitia = await prisma.panitiaProker.findMany({
      where: { programKerjaId: prokerId },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      success: true,
      message: `Berhasil men-generate nomor sertifikat untuk ${updatedPanitia.length} anggota panitia`,
      data: updatedPanitia,
    })
  } catch (error) {
    console.error('Error generating certificate numbers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

