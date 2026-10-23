'use client'

import { useState, useEffect, use } from 'react'
import dynamic from 'next/dynamic'
import { FileQuestion } from 'lucide-react'

// Pre-load section components
const sectionComponents: Record<string, any> = {
  hero: dynamic(() => import('@/themes/default/sections/Hero'), { ssr: false }),
  about: dynamic(() => import('@/themes/default/sections/About'), { ssr: false }),
  visimisi: dynamic(() => import('@/themes/default/sections/VisiMisi'), { ssr: false }),
  programs: dynamic(() => import('@/themes/default/sections/Programs'), { ssr: false }),
  team: dynamic(() => import('@/themes/default/sections/Team'), { ssr: false }),
  events: dynamic(() => import('@/themes/default/sections/Events'), { ssr: false }),
  contact: dynamic(() => import('@/themes/default/sections/Contact'), { ssr: false }),
  stats: dynamic(() => import('@/themes/default/sections/Stats'), { ssr: false }),
  gallery: dynamic(() => import('@/themes/default/sections/Gallery'), { ssr: false }),
  faq: dynamic(() => import('@/themes/default/sections/Faq'), { ssr: false }),
  cta: dynamic(() => import('@/themes/default/sections/Cta'), { ssr: false }),
  partners: dynamic(() => import('@/themes/default/sections/Partners'), { ssr: false }),
  documents: dynamic(() => import('@/themes/default/sections/Documents'), { ssr: false }),
  newsletter: dynamic(() => import('@/themes/default/sections/Newsletter'), { ssr: false })
}

interface PageRendererProps {
  slug: string
  isPreview?: boolean
}

export default function PageRenderer({ slug, isPreview = false }: PageRendererProps) {
  const [page, setPage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPage() {
      try {
        const res = await fetch(`/api/pages/${slug}`)
        if (!res.ok) {
          if (res.status === 404) {
            setError('Page not found')
          } else {
            setError('Failed to load page')
          }
          return
        }
        const data = await res.json()
        setPage(data)
      } catch (err) {
        setError('Failed to load page')
      } finally {
        setLoading(false)
      }
    }
    fetchPage()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
            <FileQuestion className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{error}</h1>
          <p className="text-muted-foreground">Halaman yang Anda cari tidak ditemukan atau belum dipublikasikan.</p>
        </div>
      </div>
    )
  }

  if (!page) return null

  const sections = page.sections || []

  return (
    <>
      {sections.map((section: any) => {
        const SectionComponent = sectionComponents[section.sectionKey]
        if (!SectionComponent) return null

        return (
          <SectionComponent
            key={section.id}
            config={{ ...section.config }}
            isPreview={isPreview}
          />
        )
      })}
    </>
  )
}
