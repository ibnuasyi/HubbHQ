'use client'

import Link from 'next/link'
import { ArrowRight, Phone, Mail } from 'lucide-react'

interface CtaProps {
  config: {
    title?: string
    subtitle?: string
    description?: string
    primaryCtaText?: string
    primaryCtaLink?: string
    secondaryCtaText?: string
    secondaryCtaLink?: string
    backgroundColor?: string
    contactPhone?: string
    contactEmail?: string
  }
  isPreview?: boolean
}

export default function Cta({ config, isPreview = false }: CtaProps) {
  return (
    <section className={`py-20 lg:py-28 bg-gradient-to-br from-green-700 via-green-600 to-green-700 relative overflow-hidden ${isPreview ? 'py-12' : ''}`}>
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cta-dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="15" cy="15" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-dots)" />
        </svg>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Title */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
          {config.title || 'Bergabung dengan Kami'}
        </h2>

        {/* Subtitle */}
        {config.subtitle && (
          <p className="text-xl text-white/90 mb-6">
            {config.subtitle}
          </p>
        )}

        {/* Description */}
        {config.description && (
          <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
            {config.description}
          </p>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {(config.primaryCtaText) && (
            <Link
              href={config.primaryCtaLink || '/anggota/daftar'}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-green-700 font-bold rounded-xl hover:bg-green-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              {config.primaryCtaText}
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
          {(config.secondaryCtaText) && (
            <Link
              href={config.secondaryCtaLink || '/kontak'}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-white/20 transition-all"
            >
              {config.secondaryCtaText}
            </Link>
          )}
        </div>

        {/* Contact Info */}
        {(config.contactPhone || config.contactEmail) && (
          <div className="flex flex-wrap justify-center gap-6 text-white/80">
            {config.contactPhone && (
              <a href={`tel:${config.contactPhone}`} className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="w-5 h-5" />
                {config.contactPhone}
              </a>
            )}
            {config.contactEmail && (
              <a href={`mailto:${config.contactEmail}`} className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
                {config.contactEmail}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
