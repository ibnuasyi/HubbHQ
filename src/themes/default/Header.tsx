'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useWebsiteConfig } from '@/hooks/use-website-config'

interface NavLink {
  id: string
  label: string
  href: string
  icon?: string | null
  children?: NavLink[]
  isExternal?: boolean
}

interface HeaderProps {
  config?: {
    logo?: string
    logoText?: string
    navLinks?: NavLink[]
    showSearch?: boolean
    transparent?: boolean
    sticky?: boolean
  }
  isPreview?: boolean
}

const defaultNavLinks: NavLink[] = [
  { id: 'home', label: 'Beranda', href: '/' },
  {
    id: 'about',
    label: 'Tentang',
    href: '/tentang',
    children: [
      { id: 'about-profil', label: 'Profil', href: '/tentang/profil' },
      { id: 'about-visi', label: 'Visi Misi', href: '/tentang/visi-misi' },
      { id: 'about-struktur', label: 'Struktur', href: '/tentang/struktur' }
    ]
  },
  { id: 'program', label: 'Program', href: '/program' },
  { id: 'galeri', label: 'Galeri', href: '/galeri' },
  { id: 'berita', label: 'Berita', href: '/berita' },
  { id: 'kontak', label: 'Kontak', href: '/kontak' }
]

export default function Header({ config, isPreview = false }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [navLinks, setNavLinks] = useState<NavLink[]>(defaultNavLinks)
  const [loading, setLoading] = useState(true)
  const { config: websiteConfig } = useWebsiteConfig()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch menu from API
  useEffect(() => {
    async function fetchMenu() {
      // If config has navLinks, use that instead of fetching
      if (config?.navLinks) {
        setNavLinks(config.navLinks as NavLink[])
        setLoading(false)
        return
      }

      try {
        const res = await fetch('/api/menu')
        if (res.ok) {
          const data = await res.json()
          if (data.length > 0) {
            // Transform database menu to component format
            const transformed = data.map((item: any) => ({
              id: item.id,
              label: item.label,
              href: item.href,
              icon: item.icon,
              isExternal: item.isExternal,
              children: item.children?.map((child: any) => ({
                id: child.id,
                label: child.label,
                href: child.href,
                icon: child.icon,
                isExternal: child.isExternal,
              }))
            }))
            setNavLinks(transformed)
          }
        }
      } catch (error) {
        console.error('Error fetching menu:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!isPreview) {
      fetchMenu()
    } else {
      setLoading(false)
    }
  }, [isPreview, config])

  const isTransparent = config?.transparent && !isScrolled
  const isSticky = config?.sticky !== false

  // Use website config for logo and name
  const logoUrl = websiteConfig.logoUrl || config?.logo
  const logoText = websiteConfig.appName || config?.logoText || 'Organisasi'

  if (loading) {
    return (
      <header className="h-16 md:h-20 bg-white border-b animate-pulse">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="h-8 w-32 bg-gray-200 rounded" />
          <div className="hidden md:flex items-center gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-4 w-16 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </header>
    )
  }

  return (
    <header
      className={`${isSticky ? 'sticky top-0 z-50' : ''} transition-all duration-300 ${
        isTransparent
          ? 'absolute top-0 left-0 right-0 bg-transparent'
          : isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm'
          : 'bg-white'
      }`}
    >
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            {logoUrl ? (
              <Image src={logoUrl} alt={logoText} width={40} height={40} className="object-contain" />
            ) : (
              <>
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white text-xl">🏛️</span>
                </div>
                <span className={`text-xl font-bold hidden sm:block ${isTransparent && !isScrolled ? 'text-white' : 'text-gray-900'}`}>
                  {logoText}
                </span>
              </>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <div key={link.id} className="relative">
                {link.children && link.children.length > 0 ? (
                  <div
                    className="relative"
                    onMouseEnter={() => setOpenDropdown(link.id)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button
                      className={`flex items-center gap-1 px-4 py-2 font-medium transition-colors rounded-lg ${
                        isTransparent && !isScrolled
                          ? 'text-white/90 hover:text-white hover:bg-white/10'
                          : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {link.icon && <span className="mr-1">{link.icon}</span>}
                      {link.label}
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openDropdown === link.id && (
                      <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg py-2 border border-gray-100">
                        {link.children.map((child) => (
                          <Link
                            key={child.id}
                            href={child.href}
                            target={child.isExternal ? '_blank' : undefined}
                            rel={child.isExternal ? 'noopener noreferrer' : undefined}
                            className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                          >
                            {child.icon && <span className="mr-2">{child.icon}</span>}
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={link.href}
                    target={link.isExternal ? '_blank' : undefined}
                    rel={link.isExternal ? 'noopener noreferrer' : undefined}
                    className={`px-4 py-2 font-medium transition-colors rounded-lg ${
                      isTransparent && !isScrolled
                        ? 'text-white/90 hover:text-white hover:bg-white/10'
                        : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {link.icon && <span className="mr-1">{link.icon}</span>}
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* CTA Button - Join */}
            <Link
              href="/anggota/daftar"
              className={`hidden lg:inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isTransparent && !isScrolled
                  ? 'bg-white text-green-700 hover:bg-green-50'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              Bergabung
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                isTransparent && !isScrolled
                  ? 'text-white hover:bg-white/10'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-100">
            {navLinks.map((link) => (
              <div key={link.id}>
                <Link
                  href={link.href}
                  target={link.isExternal ? '_blank' : undefined}
                  rel={link.isExternal ? 'noopener noreferrer' : undefined}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block py-3 px-4 font-medium border-b border-gray-50 ${
                    isTransparent && !isScrolled ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {link.icon && <span className="mr-2">{link.icon}</span>}
                  {link.label}
                </Link>
                {link.children && link.children.length > 0 && (
                  <div className="pl-4 space-y-1 bg-gray-50/50">
                    {link.children.map((child) => (
                      <Link
                        key={child.id}
                        href={child.href}
                        target={child.isExternal ? '_blank' : undefined}
                        rel={child.isExternal ? 'noopener noreferrer' : undefined}
                        onClick={() => setIsMenuOpen(false)}
                        className={`block py-2 px-4 text-sm ${
                          isTransparent && !isScrolled ? 'text-white/80' : 'text-gray-600'
                        }`}
                      >
                        {child.icon && <span className="mr-2">{child.icon}</span>}
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-4 px-4">
              <Link
                href="/anggota/daftar"
                onClick={() => setIsMenuOpen(false)}
                className="block w-full text-center py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Bergabung Sekarang
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
