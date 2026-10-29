'use client'

import React, { useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Printer, Download, FileText, Loader2, QrCode } from 'lucide-react'

export interface SuratDocumentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  surat: {
    id: string
    letterNumber: string | null
    subject: string
    content: string | null
    status: string
    type: string
    createdAt: string
    sender?: string | null
    receivedDate?: string | null
    formData?: Record<string, any> | null
    qrCodeUrl?: string | null
    jenisSurat?: { id: string; name: string; code: string } | null
    requester?: { id: string; name: string | null } | null
    approver?: { id: string; name: string | null } | null
  } | null
  organization?: {
    namaOrganisasi?: string
    subNamaOrganisasi?: string
    alamatSekretariat?: string
    kontakOrganisasi?: string
  }
}

export function SuratDocumentModal({
  open,
  onOpenChange,
  surat,
  organization,
}: SuratDocumentModalProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [downloadingDocx, setDownloadingDocx] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  if (!surat) return null

  const orgName = organization?.namaOrganisasi || 'PENGURUS BESAR ORGANISASI'
  const orgSub = organization?.subNamaOrganisasi || 'SISTEM INFORMASI PERSURATAN & ADMINISTRASI HUBBHQ'
  const orgAlamat = organization?.alamatSekretariat || 'Sekretariat Utama HubbHQ'
  const orgKontak = organization?.kontakOrganisasi || 'sekretariat@hubbhq.org'

  const tglFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(surat.createdAt))

  const formData = surat.formData || {}
  const recipient = formData.recipient || formData.tujuan || surat.sender || 'Pihak Terkait'
  const bodyContent = surat.content || formData.body || formData.isi || '(Tidak ada isi ringkasan teks)'
  const approverName = surat.approver?.name || 'Pimpinan Organisasi'

  const handleDownloadDocx = async () => {
    try {
      setDownloadingDocx(true)
      const res = await fetch(`/api/surat/${surat.id}/download?format=docx`)
      if (!res.ok) throw new Error('Gagal mengunduh berkas Word')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const safeFilename = (surat.letterNumber || `surat-${surat.id}`).replace(/[^a-zA-Z0-9_\-]/g, '_')
      a.download = `${safeFilename}.docx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      alert(err?.message || 'Gagal mengunduh dokumen .docx')
    } finally {
      setDownloadingDocx(false)
    }
  }

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true)
      const res = await fetch(`/api/surat/${surat.id}/download?format=pdf`)
      if (!res.ok) throw new Error('Gagal mengunduh berkas PDF')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const safeFilename = (surat.letterNumber || `surat-${surat.id}`).replace(/[^a-zA-Z0-9_\-]/g, '_')
      a.download = `${safeFilename}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      alert(err?.message || 'Gagal mengunduh dokumen .pdf')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[94vh] overflow-y-auto">
        <DialogHeader className="print:hidden">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <FileText className="w-5 h-5 text-primary" />
              Pratinjau & Unduh Naskah Surat Resmi
            </DialogTitle>
            <div className="flex items-center gap-2">
              {surat.jenisSurat && (
                <Badge variant="outline">{surat.jenisSurat.code}</Badge>
              )}
              <Badge className={surat.status === 'APPROVED' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}>
                {surat.status}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Paper Container for Print & Preview */}
        <div
          ref={printRef}
          id="printable-surat-resmi"
          className="p-10 bg-white text-slate-900 border rounded-lg shadow-sm font-serif print:border-none print:shadow-none print:p-0 print:m-0"
        >
          {/* KOP SURAT */}
          <div className="text-center pb-3 mb-6 border-b-[3px] border-double border-slate-950">
            <h2 className="text-xl font-bold uppercase tracking-wider text-slate-950">
              {orgName}
            </h2>
            <p className="text-sm uppercase tracking-widest text-slate-800 font-semibold mt-0.5">
              {orgSub}
            </p>
            <p className="text-xs italic text-slate-600 mt-1">
              {orgAlamat} | {orgKontak}
            </p>
          </div>

          {/* TANGGAL DAN TEMPAT */}
          <div className="text-right text-sm mb-4">
            <span>Jakarta, {tglFormatted}</span>
          </div>

          {/* METADATA SURAT */}
          <div className="grid grid-cols-[110px_1fr] text-sm gap-y-1 mb-6">
            <span className="font-semibold">Nomor</span>
            <span>: {surat.letterNumber || 'DRAFT'}</span>
            <span className="font-semibold">Lampiran</span>
            <span>: -</span>
            <span className="font-semibold">Perihal</span>
            <span className="font-bold">: {surat.subject}</span>
          </div>

          {/* TUJUAN SURAT */}
          <div className="text-sm mb-6">
            <p>Kepada Yth,</p>
            <p className="font-bold mt-1">{recipient}</p>
            <p>di Tempat</p>
          </div>

          {/* SALAM PEMBUKA & ISI */}
          <div className="text-sm space-y-4 mb-8 leading-relaxed text-justify">
            <p>Assalamu'alaikum Wr. Wb.</p>
            <p className="whitespace-pre-wrap">{bodyContent}</p>

            {/* Form Data Tambahan jika ada */}
            {Object.keys(formData).length > 0 && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1 my-3">
                <span className="font-bold uppercase tracking-wider text-slate-700 block mb-1">
                  Rincian Informasi Tambahan:
                </span>
                {Object.entries(formData).map(([key, val]) => {
                  if (['recipient', 'tujuan', 'body', 'isi'].includes(key) || !val) return null
                  const label = key.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                  return (
                    <div key={key} className="grid grid-cols-[140px_1fr]">
                      <span className="font-semibold">{label}:</span>
                      <span>{String(val)}</span>
                    </div>
                  )
                })}
              </div>
            )}

            <p>
              Demikian surat ini kami sampaikan. Atas perhatian, dukungan, dan kerja sama yang baik, kami mengucapkan terima kasih.
            </p>
            <p>Wassalamu'alaikum Wr. Wb.</p>
          </div>

          {/* TANDA TANGAN & STEMPEL QR */}
          <div className="flex justify-end pt-4">
            <div className="w-64 text-center text-sm">
              <p className="font-bold">{orgName}</p>
              <p className="mb-2">Ketua Umum,</p>

              {/* QR Code Verifikasi */}
              {surat.qrCodeUrl ? (
                <div className="my-2 flex justify-center">
                  <img
                    src={surat.qrCodeUrl}
                    alt="QR Code Verifikasi"
                    className="w-24 h-24 border border-slate-300 p-1"
                  />
                </div>
              ) : (
                <div className="h-20 flex items-center justify-center text-xs text-slate-400 italic">
                  [Tanda Tangan Resmi]
                </div>
              )}

              <p className="font-bold underline mt-2">{approverName}</p>
              <p className="text-xs text-slate-600">Pejabat Pengesah</p>
            </div>
          </div>

          {/* FOOTER VERIFIKASI */}
          <div className="mt-12 pt-3 border-t border-slate-300 text-[10px] text-slate-500 flex justify-between items-center">
            <span>Dokumen diterbitkan secara sah melalui Sistem HubbHQ</span>
            <span className="flex items-center gap-1 font-mono">
              <QrCode className="w-3 h-3" /> Ref ID: {surat.id}
            </span>
          </div>
        </div>

        {/* DIALOG FOOTER DENGAN 2 OPSI: WORD (.DOCX) & PDF (.PDF) */}
        <DialogFooter className="print:hidden pt-4 border-t flex flex-wrap gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Tutup
          </Button>

          {/* OPSI 1: UNDUH .DOCX */}
          <Button
            type="button"
            variant="outline"
            className="border-blue-600 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
            onClick={handleDownloadDocx}
            disabled={downloadingDocx}
          >
            {downloadingDocx ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2 text-blue-600" />
            )}
            Unduh Word (.docx)
          </Button>

          {/* OPSI 2A: UNDUH LANGSUNG .PDF */}
          <Button
            type="button"
            variant="outline"
            className="border-red-600 text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
          >
            {downloadingPdf ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2 text-red-600" />
            )}
            Unduh File (.pdf)
          </Button>

          {/* OPSI 2B: CETAK / SAVE AS PDF BROWSER */}
          <Button
            type="button"
            className="bg-primary text-primary-foreground"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4 mr-2" />
            Cetak Dokumen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

