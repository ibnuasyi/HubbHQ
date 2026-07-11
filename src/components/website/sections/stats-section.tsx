'use client'

import * as React from 'react'

interface StatItem {
  value: string | number
  label: string
  suffix?: string
  prefix?: string
}

interface StatsSectionProps {
  title?: string
  subtitle?: string
  stats: StatItem[]
  backgroundStyle?: 'default' | 'muted' | 'primary'
}

export function StatsSection({
  title,
  subtitle,
  stats,
  backgroundStyle = 'muted',
}: StatsSectionProps) {
  const bgStyles = {
    default: 'bg-background',
    muted: 'bg-muted/50',
    primary: 'bg-primary text-primary-foreground',
  }

  return (
    <section className={`py-16 lg:py-20 ${bgStyles[backgroundStyle]}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        {(title || subtitle) && (
          <div className="text-center max-w-3xl mx-auto mb-12">
            {subtitle && (
              <p className={`text-sm font-medium uppercase tracking-wider mb-2 ${backgroundStyle === 'primary' ? 'text-primary-foreground/80' : 'text-primary'}`}>
                {subtitle}
              </p>
            )}
            {title && (
              <h2 className={`text-3xl sm:text-4xl font-bold ${backgroundStyle === 'primary' ? 'text-primary-foreground' : 'text-foreground'}`}>
                {title}
              </h2>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className={`grid grid-cols-2 lg:grid-cols-${Math.min(stats.length, 4)} gap-8 lg:gap-12`}>
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className={`text-4xl sm:text-5xl font-bold ${backgroundStyle === 'primary' ? 'text-primary-foreground' : 'text-primary'}`}>
                {stat.prefix}
                <span>{stat.value}</span>
                {stat.suffix}
              </div>
              <div className={`mt-2 text-lg ${backgroundStyle === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
