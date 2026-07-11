'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { sanitizeHtml } from '@/lib/sanitize'
import { ArrowRight, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeroProps {
  config: {
    variant?: string
    title?: string
    subtitle?: string
    backgroundImage?: string
    backgroundOverlay?: string
    ctaText?: string
    ctaLink?: string
    ctaSecondaryText?: string
    ctaSecondaryLink?: string
    showScrollIndicator?: boolean
    textAlign?: 'left' | 'center' | 'right'
    content?: string
    image?: string
    imagePosition?: 'left' | 'right'
    videoUrl?: string
    posterImage?: string
  }
  isPreview?: boolean
}

export default function Hero({ config, isPreview = false }: HeroProps) {
  const [isVisible, setIsVisible] = useState(false)
  const variant = config.variant || 'default'

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const scrollToContent = () => {
    const nextSection = document.querySelector('section:not(.hero-section)')
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const textAlignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }[config.textAlign || 'center']

  const alignItemsClass = {
    left: 'items-start',
    center: 'items-center',
    right: 'items-end'
  }[config.textAlign || 'center']

  // Split variant - Image + Text side by side (like KPRI)
  if (variant === 'split') {
    const isImageLeft = config.imagePosition === 'left'
    return (
      <section className={`hero-section relative min-h-screen flex items-center bg-gradient-to-br from-green-50 via-white to-green-50 ${isPreview ? 'py-20' : ''}`}>
        <div className="container mx-auto px-4">
          <div className={`flex flex-col lg:flex-row items-center gap-12 ${isImageLeft ? 'lg:flex-row-reverse' : ''}`}>
            {/* Image */}
            <div className="flex-1">
              {config.image ? (
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src={config.image}
                    alt={config.title || 'Hero image'}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-[4/3] bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center shadow-xl">
                  <span className="text-8xl">🏛️</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-full mb-4">
                {config.subtitle || 'Organisasi'}
              </span>
              <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight ${textAlignClass}`}>
                {config.title || 'Selamat Datang'}
              </h1>
              {config.content && (
                <div
                  className={`prose prose-lg text-gray-600 mb-8 max-w-xl ${textAlignClass}`}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(config.content) }}
                />
              )}
              <div className={`flex flex-wrap gap-4 ${textAlignClass}`}>
                {config.ctaText && (
                  <Link href={config.ctaLink || '#'}>
                    <Button size="lg" className="bg-green-600 hover:bg-green-700">
                      {config.ctaText}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
                {config.ctaSecondaryText && (
                  <Link href={config.ctaSecondaryLink || '#'}>
                    <Button variant="outline" size="lg">
                      {config.ctaSecondaryText}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Video variant
  if (variant === 'video') {
    return (
      <section className={`hero-section relative min-h-screen flex items-center overflow-hidden ${isPreview ? 'py-20' : ''}`}>
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={config.videoUrl}
          poster={config.posterImage}
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 ${textAlignClass} ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            {config.title || 'Hero Title'}
          </h1>
          {config.subtitle && (
            <p className={`text-xl text-white/90 mb-8 max-w-2xl mx-auto ${textAlignClass}`}>
              {config.subtitle}
            </p>
          )}
          <div className="flex flex-wrap gap-4 justify-center">
            {config.ctaText && (
              <Link href={config.ctaLink || '#'}>
                <Button size="lg" className="bg-green-600 hover:bg-green-700">
                  {config.ctaText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
            {config.ctaSecondaryText && (
              <Link href={config.ctaSecondaryLink || '#'}>
                <Button variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-green-700">
                  <Play className="mr-2 h-4 w-4" />
                  {config.ctaSecondaryText}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    )
  }

  // Default variant - Full background image (like KPRI)
  return (
    <section className={`hero-section relative min-h-screen flex items-center ${isPreview ? 'py-20' : ''}`}>
      {config.backgroundImage && (
        <div className="absolute inset-0">
          <Image
            src={config.backgroundImage}
            alt="Hero background"
            fill
            className="object-cover"
            priority
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-green-900/90 via-green-900/70 to-green-900/50"
            style={{ opacity: parseFloat(config.backgroundOverlay || '0.7') }}
          />
        </div>
      )}
      {!config.backgroundImage && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-700 via-green-600 to-green-800" />
      )}

      <div className={`relative z-10 container mx-auto px-4 ${textAlignClass}`}>
        <div className={`flex flex-col ${alignItemsClass} max-w-4xl`}>
          {/* Badge */}
          {config.subtitle && (
            <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full mb-6 w-fit">
              {config.subtitle}
            </span>
          )}

          {/* Title */}
          <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            {config.title || 'Selamat Datang'}
          </h1>

          {/* Content */}
          {config.content && (
            <div
              className={`text-lg text-white/90 mb-10 max-w-2xl ${isVisible ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'}`}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(config.content) }}
            />
          )}

          {/* CTA Buttons */}
          <div className={`flex flex-wrap gap-4 ${isVisible ? 'animate-fade-in-up animation-delay-400' : 'opacity-0'}`}>
            {config.ctaText && (
              <Link href={config.ctaLink || '#'}>
                <Button size="lg" className="bg-white text-green-700 hover:bg-green-50 shadow-lg font-semibold">
                  {config.ctaText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
            {config.ctaSecondaryText && (
              <Link href={config.ctaSecondaryLink || '#'}>
                <Button variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-green-700 font-semibold">
                  {config.ctaSecondaryText}
                </Button>
              </Link>
            )}
          </div>

          {/* Stats Row */}
          <div className={`grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-white/20 ${isVisible ? 'animate-fade-in-up animation-delay-600' : 'opacity-0'}`}>
            <div className="text-left">
              <div className="text-3xl font-bold text-white">500+</div>
              <div className="text-white/70 text-sm">Anggota Aktif</div>
            </div>
            <div className="text-left">
              <div className="text-3xl font-bold text-white">25+</div>
              <div className="text-white/70 text-sm">Program Kerja</div>
            </div>
            <div className="text-left">
              <div className="text-3xl font-bold text-white">10+</div>
              <div className="text-white/70 text-sm">Tahun Berdiri</div>
            </div>
          </div>
        </div>
      </div>

      {config.showScrollIndicator !== false && !isPreview && (
        <button
          onClick={scrollToContent}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/80 hover:text-white transition-colors animate-bounce"
          aria-label="Scroll to content"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
    </section>
  )
}
