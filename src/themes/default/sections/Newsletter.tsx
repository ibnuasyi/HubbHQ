'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

interface NewsletterProps {
  config: {
    variant?: string
    title?: string
    subtitle?: string
    description?: string
    buttonText?: string
    placeholder?: string
    backgroundColor?: string
  }
  isPreview?: boolean
}

export default function Newsletter({ config, isPreview = false }: NewsletterProps) {
  const variant = config.variant || 'default'
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (res.ok) {
        setSubscribed(true)
        setEmail('')
      } else {
        const data = await res.json()
        setError(data.error || 'Terjadi kesalahan')
      }
    } catch {
      setError('Terjadi kesalahan saat mengirim')
    } finally {
      setSubmitting(false)
    }
  }

  const bgStyle = config.backgroundColor ? {
    backgroundColor: config.backgroundColor
  } : {}

  // Minimal variant
  if (variant === 'minimal') {
    return (
      <section className={`py-12 bg-gray-50 ${isPreview ? 'py-8' : ''}`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-3xl mx-auto">
            <h3 className="text-xl font-bold text-gray-900">
              {config.title || 'Berlangganan Newsletter'}
            </h3>
            {subscribed ? (
              <span className="text-green-600 font-semibold">✓ Berlangganan!</span>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder={config.placeholder || 'Email Anda'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? '...' : (config.buttonText || 'Subscribe')}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    )
  }

  // Default variant
  return (
    <section className={`py-20 bg-gradient-to-r from-indigo-600 to-purple-600 ${isPreview ? 'py-12' : ''}`} style={bgStyle}>
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-5xl mb-6 block">✉️</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {config.title || 'Berlangganan Newsletter'}
          </h2>
          {config.subtitle && (
            <p className="text-xl text-white/90 mb-2">
              {config.subtitle}
            </p>
          )}
          {config.description && (
            <p className="text-white/80 mb-8">
              {config.description}
            </p>
          )}

          {subscribed ? (
            <div className="bg-white/10 backdrop-blur rounded-2xl p-8">
              <div className="w-14 h-14 mx-auto rounded-full bg-white/20 flex items-center justify-center text-white mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Terima Kasih!</h3>
              <p className="text-white/90">Anda berhasil berlangganan newsletter kami.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  placeholder={config.placeholder || 'Masukkan email Anda'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-6 py-4 rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 shadow-lg"
                >
                  {submitting ? 'Mengirim...' : (config.buttonText || 'Berlangganan')}
                </button>
              </div>
              {error && (
                <p className="text-red-300 text-sm">{error}</p>
              )}
            </form>
          )}

          <p className="text-white/60 text-sm mt-6">
            Kami menghargai privasi Anda. Unsubscribe kapan saja.
          </p>
        </div>
      </div>
    </section>
  )
}
