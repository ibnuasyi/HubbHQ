'use client'

import * as React from 'react'
import Link from 'next/link'
import { useWebsiteConfig } from '@/hooks/use-website-config'
import { Mail, Phone, MapPin, Clock, Facebook, Instagram, Twitter, Youtube, ArrowRight } from 'lucide-react'

interface FooterProps {
  config?: {
    columns?: Array<{
      title: string
      links: Array<{ label: string; href: string }>
    }>
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
        { label: 'Program Kerja', href: '/program' },
        { label: 'Berita', href: '/berita' },
      ]
    },
    {
      title: 'Layanan',
      links: [
        { label: 'Pendaftaran Anggota', href: '/anggota/daftar' },
        { label: 'Donasi', href: '/donasi' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Hubungi Kami', href: '/kontak' },
      ]
    },
    {
      title: 'Informasi',
      links: [
        { label: 'Struktur Organisasi', href: '/struktur' },
        { label: 'Galeri', href: '/galeri' },
        { label: 'Dokumen', href: '/dokumen' },
        { label: 'Kebijakan Privasi', href: '/privacy' },
      ]
    }
  ]

  const columns = config?.columns || defaultColumns

  const currentYear = new Date().getFullYear()

  return (
    <footer className={`bg-gray-900 text-gray-300 ${isPreview ? 'py-12' : ''}`}>
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Column 1 - Brand */}
          <div className="lg:col-span-2">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">H</span>
              </div>
              <div>
                <span className="text-xl font-bold text-white">
                  {websiteConfig.appName || 'HubbHQ'}
                </span>
                <p className="text-xs text-gray-500">Sistem Informasi Organisasi</p>
              </div>
            </Link>

            {/* Description */}
            <p className="text-gray-400 leading-relaxed mb-6 max-w-sm">
              {websiteConfig.appDescription || 'Organisasi yang berdedikasi untuk membangun Indonesia yang lebih baik melalui pemberdayaan masyarakat.'}
            </p>

            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              {websiteConfig.contactAddress && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400">{websiteConfig.contactAddress}</span>
                </div>
              )}
              {websiteConfig.contactPhone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <a href={`tel:${websiteConfig.contactPhone}`} className="text-gray-400 hover:text-green-400 transition-colors">
                    {websiteConfig.contactPhone}
                  </a>
                </div>
              )}
              {websiteConfig.contactEmail && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <a href={`mailto:${websiteConfig.contactEmail}`} className="text-gray-400 hover:text-green-400 transition-colors">
                    {websiteConfig.contactEmail}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-400">Senin - Jumat: 09:00 - 17:00</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {websiteConfig.facebookUrl && (
                <a href={websiteConfig.facebookUrl} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-800 hover:bg-green-600 flex items-center justify-center transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {websiteConfig.instagramUrl && (
                <a href={websiteConfig.instagramUrl} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-800 hover:bg-green-600 flex items-center justify-center transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {websiteConfig.twitterUrl && (
                <a href={websiteConfig.twitterUrl} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-800 hover:bg-green-600 flex items-center justify-center transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
              )}
              {websiteConfig.youtubeUrl && (
                <a href={websiteConfig.youtubeUrl} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-800 hover:bg-green-600 flex items-center justify-center transition-colors">
                  <Youtube className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Link Columns */}
          {columns.map((column, index) => (
            <div key={index}>
              <h3 className="text-white font-bold mb-6">{column.title}</h3>
              <ul className="space-y-4">
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link href={link.href}
                      className="text-gray-400 hover:text-green-400 transition-colors text-sm inline-flex items-center gap-1 group">
                      {link.label}
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter Column */}
          <div>
            <h3 className="text-white font-bold mb-6">Newsletter</h3>
            <p className="text-gray-400 text-sm mb-4">
              Dapatkan informasi terbaru dari kami
            </p>
            <form className="space-y-3">
              <input
                type="email"
                placeholder="Email Anda"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500 transition-colors text-sm"
              />
              <button
                type="submit"
                className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors text-sm flex items-center justify-center gap-2"
              >
                Berlangganan
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {currentYear} {websiteConfig.appName || 'HubbHQ'}. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/kebijakan-privasi" className="text-gray-500 hover:text-gray-300 transition-colors">
                Kebijakan Privasi
              </Link>
              <Link href="/syarat-ketentuan" className="text-gray-500 hover:text-gray-300 transition-colors">
                Syarat & Ketentuan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
