'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useWebsiteConfig } from '@/hooks/use-website-config'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Menu, X, ChevronDown, User, LogOut, Settings, LayoutDashboard, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  children?: NavItem[]
}

const mainNavItems: NavItem[] = [
  { label: 'Beranda', href: '/' },
  { label: 'Tentang Kami', href: '/tentang-kami' },
  { label: 'Berita', href: '/posts' },
  { label: 'Kalender', href: '/kalender' },
  { label: 'Anggota', href: '/anggota' },
  { label: 'Kontak', href: '/kontak' },
]

export function WebsiteHeader() {
  const pathname = usePathname()
  const { config } = useWebsiteConfig()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isScrolled, setIsScrolled] = React.useState(false)

  // Handle scroll for sticky header
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        isScrolled
          ? 'bg-background/95 backdrop-blur-md shadow-sm border-b'
          : 'bg-background'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt={config.appName || 'Logo'} className="h-10 w-10 object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                <Building2 className="w-5 h-5" />
              </div>
            )}
            <span className="text-xl font-bold text-foreground hidden sm:block">
              {config.appName || 'Organisasi'}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      'text-sm font-medium',
                      isActive && 'text-primary bg-primary/10'
                    )}
                  >
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Desktop CTA & User Menu */}
          <div className="hidden lg:flex items-center gap-4">
            <Link href="/anggota/daftar">
              <Button size="sm" className="font-medium">
                Bergabung
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-md hover:bg-muted transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-background border-t">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link key={item.href} href={item.href}>
                  <button
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted'
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </button>
                </Link>
              )
            })}
            <div className="pt-4 border-t">
              <Link href="/anggota/daftar">
                <Button className="w-full">Bergabung Sekarang</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
