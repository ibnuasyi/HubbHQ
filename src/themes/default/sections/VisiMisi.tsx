'use client'

interface VisiMisiProps {
  config: {
    variant?: string
    title?: string
    vision?: string
    missionTitle?: string
    missions?: Array<{ number?: string; text?: string; icon?: string }>
    showIcon?: boolean
  }
  isPreview?: boolean
}

export default function VisiMisi({ config, isPreview = false }: VisiMisiProps) {
  const variant = config.variant || 'default'

  // Timeline variant
  if (variant === 'timeline') {
    return (
      <section className={`py-20 bg-white ${isPreview ? 'py-12' : ''}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {config.title || 'Visi & Misi'}
            </h2>
          </div>

          {/* Vision */}
          <div className="max-w-3xl mx-auto mb-16">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">🎯</span>
                <h3 className="text-2xl font-bold">Visi</h3>
              </div>
              <p className="text-xl leading-relaxed">
                {config.vision || 'Visi organisasi...'}
              </p>
            </div>
          </div>

          {/* Missions */}
          {config.missions && config.missions.length > 0 && (
            <div className="max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                {config.missionTitle || 'Misi Kami'}
              </h3>
              <div className="space-y-4">
                {config.missions.map((mission, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                      {mission.number || index + 1}
                    </div>
                    <p className="text-gray-700 text-lg pt-1">{mission.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    )
  }

  // Default variant
  return (
    <section className={`py-20 bg-gray-50 ${isPreview ? 'py-12' : ''}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {config.title || 'Visi & Misi'}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Vision */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-indigo-600">
            <div className="flex items-center gap-3 mb-6">
              {config.showIcon !== false && <span className="text-4xl">🎯</span>}
              <h3 className="text-2xl font-bold text-gray-900">Visi</h3>
            </div>
            <p className="text-gray-600 text-lg leading-relaxed italic">
              &ldquo;{config.vision || 'Visi organisasi...'}&rdquo;
            </p>
          </div>

          {/* Mission */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-purple-600">
            <div className="flex items-center gap-3 mb-6">
              {config.showIcon !== false && <span className="text-4xl">📋</span>}
              <h3 className="text-2xl font-bold text-gray-900">
                {config.missionTitle || 'Misi'}
              </h3>
            </div>
            <ul className="space-y-4">
              {config.missions && config.missions.length > 0 ? (
                config.missions.map((mission, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      {mission.number || index + 1}
                    </span>
                    <span className="text-gray-600">{mission.text}</span>
                  </li>
                ))
              ) : (
                <>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                    <span className="text-gray-600">Misi pertama...</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                    <span className="text-gray-600">Misi kedua...</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                    <span className="text-gray-600">Misi ketiga...</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
