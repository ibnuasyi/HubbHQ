export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { getKtaConfig } from '@/lib/kta-config'
import { renderDocx, generateDefaultDocxTemplate } from '@/lib/docx-render'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import path from 'path'
import fs from 'fs/promises'

function formatIndonesianDate(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date())
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date())
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

function cleanFilename(str: string): string {
  return str.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 80)
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const format = (searchParams.get('format') || 'docx').toLowerCase()

    const [surat, orgConfig] = await Promise.all([
      prisma.surat.findUnique({
        where: { id },
        include: {
          requester: {
            select: { id: true, name: true, fullName: true, nra: true, email: true },
          },
          approver: {
            select: {
              id: true,
              name: true,
              fullName: true,
              nra: true,
              signature: true,
              jabatan: { select: { name: true } },
            },
          },
          jenisSurat: true,
        },
      }),
      getKtaConfig(),
    ])

    if (!surat) {
      return NextResponse.json({ error: 'Data surat tidak ditemukan' }, { status: 404 })
    }

    const host = request.headers.get('host') || 'localhost:3000'
    const proto = request.nextUrl.protocol === 'https:' ? 'https' : 'http'
    const baseUrl = process.env.NEXTAUTH_URL?.replace(/\/+$/, '') || `${proto}://${host}`
    const verifyUrl = `${baseUrl}/verify?code=${surat.id}`

    // Siapkan data kamus variabel untuk template
    const rawFormData = (surat.formData && typeof surat.formData === 'object') ? (surat.formData as Record<string, any>) : {}
    const approverName = surat.approver?.fullName || surat.approver?.name || orgConfig.namaKetuaUmum || 'Pimpinan Organisasi'
    const approverJabatan = surat.approver?.jabatan?.name || orgConfig.jabatanPenandatangan || 'Ketua Umum'
    const approverNra = surat.approver?.nra || '-'
    const tglSuratFormatted = formatIndonesianDate(surat.createdAt)

    const templateData: Record<string, unknown> = {
      ...rawFormData,
      nomor_surat: surat.letterNumber || 'DRAFT',
      tanggal_surat: tglSuratFormatted,
      nama_organisasi: orgConfig.namaOrganisasi || 'PENGURUS BESAR ORGANISASI',
      sub_nama_organisasi: orgConfig.subNamaOrganisasi || 'SISTEM INFORMASI PERSURATAN HUBBHQ',
      alamat_organisasi: orgConfig.alamatSekretariat || 'Sekretariat Utama Organisasi',
      kontak_organisasi: orgConfig.kontakOrganisasi || 'sekretariat@hubbhq.org',
      kota: 'Jakarta',
      perihal: surat.subject,
      tujuan_surat: rawFormData.recipient || rawFormData.tujuan || surat.sender || 'Pihak Terkait',
      isi_surat: surat.content || rawFormData.body || rawFormData.isi || 'Bersama surat ini kami sampaikan agenda penting organisasi.',
      nama_pembuat: surat.requester?.fullName || surat.requester?.name || 'Anggota',
      nama_pemohon: surat.requester?.fullName || surat.requester?.name || 'Anggota',
      nama_penandatangan: approverName,
      jabatan_penandatangan: approverJabatan,
      nra_penandatangan: approverNra,
      url_verifikasi: verifyUrl,
      qr_verifikasi: verifyUrl,
    }

    const safeNumberSlug = cleanFilename(surat.letterNumber || `surat-${surat.id}`)

    // ==========================================
    // OPSI 1: Unduh Berkas Word (.docx)
    // ==========================================
    if (format === 'docx') {
      let templateBuffer: Buffer | null = null

      // Jika jenis surat memiliki template berkas tersimpan
      if (surat.jenisSurat?.templateUrl) {
        try {
          const filePath = path.join(process.cwd(), surat.jenisSurat.templateUrl.replace(/^\//, ''))
          templateBuffer = await fs.readFile(filePath)
        } catch {
          templateBuffer = null
        }
      }

      // Jika belum ada template khusus yang diupload, gunakan template resmi bawaan
      if (!templateBuffer) {
        templateBuffer = generateDefaultDocxTemplate({
          namaOrganisasi: orgConfig.namaOrganisasi,
          subNamaOrganisasi: orgConfig.subNamaOrganisasi,
          alamatOrganisasi: orgConfig.alamatSekretariat,
          kontakOrganisasi: orgConfig.kontakOrganisasi,
        })
      }

      const outputBuffer = renderDocx(templateBuffer, templateData)
      const filename = `${safeNumberSlug}.docx`

      return new Response(new Uint8Array(outputBuffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    // ==========================================
    // OPSI 2: Unduh Berkas Dokumen PDF (.pdf)
    // ==========================================
    if (format === 'pdf') {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = 210
      const margin = 20
      const contentWidth = pageWidth - margin * 2

      // 1. KOP SURAT
      doc.setFont('times', 'bold')
      doc.setFontSize(14)
      doc.text(orgConfig.namaOrganisasi || 'PENGURUS BESAR ORGANISASI', pageWidth / 2, 22, { align: 'center' })

      doc.setFontSize(11)
      doc.text(orgConfig.subNamaOrganisasi || 'SISTEM INFORMASI PERSURATAN HUBBHQ', pageWidth / 2, 28, { align: 'center' })

      doc.setFont('times', 'italic')
      doc.setFontSize(9)
      const kopContact = `${orgConfig.alamatSekretariat || 'Sekretariat Utama Organisasi'} | ${orgConfig.kontakOrganisasi || 'sekretariat@hubbhq.org'}`
      doc.text(kopContact, pageWidth / 2, 34, { align: 'center' })

      // Garis Ganda Pemisah Kop
      doc.setLineWidth(0.8)
      doc.line(margin, 38, pageWidth - margin, 38)
      doc.setLineWidth(0.2)
      doc.line(margin, 39.2, pageWidth - margin, 39.2)

      // 2. TANGGAL SURAT (Kanan Atas)
      doc.setFont('times', 'normal')
      doc.setFontSize(11)
      doc.text(`Jakarta, ${tglSuratFormatted}`, pageWidth - margin, 48, { align: 'right' })

      // 3. METADATA SURAT (Kiri)
      let curY = 54
      doc.text(`Nomor       : ${surat.letterNumber || 'DRAFT'}`, margin, curY)
      curY += 6
      doc.text('Lampiran : -', margin, curY)
      curY += 6
      doc.text(`Perihal     : ${surat.subject}`, margin, curY)

      // 4. TUJUAN SURAT
      curY += 12
      doc.text('Kepada Yth,', margin, curY)
      curY += 6
      doc.setFont('times', 'bold')
      doc.text(String(templateData.tujuan_surat || 'Pihak Terkait'), margin, curY)
      curY += 6
      doc.setFont('times', 'normal')
      doc.text('di Tempat', margin, curY)

      // 5. SALAM PEMBUKA & ISI
      curY += 12
      doc.text("Assalamu'alaikum Wr. Wb.", margin, curY)
      curY += 7

      const rawContent = String(templateData.isi_surat || '')
      const splitContent = doc.splitTextToSize(rawContent, contentWidth)
      doc.text(splitContent, margin, curY, { lineHeightFactor: 1.4 })
      curY += splitContent.length * 6 + 6

      // Jika ada rincian form dinamis (misal tanggal kegiatan, lokasi)
      const dynamicEntries = Object.entries(rawFormData).filter(([k]) => !['recipient', 'tujuan', 'body', 'isi'].includes(k))
      if (dynamicEntries.length > 0) {
        curY += 2
        for (const [key, val] of dynamicEntries) {
          if (val === null || val === undefined || val === '') continue
          const fieldLabel = key.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
          doc.setFont('times', 'bold')
          doc.text(`• ${fieldLabel}: `, margin + 4, curY)
          doc.setFont('times', 'normal')
          const valText = doc.splitTextToSize(String(val), contentWidth - 40)
          doc.text(valText, margin + 45, curY)
          curY += Math.max(valText.length * 5, 6)
        }
        curY += 4
      }

      // 6. PENUTUP
      const penutupText = 'Demikian surat ini kami sampaikan. Atas perhatian, dukungan, dan kerja sama yang diberikan, kami ucapkan terima kasih.'
      const splitPenutup = doc.splitTextToSize(penutupText, contentWidth)
      doc.text(splitPenutup, margin, curY, { lineHeightFactor: 1.4 })
      curY += splitPenutup.length * 6 + 4

      doc.text("Wassalamu'alaikum Wr. Wb.", margin, curY)
      curY += 14

      // 7. TANDA TANGAN & STEMPEL QR
      const sigX = pageWidth - margin - 60
      doc.setFont('times', 'bold')
      doc.text(orgConfig.namaOrganisasi || 'PENGURUS BESAR ORGANISASI', sigX + 30, curY, { align: 'center' })
      curY += 5
      doc.setFont('times', 'normal')
      doc.text(`${approverJabatan},`, sigX + 30, curY, { align: 'center' })

      // Tempelkan QR Code jika ada
      let qrRendered = false
      if (surat.qrCodeUrl) {
        try {
          const qrLocalPath = path.join(process.cwd(), 'public', surat.qrCodeUrl.replace(/^\//, ''))
          const qrBytes = await fs.readFile(qrLocalPath)
          const base64Qr = `data:image/png;base64,${qrBytes.toString('base64')}`
          doc.addImage(base64Qr, 'PNG', sigX + 16, curY + 2, 28, 28)
          qrRendered = true
        } catch {
          qrRendered = false
        }
      }

      curY += qrRendered ? 32 : 24
      doc.setFont('times', 'bold')
      doc.text(approverName, sigX + 30, curY, { align: 'center' })
      curY += 5
      doc.setFont('times', 'normal')
      doc.setFontSize(9)
      doc.text(`NRA: ${approverNra}`, sigX + 30, curY, { align: 'center' })

      // 8. FOOTER VERIFIKASI RESMI
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.3)
      doc.line(margin, 280, pageWidth - margin, 280)
      doc.setFontSize(7.5)
      doc.setTextColor(100, 100, 100)
      doc.text(`Verifikasi keabsahan surat resmi ini secara online melalui: ${verifyUrl}`, margin, 284)
      doc.text(`Dokumen resmi diterbitkan oleh Sistem HubbHQ pada: ${new Date().toLocaleString('id-ID')}`, margin, 288)

      const pdfBytes = doc.output('arraybuffer')
      const filename = `${safeNumberSlug}.pdf`

      return new Response(pdfBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    return NextResponse.json({ error: 'Format tidak didukung. Pilih format=docx atau format=pdf' }, { status: 400 })
  } catch (error: any) {
    console.error('Error downloading surat document:', error)
    return NextResponse.json({ error: error.message || 'Gagal memproses dokumen surat' }, { status: 500 })
  }
}

