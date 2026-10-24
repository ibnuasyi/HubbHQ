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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  QrCode,
  CreditCard,
  Building2,
  Copy,
  Check,
  Upload,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { QrisConfig, DEFAULT_QRIS_CONFIG } from '@/lib/qris'

interface QrisConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function QrisConfigModal({
  open,
  onOpenChange,
  onSuccess,
}: QrisConfigModalProps) {
  const [config, setConfig] = useState<QrisConfig>(DEFAULT_QRIS_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copiedWebhook, setCopiedWebhook] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/webhooks/qris`
      : 'https://domain-anda.com/api/webhooks/qris'

  useEffect(() => {
    if (open) {
      loadConfig()
      setErrorMsg('')
      setSuccessMsg('')
    }
  }, [open])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/keuangan/qris/config')
      const json = await res.json()
      if (json.data) setConfig(json.data)
    } catch (err) {
      console.error('Error fetching config:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopiedWebhook(true)
    setTimeout(() => setCopiedWebhook(false), 2000)
  }

  const handleUploadQrisImage = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setErrorMsg('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'qris-organisasi')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mengunggah gambar QRIS')

      setConfig((prev) => ({
        ...prev,
        mandiri: { ...prev.mandiri, qrisImageUrl: data.url },
      }))
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal upload gambar')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const res = await fetch('/api/keuangan/qris/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan pengaturan')

      setSuccessMsg('Konfigurasi QRIS berhasil diperbarui')
      if (onSuccess) onSuccess()
      setTimeout(() => {
        onOpenChange(false)
      }, 1000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <QrCode className="w-5 h-5 text-primary" />
            Pengaturan Pembayaran QRIS Iuran Kas
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Memuat konfigurasi pembayaran...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            {errorMsg && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md">
                {successMsg}
              </div>
            )}

            {/* Pilihan Pendekatan Mode Pembayaran */}
            <div className="space-y-2">
              <Label className="text-sm font-bold">Metode Integrasi QRIS</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Opsi B: Mandiri */}
                <div
                  onClick={() => setConfig({ ...config, mode: 'MANDIRI' })}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    config.mode === 'MANDIRI'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                    <Building2 className="w-4 h-4 text-primary" />
                    Opsi B: QRIS Mandiri Organisasi
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Gunakan stiker QRIS rekening bank organisasi (BSI, BCA, Mandiri)
                    dengan nominal terkunci & kode unik 3 digit. Tanpa biaya payment gateway.
                  </p>
                </div>

                {/* Opsi A: Gateway */}
                <div
                  onClick={() => setConfig({ ...config, mode: 'GATEWAY' })}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    config.mode === 'GATEWAY'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    Opsi A: Payment Gateway Otomatis
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Verifikasi 100% otomatis detik itu juga via Webhook (Midtrans /
                    Tripay / Xendit). Tagihan lunas instan tanpa perlu rekap bendahara.
                  </p>
                </div>
              </div>
            </div>

            {/* ==================== FORM KHUSUS OPSI B: MANDIRI ==================== */}
            {config.mode === 'MANDIRI' && (
              <div className="p-4 bg-muted/30 border rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span className="font-bold text-xs uppercase tracking-wide">
                    Kelengkapan QRIS & Rekening Bank Organisasi
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="merchantName">Nama Organisasi / Merchant</Label>
                    <Input
                      id="merchantName"
                      placeholder="Contoh: BENDAHARA BEM FT"
                      value={config.mandiri.merchantName}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          mandiri: { ...config.mandiri, merchantName: e.target.value },
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="bankName">Nama Bank / E-Wallet Penampung</Label>
                    <Input
                      id="bankName"
                      placeholder="Contoh: Bank Syariah Indonesia (BSI)"
                      value={config.mandiri.bankName}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          mandiri: { ...config.mandiri, bankName: e.target.value },
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="accountNumber">Nomor Rekening / Akun</Label>
                    <Input
                      id="accountNumber"
                      placeholder="Contoh: 7182930412"
                      value={config.mandiri.accountNumber}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          mandiri: { ...config.mandiri, accountNumber: e.target.value },
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="accountHolder">Atas Nama Rekening (A.N)</Label>
                    <Input
                      id="accountHolder"
                      placeholder="Contoh: KAS BEM FAKULTAS"
                      value={config.mandiri.accountHolder}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          mandiri: { ...config.mandiri, accountHolder: e.target.value },
                        })
                      }
                      required
                    />
                  </div>
                </div>

                {/* Upload Gambar Stiker QRIS */}
                <div className="space-y-1.5 pt-1">
                  <Label>Gambar Stiker QRIS Bank Organisasi</Label>
                  <div className="flex items-center gap-3">
                    {config.mandiri.qrisImageUrl ? (
                      <img
                        src={config.mandiri.qrisImageUrl}
                        alt="Stiker QRIS"
                        className="w-16 h-16 rounded-lg object-contain border bg-white p-1"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground text-xs bg-muted">
                        No File
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-md text-xs hover:bg-muted font-medium">
                        {uploadingImage ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        Unggah Stiker QRIS
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUploadQrisImage}
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                </div>

                {/* String EMVCo QRIS Statis */}
                <div className="space-y-1">
                  <Label htmlFor="staticQrisString">
                    String / Payload QRIS EMVCo{' '}
                    <span className="text-xs text-muted-foreground font-normal">
                      (Opsional, untuk injeksi nominal dinamis otomatis)
                    </span>
                  </Label>
                  <Input
                    id="staticQrisString"
                    placeholder="00020101021126670016ID.CO.BSI.WWW0118..."
                    value={config.mandiri.staticQrisString}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        mandiri: { ...config.mandiri, staticQrisString: e.target.value },
                      })
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Jika diisi string QRIS resmi bank, sistem otomatis menginjeksi nominal tagihan ke QRIS sehingga saat anggota memindai, nominal langsung terkunci.
                  </p>
                </div>

                {/* Checkbox 3 Digit Kode Unik */}
                <div className="flex items-center space-x-2 pt-1">
                  <Checkbox
                    id="useUniqueCode"
                    checked={config.mandiri.useUniqueCode}
                    onCheckedChange={(checked: boolean) =>
                      setConfig({
                        ...config,
                        mandiri: { ...config.mandiri, useUniqueCode: Boolean(checked) },
                      })
                    }
                  />
                  <label
                    htmlFor="useUniqueCode"
                    className="text-xs font-semibold leading-none cursor-pointer"
                  >
                    Gunakan 3 Digit Kode Unik Acak (Contoh: Rp 20.000 menjadi Rp 20.142)
                  </label>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="instructions">Petunjuk Pembayaran untuk Anggota</Label>
                  <Textarea
                    id="instructions"
                    rows={2}
                    value={config.mandiri.instructions}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        mandiri: { ...config.mandiri, instructions: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            )}

            {/* ==================== FORM KHUSUS OPSI A: GATEWAY ==================== */}
            {config.mode === 'GATEWAY' && (
              <div className="p-4 bg-muted/30 border rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-xs uppercase tracking-wide">
                    Kredensial Payment Gateway (Auto-Webhook)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Penyedia Payment Gateway</Label>
                    <Select
                      value={config.gateway.provider}
                      onValueChange={(val: any) =>
                        setConfig({
                          ...config,
                          gateway: { ...config.gateway, provider: val },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simulation">
                          Simulator HubbHQ (Uji Coba Lokal / Testing)
                        </SelectItem>
                        <SelectItem value="tripay">Tripay Payment Gateway (QRIS Otomatis)</SelectItem>
                        <SelectItem value="midtrans">Midtrans Core API / Snap QRIS</SelectItem>
                        <SelectItem value="xendit">Xendit QRIS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="apiKey">
                      Server Key / API Key <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="SB-Mid-server-... / DEV-..."
                      value={config.gateway.apiKey}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          gateway: { ...config.gateway, apiKey: e.target.value },
                        })
                      }
                    />
                  </div>

                  {config.gateway.provider === 'tripay' && (
                    <div className="space-y-1">
                      <Label htmlFor="merchantCode">Tripay Merchant Code</Label>
                      <Input
                        id="merchantCode"
                        placeholder="Contoh: T12345"
                        value={config.gateway.merchantCode}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            gateway: { ...config.gateway, merchantCode: e.target.value },
                          })
                        }
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label htmlFor="clientKey">Client Key / Public Key (Opsional)</Label>
                    <Input
                      id="clientKey"
                      placeholder="Public key..."
                      value={config.gateway.clientKey}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          gateway: { ...config.gateway, clientKey: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <Checkbox
                    id="isProduction"
                    checked={config.gateway.isProduction}
                    onCheckedChange={(checked: boolean) =>
                      setConfig({
                        ...config,
                        gateway: { ...config.gateway, isProduction: Boolean(checked) },
                      })
                    }
                  />
                  <label
                    htmlFor="isProduction"
                    className="text-xs font-semibold leading-none cursor-pointer"
                  >
                    Aktifkan Mode Produksi / Live (Hilangkan centang untuk mode Sandbox/Dev)
                  </label>
                </div>

                {/* Kotak Informasi Webhook URL */}
                <div className="p-3 bg-slate-900 text-white rounded-xl text-xs space-y-2">
                  <div className="font-bold flex items-center justify-between">
                    <span>URL Webhook Notifikasi Transaksi:</span>
                    <button
                      type="button"
                      onClick={handleCopyWebhook}
                      className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      {copiedWebhook ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Tersalin!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Salin URL
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-[11px] text-slate-300 bg-slate-950 p-2 rounded border border-slate-800 break-all">
                    {webhookUrl}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Masukkan URL di atas pada dashboard pengaturan Webhook / Notification URL di akun Midtrans atau Tripay Anda.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter className="pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Pengaturan QRIS'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

