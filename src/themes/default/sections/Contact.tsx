'use client'

import { useState } from 'react'

interface ContactProps {
  config: {
    variant?: string
    title?: string
    subtitle?: string
    infoTitle?: string
    address?: string
    phone?: string
    email?: string
    whatsapp?: string
    mapsEmbed?: string
    showForm?: boolean
    socialLinks?: Array<{
      platform?: string
      url?: string
      icon?: string
    }>
  }
  isPreview?: boolean
}

export default function Contact({ config, isPreview = false }: ContactProps) {
  const variant = config.variant || 'default'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setSubmitted(true)
        setFormData({ name: '', email: '', phone: '', message: '' })
      }
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Split variant
  if (variant === 'split') {
    return (
      <section className={`py-20 bg-white ${isPreview ? 'py-12' : ''}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {config.title || 'Hubungi Kami'}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Contact Info */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                {config.infoTitle || 'Informasi Kontak'}
              </h3>

              <div className="space-y-4">
                {config.address && (
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📍</span>
                    <div>
                      <p className="font-semibold text-gray-900">Alamat</p>
                      <p className="text-gray-600">{config.address}</p>
                    </div>
                  </div>
                )}
                {config.phone && (
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📞</span>
                    <div>
                      <p className="font-semibold text-gray-900">Telepon</p>
                      <a href={`tel:${config.phone}`} className="text-indigo-600 hover:underline">
                        {config.phone}
                      </a>
                    </div>
                  </div>
                )}
                {config.email && (
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✉️</span>
                    <div>
                      <p className="font-semibold text-gray-900">Email</p>
                      <a href={`mailto:${config.email}`} className="text-indigo-600 hover:underline">
                        {config.email}
                      </a>
                    </div>
                  </div>
                )}
                {config.whatsapp && (
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">💬</span>
                    <div>
                      <p className="font-semibold text-gray-900">WhatsApp</p>
                      <a href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                        {config.whatsapp}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {config.mapsEmbed && (
                <div className="mt-8">
                  <iframe
                    src={config.mapsEmbed}
                    width="100%"
                    height="300"
                    style={{ border: 0, borderRadius: '12px' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Location Map"
                  />
                </div>
              )}
            </div>

            {/* Contact Form */}
            {config.showForm !== false && (
              <div className="bg-gray-50 p-8 rounded-2xl">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Kirim Pesan</h3>

                {submitted ? (
                  <div className="text-center py-8">
                    <span className="text-5xl mb-4 block">✅</span>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Terima Kasih!</h4>
                    <p className="text-gray-600">Pesan Anda telah terkirim.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pesan</label>
                      <textarea
                        required
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Mengirim...' : 'Kirim Pesan'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  // Default variant
  return (
    <section className={`py-20 bg-gray-900 ${isPreview ? 'py-12' : ''}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {config.title || 'Hubungi Kami'}
          </h2>
          {config.subtitle && (
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              {config.subtitle}
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
          {config.phone && (
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📞</span>
              </div>
              <h3 className="text-white font-bold mb-2">Telepon</h3>
              <a href={`tel:${config.phone}`} className="text-gray-300 hover:text-white">
                {config.phone}
              </a>
            </div>
          )}
          {config.email && (
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✉️</span>
              </div>
              <h3 className="text-white font-bold mb-2">Email</h3>
              <a href={`mailto:${config.email}`} className="text-gray-300 hover:text-white">
                {config.email}
              </a>
            </div>
          )}
          {config.whatsapp && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-white font-bold mb-2">WhatsApp</h3>
              <a href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                {config.whatsapp}
              </a>
            </div>
          )}
        </div>

        {config.address && (
          <div className="text-center mb-12">
            <span className="text-2xl mr-2">📍</span>
            <span className="text-gray-300">{config.address}</span>
          </div>
        )}

        {config.mapsEmbed && (
          <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden">
            <iframe
              src={config.mapsEmbed}
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Location Map"
            />
          </div>
        )}

        {config.showForm !== false && (
          <div className="max-w-2xl mx-auto mt-12">
            <div className="bg-white rounded-2xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Kirim Pesan</h3>

              {submitted ? (
                <div className="text-center py-8">
                  <span className="text-5xl mb-4 block">✅</span>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Terima Kasih!</h4>
                  <p className="text-gray-600">Pesan Anda telah terkirim. Kami akan segera menghubungi Anda.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pesan</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Mengirim...' : 'Kirim Pesan'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {config.socialLinks && config.socialLinks.length > 0 && (
          <div className="flex justify-center gap-4 mt-8">
            {config.socialLinks.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <span className="text-xl">{link.icon}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
