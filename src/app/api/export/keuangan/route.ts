export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import ExcelJS from 'exceljs'
import {
  EXPORT_CONFIG,
  validateExportParams,
  validateExportRequest,
  getSafeDateRange,
  getExportTimestamp,
  sanitizeExportFilename,
  sanitizeExcelCell,
  withExportTimeout,
} from '@/lib/export-utils'

// GET /api/export/keuangan?format=pdf|excel&year=2024&month=6
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const hasAccess = await hasPermission(session.user.id, 'keuangan.view')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate export request (rate limiting)
    const validation = await validateExportRequest(session.user.id, 'keuangan')
    if (!validation.allowed) {
      return validation.response!
    }

    const { searchParams } = new URL(request.url)
    const params = validateExportParams({
      year: searchParams.get('year'),
      month: searchParams.get('month'),
      format: searchParams.get('format'),
    })

    if (!params.valid) {
      return NextResponse.json({ error: params.error }, { status: 400 })
    }

    // Get safe date range
    const { startDate, endDate } = getSafeDateRange(params.year, params.month)

    // Fetch transactions with limit
    const maxRecords = EXPORT_CONFIG.MAX_RECORDS.keuangan
    const transactions = await withExportTimeout(async () => {
      return prisma.transaction.findMany({
        where: {
          date: { gte: startDate, lte: endDate },
        },
        orderBy: { date: 'asc' },
        take: maxRecords,
        include: { createdBy: { select: { name: true } } },
      })
    })

    // Check if truncated
    const totalCount = await prisma.transaction.count({
      where: { date: { gte: startDate, lte: endDate } },
    })
    const isTruncated = totalCount > maxRecords

    // Calculate summary
    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)

    const totalExpense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)

    const balance = totalIncome - totalExpense

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(amount)
    }

    const categoryLabels: Record<string, string> = {
      kas_anggota: 'Kas Anggota',
      sumbangan: 'Sumbangan',
      bisnis: 'Bisnis',
      operasional: 'Operasional',
      lainnya: 'Lainnya',
    }

    const timestamp = getExportTimestamp()
    const yearStr = params.year.toString()
    const monthStr = params.month ? params.month.toString().padStart(2, '0') : ''
    const baseFilename = `laporan-keuangan-${yearStr}${monthStr ? '-' + monthStr : ''}-${timestamp}`

    if (params.format === 'excel') {
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'HubbHQ'
      workbook.created = new Date()
      const worksheet = workbook.addWorksheet('Laporan')

      worksheet.addRow(['LAPORAN KEUANGAN'])
      worksheet.addRow([
        params.month
          ? 'Bulan: ' + new Date(params.year, params.month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
          : 'Tahun: ' + params.year,
      ])
      worksheet.addRow([])
      worksheet.addRow(['RINGKASAN'])
      worksheet.addRow(['Total Records', transactions.length.toString() + (isTruncated ? ' (dibatasi)' : '')])
      worksheet.addRow(['Total Pemasukan', totalIncome])
      worksheet.addRow(['Total Pengeluaran', totalExpense])
      worksheet.addRow(['Saldo', balance])
      worksheet.addRow([])
      worksheet.addRow(['DETAIL TRANSAKSI'])
      worksheet.addRow(['Tanggal', 'Jenis', 'Kategori', 'Keterangan', 'Jumlah'])

      transactions.forEach((t) => {
        worksheet.addRow([
          new Date(t.date).toLocaleDateString('id-ID'),
          t.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
          sanitizeExcelCell(categoryLabels[t.category] || t.category),
          sanitizeExcelCell(t.description || '-'),
          parseFloat(t.amount.toString()),
        ])
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const filename = sanitizeExportFilename(baseFilename) + '.xlsx'

      return new NextResponse(Buffer.from(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="' + filename + '"',
        },
      })
    }

    // PDF generation
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('LAPORAN KEUANGAN', 14, 20)
    doc.setFontSize(12)
    doc.text(
      params.month
        ? 'Bulan ' + new Date(params.year, params.month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
        : 'Tahun ' + params.year,
      14, 28
    )

    if (isTruncated) {
      doc.setFontSize(10)
      doc.setTextColor(255, 165, 0)
      doc.text('* Data dibatasi untuk mencegah overload', 14, 36)
      doc.setTextColor(0, 0, 0)
    }

    doc.setFontSize(12)
    const summaryY = isTruncated ? 44 : 40
    doc.text('Ringkasan:', 14, summaryY)
    doc.text('Total Records: ' + transactions.length, 14, summaryY + 8)
    doc.text('Total Pemasukan: ' + formatCurrency(totalIncome), 14, summaryY + 16)
    doc.text('Total Pengeluaran: ' + formatCurrency(totalExpense), 14, summaryY + 24)
    doc.text('Saldo: ' + formatCurrency(balance), 14, summaryY + 32)

    const tableData = transactions.map((t) => [
      new Date(t.date).toLocaleDateString('id-ID'),
      t.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
      categoryLabels[t.category] || t.category,
      t.description || '-',
      formatCurrency(parseFloat(t.amount.toString())),
    ])

    ;(doc as any).autoTable({
      startY: summaryY + 40,
      head: [['Tanggal', 'Jenis', 'Kategori', 'Keterangan', 'Jumlah']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] },
    })

    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(
        'Dicetak pada: ' + new Date().toLocaleString('id-ID') + ' - Halaman ' + i + ' dari ' + pageCount,
        14,
        doc.internal.pageSize.height - 10
      )
    }

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    const filename = sanitizeExportFilename(baseFilename) + '.pdf'

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="' + filename + '"',
      },
    })
  } catch (error: any) {
    console.error('Error exporting keuangan:', error)
    if (error.message?.includes('timeout')) {
      return NextResponse.json(
        { error: 'Export timeout. Data terlalu besar. Coba dengan filter yang lebih spesifik.' },
        { status: 408 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
