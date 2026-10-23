'use client'

import Image from 'next/image'
import { Mail, User } from 'lucide-react'

interface TeamProps {
  config: {
    variant?: 'default' | 'grid' | 'list'
    title?: string
    subtitle?: string
    members?: Array<{
      name?: string
      position?: string
      photo?: string
      bio?: string
      email?: string
    }>
  }
  isPreview?: boolean
}

export default function Team({ config, isPreview = false }: TeamProps) {
  const variant = config.variant || 'grid'

  return (
    <section className={`py-20 lg:py-28 bg-gray-50 ${isPreview ? 'py-12' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
            {config.subtitle || 'Tim Kami'}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            {config.title || 'Tim Kami'}
          </h2>
        </div>

        {/* Members Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {(config.members || []).map((member, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
            >
              {/* Photo */}
              <div className="relative aspect-square overflow-hidden">
                {member.photo ? (
                  <Image
                    src={member.photo}
                    alt={member.name || 'Team member'}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white">
                    <User className="w-16 h-16" />
                  </div>
                )}
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {/* Social icon on hover */}
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="absolute bottom-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"
                  >
                    <Mail className="w-5 h-5 text-gray-700" />
                  </a>
                )}
              </div>

              {/* Info */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {member.name || `Anggota ${index + 1}`}
                </h3>
                <p className="text-green-600 font-medium text-sm mb-2">
                  {member.position || 'Staff'}
                </p>
                {member.bio && (
                  <p className="text-gray-500 text-sm line-clamp-2">
                    {member.bio}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Placeholder if no members */}
        {(!config.members || config.members.length === 0) && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-300">
                  <User className="w-16 h-16" />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Nama {item}</h3>
                  <p className="text-green-600 font-medium text-sm">Jabatan</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
