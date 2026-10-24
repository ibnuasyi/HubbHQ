'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  QrCode,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  Zap,
  Building2,
  Sparkles,
} from 'lucide-react'

interface QrisPaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  month: number
  year: number
  amount?: number
  onSuccess?: () => void
}

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

export function QrisPaymentModal({
  open,
  onOpenChange,
  month,
  year,
  amount = 20000,
  onSuccess,
}: QrisPaymentModalProps) {
  const [loading, setLoading] = useState(true)
  const [invoice, setInvoice] = useState<any>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [copiedRekening, setCopiedRekening] = useState(false)
  const [simulating, setSimulating] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (open) {
      setIsSuccess(false)
      setErrorMsg('')
      generateInvoice()
    }
  }, [open, month, year, amount])

  // Polling status pembayaran setiap 4 detik jika invoice aktif
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (open && invoice?.data?.paymentRef && !isSuccess) {
      timer = setInterval(async () => {
        try {
          const res = await fetch('/api/keuangan/kas')
          const json = await res.json()
          if (json.data) {
            const myPayment = json.data.find(
              (p: any) => p.id === invoice.data.paymentId || p.paymentRef === invoice.data.paymentRef
            )
            if (myPayment?.status === 'APPROVED') {
              setIsSuccess(true)
              if (onSuccess) onSuccess()
            }
          }
        } catch {
          // Abaikan kesalahan polling sesaat
        }
      }, 4000)
    }
    return () => clearInterval(timer)
  }, [open, invoice, isSuccess])

  const generateInvoice = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/keuangan/qris/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month,
          year,
          amount,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal membuat tagihan QRIS')

      setInvoice(json)
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyRekening = () => {
    if (invoice?.data?.accountNumber) {
      navigator.clipboard.writeText(invoice.data.accountNumber)
      setCopiedRekening(true)
      setTimeout(() => setCopiedRekening(false), 2000)
    }
  }

  // Khusus mode simulator untuk uji coba instan
  const handleSimulatePayment = async () => {
    if (!invoice?.data?.paymentRef) return
    setSimulating(true)
    try {
      const res = await fetch('/api/webhooks/qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SIMULATE_PAY',
          paymentRef: invoice.data.paymentRef,
          amount: invoice.data.totalAmount,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal simulasi')

      setIsSuccess(true)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      alert(err.message || 'Gagal simulasi pembayaran')
    } finally {
      setSimulating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <QrCode className="w-5 h-5 text-primary" />
            Bayar Iuran Kas via QRIS
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-3" />
            <p className="text-xs font-medium">Mempersiapkan kode QRIS resmi...</p>
          </div>
        ) : errorMsg ? (
          <div className="py-8 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <p className="text-xs text-red-600">{errorMsg}</p>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
          </div>
        ) : isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-foreground">
                Pembayaran Berhasil Diverifikasi!
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Iuran kas bulan {MONTH_NAMES[month - 1]} {year} telah lunas dan
                otomatis tercatat dalam buku kas organisasi.
              </p>
            </div>

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => onOpenChange(false)}
            >
              Selesai
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Periode & Nominal Tagihan */}
            <div className="p-3.5 bg-muted/40 rounded-2xl border text-center space-y-1">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold block">
                IURAN KAS BULAN {MONTH_NAMES[month - 1]?.toUpperCase()} {year}
              </span>
              <div className="text-2xl font-black text-foreground">
                Rp {invoice?.data?.totalAmount?.toLocaleString('id-ID')}
              </div>
              {invoice?.mode === 'MANDIRI' && invoice?.data?.uniqueCode > 0 && (
                <div className="text-[11px] text-amber-600 font-semibold bg-amber-50 dark:bg-amber-950/30 p-1.5 rounded-lg border border-amber-200">
                  Termasuk 3 digit kode unik (Rp {invoice.data.uniqueCode}). Pastikan
                  nominal transfer tepat agar verifikasi mutasi cepat.
                </div>
              )}
            </div>

            {/* Gambar QRIS */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border-2 border-slate-900 shadow-sm">
              <div className="w-64 h-64 flex items-center justify-center">
                {invoice?.data?.qrCodeDataUrl ? (
                  <img
                    src={invoice.data.qrCodeDataUrl}
                    alt="Kode QRIS"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 animate-pulse rounded-lg" />
                )}
              </div>

              <div className="text-center mt-3 pt-2 border-t border-slate-200 w-full text-[10px] text-slate-500 font-sans">
                <span className="font-bold text-slate-900 block text-xs">
                  {invoice?.data?.merchantName || 'HUBBHQ QRIS PAYMENT'}
                </span>
                NMID / Standar QRIS Nasional Bank Indonesia
              </div>
            </div>

            {/* Informasi Transfer Rekening (Khusus Opsi B) */}
            {invoice?.mode === 'MANDIRI' && invoice?.data?.accountNumber && (
              <div className="p-3 bg-muted/30 rounded-xl border space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Alternatif Transfer Bank:</span>
                  <span className="font-semibold text-foreground">
                    {invoice.data.bankName}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <span className="font-mono font-bold text-sm text-foreground">
                    {invoice.data.accountNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyRekening}
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                  >
                    {copiedRekening ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Salin No. Rek
                      </>
                    )}
                  </button>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  A.N: {invoice.data.accountHolder}
                </div>
              </div>
            )}

            {/* Tombol Simulasi Pembayaran Instan (Khusus Testing / Dev) */}
            {invoice?.data?.isSimulation && (
              <div className="p-3 bg-slate-900 text-white rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <Zap className="w-3.5 h-3.5" />
                  Mode Simulator Testing Aktif
                </div>
                <p className="text-[11px] text-slate-300">
                  Gunakan tombol di bawah untuk menguji alur webhook dan otomatisasi buku kas tanpa transfer riil:
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full text-xs font-bold"
                  onClick={handleSimulatePayment}
                  disabled={simulating}
                >
                  {simulating ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                  )}
                  Simulasikan Pembayaran Lunas Sekarang
                </Button>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground text-center italic">
              Buka aplikasi BCA Mobile, Livin by Mandiri, BRImo, GoPay, ShopeePay, OVO, atau Dana,
              lalu pilih menu Scan / QRIS.
            </p>
          </div>
        )}

        <DialogFooter className="pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

