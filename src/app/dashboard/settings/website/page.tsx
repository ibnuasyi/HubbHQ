'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Globe,
  Palette,
  Sun,
  Moon,
  Monitor,
  Upload,
  Save,
  Loader2,
  Trash2,
  Info,
  Mail,
  Phone,
  MapPin,
  Link as LinkIcon,
  Image,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useWebsiteConfig } from '@/hooks/use-website-config'

interface ConfigValue {
  [key: string]: any
}

// Color presets
const COLOR_PRESETS = [
  // Preset dari website KPRI - tema organisasi
  { name: 'KPRI Green', primary: '#16a34a', light: '#22c55e', dark: '#15803d', description: 'Tema KPRI - Hijau Organisai' },
  { name: 'Navy Pro', primary: '#1e40af', light: '#3b82f6', dark: '#1e3a8a', description: 'Biru profesional' },
  { name: 'Crimson', primary: '#dc2626', light: '#ef4444', dark: '#b91c1c', description: 'Merah-bold' },
  { name: 'Amber Warm', primary: '#d97706', light: '#f59e0b', dark: '#b45309', description: 'Kuning hangat' },
  // Preset default
  { name: 'Indigo', primary: '#6366f1', light: '#818cf8', dark: '#4f46e5', description: 'Indigo default' },
  { name: 'Purple', primary: '#8b5cf6', light: '#a78bfa', dark: '#7c3aed', description: 'Ungu' },
  { name: 'Rose', primary: '#f43f5e', light: '#fb7185', dark: '#e11d48', description: 'Mawar' },
  { name: 'Teal', primary: '#14b8a6', light: '#2dd4bf', dark: '#0d9488', description: 'Teal' },
]

// Default config values
const DEFAULT_CONFIG: ConfigValue = {
  // General
  appName: 'HubbHQ',
  appDescription: 'Sistem Informasi Organisasi Modern',
  logoUrl: '',
  faviconUrl: '',

  // Appearance
  primaryColor: '#6366f1',
  defaultTheme: 'system', // light, dark, system
  sidebarCollapsed: false,

  // Contact
  contactEmail: '',
  contactPhone: '',
  contactAddress: '',

  // Social
  websiteUrl: '',
  instagramUrl: '',
  facebookUrl: '',
  twitterUrl: '',
  youtubeUrl: '',
}

