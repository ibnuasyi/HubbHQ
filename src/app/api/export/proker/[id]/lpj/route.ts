export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth, hasPermission } from '@/lib/auth'
import { canManageProker } from '@/lib/proker-auth'
import { validateExportRequest } from '@/lib/export-utils'
import ExcelJS from 'exceljs'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

export async function GET(
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
    const canView =
      ['admin', 'ketua', 'sekretaris', 'bendahara'].includes(roleName) ||
      (await hasPermission(session.user.id, 'proker.view')) ||
      (await canManageProker(session.user.id, roleName, prokerId))

    if (!canView) {
      return NextResponse.json(
        { error: 'Forbidden: Anda tidak memiliki wewenang untuk mengekspor LPJ proker ini' },
        { status: 403 }
      )
    }

    const validation = await validateExportRequest(session.user.id, 'proker')
    if (!validation.allowed) {
      return validation.response!
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'pdf' // 'pdf' or 'excel'

    const proker = await prisma.programKerja.findUnique({
      where: { id: prokerId },
      include: {
        divisi: true,
        pic: true,
        creator: true,
        panitia: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        lpj: {
          include: {
            items: { orderBy: { createdAt: 'asc' } },
            reviewedBy: { select: { name: true } },
          },
        },
      },
    })

    if (!proker) {
      return NextResponse.json({ error: 'Program kerja tidak ditemukan' }, { status: 404 })
    }

    const lpj = proker.lpj
    const items = lpj?.items || []
    const incomeItems = items.filter((i) => i.type === 'INCOME')
    const expenseItems = items.filter((i) => i.type === 'EXPENSE')

    const formatCurrency = (val: number | any) => {
      const num = Number(val || 0)
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(num)
    }

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'HubbHQ System'
      workbook.created = new Date()

      const sheet = workbook.addWorksheet('LPJ Keuangan & Kegiatan')

      // Title header
      sheet.mergeCells('A1:F1')
      sheet.getCell('A1').value = `LAPORAN PERTANGGUNGJAWABAN (LPJ) - ${proker.title.toUpperCase()}`
      sheet.getCell('A1').font = { size: 14, bold: true }
      sheet.getCell('A1').alignment = { horizontal: 'center' }

      sheet.addRow([])
      sheet.addRow(['Divisi Pengampu', proker.divisi.name])
      sheet.addRow(['Penanggung Jawab (PIC)', proker.pic?.name || '-'])
      sheet.addRow(['Waktu Pelaksanaan', `${proker.startDate ? new Date(proker.startDate).toLocaleDateString('id-ID') : '-'} s/d ${proker.endDate ? new Date(proker.endDate).toLocaleDateString('id-ID') : '-'}`])
      sheet.addRow(['Lokasi Kegiatan', proker.lokasi || '-'])
      sheet.addRow(['Estimasi Anggaran (RAB)', formatCurrency(proker.anggaranEstimasi)])
      sheet.addRow(['Total Realisasi Pemasukan', formatCurrency(lpj?.totalPemasukan)])
      sheet.addRow(['Total Realisasi Pengeluaran', formatCurrency(lpj?.totalPengeluaran)])
      sheet.addRow(['Saldo Akhir (Surplus/Defisit)', formatCurrency(lpj?.saldoAkhir)])
      sheet.addRow(['Status LPJ', lpj?.status || 'DRAFT'])
      sheet.addRow([])

      // Section: Pengeluaran
      sheet.addRow(['DAFTAR REALISASI BELANJA / PENGELUARAN'])
      sheet.getRow(sheet.rowCount).font = { bold: true }

      const expenseHeader = ['No', 'Kategori Pos', 'Nama Barang / Uraian', 'Kuantitas', 'Harga Satuan', 'Subtotal Biaya']
      const expHeaderRow = sheet.addRow(expenseHeader)
      expHeaderRow.eachCell((c) => {
        c.font = { bold: true }
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }
      })

      expenseItems.forEach((it, idx) => {
        sheet.addRow([
          idx + 1,
          it.kategori,
          it.namaBarang,
          `${Number(it.qty)} ${it.satuan || ''}`,
          Number(it.hargaSatuan),
          Number(it.totalHarga),
        ])
      })

      sheet.addRow([])

      // Section: Pemasukan
      sheet.addRow(['DAFTAR REALISASI PEMASUKAN DANA'])
      sheet.getRow(sheet.rowCount).font = { bold: true }

      const incHeaderRow = sheet.addRow(['No', 'Kategori', 'Sumber Pemasukan', 'Kuantitas', 'Nominal Satuan', 'Total Nominal'])
      incHeaderRow.eachCell((c) => {
        c.font = { bold: true }
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }
      })

      incomeItems.forEach((it, idx) => {
        sheet.addRow([
          idx + 1,
          it.kategori,
          it.namaBarang,
          `${Number(it.qty)} ${it.satuan || ''}`,
          Number(it.hargaSatuan),
          Number(it.totalHarga),
        ])
      })

      sheet.columns = [
        { width: 8 },
        { width: 22 },
        { width: 35 },
        { width: 16 },
        { width: 20 },
        { width: 22 },
      ]

      const buffer = await workbook.xlsx.writeBuffer()
      const filename = `LPJ-${proker.title.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    // PDF Format
    const doc = new jsPDF()

    // Title
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('LAPORAN PERTANGGUNGJAWABAN (LPJ)', 105, 18, { align: 'center' })

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(proker.title.toUpperCase(), 105, 25, { align: 'center' })

    doc.setLineWidth(0.5)
    doc.line(14, 30, 196, 30)

    // Meta Table
    doc.setFontSize(10)
    let y = 38
    doc.text(`Divisi: ${proker.divisi.name}`, 14, y)
    doc.text(`PIC: ${proker.pic?.name || '-'}`, 110, y)
    y += 7
    doc.text(`Status LPJ: ${lpj?.status || 'DRAFT'}`, 14, y)
    doc.text(`Estimasi RAB: ${formatCurrency(proker.anggaranEstimasi)}`, 110, y)
    y += 7
    doc.text(`Total Pemasukan: ${formatCurrency(lpj?.totalPemasukan)}`, 14, y)
    doc.text(`Total Pengeluaran: ${formatCurrency(lpj?.totalPengeluaran)}`, 110, y)
    y += 7
    doc.text(`Saldo Akhir: ${formatCurrency(lpj?.saldoAkhir)}`, 14, y)
    doc.text(`Peserta Hadir: ${lpj?.pesertaHadir || 0} Orang`, 110, y)

    y += 12

    // Narrative Summary
    doc.setFont('helvetica', 'bold')
    doc.text('1. Ringkasan Pelaksanaan & Ketercapaian Sasaran', 14, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    const ringkasan = lpj?.ringkasanKegiatan || 'Belum ada catatan naratif ringkasan.'
    const splitRingkasan = doc.splitTextToSize(ringkasan, 180)
    doc.text(splitRingkasan, 14, y)
    y += splitRingkasan.length * 5 + 6

    // Evaluasi & Kendala
    doc.setFont('helvetica', 'bold')
    doc.text('2. Evaluasi, Kendala & Solusi Lapangan', 14, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    const kendala = `Kendala: ${lpj?.kendala || '-'}\nSolusi: ${lpj?.solusi || '-'}\nRekomendasi: ${lpj?.rekomendasi || '-'}`
    const splitKendala = doc.splitTextToSize(kendala, 180)
    doc.text(splitKendala, 14, y)
    y += splitKendala.length * 5 + 8

    // Financial Table (Expenses)
    doc.setFont('helvetica', 'bold')
    doc.text('3. Rincian Realisasi Pengeluaran Anggaran', 14, y)
    y += 4

    const tableData = expenseItems.map((it, idx) => [
      (idx + 1).toString(),
      it.kategori,
      it.namaBarang,
      `${Number(it.qty)} ${it.satuan || ''}`,
      formatCurrency(it.hargaSatuan),
      formatCurrency(it.totalHarga),
    ])

    ;(doc as any).autoTable({
      startY: y,
      head: [['No', 'Kategori', 'Nama Barang / Pos Belanja', 'Qty', 'Harga Satuan', 'Subtotal']],
      body: tableData.length > 0 ? tableData : [['-', '-', 'Belum ada rincian belanja', '-', '-', '-']],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: 14, right: 14 },
    })

    const finalY = (doc as any).lastAutoTable.finalY + 15

    // Signatures
    if (finalY < 250) {
      doc.text('Ketua Pelaksana,', 30, finalY)
      doc.text('Bendahara Pelaksana,', 140, finalY)
      doc.text(proker.pic?.name || '(....................................)', 30, finalY + 25)
      doc.text('(....................................)', 140, finalY + 25)
    }

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    const filename = `LPJ-${proker.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating LPJ document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

