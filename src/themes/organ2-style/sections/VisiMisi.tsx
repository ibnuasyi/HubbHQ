'use client'

import { CheckCircle2 } from 'lucide-react'

interface VisiMisiProps {
  config: {
    title?: string
    subtitle?: string
    vision?: string
    missionTitle?: string
    missions?: Array<{ number?: string; text?: string }>
    image?: string
  }
  isPreview?: boolean
}

export default function VisiMisi({ config, isPreview = false }: VisiMisiProps) {
  return (
    <section className={`py-20 lg:py-28 bg-white ${isPreview ? 'py-12' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Visi */}
          <div className="relative">
            <div className="sticky top-24">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Visi Kami
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                {config.title || 'Visi & Misi'}
              </h2>
              <div className="p-8 bg-gradient-to-br from-green-50 to-green-100/50 rounded-3xl border border-green-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <p className="text-xl text-gray-700 leading-relaxed font-medium">
                    {config.vision || 'Menjadi organisasi yang unggul dalam pemberdayaan masyarakat dan generasi muda Indonesia.'}
                  </p>
                </div>
              </div>

              {/* Decorative */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-green-100 rounded-3xl -z-10 opacity-50" />
            </div>
          </div>

          {/* Misi */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-amber-500 rounded-full" />
              {config.missionTitle || 'Misi Kami'}
            </div>

            <div className="space-y-6">
              {(config.missions || []).map((mission, index) => (
                <div
                  key={index}
                  className="flex items-start gap-5 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-green-600">
                      {mission.number || index + 1}
                    </span>
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-gray-700 font-medium">
                      {mission.text || 'Misi tidak tersedia'}
                    </p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                </div>
              ))}

              {(!config.missions || config.missions.length === 0) && (
                <>
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-5 p-6 bg-white rounded-2xl border border-gray-100"
                    >
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-green-600">{item}</span>
                      </div>
                      <p className="text-gray-500 italic">Misi {item}...</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
