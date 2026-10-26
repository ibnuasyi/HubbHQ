'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Server,
  HardDrive,
  Cloud,
  FolderArchive,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
  Save,
  RefreshCw,
  Folder,
  Lock,
  Globe,
  Radio,
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
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { StorageSettings, DEFAULT_STORAGE_SETTINGS, StorageProviderType } from '@/lib/storage'

export default function StorageSettingsPage() {
  const [config, setConfig] = useState<StorageSettings>(DEFAULT_STORAGE_SETTINGS)
  const [configuredSecrets, setConfiguredSecrets] = useState({
    s3: false,
    r2: false,
    webdav: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [showS3Secret, setShowS3Secret] = useState(false)
  const [showR2Secret, setShowR2Secret] = useState(false)
  const [showWebdavPassword, setShowWebdavPassword] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    setStatusMessage(null)
    try {
      const res = await fetch('/api/settings/storage')
      const json = await res.json()
      if (json.data) {
        setConfig(json.data)
      }
      if (json.configuredSecrets) {
        setConfiguredSecrets(json.configuredSecrets)
      }
    } catch (err: any) {
      console.error('Gagal mengambil pengaturan penyimpanan:', err)
      setStatusMessage({
        type: 'error',
        text: 'Gagal memuat pengaturan penyimpanan dari server.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    setStatusMessage(null)
    try {
      const res = await fetch('/api/settings/storage/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const json = await res.json()
      setTestResult({
        success: Boolean(json.success),
        message: json.message || (json.success ? 'Koneksi berhasil.' : 'Koneksi gagal.'),
      })
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Terjadi kesalahan saat menguji koneksi.',
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setStatusMessage(null)
    setTestResult(null)

    try {
      const res = await fetch('/api/settings/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Gagal menyimpan pengaturan.')
      }

      setStatusMessage({
        type: 'success',
        text: json.message || 'Pengaturan penyimpanan berkas berhasil disimpan dan diterapkan.',
      })
      // Muat ulang pengaturan untuk memperbarui status secret
      await loadSettings()
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Terjadi kesalahan saat menyimpan pengaturan.',
      })
    } finally {
      setSaving(false)
    }
  }

  const selectProvider = (provider: StorageProviderType) => {
    setConfig({ ...config, provider })
    setTestResult(null)
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Memuat konfigurasi penyimpanan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl space-y-6">
      {/* Header & Navigasi */}
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
            <span className="text-foreground">Penyimpanan Berkas</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Penyimpanan Berkas (Object Storage)</h1>
              <p className="text-sm text-muted-foreground">
                Konfigurasi backend penyimpanan media, lampiran dokumen, dan berkas organisasi.
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

      {/* Form Konfigurasi */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Pemilihan Provider */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Pilih Provider Penyimpanan</CardTitle>
            <CardDescription>
              Tentukan infrastruktur tempat berkas diunggah dan disimpan secara aman.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Local Storage */}
              <div
                onClick={() => selectProvider('local')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  config.provider === 'local'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:bg-muted/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                      <Server className="h-5 w-5" />
                    </div>
                    {config.provider === 'local' && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        Aktif
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm">Penyimpanan Lokal</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Menyimpan file di harddisk server (folder uploads). Tanpa biaya pihak ketiga.
                  </p>
                </div>
              </div>

              {/* Universal S3 */}
              <div
                onClick={() => selectProvider('s3')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  config.provider === 's3'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:bg-muted/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                      <Cloud className="h-5 w-5" />
                    </div>
                    {config.provider === 's3' && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        Aktif
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm">Universal S3</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    AWS S3, MinIO lokal, Wasabi, atau AList S3 Gateway. Standar industri.
                  </p>
                </div>
              </div>

              {/* Cloudflare R2 */}
              <div
                onClick={() => selectProvider('r2')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  config.provider === 'r2'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:bg-muted/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                      <HardDrive className="h-5 w-5" />
                    </div>
                    {config.provider === 'r2' && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        Aktif
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm">Cloudflare R2</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    S3-compatible tanpa biaya egress data. Kecepatan CDN global gratis.
                  </p>
                </div>
              </div>

              {/* WebDAV */}
              <div
                onClick={() => selectProvider('webdav')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  config.provider === 'webdav'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:bg-muted/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                      <FolderArchive className="h-5 w-5" />
                    </div>
                    {config.provider === 'webdav' && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        Aktif
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm">WebDAV / AList</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Nextcloud, OwnCloud, Synology, atau AList WebDAV mount drive.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Detail Sesuai Provider */}
        {config.provider === 'local' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Konfigurasi Penyimpanan Lokal</CardTitle>
              <CardDescription>
                Berkas akan disimpan langsung di direktori sistem file server.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="baseDir">Direktori Penyimpanan (Base Directory)</Label>
                <Input
                  id="baseDir"
                  value={config.local.baseDir}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      local: { ...config.local, baseDir: e.target.value },
                    })
                  }
                  placeholder="./uploads"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Lokasi path relatif terhadap root aplikasi (contoh: <code>./uploads</code>). Dilindungi dari path traversal.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 rounded-lg border bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Globe className="h-4 w-4 text-emerald-600" />
                    Folder Akses Publik
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Dapat diakses langsung oleh pengunjung website tanpa login:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {config.local.publicFolders.map((f, i) => (
                      <span key={i} className="text-[11px] bg-background border px-2 py-0.5 rounded font-mono">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Lock className="h-4 w-4 text-amber-600" />
                    Folder Akses Terlindungi
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Hanya dapat diunduh oleh pengguna yang terautentikasi:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {config.local.protectedFolders.map((f, i) => (
                      <span key={i} className="text-[11px] bg-background border px-2 py-0.5 rounded font-mono">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {config.provider === 's3' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Konfigurasi Universal S3</CardTitle>
              <CardDescription>
                Kompatibel dengan AWS S3, MinIO, Wasabi, IDCloudHost, atau AList S3 Gateway.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="s3Endpoint">Endpoint S3 (Opsional untuk AWS)</Label>
                  <Input
                    id="s3Endpoint"
                    value={config.s3.endpoint || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        s3: { ...config.s3, endpoint: e.target.value },
                      })
                    }
                    placeholder="https://s3.ap-southeast-1.amazonaws.com"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Isi jika menggunakan MinIO (contoh: <code>http://localhost:9000</code>) atau Wasabi.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="s3Region">Region S3</Label>
                  <Input
                    id="s3Region"
                    value={config.s3.region}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        s3: { ...config.s3, region: e.target.value },
                      })
                    }
                    placeholder="ap-southeast-1"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="s3Bucket">Nama Bucket S3</Label>
                  <Input
                    id="s3Bucket"
                    value={config.s3.bucket}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        s3: { ...config.s3, bucket: e.target.value },
                      })
                    }
                    placeholder="hubbhq-files"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="s3PublicUrl">Domain Publik / CDN URL (Opsional)</Label>
                  <Input
                    id="s3PublicUrl"
                    value={config.s3.publicUrl || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        s3: { ...config.s3, publicUrl: e.target.value },
                      })
                    }
                    placeholder="https://cdn.organisasi.id"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="s3AccessKeyId">Access Key ID</Label>
                  <Input
                    id="s3AccessKeyId"
                    value={config.s3.accessKeyId}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        s3: { ...config.s3, accessKeyId: e.target.value },
                      })
                    }
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="s3SecretAccessKey">
                    Secret Access Key
                    {configuredSecrets.s3 && (
                      <span className="ml-2 text-[10px] text-emerald-600 font-normal">
                        (Kunci rahasia sudah tersimpan)
                      </span>
                    )}
                  </Label>
                  <div className="relative">
                    <Input
                      id="s3SecretAccessKey"
                      type={showS3Secret ? 'text' : 'password'}
                      value={config.s3.secretAccessKey}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          s3: { ...config.s3, secretAccessKey: e.target.value },
                        })
                      }
                      placeholder={
                        configuredSecrets.s3
                          ? 'Biarkan bila tidak ingin mengubah'
                          : 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
                      }
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowS3Secret(!showS3Secret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showS3Secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="forcePathStyle"
                  checked={config.s3.forcePathStyle}
                  onCheckedChange={(checked: boolean) =>
                    setConfig({
                      ...config,
                      s3: { ...config.s3, forcePathStyle: Boolean(checked) },
                    })
                  }
                />
                <label
                  htmlFor="forcePathStyle"
                  className="text-xs font-medium leading-none cursor-pointer"
                >
                  Gunakan Path-Style Addressing (Wajib dicentang untuk MinIO dan AList S3 Gateway)
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {config.provider === 'r2' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Konfigurasi Cloudflare R2</CardTitle>
              <CardDescription>
                Penyimpanan kompatibel S3 berkinerja tinggi tanpa biaya transfer data keluar (Zero Egress).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="r2AccountId">Cloudflare Account ID</Label>
                  <Input
                    id="r2AccountId"
                    value={config.r2.accountId}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        r2: { ...config.r2, accountId: e.target.value },
                      })
                    }
                    placeholder="Contoh: 1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Dapat dilihat di dashboard Cloudflare pada menu sidebar kanan &gt; Account ID.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="r2Bucket">Nama Bucket R2</Label>
                  <Input
                    id="r2Bucket"
                    value={config.r2.bucket}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        r2: { ...config.r2, bucket: e.target.value },
                      })
                    }
                    placeholder="hubbhq-storage"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="r2AccessKeyId">R2 Access Key ID</Label>
                  <Input
                    id="r2AccessKeyId"
                    value={config.r2.accessKeyId}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        r2: { ...config.r2, accessKeyId: e.target.value },
                      })
                    }
                    placeholder="Access Key Token R2"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="r2SecretAccessKey">
                    R2 Secret Access Key
                    {configuredSecrets.r2 && (
                      <span className="ml-2 text-[10px] text-emerald-600 font-normal">
                        (Kunci rahasia sudah tersimpan)
                      </span>
                    )}
                  </Label>
                  <div className="relative">
                    <Input
                      id="r2SecretAccessKey"
                      type={showR2Secret ? 'text' : 'password'}
                      value={config.r2.secretAccessKey}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          r2: { ...config.r2, secretAccessKey: e.target.value },
                        })
                      }
                      placeholder={
                        configuredSecrets.r2
                          ? 'Biarkan bila tidak ingin mengubah'
                          : 'Secret Access Token R2'
                      }
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowR2Secret(!showR2Secret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showR2Secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="r2PublicUrl">Public Domain / Custom Domain R2 (Opsional)</Label>
                  <Input
                    id="r2PublicUrl"
                    value={config.r2.publicUrl || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        r2: { ...config.r2, publicUrl: e.target.value },
                      })
                    }
                    placeholder="https://pub-xxxxxxxxxx.r2.dev atau https://media.organisasi.id"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Jika diaktifkan di R2 Settings (Custom Domain atau R2.dev), file publik disajikan langsung melalui URL ini.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {config.provider === 'webdav' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Konfigurasi WebDAV / AList</CardTitle>
              <CardDescription>
                Integrasi ke penyimpanan berbasis protokol WebDAV (Nextcloud, OwnCloud, Synology NAS, AList).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="webdavUrl">URL Server WebDAV</Label>
                  <Input
                    id="webdavUrl"
                    value={config.webdav.url}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        webdav: { ...config.webdav, url: e.target.value },
                      })
                    }
                    placeholder="https://cloud.organisasi.id/remote.php/dav/files/admin/ atau http://localhost:5244/dav"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    URL endpoint WebDAV resmi. Sistem memblokir alamat IP metadata cloud demi keamanan.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="webdavUsername">Username WebDAV</Label>
                  <Input
                    id="webdavUsername"
                    value={config.webdav.username}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        webdav: { ...config.webdav, username: e.target.value },
                      })
                    }
                    placeholder="admin / user"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="webdavPassword">
                    Password / App Token WebDAV
                    {configuredSecrets.webdav && (
                      <span className="ml-2 text-[10px] text-emerald-600 font-normal">
                        (Kata sandi sudah tersimpan)
                      </span>
                    )}
                  </Label>
                  <div className="relative">
                    <Input
                      id="webdavPassword"
                      type={showWebdavPassword ? 'text' : 'password'}
                      value={config.webdav.password}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          webdav: { ...config.webdav, password: e.target.value },
                        })
                      }
                      placeholder={
                        configuredSecrets.webdav
                          ? 'Biarkan bila tidak ingin mengubah'
                          : 'Password akun WebDAV'
                      }
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowWebdavPassword(!showWebdavPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showWebdavPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="webdavBasePath">Base Path / Sub-folder (Opsional)</Label>
                  <Input
                    id="webdavBasePath"
                    value={config.webdav.basePath || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        webdav: { ...config.webdav, basePath: e.target.value },
                      })
                    }
                    placeholder="hubbhq"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="webdavPublicUrl">Public Direct URL (Opsional)</Label>
                  <Input
                    id="webdavPublicUrl"
                    value={config.webdav.publicUrl || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        webdav: { ...config.webdav, publicUrl: e.target.value },
                      })
                    }
                    placeholder="https://share.organisasi.id/d/hubbhq"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Kotak Pengaman Sistem */}
        <div className="p-4 rounded-xl border bg-muted/30 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <span className="font-semibold text-foreground">Sistem Keamanan Aktif & Terlindungi</span>
            <p className="text-muted-foreground leading-relaxed">
              Konfigurasi ini dilindungi oleh filter SSRF (blokir IP metadata cloud), pencegahan direktori traversal, dan proteksi penimpaan kunci rahasia (Secret Preservation). Hanya pengguna dengan peran Super Admin dan Administrator yang memiliki akses ke halaman ini.
            </p>
          </div>
        </div>

        {/* Hasil Uji Koneksi */}
        {testResult && (
          <Alert variant={testResult.success ? 'default' : 'destructive'} className="border">
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {testResult.success ? 'Hasil Uji Koneksi Berhasil' : 'Hasil Uji Koneksi Gagal'}
            </AlertTitle>
            <AlertDescription>{testResult.message}</AlertDescription>
          </Alert>
        )}

        {/* Tombol Aksi */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleTestConnection}
            disabled={testing || saving}
            className="w-full sm:w-auto"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menguji Koneksi...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Uji Koneksi Penyimpanan
              </>
            )}
          </Button>

          <Button type="submit" disabled={saving || testing} className="w-full sm:w-auto">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Simpan Konfigurasi
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

