'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Building2, User, Palette, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Color presets for organization branding
const COLOR_PRESETS = [
  { name: 'Hijau Zamrud', color: '#16a34a' },
  { name: 'Biru Navy', color: '#1e40af' },
  { name: 'Merah Maroon', color: '#dc2626' },
  { name: 'Ungu Purple', color: '#7c3aed' },
  { name: 'Biru Cyan', color: '#0891b2' },
  { name: 'Orange', color: '#ea580c' },
]

export default function SetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationDescription: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    primaryColor: '#16a34a',
    logoUrl: '',
  })

  // Check if setup is needed
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await fetch('/api/setup')
        const data = await res.json()

        if (!data.needsSetup) {
          // Setup already completed, redirect to login
          router.push('/login')
        } else {
          setLoading(false)
        }
      } catch (err) {
        console.error('Error checking setup status:', err)
        setError('Tidak dapat terhubung ke database. Pastikan database sudah berjalan.')
        setLoading(false)
      }
    }

    checkSetup()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords match
    if (formData.adminPassword !== formData.confirmPassword) {
      setError('Password tidak cocok')
      return
    }

    // Validate password length
    if (formData.adminPassword.length < 8) {
      setError('Password minimal 8 karakter')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: formData.organizationName,
          organizationDescription: formData.organizationDescription,
          adminName: formData.adminName,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword,
          primaryColor: formData.primaryColor,
          logoUrl: formData.logoUrl,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Setup gagal')
        return
      }

      setSuccess(true)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)

    } catch (err) {
      console.error('Setup error:', err)
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Setup Berhasil!</h2>
            <p className="text-muted-foreground mb-6">
              Akun admin telah dibuat. Mengalihkan ke halaman login...
            </p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary flex items-center justify-center">
            <Building2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
            Selamat Datang di HubbHQ
          </h1>
          <p className="mt-2 text-muted-foreground">
            Setup awal untuk memulai organisasi Anda
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Organization Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Informasi Organisasi
                </CardTitle>
                <CardDescription>
                  Masukkan informasi dasar organisasi Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="orgName">Nama Organisasi *</Label>
                  <Input
                    id="orgName"
                    placeholder="Contoh: HubbHQ Organisasi"
                    value={formData.organizationName}
                    onChange={(e) => updateField('organizationName', e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="orgDesc">Deskripsi Singkat</Label>
                  <textarea
                    id="orgDesc"
                    placeholder="Deskripsi singkat tentang organisasi Anda"
                    value={formData.organizationDescription}
                    onChange={(e) => updateField('organizationDescription', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border rounded-lg bg-background text-sm min-h-[80px] resize-none"
                  />
                </div>
                <div>
                  <Label htmlFor="logoUrl">URL Logo (opsional)</Label>
                  <Input
                    id="logoUrl"
                    placeholder="https://example.com/logo.png"
                    value={formData.logoUrl}
                    onChange={(e) => updateField('logoUrl', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Anda bisa mengupload logo nanti di pengaturan
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Admin Account */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Akun Administrator
                </CardTitle>
                <CardDescription>
                  Akun ini akan memiliki akses penuh ke sistem
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="adminName">Nama Lengkap Admin *</Label>
                  <Input
                    id="adminName"
                    placeholder="Nama administrator"
                    value={formData.adminName}
                    onChange={(e) => updateField('adminName', e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="adminEmail">Email Admin *</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="admin@organisasi.org"
                    value={formData.adminEmail}
                    onChange={(e) => updateField('adminEmail', e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="adminPassword">Password *</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      placeholder="Min. 8 karakter"
                      value={formData.adminPassword}
                      onChange={(e) => updateField('adminPassword', e.target.value)}
                      required
                      minLength={8}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Konfirmasi Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Ulangi password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Branding Color */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Warna Branding
                </CardTitle>
                <CardDescription>
                  Pilih warna utama untuk tampilan organisasi Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.color}
                      type="button"
                      onClick={() => updateField('primaryColor', preset.color)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.primaryColor === preset.color
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                      }`}
                    >
                      <div
                        className="w-full h-10 rounded-md mb-2"
                        style={{ backgroundColor: preset.color }}
                      />
                      <span className="text-xs text-center block">{preset.name}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <Label htmlFor="customColor">Warna Custom:</Label>
                  <input
                    type="color"
                    id="customColor"
                    value={formData.primaryColor}
                    onChange={(e) => updateField('primaryColor', e.target.value)}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => updateField('primaryColor', e.target.value)}
                    className="w-32 font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitting || !formData.organizationName || !formData.adminName || !formData.adminEmail || !formData.adminPassword}
              className="w-full h-12 text-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Mulai Setup
                </>
              )}
            </Button>

            {/* Info */}
            <p className="text-center text-sm text-muted-foreground">
              Setup ini akan membuat database, role, permission, dan akun admin pertama Anda.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
