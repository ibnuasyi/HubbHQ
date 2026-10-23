'use client'

import Image from 'next/image'
import Link from 'next/link'
import { sanitizeHtml } from '@/lib/sanitize'
import { ArrowRight, Building2 } from 'lucide-react'
import { DynamicIcon } from '@/components/ui/dynamic-icon'
import { Button } from '@/components/ui/button'

interface AboutProps {
  config: {
    variant?: string
    title?: string
    subtitle?: string
    content?: string
    image?: string
    imagePosition?: 'left' | 'right'
    showStats?: boolean
    stats?: Array<{ value: string; label: string }>
    features?: Array<{ icon?: string; title: string; description: string; link?: string }>
    ctaText?: string
    ctaLink?: string
  }
  isPreview?: boolean
}

export default function About({ config, isPreview = false }: AboutProps) {
  const variant = config.variant || 'default'

  // Cards variant - Like HubbHQ cards (3 columns)
  if (variant === 'cards' && config.features) {
    return (
      <section className={`py-20 bg-white ${isPreview ? 'py-12' : ''}`}>
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            {config.subtitle && (
              <span className="text-green-600 font-semibold text-sm uppercase tracking-wider">
                {config.subtitle}
              </span>
            )}
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
              {config.title || 'Tentang Kami'}
            </h2>
            {config.content && (
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {config.content}
              </p>
            )}
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {config.features.map((feature, index) => (
              <Link
                key={index}
                href={feature.link || '#'}
                className="group p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-200"
              >
                {feature.icon && (
                  <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-600 transition-colors">
                    <DynamicIcon name={feature.icon} className="w-7 h-7 text-green-700 group-hover:text-white transition-colors" />
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {feature.description}
                </p>
                {feature.link && (
                  <span className="inline-flex items-center text-green-600 font-medium text-sm group-hover:text-green-700">
                    Baca selengkapnya
                    <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* CTA */}
          {config.ctaText && (
            <div className="text-center mt-12">
              <Link href={config.ctaLink || '#'}>
                <Button size="lg" className="bg-green-600 hover:bg-green-700">
                  {config.ctaText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    )
  }

  // Split variant - Image + Text (modern style)
  if (variant === 'split') {
    const isImageLeft = config.imagePosition !== 'right'

    return (
      <section className={`py-20 bg-gray-50 ${isPreview ? 'py-12' : ''}`}>
        <div className="container mx-auto px-4">
          <div className={`flex flex-col lg:flex-row items-center gap-12 ${!isImageLeft ? 'lg:flex-row-reverse' : ''}`}>
            {/* Image */}
            <div className="flex-1">
              {config.image ? (
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src={config.image}
                    alt={config.title || 'About image'}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-[4/3] bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center shadow-xl text-white">
                  <Building2 className="w-24 h-24" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              {config.subtitle && (
                <span className="inline-block text-green-600 font-semibold text-sm uppercase tracking-wider mb-2">
                  {config.subtitle}
                </span>
              )}
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {config.title || 'Tentang Organisasi Kami'}
              </h2>
              {config.content && (
                <div
                  className="prose prose-lg text-gray-600 mb-8"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(config.content) }}
                />
              )}

              {/* Stats */}
              {config.showStats && config.stats && (
                <div className="grid grid-cols-3 gap-6 mt-8">
                  {config.stats.map((stat, index) => (
                    <div key={index} className="text-center p-4 bg-white rounded-xl shadow-md">
                      <div className="text-3xl font-bold text-green-600 mb-1">{stat.value}</div>
                      <div className="text-gray-600 text-sm">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* CTA */}
              {config.ctaText && (
                <div className="mt-8">
                  <Link href={config.ctaLink || '#'}>
                    <Button className="bg-green-600 hover:bg-green-700">
                      {config.ctaText}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Default / Centered variant
  const isImageLeft = config.imagePosition !== 'right'

  return (
    <section className={`py-20 bg-white ${isPreview ? 'py-12' : ''}`}>
      <div className="container mx-auto px-4">
        <div className={`flex flex-col lg:flex-row items-center gap-12 ${!isImageLeft ? 'lg:flex-row-reverse' : ''}`}>
          {/* Image */}
          <div className="flex-1">
            {config.image ? (
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src={config.image}
                  alt={config.title || 'About image'}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[4/3] bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center shadow-xl text-white">
                <Building2 className="w-24 h-24" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <span className="text-green-600 font-semibold text-sm uppercase tracking-wider">
              Tentang Kami
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
              {config.title || 'Tentang Organisasi Kami'}
            </h2>
            {config.subtitle && (
              <p className="text-xl text-green-600 font-medium mb-6">
                {config.subtitle}
              </p>
            )}
            {config.content && (
              <div
                className="prose prose-lg text-gray-600 mb-8"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(config.content) }}
              />
            )}

            {/* Stats */}
            {config.showStats && config.stats && (
              <div className="grid grid-cols-3 gap-6 mt-8">
                {config.stats.map((stat, index) => (
                  <div key={index} className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="text-3xl font-bold text-green-600 mb-1">{stat.value}</div>
                    <div className="text-gray-600 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
