'use client'

import * as React from 'react'
import Link from 'next/link'
import { useWebsiteConfig } from '@/hooks/use-website-config'
import { Mail, Phone, MapPin, Clock, Facebook, Instagram, Twitter, Youtube } from 'lucide-react'

interface FooterProps {
  config?: {
    columns?: Array<{
      title: string
      links: Array<{ label: string; href: string }>
    }>
    socialLinks?: Array<{
      platform?: string
      url?: string
      icon?: string
    }>
    copyright?: string
    logo?: string
    showNewsletter?: boolean
  }
  isPreview?: boolean
}

export default function Footer({ config, isPreview = false }: FooterProps) {
  const { config: websiteConfig } = useWebsiteConfig()

  const defaultColumns = [
    {
      title: 'Menu',
      links: [
        { label: 'Beranda', href: '/' },
        { label: 'Tentang Kami', href: '/tentang' },
        { label: 'Visi Misi', href: '/visi-misi' },
        { label: 'Berita', href: '/berita' },
        { label: 'Kontak', href: '/kontak' }
      ]
    },
    {
      title: 'Program',
      links: [
        { label: 'Pendidikan', href: '/program/pendidikan' },
        { label: 'Sosial', href: '/program/sosial' },
        { label: 'Advokasi', href: '/program/advokasi' }
      ]
    },
    {
      title: 'Lainnya',
      links: [
        { label: 'FAQ', href: '/faq' },
        { label: 'Struktur Organisasi', href: '/struktur' },
        { label: 'Galeri', href: '/galeri' }
      ]
    }
  ]

  const columns = config?.columns || defaultColumns

  return (
    <footer className={`bg-slate-900 text-slate-300 ${isPreview ? 'py-12' : ''}`}>
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1 - About */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              {config?.logo ? (
                <img src={config.logo} alt="Logo" className="h-10" />
              ) : (
                <>
                  <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
                    <span className="text-xl">🏛️</span>
                  </div>
                  <span className="text-xl font-bold text-white">
                    {websiteConfig.appName || 'Organisasi'}
                  </span>
                </>
              )}
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              {websiteConfig.appDescription || 'Organisasi yang bergerak di bidang sosial dan kemanusiaan untuk membangun masyarakat yang lebih baik.'}
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              {websiteConfig.facebookUrl && (
                <a
                  href={websiteConfig.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-green-600 flex items-center justify-center transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {websiteConfig.instagramUrl && (
                <a
                  href={websiteConfig.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-green-600 flex items-center justify-center transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {websiteConfig.twitterUrl && (
                <a
                  href={websiteConfig.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-green-600 flex items-center justify-center transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              )}
              {websiteConfig.youtubeUrl && (
                <a
                  href={websiteConfig.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-green-600 flex items-center justify-center transition-colors"
                >
                  <Youtube className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Link Columns */}
          {columns.map((column, index) => (
            <div key={index}>
              <h3 className="text-white font-semibold mb-4">{column.title}</h3>
              <ul className="space-y-3">
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      href={link.href}
                      className="text-slate-400 hover:text-green-400 transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Column - Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Kontak</h3>
            <ul className="space-y-4">
              {websiteConfig.contactAddress && (
                <li className="flex gap-3">
                  <MapPin className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-400 text-sm">{websiteConfig.contactAddress}</span>
                </li>
              )}
              {websiteConfig.contactPhone && (
                <li className="flex gap-3">
                  <Phone className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <a href={`tel:${websiteConfig.contactPhone}`} className="text-slate-400 hover:text-green-400 transition-colors text-sm">
                    {websiteConfig.contactPhone}
                  </a>
                </li>
              )}
              {websiteConfig.contactEmail && (
                <li className="flex gap-3">
                  <Mail className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <a href={`mailto:${websiteConfig.contactEmail}`} className="text-slate-400 hover:text-green-400 transition-colors text-sm">
                    {websiteConfig.contactEmail}
                  </a>
                </li>
              )}
              <li className="flex gap-3">
                <Clock className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-slate-400 text-sm">Senin - Jumat: 09:00 - 17:00</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} {websiteConfig.appName || 'Organisasi'}. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/kebijakan-privasi" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                Kebijakan Privasi
              </Link>
              <Link href="/syarat-ketentuan" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                Syarat & Ketentuan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
