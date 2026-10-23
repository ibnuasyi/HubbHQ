export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth, hasPermission } from '@/lib/auth'

// GET /api/proker/lpj/template - Get active official LPJ template
export async function GET() {
  try {
    const configs = await prisma.websiteConfig.findMany({
      where: {
        key: {
          in: [
            'lpj_template_url',
            'lpj_template_name',
            'lpj_template_desc',
            'lpj_template_updated_at',
            'lpj_template_updated_by',
          ],
        },
      },
    })

    const map: Record<string, string> = {}
    configs.forEach((c) => {
      if (typeof c.value === 'string') {
        map[c.key] = c.value
      } else if (c.value !== null && c.value !== undefined) {
        map[c.key] = String(c.value)
      }
    })

    const templateData = {
      url: map.lpj_template_url || null,
      name: map.lpj_template_name || 'Template_Resmi_LPJ_Organisasi.docx',
      description:
        map.lpj_template_desc ||
        'Format baku laporan pertanggungjawaban kegiatan resmi sesuai pedoman administrasi organisasi.',
      updatedAt: map.lpj_template_updated_at || null,
      updatedBy: map.lpj_template_updated_by || 'Sekretariat / Bendahara',
    }

    return NextResponse.json({ success: true, data: templateData })
  } catch (error) {
    console.error('Error fetching LPJ template config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/proker/lpj/template - Upload or update official LPJ template (Bendahara/Sekretaris/Admin)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions: Bendahara (keuangan.approve) or Sekretaris (surat.create) or Admin
    const canApproveKeuangan = await hasPermission(session.user.id, 'keuangan.approve')
    const canManageSurat = await hasPermission(session.user.id, 'surat.create')
    const canEditProker = await hasPermission(session.user.id, 'proker.edit')

    if (!canApproveKeuangan && !canManageSurat && !canEditProker) {
      return NextResponse.json(
        { error: 'Forbidden: Hanya Bendahara, Sekretaris, atau Administrator yang dapat mengunggah template resmi LPJ.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { url, name, description } = body

    if (!url || !url.trim()) {
      return NextResponse.json(
        { error: 'Tautan atau URL file template LPJ wajib diisi.' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const updaterName = session.user.name || session.user.email || 'Pengurus'

    const updates = [
      { key: 'lpj_template_url', value: url.trim(), category: 'proker' },
      { key: 'lpj_template_name', value: name?.trim() || 'Template_Resmi_LPJ.docx', category: 'proker' },
      { key: 'lpj_template_desc', value: description?.trim() || '', category: 'proker' },
      { key: 'lpj_template_updated_at', value: now, category: 'proker' },
      { key: 'lpj_template_updated_by', value: updaterName, category: 'proker' },
    ]

    for (const item of updates) {
      await prisma.websiteConfig.upsert({
        where: { key: item.key },
        create: {
          key: item.key,
          value: item.value,
          category: item.category,
        },
        update: {
          value: item.value,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Template resmi LPJ organisasi berhasil diperbarui oleh ' + updaterName,
      data: {
        url: url.trim(),
        name: name?.trim() || 'Template_Resmi_LPJ.docx',
        description: description?.trim() || '',
        updatedAt: now,
        updatedBy: updaterName,
      },
    })
  } catch (error) {
    console.error('Error updating LPJ template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
