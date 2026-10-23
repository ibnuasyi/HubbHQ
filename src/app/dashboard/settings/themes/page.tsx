'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, Palette, Loader2, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Theme {
  id: string
  name: string
  slug: string
  version: string
  description?: string
  thumbnail?: string
  isActive: boolean
  author?: string
}

export default function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState<string | null>(null)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    fetchThemes()
  }, [])

  const fetchThemes = async () => {
    try {
      const res = await fetch('/api/themes')
      if (res.ok) {
        const data = await res.json()
        setThemes(data)
      }
    } catch (error) {
      console.error('Error fetching themes:', error)
    } finally {
      setLoading(false)
    }
  }

  const activateTheme = async (slug: string) => {
    setActivating(slug)
    try {
      const res = await fetch(`/api/themes/${slug}/activate`, { method: 'POST' })
      if (res.ok) {
        await fetchThemes()
      }
    } catch (error) {
      console.error('Error activating theme:', error)
    } finally {
      setActivating(null)
    }
  }

  const installDefaultTheme = async () => {
    setInstalling(true)
    try {
      const res = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Modern Minimalis',
          slug: 'modern-minimalis',
          version: '1.0.0',
          description: 'Tema modern minimalis dengan desain clean dan responsif',
          author: 'Ibnu Batuthah',
          config: {
            primaryColor: '#6366f1',
            secondaryColor: '#8b5cf6',
            accentColor: '#ec4899',
            defaultSections: ['hero', 'about', 'visimisi', 'programs', 'team', 'contact', 'footer'],
            availableSections: [
              { name: 'Hero', slug: 'hero', icon: 'image' },
              { name: 'About', slug: 'about', icon: 'filetext' },
              { name: 'Visi Misi', slug: 'visimisi', icon: 'target' },
              { name: 'Programs', slug: 'programs', icon: 'clipboard' },
              { name: 'Team', slug: 'team', icon: 'users' },
              { name: 'Gallery', slug: 'gallery', icon: 'image' },
              { name: 'Contact', slug: 'contact', icon: 'mail' },
              { name: 'Footer', slug: 'footer', icon: 'filetext' },
            ],
          }
        })
      })
      if (res.ok) {
        await fetchThemes()
      }
    } catch (error) {
      console.error('Error installing theme:', error)
    } finally {
      setInstalling(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tema Website</h1>
          <p className="text-muted-foreground">
            Pilih dan kelola tema untuk website organisasi Anda
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Palette className="w-4 h-4 mr-1" />
          {themes.length} Tema
        </Badge>
      </div>

      {/* Active Theme Banner */}
      {themes.find(t => t.isActive) && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Check className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Tema Aktif</p>
              <p className="text-sm text-muted-foreground">
                {themes.find(t => t.isActive)?.name} v{themes.find(t => t.isActive)?.version}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/settings/themes/${themes.find(t => t.isActive)?.slug}`}>
              Konfigurasi Tema
            </Link>
          </Button>
        </div>
      )}

      {/* Themes Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : themes.length === 0 ? (
        <div className="text-center py-16 bg-muted/50 rounded-xl border-2 border-dashed">
          <div className="w-16 h-16 bg-muted-foreground/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Palette className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Belum ada tema</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Instal tema default untuk mulai membangun website organisasi Anda
          </p>
          <Button onClick={installDefaultTheme} disabled={installing}>
            {installing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menginstal...
              </>
            ) : (
              <>
                <Palette className="w-4 h-4 mr-2" />
                Instal Tema Default
              </>
            )}
          </Button>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {themes.map(theme => (
              <div
                key={theme.id}
                className={`bg-card rounded-xl border-2 overflow-hidden transition-all ${
                  theme.isActive
                    ? 'border-primary shadow-lg ring-4 ring-primary/20'
                    : 'border-border hover:border-primary/50 hover:shadow-md'
                }`}
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative">
                  {theme.thumbnail ? (
                    <img src={theme.thumbnail} alt={theme.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center flex flex-col items-center">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                        <Palette className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">{theme.name}</p>
                    </div>
                  )}

                  {/* Active Badge */}
                  {theme.isActive && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-primary text-primary-foreground gap-1">
                        <Crown className="w-3 h-3" />
                        Aktif
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-lg">{theme.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      v{theme.version} oleh {theme.author || 'Unknown'}
                    </p>
                  </div>

                  {theme.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {theme.description}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/dashboard/settings/themes/${theme.slug}`}>
                        Konfigurasi
                      </Link>
                    </Button>

                    {!theme.isActive ? (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => activateTheme(theme.slug)}
                        disabled={activating === theme.slug}
                      >
                        {activating === theme.slug ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Mengaktifkan...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Aktifkan
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" className="flex-1" disabled>
                        <Check className="w-4 h-4 mr-1" />
                        Aktif
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add More Theme Hint */}
          <div className="text-center py-4 border-t">
            <p className="text-sm text-muted-foreground">
              Ingin tema lain? Hubungi developer untuk tema premium.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
