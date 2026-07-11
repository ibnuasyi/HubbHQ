'use client'

import Image from 'next/image'

interface Partner {
  name?: string
  logo?: string
  website?: string
  tier?: 'platinum' | 'gold' | 'silver'
}

interface PartnersProps {
  config: {
    variant?: string
    title?: string
    subtitle?: string
    partners?: Partner[]
    showTiers?: boolean
  }
  isPreview?: boolean
}

export default function Partners({ config, isPreview = false }: PartnersProps) {
  const variant = config.variant || 'default'

  const tierColors = {
    platinum: 'from-gray-300 to-gray-500',
    gold: 'from-yellow-300 to-yellow-500',
    silver: 'from-gray-200 to-gray-400'
  }

  const tierLabels = {
    platinum: '🥇 Platinum',
    gold: '🥈 Gold',
    silver: '🥉 Silver'
  }

  // Group partners by tier
  const partnersByTier = config.partners?.reduce((acc, partner) => {
    const tier = partner.tier || 'silver'
    if (!acc[tier]) acc[tier] = []
    acc[tier].push(partner)
    return acc
  }, {} as Record<string, Partner[]>)

  // Carousel variant
  if (variant === 'carousel') {
    return (
      <section className={`py-20 bg-gray-50 ${isPreview ? 'py-12' : ''}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {config.title || 'Mitra & Partner'}
            </h2>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {(config.partners || []).map((partner, index) => (
              <a
                key={index}
                href={partner.website || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                {partner.logo ? (
                  <div className="w-32 h-20 relative grayscale group-hover:grayscale-0 transition-all duration-300">
                    <Image
                      src={partner.logo}
                      alt={partner.name || 'Partner'}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 font-semibold">{partner.name}</span>
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Default variant with tiers
  return (
    <section className={`py-20 bg-white ${isPreview ? 'py-12' : ''}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {config.title || 'Mitra & Partner'}
          </h2>
          {config.subtitle && (
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {config.subtitle}
            </p>
          )}
        </div>

        {config.showTiers !== false && partnersByTier ? (
          <div className="space-y-16">
            {(['platinum', 'gold', 'silver'] as const).map(tier => {
              const tierPartners = partnersByTier[tier]
              if (!tierPartners?.length) return null

              return (
                <div key={tier}>
                  <div className="text-center mb-8">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${tierColors[tier]} text-white font-semibold`}>
                      {tierLabels[tier]}
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-8">
                    {tierPartners.map((partner, index) => (
                      <a
                        key={index}
                        href={partner.website || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group"
                      >
                        {partner.logo ? (
                          <div className={`w-40 h-24 relative grayscale group-hover:grayscale-0 transition-all duration-300 ${
                            tier === 'platinum' ? 'w-48 h-28' : tier === 'gold' ? 'w-44 h-26' : ''
                          }`}>
                            <Image
                              src={partner.logo}
                              alt={partner.name || 'Partner'}
                              fill
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${tier === 'platinum' ? 'w-48 h-28' : tier === 'gold' ? 'w-44 h-26' : 'w-40 h-24'}`}>
                            <span className="text-gray-600 font-semibold">{partner.name}</span>
                          </div>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {(config.partners || []).map((partner, index) => (
              <a
                key={index}
                href={partner.website || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                {partner.logo ? (
                  <div className="w-40 h-24 relative grayscale group-hover:grayscale-0 transition-all duration-300">
                    <Image
                      src={partner.logo}
                      alt={partner.name || 'Partner'}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-40 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 font-semibold">{partner.name}</span>
                  </div>
                )}
              </a>
            ))}

            {/* Placeholder if no partners */}
            {(!config.partners || config.partners.length === 0) && (
              <div className="w-full text-center py-12 text-gray-400">
                <p className="text-4xl mb-4">🤝</p>
                <p>Mitra akan ditampilkan di sini</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
