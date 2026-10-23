'use client'

import { useState, useEffect, useRef } from 'react'
import { DynamicIcon } from '@/components/ui/dynamic-icon'

interface Stat {
  value?: string
  label?: string
  icon?: string
  color?: string
  description?: string
}

interface StatsProps {
  config: {
    variant?: string
    title?: string
    stats?: Stat[]
    columns?: '2' | '3' | '4' | '6'
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
    if (!animate) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
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
          const step = Math.ceil(target / 50)

          if (current < target) {
            newCounters[index] = Math.min(current + step, target)
          } else {
            newCounters[index] = target
          }
        })
        return newCounters
      })
    }, 30)

    return () => clearInterval(interval)
  }, [isVisible, animate, config.stats])

  const gridCols = {
    '2': 'md:grid-cols-2',
    '3': 'md:grid-cols-3',
    '4': 'md:grid-cols-2 lg:grid-cols-4',
    '6': 'md:grid-cols-3 lg:grid-cols-6'
  }[columns]

  // Cards variant
  if (variant === 'cards') {
    return (
      <section className={`py-20 bg-white ${isPreview ? 'py-12' : ''}`} ref={sectionRef}>
        <div className="container mx-auto px-4">
          {config.title && (
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {config.title}
              </h2>
            </div>
          )}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(config.stats || []).map((stat, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl shadow-lg text-center border border-gray-100 hover:border-green-200 hover:shadow-xl transition-all"
              >
                {stat.value && (
                  <div className="text-4xl font-bold text-green-600 mb-2">{stat.value}</div>
                )}
                <div className="text-lg font-semibold text-gray-900 mb-2">{stat.label}</div>
                {stat.description && (
                  <p className="text-gray-600 text-sm">{stat.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Default animated stats (Green theme modern style)
  return (
    <section className={`py-16 lg:py-20 bg-gradient-to-r from-green-700 via-green-600 to-green-700 ${isPreview ? 'py-12' : ''}`} ref={sectionRef}>
      <div className="container mx-auto px-4">
        {config.title && (
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {config.title}
            </h2>
          </div>
        )}
        <div className={`grid ${gridCols} gap-8`}>
          {(config.stats || []).map((stat, index) => {
            const numericValue = parseInt(stat.value?.replace(/\D/g, '') || '0') || 0
            const displayValue = animate && isVisible
              ? counters[index]?.toLocaleString() || '0'
              : numericValue.toLocaleString()
            const suffix = stat.value?.replace(/[\d,]/g, '') || ''

            return (
              <div
                key={index}
                className="text-center"
              >
                {stat.icon && (
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <DynamicIcon name={stat.icon} className="w-7 h-7 text-white" />
                    </div>
                  </div>
                )}
                <div
                  className="text-4xl md:text-5xl font-bold text-white mb-2"
                  style={{ color: stat.color || 'white' }}
                >
                  {displayValue}{suffix}
                </div>
                <div className="text-lg text-white/80">
                  {stat.label}
                </div>
              </div>
            )
          })}
        </div>

        {/* Placeholder if no stats */}
        {(!config.stats || config.stats.length === 0) && (
          <div className={`grid ${gridCols} gap-8`}>
            {Array.from({ length: parseInt(columns) }).map((_, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">0</div>
                <div className="text-lg text-white/80">Statistik {index + 1}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
