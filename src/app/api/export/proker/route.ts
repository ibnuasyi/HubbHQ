export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth, hasPermission } from '@/lib/auth'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import ExcelJS from 'exceljs'
import {
  EXPORT_CONFIG,
  validateExportRequest,
  validateExportParams,
  sanitizeExportFilename,
  getExportTimestamp,
} from '@/lib/export-utils'

// GET /api/export/proker?format=pdf|excel&year=2024
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const canExportProker =
      ['admin', 'ketua', 'sekretaris', 'bendahara'].includes(roleName) ||
      (await hasPermission(session.user.id, 'proker.view'))

    if (!canExportProker) {
      return NextResponse.json(
        { error: 'Forbidden: Anda tidak memiliki akses untuk mengekspor data program kerja' },
        { status: 403 }
      )
    }

    const validation = await validateExportRequest(session.user.id, 'proker')
    if (!validation.allowed) {
      return validation.response!
    }

    const { searchParams } = new URL(request.url)
    const params = validateExportParams({
      year: searchParams.get('year'),
      format: searchParams.get('format'),
    })

    if (!params.valid) {
      return NextResponse.json({ error: params.error }, { status: 400 })
    }

    const year = params.year
    const format = params.format
    const divisiId = searchParams.get('divisiId')

    // Fetch proker with checkpoints
    const where: any = {}
    if (divisiId) {
      where.divisiId = divisiId
    }

    const maxRecords = EXPORT_CONFIG.MAX_RECORDS.proker || 5000

    const proker = await prisma.programKerja.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: maxRecords,
      include: {
        divisi: true,
        pic: {
          select: { name: true },
        },
        checkpoints: {
          orderBy: { order: 'asc' },
        },
      },
    })

    // Fetch divisi for dropdown
    const divisi = await prisma.divisi.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })

    // Calculate stats
    const totalProker = proker.length
    const completedProker = proker.filter((p) => p.status === 'COMPLETED').length
    const onProgressProker = proker.filter((p) => p.status === 'ON_PROGRESS').length

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(amount)
    }

    // Status labels
    const statusLabels: Record<string, string> = {
      DRAFT: 'Draft',
      ON_PROGRESS: 'On Progress',
      COMPLETED: 'Selesai',
      CANCELLED: 'Dibatalkan',
    }

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'HubbHQ'
      workbook.created = new Date()
      const worksheet = workbook.addWorksheet('Laporan Proker')

      worksheet.addRow(['LAPORAN PROGRAM KERJA'])
      worksheet.addRow([`Tahun: ${year}`])
      worksheet.addRow([])
      worksheet.addRow(['RINGKASAN'])
      worksheet.addRow(['Total Program Kerja', totalProker])
      worksheet.addRow(['Selesai', completedProker])
      worksheet.addRow(['On Progress', onProgressProker])
      worksheet.addRow([])
      worksheet.addRow(['DETAIL PROGRAM KERJA'])
      worksheet.addRow(['No', 'Judul', 'Divisi', 'Status', 'PIC', 'Checkpoint', 'Progress'])

      proker.forEach((p, i) => {
        const completedCheckpoints = p.checkpoints.filter((c) => c.isCompleted).length
        const totalCheckpoints = p.checkpoints.length
        const progress = totalCheckpoints > 0
          ? Math.round((completedCheckpoints / totalCheckpoints) * 100)
          : 0

        worksheet.addRow([
          (i + 1).toString(),
          p.title,
          p.divisi.name,
          statusLabels[p.status] || p.status,
          p.pic?.name || '-',
          `${completedCheckpoints}/${totalCheckpoints}`,
          `${progress}%`,
        ])
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const filename = sanitizeExportFilename(`laporan-proker-${year}-${getExportTimestamp()}`) + '.xlsx'

      return new NextResponse(Buffer.from(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    // PDF generation
    const doc = new jsPDF()

    // Title
    doc.setFontSize(18)
    doc.text('LAPORAN PROGRAM KERJA', 14, 20)
    doc.setFontSize(12)
    doc.text(`Tahun ${year}`, 14, 28)

    // Summary
    doc.setFontSize(12)
    doc.text('Ringkasan:', 14, 40)
    doc.text(`Total Program Kerja: ${totalProker}`, 14, 48)
    doc.text(`Selesai: ${completedProker}`, 14, 56)
    doc.text(`On Progress: ${onProgressProker}`, 14, 64)

    // Proker table
    const tableData = proker.map((p) => {
      const completedCheckpoints = p.checkpoints.filter((c) => c.isCompleted).length
      const totalCheckpoints = p.checkpoints.length
      const progress = totalCheckpoints > 0
        ? Math.round((completedCheckpoints / totalCheckpoints) * 100)
        : 0

      return [
        p.title,
        p.divisi.name,
        statusLabels[p.status] || p.status,
        p.pic?.name || '-',
        `${completedCheckpoints}/${totalCheckpoints}`,
        `${progress}%`,
      ]
    })

    ;(doc as any).autoTable({
      startY: 74,
      head: [['Judul', 'Divisi', 'Status', 'PIC', 'Checkpoint', 'Progress']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] },
      columnStyles: {
        0: { cellWidth: 60 },
      },
    })

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(
        `Dicetak pada: ${new Date().toLocaleString('id-ID')} - Halaman ${i} dari ${pageCount}`,
        14,
        doc.internal.pageSize.height - 10
      )
    }

    // Generate buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    const filename = sanitizeExportFilename(`laporan-proker-${year}-${getExportTimestamp()}`) + '.pdf'

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting proker:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
