'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProgramsProps {
  config: {
    variant?: string
    title?: string
    subtitle?: string
    programs?: Array<{
      title?: string
      description?: string
      icon?: string
      color?: string
      image?: string
      link?: string
    }>
    columns?: '2' | '3' | '4'
    categories?: Array<{
      name?: string
      programs?: Array<{ title?: string; description?: string }>
    }>
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

  // Cards variant with images
  if (variant === 'cards' && config.programs) {
    return (
      <section className={`py-20 bg-gray-50 ${isPreview ? 'py-12' : ''}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            {config.subtitle && (
              <span className="text-green-600 font-semibold text-sm uppercase tracking-wider">
                {config.subtitle}
              </span>
            )}
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
              {config.title || 'Program Kerja'}
            </h2>
          </div>
          <div className={`grid ${gridCols} gap-8`}>
            {config.programs.map((program, index) => (
              <Link
                key={index}
                href={program.link || '#'}
                className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                {program.image ? (
                  <div className="relative aspect-video overflow-hidden">
                    <Image
                      src={program.image}
                      alt={program.title || 'Program'}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center">
                    <span className="text-6xl">{program.icon || '📋'}</span>
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                    {program.title || `Program ${index + 1}`}
                  </h3>
                  <p className="text-gray-600 mb-4">{program.description}</p>
                  <span className="inline-flex items-center text-green-600 font-medium text-sm group-hover:gap-2 transition-all">
                    Selengkapnya <ArrowRight className="ml-1 h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
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

  // Tabs variant
  if (variant === 'tabs' && config.categories) {
    return (
      <section className={`py-20 bg-white ${isPreview ? 'py-12' : ''}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {config.title || 'Program Kerja'}
            </h2>
          </div>
          <div className="space-y-12 max-w-4xl mx-auto">
            {config.categories.map((category, catIndex) => (
              <div key={catIndex}>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <span className="w-10 h-10 bg-green-600 text-white rounded-xl flex items-center justify-center text-lg font-bold">
                    {catIndex + 1}
                  </span>
                  {category.name}
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {category.programs?.map((program, progIndex) => (
                    <div
                      key={progIndex}
                      className="p-5 bg-gray-50 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/50 transition-colors"
                    >
                      <h4 className="font-semibold text-gray-900">{program.title}</h4>
                      <p className="text-gray-600 text-sm mt-1">{program.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Default icon cards variant (like KPRI style)
  return (
    <section className={`py-20 bg-white ${isPreview ? 'py-12' : ''}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          {config.subtitle && (
            <span className="text-green-600 font-semibold text-sm uppercase tracking-wider">
              {config.subtitle}
            </span>
          )}
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
            {config.title || 'Program Kerja'}
          </h2>
          {config.subtitle && (
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {config.subtitle}
            </p>
          )}
        </div>

        <div className={`grid ${gridCols} gap-8`}>
          {config.programs && config.programs.length > 0 ? (
            config.programs.map((program, index) => (
              <div
                key={index}
                className="group p-8 bg-white rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-xl transition-all duration-300"
              >
                {program.icon && (
                  <div
                    className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mb-6 group-hover:bg-green-600 transition-colors"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{program.icon}</span>
                  </div>
                )}
                {!program.icon && (
                  <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                    <span className="text-2xl font-bold text-green-600">{index + 1}</span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                  {program.title || `Program ${index + 1}`}
                </h3>
                <p className="text-gray-600">
                  {program.description}
                </p>
              </div>
            ))
          ) : (
            // Placeholder cards
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="p-8 bg-white rounded-2xl border border-gray-100"
              >
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-green-600">{index + 1}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Program {index + 1}
                </h3>
                <p className="text-gray-600">
                  Deskripsi program...
                </p>
              </div>
            ))
          )}
        </div>

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
