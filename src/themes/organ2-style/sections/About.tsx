'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle } from 'lucide-react'

interface AboutProps {
  config: {
    variant?: 'default' | 'cards' | 'split' | 'centered'
    title?: string
    subtitle?: string
    description?: string
    content?: string
    image?: string
    imagePosition?: 'left' | 'right'
    features?: Array<{
      icon?: string
      title: string
      description: string
      link?: string
    }>
    stats?: Array<{ value: string; label: string }>
    ctaText?: string
    ctaLink?: string
  }
  isPreview?: boolean
}

export default function About({ config, isPreview = false }: AboutProps) {
  const variant = config.variant || 'default'

  // Cards variant - Grid 3 columns (KPRI style)
  if (variant === 'cards' && config.features) {
    return (
      <section className={`py-20 lg:py-28 bg-white ${isPreview ? 'py-12' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
              {config.subtitle || 'Tentang Kami'}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {config.title || 'Tentang Organisasi'}
            </h2>
            {config.description && (
              <p className="text-lg text-gray-600">
                {config.description}
              </p>
            )}
          </div>

          {/* Feature Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {config.features.map((feature, index) => (
              <Link
                key={index}
                href={feature.link || '#'}
                className="group relative bg-white rounded-2xl p-8 border border-gray-100 hover:border-green-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* Number badge */}
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-green-600">{index + 1}</span>
                </div>

                {/* Icon */}
                {feature.icon && (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">{feature.icon}</span>
                  </div>
                )}

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {feature.description}
                </p>

                {/* Arrow */}
                <div className="flex items-center text-green-600 font-medium">
                  <span className="text-sm">Selengkapnya</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>

                {/* Hover gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/0 via-green-50/0 to-green-50/0 group-hover:from-green-50/50 group-hover:via-green-50/25 group-hover:to-green-50/0 transition-all duration-300 opacity-0 group-hover:opacity-100" />
              </Link>
            ))}
          </div>

          {/* CTA */}
          {config.ctaText && (
            <div className="text-center mt-16">
              <Link
                href={config.ctaLink || '#'}
                className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-600/25 hover:shadow-green-600/40"
              >
                {config.ctaText}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </section>
    )
  }

  // Split variant - Image on one side, content on the other
  if (variant === 'split') {
    const isImageLeft = config.imagePosition === 'left'

    return (
      <section className={`py-20 lg:py-28 bg-gray-50 ${isPreview ? 'py-12' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${!isImageLeft ? 'lg:flex-row-reverse' : ''}`}>
            {/* Image */}
            <div className={!isImageLeft ? 'lg:order-2' : ''}>
              <div className="relative">
                {config.image ? (
                  <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                    <Image
                      src={config.image}
                      alt={config.title || 'About'}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center shadow-2xl">
                    <span className="text-8xl">🏛️</span>
                  </div>
                )}

                {/* Decorative elements */}
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-green-100 rounded-3xl -z-10" />
                <div className="absolute -top-6 -left-6 w-24 h-24 bg-green-200 rounded-2xl -z-10" />
              </div>
            </div>

            {/* Content */}
            <div className={!isImageLeft ? 'lg:order-1' : ''}>
              <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
                {config.subtitle || 'Tentang Kami'}
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                {config.title || 'Tentang Organisasi'}
              </h2>
              {config.content && (
                <p className="text-lg text-gray-600 mb-8">
                  {config.content}
                </p>
              )}

              {/* Stats */}
              {config.stats && config.stats.length > 0 && (
                <div className="grid grid-cols-3 gap-6 mb-8">
                  {config.stats.map((stat, index) => (
                    <div key={index} className="text-center p-4 bg-white rounded-2xl shadow-sm">
                      <div className="text-3xl font-bold text-green-600 mb-1">{stat.value}</div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* CTA */}
              {config.ctaText && (
                <Link
                  href={config.ctaLink || '#'}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all"
                >
                  {config.ctaText}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Default variant - Simple centered
  return (
    <section className={`py-20 lg:py-28 bg-white ${isPreview ? 'py-12' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
            {config.subtitle || 'Tentang Kami'}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            {config.title || 'Tentang Organisasi'}
          </h2>
          {config.content && (
            <p className="text-lg text-gray-600">
              {config.content}
            </p>
          )}

          {/* Features checklist */}
          {config.features && config.features.length > 0 && (
            <div className="mt-8 space-y-4">
              {config.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 text-left">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-gray-900">{feature.title}</span>
                    <span className="text-gray-600"> - {feature.description}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
