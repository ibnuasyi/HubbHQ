export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth, hasPermission } from '@/lib/auth'
import { canManageProker } from '@/lib/proker-auth'

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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const hasAccess = await canManageProker(session.user.id, roleName, prokerId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Anda tidak memiliki akses mengelola sertifikat proker ini' }, { status: 403 })
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

    if (sertifikatTemplate && String(sertifikatTemplate).trim().toLowerCase().startsWith('javascript:')) {
      return NextResponse.json({ error: 'URL template sertifikat tidak valid' }, { status: 400 })
    }

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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const hasAccess = await canManageProker(session.user.id, roleName, prokerId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Anda tidak memiliki akses mengelola sertifikat proker ini' }, { status: 403 })
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

    // Sinkronisasi dengan Studio E-Sertifikat terpusat
    const templateName = `Sertifikat Kepanitiaan - ${proker.title}`
    let certTemplate = await prisma.sertifikatTemplate.findFirst({
      where: {
        namaTemplate: templateName,
      },
    })

    const defaultConfig = JSON.stringify({
      nama: { x: 960, y: 520, fontSize: 54, color: "#0f172a", align: "center", isBold: true },
      sebagai: { x: 960, y: 620, fontSize: 32, color: "#334155", align: "center", isBold: false },
      nomor: { x: 960, y: 350, fontSize: 22, color: "#64748b", align: "center", isBold: true },
      tanggal: { x: 1440, y: 880, fontSize: 20, color: "#334155", align: "center", isBold: false },
      qr: { x: 220, y: 840, size: 110, show: true },
    })

    if (!certTemplate) {
      certTemplate = await prisma.sertifikatTemplate.create({
        data: {
          namaTemplate: templateName,
          kategori: "PANITIA",
          imageUrl:
            proker.sertifikatTemplate ||
            "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1920&auto=format&fit=crop&q=80",
          prefixNomor: pattern,
          configJson: defaultConfig,
        },
      })
    } else {
      await prisma.sertifikatTemplate.update({
        where: { id: certTemplate.id },
        data: {
          prefixNomor: pattern,
          imageUrl: proker.sertifikatTemplate || certTemplate.imageUrl,
        },
      })
    }

    let counter = 1
    for (const p of proker.panitia) {
      const formattedNo = String(counter).padStart(3, '0')
      const nomorSertifikat = pattern.replace('[NO]', formattedNo)

      const user = await prisma.user.findUnique({
        where: { id: p.userId },
        select: { name: true },
      })
      const namaUser = user?.name || "Anggota Panitia"

      // 1. Simpan nomor registrasi pada penugasan panitia
      await prisma.panitiaProker.update({
        where: { id: p.id },
        data: {
          nomorSertifikat,
          sertifikatGeneratedAt: now,
        },
      })

      // 2. Daftarkan ke basis data verifikasi terpusat SertifikatGenerated
      const certGen = await prisma.sertifikatGenerated.upsert({
        where: { nomorSertifikat },
        update: {
          namaPenerima: namaUser,
          sebagai: p.roleJabatan || "Panitia Pelaksana",
          keterangan: `Panitia Pelaksana Kegiatan: ${proker.title}`,
        },
        create: {
          templateId: certTemplate.id,
          nomorSertifikat,
          namaPenerima: namaUser,
          sebagai: p.roleJabatan || "Panitia Pelaksana",
          keterangan: `Panitia Pelaksana Kegiatan: ${proker.title}`,
        },
      })

      if (certGen.outputImageUrl) {
        await prisma.panitiaProker.update({
          where: { id: p.id },
          data: { sertifikatUrl: certGen.outputImageUrl },
        })
      }

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

