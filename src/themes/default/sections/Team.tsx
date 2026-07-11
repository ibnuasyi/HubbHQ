'use client'

import Image from 'next/image'

interface TeamProps {
  config: {
    variant?: string
    title?: string
    subtitle?: string
    members?: Array<{
      name?: string
      position?: string
      photo?: string
      bio?: string
      linkedin?: string
      twitter?: string
      instagram?: string
    }>
    showSocial?: boolean
    layout?: 'grid' | 'list'
  }
  isPreview?: boolean
}

export default function Team({ config, isPreview = false }: TeamProps) {
  const variant = config.variant || 'default'
  const layout = config.layout || 'grid'

  // Carousel variant (simplified for now)
  if (variant === 'carousel') {
    return (
      <section className={`py-20 bg-gray-900 ${isPreview ? 'py-12' : ''}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {config.title || 'Tim Kami'}
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            {(config.members || []).map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 border-4 border-indigo-500">
                  {member.photo ? (
                    <Image src={member.photo} alt={member.name || ''} width={128} height={128} className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center text-4xl">
                      👤
                    </div>
                  )}
                </div>
                <h3 className="text-white font-bold">{member.name}</h3>
                <p className="text-gray-400">{member.position}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <section className={`py-16 bg-white ${isPreview ? 'py-12' : ''}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {config.title || 'Tim Kami'}
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {(config.members || []).map((member, index) => (
              <div key={index} className="flex items-center gap-3 bg-gray-50 rounded-full px-4 py-2">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  {member.photo ? (
                    <Image src={member.photo} alt={member.name || ''} width={40} height={40} className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center">👤</div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.position}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Default grid/list variant
  const members = config.members || []

  return (
    <section className={`py-20 bg-gray-50 ${isPreview ? 'py-12' : ''}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {config.title || 'Tim Kami'}
          </h2>
          {config.subtitle && (
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {config.subtitle}
            </p>
          )}
        </div>

        <div className={layout === 'list' ? 'space-y-6 max-w-3xl mx-auto' : `grid md:grid-cols-2 lg:grid-cols-4 gap-8`}>
          {members.length > 0 ? (
            members.map((member, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow ${layout === 'list' ? 'flex' : ''}`}
              >
                <div className={`relative ${layout === 'list' ? 'w-32 h-32 flex-shrink-0' : 'aspect-square'}`}>
                  {member.photo ? (
                    <Image
                      src={member.photo}
                      alt={member.name || 'Team member'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <span className="text-5xl text-white">👤</span>
                    </div>
                  )}
                </div>
                <div className={`p-6 ${layout === 'list' ? 'flex-1' : ''}`}>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-indigo-600 font-medium mb-3">{member.position}</p>
                  {member.bio && (
                    <p className="text-gray-600 text-sm mb-4">{member.bio}</p>
                  )}
                  {config.showSocial !== false && (
                    <div className="flex gap-3">
                      {member.linkedin && (
                        <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                        </a>
                      )}
                      {member.twitter && (
                        <a href={member.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                        </a>
                      )}
                      {member.instagram && (
                        <a href={member.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-600">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            // Placeholder
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-lg">
                <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-6xl">👤</span>
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Nama Anggota</h3>
                  <p className="text-indigo-600 font-medium">Jabatan</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
