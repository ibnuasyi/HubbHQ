'use client'

import React, { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import html2canvas from 'html2canvas'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, Download, ExternalLink, QrCode as QrIcon, Loader2 } from 'lucide-react'
import { InventarisItem } from './barang-dialog'

interface QrLabelModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: InventarisItem | null
}

export function QrLabelModal({ open, onOpenChange, item }: QrLabelModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [downloading, setDownloading] = useState(false)
  const labelRef = useRef<HTMLDivElement>(null)

  const publicUrl =
    typeof window !== 'undefined' && item
      ? `${window.location.origin}/inventaris/${encodeURIComponent(item.kodeBarang)}`
      : ''

  useEffect(() => {
    if (item && open) {
      const url = `${window.location.origin}/inventaris/${encodeURIComponent(item.kodeBarang)}`
      QRCode.toDataURL(url, {
        width: 320,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR:', err))
    }
  }, [item, open])

  const handlePrint = () => {
    if (!labelRef.current) return
    window.print()
  }

  const handleDownloadPng = async () => {
    if (!labelRef.current || !item) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(labelRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
      })
      const link = document.createElement('a')
      link.download = `LABEL-${item.kodeBarang}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Failed to export label image:', err)
    } finally {
      setDownloading(false)
    }
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <QrIcon className="w-5 h-5 text-primary" />
            Label QR Fisik Inventaris
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-xl border border-dashed border-border">
          {/* Printable Label Tag Container */}
          <div
            ref={labelRef}
            id="inventaris-printable-label"
            className="w-[380px] p-4 bg-white text-slate-900 border-2 border-slate-800 rounded-lg shadow-sm font-sans"
          >
            {/* Header Tag */}
            <div className="flex items-center justify-between border-b border-slate-300 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  HQ
                </div>
                <div>
                  <h4 className="text-[11px] font-black tracking-wider uppercase text-slate-900 leading-tight">
                    INVENTARIS SEKRETARIAT
                  </h4>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">
                    HUBBHQ ASSET MANAGEMENT
                  </p>
                </div>
              </div>
              <div className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                {item.satuan}
              </div>
            </div>

            {/* Content: QR Code + Details */}
            <div className="flex items-center gap-3">
              {/* QR Image */}
              <div className="w-24 h-24 flex-shrink-0 bg-white p-1 rounded border border-slate-200 flex items-center justify-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={item.kodeBarang}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 animate-pulse rounded" />
                )}
              </div>

              {/* Detail Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">
                    Kode Barang
                  </div>
                  <div className="font-mono font-black text-sm tracking-tight text-slate-950">
                    {item.kodeBarang}
                  </div>
                </div>

                <div className="my-1">
                  <div className="font-bold text-xs text-slate-900 truncate">
                    {item.namaBarang}
                  </div>
                  {item.merkModel && (
                    <div className="text-[11px] text-slate-600 truncate">
                      {item.merkModel}
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 truncate">
                  <span className="font-semibold text-slate-700">Lokasi: </span>
                  {item.lokasiPenyimpanan}
                </div>
              </div>
            </div>

            {/* Footer Tag */}
            <div className="mt-2 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500">
              <span>Scan untuk periksa status ketersediaan</span>
              <span className="font-mono font-medium">Kondisi: {item.kondisi}</span>
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground text-center">
            Tempelkan stiker ini pada bodi fisik barang. Kamera ponsel dapat langsung
            memindai untuk melihat status peminjaman.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => window.open(publicUrl, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-1.5" />
            Buka Halaman Scan
          </Button>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleDownloadPng}
              disabled={downloading || !qrDataUrl}
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-1.5" />
              )}
              Unduh PNG
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              disabled={!qrDataUrl}
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Label
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

