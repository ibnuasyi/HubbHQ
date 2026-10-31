'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CtaProps {
  config: {
    variant?: string
    title?: string
    subtitle?: string
    description?: string
    primaryCtaText?: string
    primaryCtaLink?: string
    secondaryCtaText?: string
    secondaryCtaLink?: string
    backgroundColor?: string
    showPattern?: boolean
    ctaText?: string
    ctaLink?: string
  }
  isPreview?: boolean
}

export default function Cta({ config, isPreview = false }: CtaProps) {
  const variant = config.variant || 'default'
  const bgColor = config.backgroundColor || '#16a34a' // Green as default

  // Centered variant
  if (variant === 'centered') {
    return (
      <section className={`py-20 bg-gradient-to-r from-green-600 to-green-700 ${isPreview ? 'py-12' : ''}`}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {config.title || 'Bergabung dengan Kami'}
          </h2>
          {config.subtitle && (
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              {config.subtitle}
            </p>
          )}
          {config.description && (
            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
              {config.description}
            </p>
          )}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 w-full sm:w-auto">
            {(config.primaryCtaText || config.ctaText) && (
              <Link href={config.primaryCtaLink || config.ctaLink || '#'} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-white text-green-700 hover:bg-green-50 shadow-lg font-semibold">
                  {config.primaryCtaText || config.ctaText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
            {config.secondaryCtaText && (
              <Link href={config.secondaryCtaLink || '#'} className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-green-700 font-semibold">
                  {config.secondaryCtaText}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    )
  }

  // Default variant with pattern
  return (
    <section
      className={`py-20 relative overflow-hidden ${isPreview ? 'py-12' : ''}`}
      style={{ backgroundColor: bgColor }}
    >
      {/* Background Pattern */}
      {config.showPattern !== false && (
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="cta-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="2" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cta-pattern)" />
          </svg>
        </div>
      )}

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            {config.title || 'Bergabung dengan Kami'}
          </h2>

          {config.subtitle && (
            <p className="text-xl md:text-2xl text-white/90 mb-6">
              {config.subtitle}
            </p>
          )}

          {config.description && (
            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
              {config.description}
            </p>
          )}

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 w-full sm:w-auto">
            {(config.primaryCtaText || config.ctaText) && (
              <Link href={config.primaryCtaLink || config.ctaLink || '#'} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-white text-green-700 hover:bg-green-50 shadow-lg font-semibold">
                  {config.primaryCtaText || config.ctaText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
            {config.secondaryCtaText && (
              <Link href={config.secondaryCtaLink || '#'} className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-green-700 font-semibold">
                  {config.secondaryCtaText}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
