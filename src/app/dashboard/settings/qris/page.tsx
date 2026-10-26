'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  QrCode,
  Building2,
  CreditCard,
  Zap,
  Copy,
  Check,
  Upload,
  ShieldCheck,
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { QrisConfig, DEFAULT_QRIS_CONFIG } from '@/lib/qris'

export default function QrisSettingsPage() {
  const [config, setConfig] = useState<QrisConfig>(DEFAULT_QRIS_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [copiedWebhook, setCopiedWebhook] = useState(false)
  const [copiedAccount, setCopiedAccount] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showWebhookSecret, setShowWebhookSecret] = useState(false)

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/webhooks/qris`
      : 'https://domain-anda.com/api/webhooks/qris'

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setLoading(true)
    setStatusMessage(null)
    try {
      const res = await fetch('/api/keuangan/qris/config')
      const json = await res.json()
      if (json.data) {
        setConfig(json.data)
      }
    } catch (err: any) {
      console.error('Gagal mengambil konfigurasi QRIS:', err)
      setStatusMessage({
        type: 'error',
        text: 'Gagal memuat konfigurasi QRIS dari server.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopiedWebhook(true)
    setTimeout(() => setCopiedWebhook(false), 2000)
  }

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(config.mandiri.accountNumber)
    setCopiedAccount(true)
    setTimeout(() => setCopiedAccount(false), 2000)
  }

  const handleUploadQrisImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setStatusMessage(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('type', 'umum')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: form,
      })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Gagal mengunggah stiker QRIS')
      }

      setConfig({
        ...config,
        mandiri: {
          ...config.mandiri,
          qrisImageUrl: json.data?.url || '',
        },
      })
      setStatusMessage({
        type: 'success',
        text: 'Gambar stiker QRIS berhasil diunggah.',
      })
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Gagal mengunggah berkas QRIS.',
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setStatusMessage(null)

    try {
      const res = await fetch('/api/keuangan/qris/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Gagal menyimpan konfigurasi.')
      }

      setStatusMessage({
        type: 'success',
        text: json.message || 'Konfigurasi pembayaran QRIS organisasi berhasil disimpan.',
      })
      await loadConfig()
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Terjadi kesalahan saat menyimpan konfigurasi.',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Memuat konfigurasi QRIS & pembayaran...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl space-y-6">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link
              href="/dashboard/settings"
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Pengaturan Sistem
            </Link>
            <span>/</span>
            <span className="text-foreground">Pembayaran QRIS & Bank</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Metode Pembayaran QRIS & Bank</h1>
              <p className="text-sm text-muted-foreground">
                Penerimaan dana kas organisasi, pendaftaran kegiatan, dan transfer rekening resmi.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Status */}
      {statusMessage && (
        <Alert variant={statusMessage.type === 'error' ? 'destructive' : 'default'} className="border">
          {statusMessage.type === 'error' ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          )}
          <AlertTitle>
            {statusMessage.type === 'error' ? 'Pemberitahuan Galat' : 'Penyimpanan Berhasil'}
          </AlertTitle>
          <AlertDescription>{statusMessage.text}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Pemilihan Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Mode Pembayaran QRIS</CardTitle>
            <CardDescription>
              Pilih alur pembayaran yang paling sesuai dengan kebutuhan bendahara dan kas organisasi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mode Mandiri */}
              <div
                onClick={() => setConfig({ ...config, mode: 'MANDIRI' })}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  config.mode === 'MANDIRI'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:bg-muted/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                        <Building2 className="h-4 w-4" />
                      </div>
                      QRIS Mandiri & Rekening Bank
                    </div>
                    {config.mode === 'MANDIRI' && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Dana langsung masuk ke rekening bank / e-wallet organisasi tanpa perantara pihak ketiga. 100% bebas biaya transaksi gateway.
                  </p>
                </div>
              </div>

              {/* Mode Gateway */}
              <div
                onClick={() => setConfig({ ...config, mode: 'GATEWAY' })}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  config.mode === 'GATEWAY'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:bg-muted/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                        <Zap className="h-4 w-4" />
                      </div>
                      Payment Gateway Otomatis
                    </div>
                    {config.mode === 'GATEWAY' && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Verifikasi tagihan detik itu juga via Webhook (Midtrans / Tripay / Xendit). Kas otomatis lunas instan tanpa perlu rekap manual.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Mode Mandiri */}
        {config.mode === 'MANDIRI' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Identitas Rekening & QRIS Organisasi</CardTitle>
                  <CardDescription>
                    Informasi ini akan ditampilkan kepada anggota saat melakukan pembayaran kas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="merchantName">Nama Organisasi / Merchant QRIS</Label>
                      <Input
                        id="merchantName"
                        value={config.mandiri.merchantName}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            mandiri: { ...config.mandiri, merchantName: e.target.value },
                          })
                        }
                        placeholder="Contoh: BENDAHARA UMUM ORGANISASI"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="bankName">Nama Bank / E-Wallet Penampung</Label>
                      <Input
                        id="bankName"
                        value={config.mandiri.bankName}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            mandiri: { ...config.mandiri, bankName: e.target.value },
                          })
                        }
                        placeholder="Contoh: Bank Syariah Indonesia (BSI)"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="accountNumber">Nomor Rekening Bank</Label>
                      <Input
                        id="accountNumber"
                        value={config.mandiri.accountNumber}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            mandiri: { ...config.mandiri, accountNumber: e.target.value },
                          })
                        }
                        placeholder="Contoh: 7182930412"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="accountHolder">Atas Nama Rekening (A.N)</Label>
                      <Input
                        id="accountHolder"
                        value={config.mandiri.accountHolder}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            mandiri: { ...config.mandiri, accountHolder: e.target.value },
                          })
                        }
                        placeholder="Contoh: KAS BESAR PENGURUS"
                        required
                      />
                    </div>
                  </div>

                  {/* Unggah Stiker QRIS */}
                  <div className="space-y-2 pt-2">
                    <Label>Gambar Stiker QRIS Bank Resmi</Label>
                    <div className="flex items-center gap-4">
                      {config.mandiri.qrisImageUrl ? (
                        <div className="relative border rounded-lg p-1 bg-white">
                          <img
                            src={config.mandiri.qrisImageUrl}
                            alt="Stiker QRIS"
                            className="h-20 w-20 object-contain rounded"
                          />
                        </div>
                      ) : (
                        <div className="h-20 w-20 rounded-lg border border-dashed flex items-center justify-center text-xs text-muted-foreground bg-muted">
                          Belum Ada
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="cursor-pointer">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-md text-xs hover:bg-muted font-medium bg-background shadow-sm">
                            {uploadingImage ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                            Unggah Gambar Stiker QRIS
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleUploadQrisImage}
                            disabled={uploadingImage}
                          />
                        </label>
                        <p className="text-[11px] text-muted-foreground">
                          Format PNG, JPG, atau WebP. Disarankan gambar QRIS beresolusi tajam.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* String EMVCo QRIS Statis */}
                  <div className="space-y-1.5 pt-2">
                    <Label htmlFor="staticQrisString">
                      String Payload EMVCo QRIS{' '}
                      <span className="text-xs text-muted-foreground font-normal">(Opsional)</span>
                    </Label>
                    <Input
                      id="staticQrisString"
                      value={config.mandiri.staticQrisString}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          mandiri: { ...config.mandiri, staticQrisString: e.target.value },
                        })
                      }
                      placeholder="00020101021126670016ID.CO.BSI.WWW..."
                    />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Jika diisi payload string QRIS resmi bank, sistem otomatis menginjeksi nominal tagihan ke QRIS sehingga saat anggota memindai, nominal langsung terkunci otomatis.
                    </p>
                  </div>

                  {/* 3 Digit Kode Unik */}
                  <div className="flex items-center space-x-2 pt-2">
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

                  {/* Petunjuk Pembayaran */}
                  <div className="space-y-1.5 pt-2">
                    <Label htmlFor="instructions">Petunjuk Pembayaran untuk Anggota</Label>
                    <Textarea
                      id="instructions"
                      rows={3}
                      value={config.mandiri.instructions}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          mandiri: { ...config.mandiri, instructions: e.target.value },
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sisi Kanan: Live Preview Pembayaran */}
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pratinjau Tampilan Anggota
              </div>

              <div className="p-4 rounded-2xl border bg-card shadow-sm space-y-4">
                <div className="text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    QRIS Resmi Organisasi
                  </span>
                  <h4 className="font-bold text-sm text-foreground pt-1">
                    {config.mandiri.merchantName || 'NAMA MERCHANT'}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {config.mandiri.bankName || 'Bank Penampung'}
                  </p>
                </div>

                <div className="flex justify-center p-3 bg-white rounded-xl border">
                  {config.mandiri.qrisImageUrl ? (
                    <img
                      src={config.mandiri.qrisImageUrl}
                      alt="Pratinjau QRIS"
                      className="w-44 h-44 object-contain"
                    />
                  ) : (
                    <div className="w-44 h-44 border border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground p-3 text-center">
                      <QrCode className="h-10 w-10 text-muted-foreground/40 mb-1" />
                      <span className="text-xs">Stiker QRIS Belum Diunggah</span>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-muted/40 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">No. Rekening:</span>
                    <div className="flex items-center gap-1 font-mono font-semibold">
                      <span>{config.mandiri.accountNumber || '-'}</span>
                      <button
                        type="button"
                        onClick={handleCopyAccount}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                        title="Salin No Rekening"
                      >
                        {copiedAccount ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Atas Nama:</span>
                    <span className="font-medium text-foreground">{config.mandiri.accountHolder || '-'}</span>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed italic border-t pt-2">
                  &quot;{config.mandiri.instructions}&quot;
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form Mode Gateway */}
        {config.mode === 'GATEWAY' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Konfigurasi Payment Gateway Otomatis</CardTitle>
              <CardDescription>
                Integrasi API untuk menerbitkan QRIS dinamis dan verifikasi pembayaran otomatis via webhook.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
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
                      <SelectItem value="simulation">Simulator HubbHQ (Uji Coba / Testing)</SelectItem>
                      <SelectItem value="tripay">Tripay Payment Gateway</SelectItem>
                      <SelectItem value="midtrans">Midtrans Core API / Snap QRIS</SelectItem>
                      <SelectItem value="xendit">Xendit QRIS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="apiKey">API Key / Server Key</Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showApiKey ? 'text' : 'password'}
                      value={config.gateway.apiKey}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          gateway: { ...config.gateway, apiKey: e.target.value },
                        })
                      }
                      placeholder="SB-Mid-server-... / DEV-..."
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {config.gateway.provider === 'tripay' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="merchantCode">Tripay Merchant Code</Label>
                    <Input
                      id="merchantCode"
                      value={config.gateway.merchantCode}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          gateway: { ...config.gateway, merchantCode: e.target.value },
                        })
                      }
                      placeholder="Contoh: T12345"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="clientKey">Client Key / Public Key (Opsional)</Label>
                  <Input
                    id="clientKey"
                    value={config.gateway.clientKey}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        gateway: { ...config.gateway, clientKey: e.target.value },
                      })
                    }
                    placeholder="Public key..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="webhookSecret">Webhook Secret Key</Label>
                  <div className="relative">
                    <Input
                      id="webhookSecret"
                      type={showWebhookSecret ? 'text' : 'password'}
                      value={config.gateway.webhookSecret}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          gateway: { ...config.gateway, webhookSecret: e.target.value },
                        })
                      }
                      placeholder="Secret key untuk memvalidasi callback webhook"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Mode Sandbox vs Production */}
              <div className="flex items-center space-x-2 pt-2">
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
                  Gunakan Mode Produksi (Live). Jangan dicentang jika masih menggunakan API Sandbox/Development.
                </label>
              </div>

              {/* Callback Webhook URL Box */}
              <div className="p-3.5 bg-muted/30 border rounded-xl space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Zap className="h-4 w-4 text-emerald-600" />
                    URL Callback Webhook Sistem
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyWebhook}
                    className="h-7 text-xs gap-1"
                  >
                    {copiedWebhook ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Salin URL
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-background border px-3 py-1.5 rounded-lg text-xs font-mono text-muted-foreground select-all break-all">
                  {webhookUrl}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Tempel URL ini pada pengaturan webhook di dashboard penyedia gateway (Midtrans / Tripay / Xendit) agar notifikasi pembayaran lunas diterima secara instan.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Kotak Pengaman */}
        <div className="p-4 rounded-xl border bg-muted/30 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <span className="font-semibold text-foreground">Proteksi Akses & Kunci Rahasia</span>
            <p className="text-muted-foreground leading-relaxed">
              Pengaturan QRIS hanya dapat dikelola oleh Administrator, Super Admin, dan Bendahara. Kunci rahasia API key terlindungi oleh mekanisme penahanan (Secret Preservation) sehingga tidak akan tertimpa secara tidak sengaja saat memperbarui rekening.
            </p>
          </div>
        </div>

        {/* Tombol Simpan */}
        <div className="flex items-center justify-end pt-2">
          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Simpan Konfigurasi QRIS
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

