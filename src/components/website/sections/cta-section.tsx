'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CTASectionProps {
  title?: string
  description?: string
  primaryButtonText?: string
  primaryButtonLink?: string
  secondaryButtonText?: string
  secondaryButtonLink?: string
  backgroundStyle?: 'default' | 'primary' | 'muted'
}

export function CTASection({
  title = 'Bergabunglah Bersama Kami',
  description = 'Jadilah bagian dari gerakan kami dalam membangun Indonesia yang lebih baik.',
  primaryButtonText = 'Daftar Sekarang',
  primaryButtonLink = '/anggota/daftar',
  secondaryButtonText = 'Hubungi Kami',
  secondaryButtonLink = '/kontak',
  backgroundStyle = 'primary',
}: CTASectionProps) {
  const bgStyles = {
    default: 'bg-background border',
    primary: 'bg-primary text-primary-foreground',
    muted: 'bg-muted',
  }

  const textStyles = {
    default: 'text-foreground',
    primary: 'text-primary-foreground',
    muted: 'text-foreground',
  }

  const buttonVariant = backgroundStyle === 'primary' ? 'secondary' : 'default'

  return (
    <section className={`py-16 lg:py-24 ${bgStyles[backgroundStyle]}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className={`text-3xl sm:text-4xl font-bold mb-4 ${textStyles[backgroundStyle]}`}>
          {title}
        </h2>
        <p className={`text-lg mb-8 ${backgroundStyle === 'primary' ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
          {description}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={primaryButtonLink}>
            <Button size="lg" variant={buttonVariant} className="w-full sm:w-auto group">
              {primaryButtonText}
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          {secondaryButtonText && (
            <Link href={secondaryButtonLink}>
              <Button
                size="lg"
                variant={backgroundStyle === 'primary' ? 'outline' : 'outline'}
                className={`w-full sm:w-auto ${backgroundStyle === 'primary' ? 'border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary' : ''}`}
              >
                {secondaryButtonText}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
