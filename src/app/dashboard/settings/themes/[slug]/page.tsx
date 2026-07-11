'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Palette, Save, Check, Loader2 } from 'lucide-react'

interface Theme {
  id: string
  name: string
  slug: string
  version: string
  description?: string
  config: any
  css?: string
  isActive: boolean
}

interface PageProps {
  params: { slug: string }
}

export default function ThemeDetailPage({ params }: PageProps) {
  const slug = params.slug
  const [theme, setTheme] = useState<Theme | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<any>(null)
  const [css, setCss] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    async function fetchTheme() {
      try {
        const res = await fetch(`/api/themes/${slug}`)
        if (res.ok) {
          const data = await res.json()
          setTheme(data)
          setConfig(data.config)
          setCss(data.css || '')
        }
      } catch (error) {
        console.error('Error fetching theme:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTheme()
  }, [slug])

  const saveTheme = async () => {
    if (!theme) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/themes/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, css })
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Tema berhasil disimpan!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: 'Gagal menyimpan tema' })
      }
    } catch (error) {
      console.error('Error saving theme:', error)
      setMessage({ type: 'error', text: 'Terjadi kesalahan' })
    } finally {
      setSaving(false)
    }
  }

  const updateConfigColor = (key: string, value: string) => {
    setConfig((prev: any) => ({
      ...prev,
      config: {
        ...prev?.config,
        [key]: value
      }
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!theme) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">Tema tidak ditemukan</h1>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/dashboard/settings/themes" className="hover:text-primary">Tema</Link>
            <span>/</span>
            <span>{theme.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{theme.name}</h1>
          <p className="text-muted-foreground">v{theme.version} - {theme.description}</p>
        </div>
        <div className="flex gap-2">
          {theme.isActive && (
            <span className="px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium flex items-center gap-1">
              <Check className="h-4 w-4" />
              Aktif
            </span>
          )}
          <button
            onClick={saveTheme}
            disabled={saving}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Simpan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'}`}>
          {message.text}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Config */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Informasi Dasar</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Nama</label>
                <input
                  type="text"
                  value={theme.name}
                  readOnly
                  className="w-full px-3 py-2 border rounded-lg bg-muted cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Versi</label>
                <input
                  type="text"
                  value={theme.version}
                  readOnly
                  className="w-full px-3 py-2 border rounded-lg bg-muted cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Pengaturan Warna
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Warna Utama</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config?.config?.primaryColor || '#16a34a'}
                    onChange={(e) => updateConfigColor('primaryColor', e.target.value)}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config?.config?.primaryColor || '#16a34a'}
                    onChange={(e) => updateConfigColor('primaryColor', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Warna Sekunder</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config?.config?.secondaryColor || '#15803d'}
                    onChange={(e) => updateConfigColor('secondaryColor', e.target.value)}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config?.config?.secondaryColor || '#15803d'}
                    onChange={(e) => updateConfigColor('secondaryColor', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Warna Accent</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config?.config?.accentColor || '#f59e0b'}
                    onChange={(e) => updateConfigColor('accentColor', e.target.value)}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config?.config?.accentColor || '#f59e0b'}
                    onChange={(e) => updateConfigColor('accentColor', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Warna Background</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config?.config?.backgroundColor || '#ffffff'}
                    onChange={(e) => updateConfigColor('backgroundColor', e.target.value)}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config?.config?.backgroundColor || '#ffffff'}
                    onChange={(e) => updateConfigColor('backgroundColor', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Warna Text</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config?.config?.textColor || '#1e293b'}
                    onChange={(e) => updateConfigColor('textColor', e.target.value)}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config?.config?.textColor || '#1e293b'}
                    onChange={(e) => updateConfigColor('textColor', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Font Family</label>
                <input
                  type="text"
                  value={config?.config?.fontFamily || 'Plus Jakarta Sans'}
                  onChange={(e) => updateConfigColor('fontFamily', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                />
              </div>
            </div>
          </div>

          {/* Custom CSS */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Custom CSS</h2>
            <textarea
              value={css}
              onChange={(e) => setCss(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 border rounded-lg font-mono text-sm bg-background resize-none"
              placeholder="/* Custom CSS overrides */"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Preview */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Preview</h2>
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
              {config?.thumbnail ? (
                <img src={config.thumbnail} alt="Preview" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div className="text-center p-4">
                  <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Preview Tema</p>
                </div>
              )}
            </div>
          </div>

          {/* Sections */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Section yang Tersedia</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(config?.availableSections || []).map((section: any, index: number) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                    <span className="text-sm">📦</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{section.name}</p>
                    <p className="text-xs text-muted-foreground">{section.key}</p>
                  </div>
                </div>
              ))}
              {(!config?.availableSections || config.availableSections.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Tidak ada section</p>
              )}
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Info Tema</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slug:</span>
                <span className="font-mono bg-muted px-2 py-0.5 rounded">{theme.slug}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Author:</span>
                <span>{config?.author || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className={theme.isActive ? 'text-green-600' : 'text-muted-foreground'}>
                  {theme.isActive ? '✓ Aktif' : 'Nonaktif'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
