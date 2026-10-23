'use client'

import * as React from 'react'
import Link from 'next/link'
import { useWebsiteConfig } from '@/hooks/use-website-config'
import { Button } from '@/components/ui/button'
import { ArrowRight, Play, Building2, Sparkles } from 'lucide-react'

interface HeroSectionProps {
  title?: string
  subtitle?: string
  description?: string
  primaryButtonText?: string
  primaryButtonLink?: string
  secondaryButtonText?: string
  secondaryButtonLink?: string
  backgroundImage?: string
  showVideoButton?: boolean
}

export function HeroSection({
  title,
  subtitle,
  description,
  primaryButtonText = 'Pelajari Lebih Lanjut',
  primaryButtonLink = '#',
  secondaryButtonText,
  secondaryButtonLink = '#',
  backgroundImage,
  showVideoButton = false,
}: HeroSectionProps) {
  const { config } = useWebsiteConfig()

  const displayTitle = title || config.appName || 'Selamat Datang'
  const displaySubtitle = subtitle || ''
  const displayDescription = description || config.appDescription || 'Sistem Informasi Anggota Organisasi'

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            {displaySubtitle && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {displaySubtitle}
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="block text-foreground">{displayTitle}</span>
            </h1>

            {/* Description */}
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
              {displayDescription}
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href={primaryButtonLink}>
                <Button size="lg" className="w-full sm:w-auto group">
                  {primaryButtonText}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              {secondaryButtonText && (
                <Link href={secondaryButtonLink}>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    {secondaryButtonText}
                  </Button>
                </Link>
              )}

              {showVideoButton && (
                <Button variant="ghost" size="lg" className="w-full sm:w-auto">
                  <Play className="mr-2 h-4 w-4" />
                  Tonton Video
                </Button>
              )}
            </div>

            {/* Stats (optional) */}
            <div className="mt-12 grid grid-cols-3 gap-8">
              <div>
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Anggota Aktif</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">10+</div>
                <div className="text-sm text-muted-foreground">Program Kerja</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">5+</div>
                <div className="text-sm text-muted-foreground">Tahun Berdiri</div>
              </div>
            </div>
          </div>

          {/* Image/Visual */}
          <div className="relative hidden lg:block">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
              {backgroundImage ? (
                <img
                  src={backgroundImage}
                  alt={displayTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <Building2 className="w-16 h-16" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Floating Card */}
            <div className="absolute -bottom-6 -left-6 bg-card rounded-xl shadow-xl p-4 border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold">Bergabung Sekarang</div>
                  <div className="text-sm text-muted-foreground">Daftar jadi anggota</div>
                </div>
              </div>
            </div>

            {/* Another Floating Element */}
            <div className="absolute -top-4 -right-4 bg-card rounded-xl shadow-xl p-3 border">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-sm font-medium">Terpercaya</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
