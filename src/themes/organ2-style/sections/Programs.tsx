'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { DynamicIcon } from '@/components/ui/dynamic-icon'

interface ProgramsProps {
  config: {
    variant?: 'default' | 'cards' | 'grid' | 'minimal'
    title?: string
    subtitle?: string
    description?: string
    programs?: Array<{
      title?: string
      description?: string
      icon?: string
      image?: string
      link?: string
    }>
    columns?: '2' | '3' | '4'
    ctaText?: string
    ctaLink?: string
  }
  isPreview?: boolean
}

export default function Programs({ config, isPreview = false }: ProgramsProps) {
  const variant = config.variant || 'default'
  const columns = config.columns || '3'

  const gridCols = {
    '2': 'md:grid-cols-2',
    '3': 'md:grid-cols-2 lg:grid-cols-3',
    '4': 'md:grid-cols-2 lg:grid-cols-4'
  }[columns]

  // Cards variant with images (modern style)
  if (variant === 'cards' && config.programs) {
    return (
      <section className={`py-20 lg:py-28 bg-gray-50 ${isPreview ? 'py-12' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
              {config.subtitle || 'Program Kerja'}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {config.title || 'Program Kerja'}
            </h2>
            {config.description && (
              <p className="text-lg text-gray-600">
                {config.description}
              </p>
            )}
          </div>

          {/* Cards Grid */}
          <div className={`grid ${gridCols} gap-8`}>
            {config.programs.map((program, index) => (
              <Link
                key={index}
                href={program.link || '#'}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
              >
                {/* Image */}
                {program.image ? (
                  <div className="aspect-video overflow-hidden">
                    <Image
                      src={program.image}
                      alt={program.title || 'Program'}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <DynamicIcon name={program.icon || 'clipboard'} className="w-16 h-16 text-white" />
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                    {program.title || `Program ${index + 1}`}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {program.description}
                  </p>
                  <div className="flex items-center text-green-600 font-medium text-sm">
                    <span>Selengkapnya</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* CTA */}
          {config.ctaText && (
            <div className="text-center mt-16">
              <Link
                href={config.ctaLink || '#'}
                className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all shadow-lg"
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

  // Grid variant - Icon cards
  if (variant === 'grid' && config.programs) {
    return (
      <section className={`py-20 lg:py-28 bg-white ${isPreview ? 'py-12' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
              {config.subtitle || 'Program Kerja'}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {config.title || 'Program Kerja'}
            </h2>
          </div>

          {/* Icon Grid */}
          <div className={`grid ${gridCols} gap-8`}>
            {config.programs.map((program, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl p-8 hover:bg-green-50 transition-colors duration-300 group"
              >
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:bg-green-600 transition-colors">
                  <span className="text-3xl group-hover:scale-110 transition-transform">{program.icon || index + 1}</span>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {program.title || `Program ${index + 1}`}
                </h3>
                <p className="text-gray-600">
                  {program.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Default - Icon cards with border
  return (
    <section className={`py-20 lg:py-28 bg-white ${isPreview ? 'py-12' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
            {config.subtitle || 'Program Kerja'}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            {config.title || 'Program Kerja'}
          </h2>
          {config.description && (
            <p className="text-lg text-gray-600">
              {config.description}
            </p>
          )}
        </div>

        {/* Programs Grid */}
        <div className={`grid ${gridCols} gap-6`}>
          {config.programs && config.programs.length > 0 ? (
            config.programs.map((program, index) => (
              <Link
                key={index}
                href={program.link || '#'}
                className="group relative bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-green-200 transition-all duration-300"
              >
                {/* Number */}
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-500">{index + 1}</span>
                </div>

                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
                  <DynamicIcon name={program.icon || 'clipboard'} className="w-7 h-7 text-green-700 group-hover:text-white transition-colors" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                  {program.title || `Program ${index + 1}`}
                </h3>
                <p className="text-gray-600 text-sm">
                  {program.description}
                </p>
              </Link>
            ))
          ) : (
            // Placeholder
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 border-2 border-gray-100">
                <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                  <span className="text-2xl">{index + 1}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Program {index + 1}</h3>
                <p className="text-gray-600 text-sm">Deskripsi program...</p>
              </div>
            ))
          )}
        </div>

        {/* CTA */}
        {config.ctaText && (
          <div className="text-center mt-16">
            <Link
              href={config.ctaLink || '#'}
              className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all shadow-lg"
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
