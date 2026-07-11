'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useWebsiteConfig } from '@/hooks/use-website-config'
import { Menu, X, Phone, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  config?: {
    logo?: string
    logoText?: string
    navLinks?: Array<{
      id: string
      label: string
      href: string
      children?: Array<{ id: string; label: string; href: string }>
    }>
    transparent?: boolean
    sticky?: boolean
  }
  isPreview?: boolean
}

export default function Header({ config, isPreview = false }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { config: websiteConfig } = useWebsiteConfig()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const logoUrl = websiteConfig.logoUrl || config?.logo
  const logoText = websiteConfig.appName || config?.logoText || 'KPRI'
  const isTransparent = config?.transparent && !isScrolled

  // Navigation items
  const navItems = [
    { label: 'Beranda', href: '/' },
    { label: 'Tentang', href: '/tentang' },
    { label: 'Program', href: '/program' },
    { label: 'Berita', href: '/berita' },
    { label: 'Kontak', href: '/kontak' },
  ]

  return (
    <>
      {/* Top Bar - Contact Info */}
      <div className={cn(
        "hidden lg:block border-b transition-colors duration-300",
        isTransparent ? "bg-transparent border-white/20" : "bg-white border-gray-100"
      )}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-10">
            {/* Contact Info */}
            <div className="flex items-center gap-6 text-sm">
              {websiteConfig.contactEmail && (
                <a
                  href={`mailto:${websiteConfig.contactEmail}`}
                  className={cn(
                    "flex items-center gap-2 transition-colors",
                    isTransparent ? "text-white/80 hover:text-white" : "text-gray-600 hover:text-green-600"
                  )}
                >
                  <Mail className="w-4 h-4" />
                  {websiteConfig.contactEmail}
                </a>
              )}
              {websiteConfig.contactPhone && (
                <a
                  href={`tel:${websiteConfig.contactPhone}`}
                  className={cn(
                    "flex items-center gap-2 transition-colors",
                    isTransparent ? "text-white/80 hover:text-white" : "text-gray-600 hover:text-green-600"
                  )}
                >
                  <Phone className="w-4 h-4" />
                  {websiteConfig.contactPhone}
                </a>
              )}
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {websiteConfig.facebookUrl && (
                <a href={websiteConfig.facebookUrl} target="_blank" rel="noopener noreferrer"
                  className={cn(
                    "transition-colors",
                    isTransparent ? "text-white/80 hover:text-white" : "text-gray-500 hover:text-green-600"
                  )}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              )}
              {websiteConfig.instagramUrl && (
                <a href={websiteConfig.instagramUrl} target="_blank" rel="noopener noreferrer"
                  className={cn(
                    "transition-colors",
                    isTransparent ? "text-white/80 hover:text-white" : "text-gray-500 hover:text-green-600"
                  )}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 4.052.014 5.35 0 6.732 0 8.333 0 12.667 12.667 12.667 12.667 12.667C17.333 12.667 20 8.333 20 8.333c0-3.205-.014-3.583-.072-4.849-.196-1.362-.619-2.78-3.977-3.98C12.012.014 11.259 0 8.333 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
              )}
              {websiteConfig.youtubeUrl && (
                <a href={websiteConfig.youtubeUrl} target="_blank" rel="noopener noreferrer"
                  className={cn(
                    "transition-colors",
                    isTransparent ? "text-white/80 hover:text-white" : "text-gray-500 hover:text-green-600"
                  )}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          isTransparent
            ? "bg-transparent"
            : isScrolled
              ? "bg-white shadow-md"
              : "bg-white"
        )}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              {logoUrl ? (
                <Image src={logoUrl} alt={logoText} width={44} height={44} className="object-contain" />
              ) : (
                <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center shadow-md">
                  <span className="text-white text-xl font-bold">K</span>
                </div>
              )}
              <div>
                <span className={cn(
                  "text-xl font-bold transition-colors",
                  isTransparent && !isScrolled ? "text-white" : "text-gray-900"
                )}>
                  {logoText}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 font-medium rounded-lg transition-colors",
                    isTransparent && !isScrolled
                      ? "text-white/90 hover:text-white hover:bg-white/10"
                      : "text-gray-700 hover:text-green-600 hover:bg-green-50"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* CTA Button */}
            <div className="hidden lg:flex items-center gap-4">
              <Link
                href="/anggota/daftar"
                className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                Bergabung
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={cn(
                "lg:hidden p-2 rounded-lg transition-colors",
                isTransparent && !isScrolled
                  ? "text-white hover:bg-white/10"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white border-t">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 text-gray-700 font-medium rounded-lg hover:bg-green-50 hover:text-green-600 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-4">
                <Link
                  href="/anggota/daftar"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full text-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  Bergabung Sekarang
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  )
}
