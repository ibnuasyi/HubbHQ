export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import ExcelJS from 'exceljs'

// GET /api/export/surat?format=pdf|excel&type=MASUK|KELUAR&year=2024
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'pdf'
    const type = searchParams.get('type') // MASUK, KELUAR, or all
    const year = searchParams.get('year') || new Date().getFullYear().toString()

    // Build date range for year
    const startDate = new Date(parseInt(year), 0, 1)
    const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59)

    // Fetch surat
    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    }

    if (type === 'MASUK' || type === 'KELUAR') {
      where.type = type
    }

    const surat = await prisma.surat.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        requester: {
          select: { name: true },
        },
        approver: {
          select: { name: true },
        },
        jenisSurat: {
          select: { name: true, code: true },
        },
      },
    })

    // Calculate stats
    const totalSurat = surat.length
    const suratMasuk = surat.filter((s) => s.type === 'MASUK').length
    const suratKeluar = surat.filter((s) => s.type === 'KELUAR').length
    const approved = surat.filter((s) => s.status === 'APPROVED').length
    const pending = surat.filter((s) => s.status === 'PENDING_APPROVAL').length

    // Status labels
    const statusLabels: Record<string, string> = {
      DRAFT: 'Draft',
      PENDING_APPROVAL: 'Menunggu',
      APPROVED: 'Disetujui',
      REJECTED: 'Ditolak',
    }

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'HubbHQ'
      workbook.created = new Date()
      const worksheet = workbook.addWorksheet('Laporan Surat')

      worksheet.addRow(['LAPORAN SURAT'])
      worksheet.addRow([`Tahun: ${year}`])
      worksheet.addRow([])
      worksheet.addRow(['RINGKASAN'])
      worksheet.addRow(['Total Surat', totalSurat])
      worksheet.addRow(['Surat Masuk', suratMasuk])
      worksheet.addRow(['Surat Keluar', suratKeluar])
      worksheet.addRow(['Disetujui', approved])
      worksheet.addRow(['Menunggu', pending])
      worksheet.addRow([])
      worksheet.addRow(['DETAIL SURAT'])
      worksheet.addRow(['No', 'Tanggal', 'Jenis', 'Nomor Surat', 'Perihal', 'Tipe', 'Status', 'Pemohon', 'Pemberi Approval'])

      surat.forEach((s, i) => {
        worksheet.addRow([
          (i + 1).toString(),
          new Date(s.createdAt).toLocaleDateString('id-ID'),
          s.jenisSurat ? `${s.jenisSurat.name} (${s.jenisSurat.code})` : '-',
          s.letterNumber || '-',
          s.subject,
          s.type === 'MASUK' ? 'Masuk' : 'Keluar',
          statusLabels[s.status] || s.status,
          s.requester?.name || '-',
          s.approver?.name || '-',
        ])
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const filename = `laporan-surat-${year}${type ? `-${type.toLowerCase()}` : ''}.xlsx`

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
    doc.text('LAPORAN SURAT', 14, 20)
    doc.setFontSize(12)
    doc.text(`Tahun ${year}${type ? ` - ${type === 'MASUK' ? 'Surat Masuk' : 'Surat Keluar'}` : ''}`, 14, 28)

    // Summary
    doc.setFontSize(12)
    doc.text('Ringkasan:', 14, 40)
    doc.text(`Total Surat: ${totalSurat}`, 14, 48)
    doc.text(`Surat Masuk: ${suratMasuk}`, 14, 56)
    doc.text(`Surat Keluar: ${suratKeluar}`, 14, 64)
    doc.text(`Disetujui: ${approved}`, 14, 72)
    doc.text(`Menunggu: ${pending}`, 14, 80)

    // Surat table
    const tableData = surat.map((s) => [
      new Date(s.createdAt).toLocaleDateString('id-ID'),
      s.jenisSurat?.code || '-',
      s.letterNumber || '-',
      s.subject.substring(0, 30) + (s.subject.length > 30 ? '...' : ''),
      s.type === 'MASUK' ? 'Masuk' : 'Keluar',
      statusLabels[s.status] || s.status,
    ])

    ;(doc as any).autoTable({
      startY: 90,
      head: [['Tanggal', 'Jenis', 'No. Surat', 'Perihal', 'Tipe', 'Status']],
      body: tableData,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [99, 102, 241] },
      columnStyles: {
        0: { cellWidth: 25 },
        3: { cellWidth: 50 },
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

    const filename = `laporan-surat-${year}${type ? `-${type.toLowerCase()}` : ''}.pdf`

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting surat:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