export default function WebsiteSettingsPage() {
  const router = useRouter()
  const { refreshConfig } = useWebsiteConfig() // Get refresh function from hook
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [config, setConfig] = React.useState<ConfigValue>(DEFAULT_CONFIG)
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null)
  const [faviconPreview, setFaviconPreview] = React.useState<string | null>(null)

  // Fetch config
  React.useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/website-config')
        if (res.ok) {
          const data = await res.json()
          if (data.data) {
            setConfig({ ...DEFAULT_CONFIG, ...data.data })
            if (data.data.logoUrl) {
              setLogoPreview(data.data.logoUrl)
            }
            if (data.data.faviconUrl) {
              setFaviconPreview(data.data.faviconUrl)
            }
          }
        }
      } catch (err) {
        console.error('Error fetching config:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchConfig()
  }, [])

  const updateConfig = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        updateConfig('logoUrl', data.url)
      }
    } catch (err) {
      console.error('Error uploading logo:', err)
    }
  }

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type (only accept .ico, .png, .svg, .jpg)
    const validTypes = ['image/x-icon', 'image/png', 'image/svg+xml', 'image/jpeg']
    if (!validTypes.includes(file.type) && !file.name.match(/\.(ico|png|svg|jpg|jpeg)$/i)) {
      setError('Format favicon tidak valid. Gunakan .ico, .png, .svg, atau .jpg')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setFaviconPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        updateConfig('faviconUrl', data.url)
      }
    } catch (err) {
      console.error('Error uploading favicon:', err)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Convert config to array format for API
      const configs = Object.entries(config).map(([key, value]) => ({
        key,
        value,
      }))

      const res = await fetch('/api/website-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs }),
      })

      if (res.ok) {
        setSuccess('Pengaturan berhasil disimpan!')
        // Refresh the shared config so sidebar updates
        await refreshConfig()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Gagal menyimpan pengaturan')
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  const handlePresetClick = (preset: typeof COLOR_PRESETS[0]) => {
    updateConfig('primaryColor', preset.primary)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pengaturan Website</h1>
          <p className="text-muted-foreground">
            Kelola konfigurasi dan tampilan website
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Simpan Perubahan
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 border-green-500 bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-100">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="general" className="gap-1">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Umum</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Tampilan</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="gap-1">
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">Kontak</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-1">
            <LinkIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Sosial</span>
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Umum</CardTitle>
                <CardDescription>
                  Pengaturan dasar website organisasi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="appName">Nama Aplikasi</Label>
                  <Input
                    id="appName"
                    value={config.appName || ''}
                    onChange={(e) => updateConfig('appName', e.target.value)}
                    placeholder="Nama aplikasi"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appDescription">Deskripsi</Label>
                  <Textarea
                    id="appDescription"
                    value={config.appDescription || ''}
                    onChange={(e) => updateConfig('appDescription', e.target.value)}
                    placeholder="Deskripsi singkat organisasi"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg border bg-muted">
                        {logoPreview ? (
                          <img
                            src={logoPreview}
                            alt="Logo"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Image className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <label
                        htmlFor="logo-upload"
                        className="absolute -bottom-2 -right-2 h-8 w-8 cursor-pointer rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90"
                      >
                        <Upload className="h-4 w-4" />
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                        />
                      </label>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Unggah logo organisasi</p>
                      <p>Format: PNG, JPG (maks 2MB)</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Favicon</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-muted">
                        {faviconPreview ? (
                          <img
                            src={faviconPreview}
                            alt="Favicon"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Globe className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <label
                        htmlFor="favicon-upload"
                        className="absolute -bottom-2 -right-2 h-8 w-8 cursor-pointer rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90"
                      >
                        <Upload className="h-4 w-4" />
                        <input
                          id="favicon-upload"
                          type="file"
                          accept=".ico,.png,.svg,.jpg,.jpeg"
                          className="hidden"
                          onChange={handleFaviconUpload}
                        />
                      </label>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Unggah favicon website</p>
                      <p>Format: ICO, PNG, SVG (maks 1MB)</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tema</CardTitle>
                <CardDescription>
                  Pengaturan tema dan warna website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Tema Default</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      type="button"
                      variant={config.defaultTheme === 'light' ? 'default' : 'outline'}
                      className="h-20 flex-col gap-2"
                      onClick={() => updateConfig('defaultTheme', 'light')}
                    >
                      <Sun className="h-5 w-5" />
                      <span className="text-xs">Light</span>
                    </Button>
                    <Button
                      type="button"
                      variant={config.defaultTheme === 'dark' ? 'default' : 'outline'}
                      className="h-20 flex-col gap-2"
                      onClick={() => updateConfig('defaultTheme', 'dark')}
                    >
                      <Moon className="h-5 w-5" />
                      <span className="text-xs">Dark</span>
                    </Button>
                    <Button
                      type="button"
                      variant={config.defaultTheme === 'system' ? 'default' : 'outline'}
                      className="h-20 flex-col gap-2"
                      onClick={() => updateConfig('defaultTheme', 'system')}
                    >
                      <Monitor className="h-5 w-5" />
                      <span className="text-xs">System</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Warna Utama</Label>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg border"
                      style={{ backgroundColor: config.primaryColor }}
                    />
                    <Input
                      id="primaryColor"
                      type="color"
                      value={config.primaryColor || '#6366f1'}
                      onChange={(e) => updateConfig('primaryColor', e.target.value)}
                      className="w-24 h-10 cursor-pointer"
                    />
                    <Input
                      value={config.primaryColor || '#6366f1'}
                      onChange={(e) => updateConfig('primaryColor', e.target.value)}
                      placeholder="#6366f1"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Preset Warna</Label>
                  <div className="grid grid-cols-4 gap-3">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        className={`flex items-center gap-2 rounded-lg border p-2 transition-all ${
                          config.primaryColor === preset.primary
                            ? 'border-2 ring-2 ring-primary'
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => handlePresetClick(preset)}
                      >
                        <div
                          className="h-6 w-6 rounded-full"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <span className="text-xs">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Kontak</CardTitle>
                <CardDescription>
                  Kontak resmi organisasi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={config.contactEmail || ''}
                    onChange={(e) => updateConfig('contactEmail', e.target.value)}
                    placeholder="email@organisasi.org"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telepon
                  </Label>
                  <Input
                    id="contactPhone"
                    value={config.contactPhone || ''}
                    onChange={(e) => updateConfig('contactPhone', e.target.value)}
                    placeholder="+62 xxx xxxx xxxx"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactAddress" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Alamat
                  </Label>
                  <Textarea
                    id="contactAddress"
                    value={config.contactAddress || ''}
                    onChange={(e) => updateConfig('contactAddress', e.target.value)}
                    placeholder="Alamat lengkap organisasi"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tautan Sosial Media</CardTitle>
                <CardDescription>
                  Link media sosial organisasi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website</Label>
                  <Input
                    id="websiteUrl"
                    value={config.websiteUrl || ''}
                    onChange={(e) => updateConfig('websiteUrl', e.target.value)}
                    placeholder="https://organisasi.org"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagramUrl">Instagram</Label>
                  <Input
                    id="instagramUrl"
                    value={config.instagramUrl || ''}
                    onChange={(e) => updateConfig('instagramUrl', e.target.value)}
                    placeholder="https://instagram.com/organisasi"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebookUrl">Facebook</Label>
                  <Input
                    id="facebookUrl"
                    value={config.facebookUrl || ''}
                    onChange={(e) => updateConfig('facebookUrl', e.target.value)}
                    placeholder="https://facebook.com/organisasi"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitterUrl">Twitter/X</Label>
                  <Input
                    id="twitterUrl"
                    value={config.twitterUrl || ''}
                    onChange={(e) => updateConfig('twitterUrl', e.target.value)}
                    placeholder="https://twitter.com/organisasi"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtubeUrl">YouTube</Label>
                  <Input
                    id="youtubeUrl"
                    value={config.youtubeUrl || ''}
                    onChange={(e) => updateConfig('youtubeUrl', e.target.value)}
                    placeholder="https://youtube.com/@organisasi"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
