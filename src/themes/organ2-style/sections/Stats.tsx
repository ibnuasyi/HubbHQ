'use client'

import { useState, useEffect, useRef } from 'react'

interface Stat {
  value?: string
  label?: string
  icon?: string
  color?: string
}

interface StatsProps {
  config: {
    variant?: 'default' | 'cards' | 'minimal'
    title?: string
    subtitle?: string
    stats?: Stat[]
    columns?: '2' | '3' | '4' | '5'
    animate?: boolean
  }
  isPreview?: boolean
}

export default function Stats({ config, isPreview = false }: StatsProps) {
  const variant = config.variant || 'default'
  const columns = config.columns || '4'
  const animate = config.animate !== false
  const [isVisible, setIsVisible] = useState(false)
  const [counters, setCounters] = useState<{ [key: string]: number }>({})
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!animate) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [animate])

  useEffect(() => {
    if (!isVisible || !animate) return

    const stats = config.stats || []
    const interval = setInterval(() => {
      setCounters(prev => {
        const newCounters = { ...prev }
        stats.forEach((stat, index) => {
          const current = prev[index] || 0
          const target = parseInt(stat.value?.replace(/\D/g, '') || '0') || 0
          const step = Math.ceil(target / 30)

          if (current < target) {
            newCounters[index] = Math.min(current + step, target)
          } else {
            newCounters[index] = target
          }
        })
        return newCounters
      })
    }, 40)

    return () => clearInterval(interval)
  }, [isVisible, animate, config.stats])

  const gridCols = {
    '2': 'md:grid-cols-2',
    '3': 'md:grid-cols-3',
    '4': 'md:grid-cols-2 lg:grid-cols-4',
    '5': 'md:grid-cols-3 lg:grid-cols-5'
  }[columns]

  // Cards variant - With icons
  if (variant === 'cards') {
    return (
      <section className={`py-20 lg:py-28 bg-white ${isPreview ? 'py-12' : ''}`} ref={sectionRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {config.title && (
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                {config.title}
              </h2>
              {config.subtitle && (
                <p className="text-lg text-gray-600">{config.subtitle}</p>
              )}
            </div>
          )}

          <div className={`grid ${gridCols} gap-8`}>
            {(config.stats || []).map((stat, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-green-200 transition-all duration-300 text-center group"
              >
                {stat.icon && (
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-100 flex items-center justify-center group-hover:bg-green-600 transition-colors">
                    <span className="text-3xl group-hover:scale-110 transition-transform">{stat.icon}</span>
                  </div>
                )}
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Minimal variant - Simple horizontal line with stats
  if (variant === 'minimal') {
    return (
      <section className={`py-12 bg-gray-50 border-y border-gray-200 ${isPreview ? 'py-8' : ''}`} ref={sectionRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`grid ${gridCols} gap-8 divide-x divide-gray-200`}>
            {(config.stats || []).map((stat, index) => {
              const numericValue = parseInt(stat.value?.replace(/\D/g, '') || '0') || 0
              const displayValue = animate && isVisible
                ? counters[index]?.toLocaleString() || '0'
                : numericValue.toLocaleString()
              const suffix = stat.value?.replace(/[\d,]/g, '') || ''

              return (
                <div key={index} className="text-center px-8 first:pl-0 last:pr-0">
                  <div className="text-3xl sm:text-4xl font-bold text-gray-900">
                    {displayValue}{suffix}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    )
  }

  // Default animated stats (Green gradient)
  return (
    <section
      className={`py-20 lg:py-28 bg-gradient-to-r from-green-700 via-green-600 to-green-700 ${isPreview ? 'py-12' : ''}`}
      ref={sectionRef}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {config.title && (
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {config.title}
            </h2>
            {config.subtitle && (
              <p className="text-lg text-white/80">{config.subtitle}</p>
            )}
          </div>
        )}

        <div className={`grid ${gridCols} gap-8 lg:gap-12`}>
          {(config.stats || []).map((stat, index) => {
            const numericValue = parseInt(stat.value?.replace(/\D/g, '') || '0') || 0
            const displayValue = animate && isVisible
              ? counters[index]?.toLocaleString() || '0'
              : numericValue.toLocaleString()
            const suffix = stat.value?.replace(/[\d,]/g, '') || ''

            return (
              <div
                key={index}
                className="text-center group"
              >
                {stat.icon && (
                  <div className="text-6xl mb-4 opacity-80">{stat.icon}</div>
                )}
                <div
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-2"
                >
                  {displayValue}{suffix}
                </div>
                <div className="text-lg text-white/80 font-medium">
                  {stat.label}
                </div>
              </div>
            )
          })}
        </div>

        {/* Placeholder */}
        {(!config.stats || config.stats.length === 0) && (
          <div className={`grid ${gridCols} gap-8`}>
            {Array.from({ length: parseInt(columns) }).map((_, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl sm:text-5xl font-bold text-white/50">0</div>
                <div className="text-lg text-white/50 mt-2">Statistik {index + 1}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
