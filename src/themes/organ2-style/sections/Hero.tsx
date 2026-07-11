'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Play } from 'lucide-react'

interface HeroProps {
  config: {
    variant?: 'default' | 'split' | 'centered'
    title?: string
    subtitle?: string
    description?: string
    backgroundImage?: string
    ctaText?: string
    ctaLink?: string
    ctaSecondaryText?: string
    ctaSecondaryLink?: string
    showScrollIndicator?: boolean
    image?: string
    imagePosition?: 'left' | 'right'
  }
  isPreview?: boolean
}

export default function Hero({ config, isPreview = false }: HeroProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Split variant - Image on one side, content on the other (KPRI style)
  if (config.variant === 'split') {
    const isImageLeft = config.imagePosition === 'left'

    return (
      <section className={`relative min-h-screen flex items-center bg-gradient-to-br from-gray-50 via-white to-green-50 ${isPreview ? 'py-20' : ''}`}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-green-50/50 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-0">
          <div className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${isImageLeft ? '' : 'lg:flex-row-reverse'}`}>
            {/* Content */}
            <div className={`${isImageLeft ? '' : 'lg:order-2'}`}>
              <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-6">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  {config.subtitle || 'Organisasi Resmi'}
                </div>

                {/* Title */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                  {config.title || 'Selamat Datang'}
                </h1>

                {/* Description */}
                {config.description && (
                  <p className="text-lg text-gray-600 mb-8 max-w-xl">
                    {config.description}
                  </p>
                )}

                {/* CTA Buttons */}
                <div className="flex flex-wrap gap-4">
                  {config.ctaText && (
                    <Link
                      href={config.ctaLink || '#'}
                      className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-600/25 hover:shadow-green-600/40 hover:-translate-y-0.5"
                    >
                      {config.ctaText}
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  )}
                  {config.ctaSecondaryText && (
                    <Link
                      href={config.ctaSecondaryLink || '#'}
                      className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-green-600 hover:text-green-600 transition-all"
                    >
                      {config.ctaSecondaryText}
                    </Link>
                  )}
                </div>

                {/* Trust indicators */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <div className="flex items-center gap-8 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Terpercaya</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Resmi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Profesional</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className={`relative ${isImageLeft ? '' : 'lg:order-1'}`}>
              <div className={`relative transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {config.image ? (
                  <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                    <Image
                      src={config.image}
                      alt={config.title || 'Hero image'}
                      fill
                      className="object-cover"
                    />
                    {/* Decorative overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                  </div>
                ) : (
                  <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-green-600 via-green-500 to-emerald-400 flex items-center justify-center shadow-2xl">
                    <div className="text-center text-white">
                      <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                        <span className="text-5xl">🏛️</span>
                      </div>
                      <p className="text-lg font-medium opacity-90">Organisasi</p>
                    </div>
                  </div>
                )}

                {/* Floating card */}
                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-5 border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <span className="text-2xl">👥</span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">500+</div>
                      <div className="text-sm text-gray-500">Anggota Aktif</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Centered variant
  if (config.variant === 'centered') {
    return (
      <section className={`relative min-h-screen flex items-center justify-center bg-gradient-to-br from-green-700 via-green-600 to-green-800 ${isPreview ? 'py-20' : ''}`}>
        {config.backgroundImage && (
          <div className="absolute inset-0">
            <Image src={config.backgroundImage} alt="" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/50" />
          </div>
        )}

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              {config.subtitle || 'Selamat Datang'}
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              {config.title || 'Selamat Datang'}
            </h1>

            {/* Description */}
            {config.description && (
              <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
                {config.description}
              </p>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              {config.ctaText && (
                <Link
                  href={config.ctaLink || '#'}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-green-700 font-bold rounded-xl hover:bg-green-50 transition-all shadow-lg"
                >
                  {config.ctaText}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
              {config.ctaSecondaryText && (
                <Link
                  href={config.ctaSecondaryLink || '#'}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-white/20 transition-all"
                >
                  <Play className="w-5 h-5" />
                  {config.ctaSecondaryText}
                </Link>
              )}
            </div>
          </div>
        </div>

        {config.showScrollIndicator !== false && !isPreview && (
          <button
            onClick={() => window.scrollTo({ behavior: 'smooth', top: window.innerHeight })}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80 hover:text-white transition-colors animate-bounce"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        )}
      </section>
    )
  }

  // Default variant - Full width banner
  return (
    <section className={`relative min-h-[80vh] flex items-center ${isPreview ? 'py-20' : ''}`}>
      {config.backgroundImage ? (
        <div className="absolute inset-0">
          <Image src={config.backgroundImage} alt="" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/90 via-green-900/60 to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-green-700 via-green-600 to-green-800" />
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl">
          <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              {config.subtitle || 'Organisasi'}
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              {config.title || 'Selamat Datang'}
            </h1>

            {/* Description */}
            {config.description && (
              <p className="text-xl text-white/90 mb-10 max-w-2xl">
                {config.description}
              </p>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              {config.ctaText && (
                <Link
                  href={config.ctaLink || '#'}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-green-700 font-bold rounded-xl hover:bg-green-50 transition-all shadow-lg"
                >
                  {config.ctaText}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
              {config.ctaSecondaryText && (
                <Link
                  href={config.ctaSecondaryLink || '#'}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-white/20 transition-all"
                >
                  {config.ctaSecondaryText}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {config.showScrollIndicator !== false && !isPreview && (
        <button
          onClick={() => window.scrollTo({ behavior: 'smooth', top: window.innerHeight })}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80 hover:text-white transition-colors animate-bounce"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
    </section>
  )
}
