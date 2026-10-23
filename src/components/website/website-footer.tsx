'use client'

import * as React from 'react'
import Link from 'next/link'
import { useWebsiteConfig } from '@/hooks/use-website-config'
import { Mail, Phone, MapPin, Clock, Facebook, Instagram, Twitter, Youtube, Building2 } from 'lucide-react'

export function WebsiteFooter() {
  const { config } = useWebsiteConfig()

  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-slate-900 text-slate-300">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1 - About */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white">
                {config.appName || 'Organisasi'}
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              {config.appDescription || 'Sistem Informasi Anggota Organisasi'}
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              {config.facebookUrl && (
                <a
                  href={config.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-primary flex items-center justify-center transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {config.instagramUrl && (
                <a
                  href={config.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-primary flex items-center justify-center transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {config.twitterUrl && (
                <a
                  href={config.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-primary flex items-center justify-center transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              )}
              {config.youtubeUrl && (
                <a
                  href={config.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-primary flex items-center justify-center transition-colors"
                >
                  <Youtube className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Column 2 - Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Menu</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-slate-400 hover:text-primary transition-colors text-sm">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/tentang-kami" className="text-slate-400 hover:text-primary transition-colors text-sm">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link href="/visi-misi" className="text-slate-400 hover:text-primary transition-colors text-sm">
                  Visi Misi
                </Link>
              </li>
              <li>
                <Link href="/posts" className="text-slate-400 hover:text-primary transition-colors text-sm">
                  Berita
                </Link>
              </li>
              <li>
                <Link href="/anggota" className="text-slate-400 hover:text-primary transition-colors text-sm">
                  Anggota
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 - Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Kontak</h3>
            <ul className="space-y-4">
              {config.contactAddress && (
                <li className="flex gap-3">
                  <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-slate-400 text-sm">{config.contactAddress}</span>
                </li>
              )}
              {config.contactPhone && (
                <li className="flex gap-3">
                  <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                  <a href={`tel:${config.contactPhone}`} className="text-slate-400 hover:text-primary transition-colors text-sm">
                    {config.contactPhone}
                  </a>
                </li>
              )}
              {config.contactEmail && (
                <li className="flex gap-3">
                  <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                  <a href={`mailto:${config.contactEmail}`} className="text-slate-400 hover:text-primary transition-colors text-sm">
                    {config.contactEmail}
                  </a>
                </li>
              )}
              <li className="flex gap-3">
                <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-slate-400 text-sm">Senin - Jumat: 09:00 - 17:00</span>
              </li>
            </ul>
          </div>

          {/* Column 4 - Newsletter */}
          <div>
            <h3 className="text-white font-semibold mb-4">Newsletter</h3>
            <p className="text-slate-400 text-sm mb-4">
              Dapatkan informasi terbaru dari kami
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Email Anda"
                className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors text-sm"
              >
                Kirim
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © {currentYear} {config.appName || 'Organisasi'}. All rights reserved.
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
