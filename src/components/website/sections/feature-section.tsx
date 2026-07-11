'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, LucideIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
  link?: string
}

interface FeatureSectionProps {
  title?: string
  subtitle?: string
  description?: string
  features: Feature[]
  columns?: 2 | 3 | 4
  showViewAll?: boolean
  viewAllLink?: string
  viewAllText?: string
  backgroundStyle?: 'default' | 'muted' | 'gradient'
}

export function FeatureSection({
  title,
  subtitle,
  description,
  features,
  columns = 3,
  showViewAll = false,
  viewAllLink = '#',
  viewAllText = 'Lihat Semua',
  backgroundStyle = 'default',
}: FeatureSectionProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  }

  const bgStyles = {
    default: 'bg-background',
    muted: 'bg-muted/50',
    gradient: 'bg-gradient-to-b from-muted/50 to-background',
  }

  return (
    <section className={`py-16 lg:py-24 ${bgStyles[backgroundStyle]}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          {subtitle && (
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
              {subtitle}
            </p>
          )}
          {title && (
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-4 text-lg text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        {/* Feature Cards Grid */}
        <div className={`grid ${gridCols[columns]} gap-6`}>
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            const CardWrapper = feature.link ? Link : 'div'

            return (
              <Card
                key={index}
                className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/50"
              >
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <IconComponent className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                  {feature.link && (
                    <Link
                      href={feature.link}
                      className="inline-flex items-center mt-4 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      Baca selengkapnya
                      <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  )}
                </CardContent>

                {/* Hover Effect Decoration */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full transform translate-x-1/2 -translate-y-1/2 group-hover:bg-primary/10 transition-colors" />
              </Card>
            )
          })}
        </div>

        {/* View All Button */}
        {showViewAll && (
          <div className="text-center mt-12">
            <Link href={viewAllLink}>
              <button className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-primary text-primary font-medium hover:bg-primary hover:text-primary-foreground transition-colors">
                {viewAllText}
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

// Pre-built feature sets for common use cases
export const tentangFeatures = [
  {
    icon: Users,
    title: 'Visi',
    description: 'Menjadi organisasi yang unggul dalam pemberdayaan masyarakat dan generasi muda Indonesia.',
    link: '/visi-misi',
  },
  {
    icon: Target,
    title: 'Misi',
    description: 'Mengembangkan potensi generasi muda melalui pendidikan, pelatihan, dan kegiatan sosial.',
    link: '/visi-misi',
  },
  {
    icon: Shield,
    title: 'Nilai-Nilai',
    description: 'Berpegang pada nilai-nilai kebangsaan, keadilan, dan kesejahteraan rakyat.',
    link: '/nilai-nilai',
  },
]

export const programFeatures = [
  {
    icon: GraduationCap,
    title: 'Pendidikan',
    description: 'Program pelatihan dan pengembangan kapasitas anggota.',
    link: '/program/pendidikan',
  },
  {
    icon: Heart,
    title: 'Sosial',
    description: 'Kegiatan bakti sosial dan pemberdayaan masyarakat.',
    link: '/program/sosial',
  },
  {
    icon: Megaphone,
    title: 'Advokasi',
    description: 'Perjuangan hak-hak rakyat melalui advokasi kebijakan.',
    link: '/program/advokasi',
  },
]

// Import icons used
import { Users, Target, Shield, GraduationCap, Heart, Megaphone } from 'lucide-react'
