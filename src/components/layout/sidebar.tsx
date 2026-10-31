'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Users,
  FolderKanban,
  Wallet,
  Calendar,
  Mail,
  Library,
  Globe,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  UserCircle,
  Shield,
  MapPin,
  FileText,
  Sun,
  Moon,
  Monitor,
  Menu,
  X,
  Paintbrush,
  Palette,
  Tag,
  Network,
  FileCheck,
  Images,
  HelpCircle,
  Settings,
  CreditCard,
  Boxes,
  Vote,
  GraduationCap,
  HeartHandshake,
  Scale,
  MessageSquareQuote,
  UserPlus,
  Award,
  HardDrive,
  QrCode,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { useWebsiteConfig } from '@/hooks/use-website-config'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NavItem {
  title: string
  href?: string
  icon: React.ElementType
  items?: NavItem[]
}

interface NavSection {
  title?: string
  items: NavItem[]
}

// Section separator component
function NavSectionLabel({ title }: { title: string }) {
  return (
    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      {title}
    </div>
  )
}

const navigationItems: NavSection[] = [
  {
    title: 'Dashboard',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Aplikasi',
    items: [
      {
        title: 'Anggota',
        href: '/dashboard/anggota',
        icon: Users,
      },
      {
        title: 'KTA Digital',
        href: '/dashboard/kta',
        icon: CreditCard,
      },
      {
        title: 'Divisi',
        href: '/dashboard/divisi',
        icon: FolderKanban,
      },
      {
        title: 'Struktur Organisasi',
        href: '/dashboard/orgchart',
        icon: Network,
      },
      {
        title: 'Program Kerja',
        href: '/dashboard/proker',
        icon: Calendar,
      },
      {
        title: 'Proposal Dana',
        href: '/dashboard/proposal',
        icon: FileCheck,
      },
      {
        title: 'Keuangan',
        href: '/dashboard/keuangan',
        icon: Wallet,
      },
      {
        title: 'Inventaris & Aset',
        href: '/dashboard/inventaris',
        icon: Boxes,
      },
      {
        title: 'E-Voting Musyawarah',
        href: '/dashboard/voting',
        icon: Vote,
      },
      {
        title: 'Open Recruitment (Oprec)',
        href: '/dashboard/oprec',
        icon: UserPlus,
      },
      {
        title: 'Studio E-Sertifikat',
        href: '/dashboard/sertifikat',
        icon: Award,
      },
      {
        title: 'Kotak Aspirasi & Advokasi',
        href: '/dashboard/aspirasi',
        icon: MessageSquareQuote,
      },
      {
        title: 'Diklat & Kaderisasi',
        href: '/dashboard/kaderisasi',
        icon: GraduationCap,
      },
      {
        title: 'Jejaring Alumni',
        href: '/dashboard/alumni',
        icon: HeartHandshake,
      },
      {
        title: 'Persidangan & TAP Mubes',
        href: '/dashboard/sidang',
        icon: Scale,
      },
      {
        title: 'Surat',
        href: '/dashboard/surat',
        icon: Mail,
      },
      {
        title: 'Kalender',
        href: '/dashboard/kalender',
        icon: Calendar,
      },
      {
        title: 'Library',
        href: '/dashboard/library',
        icon: Library,
      },
    ],
  },
  {
    title: 'Website',
    items: [
      {
        title: 'Website Builder',
        href: '/dashboard/pages',
        icon: Paintbrush,
      },
      {
        title: 'Posts',
        href: '/dashboard/posts',
        icon: FileText,
      },
      {
        title: 'Galeri Media',
        href: '/dashboard/gallery',
        icon: Images,
      },
      {
        title: 'Tanya Jawab (FAQ)',
        href: '/dashboard/faq',
        icon: HelpCircle,
      },
      {
        title: 'Kategori',
        href: '/dashboard/settings/categories',
        icon: Tag,
      },
      {
        title: 'Menu',
        href: '/dashboard/settings/menu',
        icon: Menu,
      },
      {
        title: 'Tema',
        href: '/dashboard/settings/themes',
        icon: Palette,
      },
      {
        title: 'Pengaturan Website',
        href: '/dashboard/settings/website',
        icon: Globe,
      },
    ],
  },
  {
    title: 'Pengaturan',
    items: [
      {
        title: 'Pusat Pengaturan',
        href: '/dashboard/settings',
        icon: Settings,
      },
      {
        title: 'Role & Permission',
        href: '/dashboard/settings/roles',
        icon: Shield,
      },
      {
        title: 'Wilayah',
        href: '/dashboard/settings/wilayah',
        icon: MapPin,
      },
      {
        title: 'Jabatan',
        href: '/dashboard/settings/jabatan',
        icon: UserCircle,
      },
      {
        title: 'Jenis Surat',
        href: '/dashboard/settings/jenis-surat',
        icon: FileText,
      },
      {
        title: 'Penyimpanan Berkas',
        href: '/dashboard/settings/storage',
        icon: HardDrive,
      },
      {
        title: 'Pembayaran QRIS',
        href: '/dashboard/settings/qris',
        icon: QrCode,
      },
    ],
  },
]

interface SidebarContextType {
  isCollapsed: boolean
  setIsCollapsed: (value: boolean) => void
  isMobileOpen: boolean
  setIsMobileOpen: (value: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextType>({
  isCollapsed: false,
  setIsCollapsed: () => {},
  isMobileOpen: false,
  setIsMobileOpen: () => {},
})

export function useSidebar() {
  return React.useContext(SidebarContext)
}

export function Sidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { config } = useWebsiteConfig() // Use the shared hook
  const [expandedItems, setExpandedItems] = React.useState<string[]>([])
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [isMobileOpen, setIsMobileOpen] = React.useState(false)

  // Close mobile sidebar on route change
  React.useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  // Handle Escape key to close mobile sidebar (WCAG 2.1)
  React.useEffect(() => {
    if (!isMobileOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMobileOpen])

  const toggleExpand = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    )
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }}>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b bg-card px-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Buka menu navigasi"
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Link href="/dashboard" className="flex items-center gap-2">
          {config.logoUrl ? (
            <img src={config.logoUrl} alt="Logo" className="h-6 w-6 object-contain rounded" />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <Home className="h-3 w-3 text-primary-foreground" />
            </div>
          )}
          <span className="font-semibold">{config.appName || 'HubbHQ'}</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Ganti mode tema"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-5 w-5 dark:hidden" />
          <Moon className="h-5 w-5 hidden dark:block" />
        </Button>
      </header>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r bg-card transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Fixed header */}
        <div className="flex-shrink-0">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            {!isCollapsed && (
              <Link href="/dashboard" className="flex items-center gap-2">
                {config.logoUrl ? (
                  <img src={config.logoUrl} alt="Logo" className="h-8 w-8 object-contain rounded" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <Home className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <span className="text-lg font-semibold">{config.appName || 'HubbHQ'}</span>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-8 w-8', isCollapsed && 'mx-auto')}
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? 'Perluas bilah sisi' : 'Ciutkan bilah sisi'}
              title={isCollapsed ? 'Perluas bilah sisi' : 'Ciutkan bilah sisi'}
            >
              <ChevronLeft className={cn('h-4 w-4 transition-transform', isCollapsed && 'rotate-180')} />
            </Button>
          </div>

          {/* Theme Switcher */}
          {!isCollapsed && (
            <div className="flex items-center justify-end gap-1 border-b px-4 py-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label={theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
                title={theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              >
                <Sun className="h-4 w-4 dark:hidden" />
                <Moon className="h-4 w-4 hidden dark:block" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Pengaturan tema sistem">
                    <Monitor className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme('light')}>
                    <Sun className="mr-2 h-4 w-4" />
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')}>
                    <Moon className="mr-2 h-4 w-4" />
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')}>
                    <Monitor className="mr-2 h-4 w-4" />
                    System
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Scrollable navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          <div className="space-y-1 px-2">
            {navigationItems.map((section, sectionIndex) => (
              <div key={section.title || sectionIndex}>
                {section.title && !isCollapsed && (
                  <NavSectionLabel title={section.title} />
                )}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <div key={item.title}>
                      {item.items ? (
                        <div>
                          <Button
                            variant="ghost"
                            className={cn(
                              'w-full justify-between',
                              expandedItems.includes(item.title) && 'bg-muted',
                              isCollapsed && 'px-2 justify-center'
                            )}
                            onClick={() => toggleExpand(item.title)}
                            title={isCollapsed ? item.title : undefined}
                          >
                            <span className="flex items-center gap-2">
                              <item.icon className="h-4 w-4 flex-shrink-0" />
                              {!isCollapsed && item.title}
                            </span>
                            {!isCollapsed && (
                              expandedItems.includes(item.title) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )
                            )}
                          </Button>
                          {!isCollapsed && expandedItems.includes(item.title) && (
                            <div className="ml-6 mt-1 space-y-1">
                              {item.items.map((subItem) => (
                                <Link key={subItem.title} href={subItem.href || '#'}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                      'w-full justify-start',
                                      isActive(subItem.href || '') && 'bg-muted'
                                    )}
                                  >
                                    <subItem.icon className="mr-2 h-4 w-4" />
                                    {subItem.title}
                                  </Button>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Link href={item.href || '#'}>
                          <Button
                            variant="ghost"
                            className={cn(
                              'w-full justify-start',
                              isActive(item.href || '') && 'bg-muted',
                              isCollapsed && 'px-2 justify-center'
                            )}
                            title={isCollapsed ? item.title : undefined}
                            aria-label={isCollapsed ? item.title : undefined}
                          >
                            <item.icon className={cn('h-4 w-4', !isCollapsed && 'mr-2')} />
                            {!isCollapsed && item.title}
                          </Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
                {section.title && sectionIndex < navigationItems.length - 1 && (
                  <div className="my-3 border-b border-border" />
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Fixed footer */}
        <div className="flex-shrink-0 border-t p-3 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {!isCollapsed && 'HubbHQ v1.3.0'}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Ganti Tema Tampilan">
                {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" /> Mode Terang
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" /> Mode Gelap
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Monitor className="mr-2 h-4 w-4" /> Ikuti Sistem
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu navigasi mobile">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 flex flex-col bg-card animate-in slide-in-from-left duration-200">
            <div className="flex-shrink-0">
              <div className="flex h-14 items-center justify-between border-b px-4">
                <Link href="/dashboard" className="flex items-center gap-2">
                  {config.logoUrl ? (
                    <img src={config.logoUrl} alt="Logo" className="h-8 w-8 object-contain rounded" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                      <Home className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                  <span className="text-lg font-semibold">{config.appName || 'HubbHQ'}</span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Tutup menu navigasi"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex items-center justify-end gap-1 border-b px-4 py-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Ganti mode tema"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  <Sun className="h-4 w-4 dark:hidden" />
                  <Moon className="h-4 w-4 hidden dark:block" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Pengaturan tema sistem">
                      <Monitor className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setTheme('light')}>
                      <Sun className="mr-2 h-4 w-4" />
                      Mode Terang
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('dark')}>
                      <Moon className="mr-2 h-4 w-4" />
                      Mode Gelap
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('system')}>
                      <Monitor className="mr-2 h-4 w-4" />
                      Ikuti Sistem
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto overscroll-contain py-2">
              <div className="space-y-1 px-2">
                {navigationItems.map((section, sectionIndex) => (
                  <div key={section.title || sectionIndex}>
                    {section.title && (
                      <NavSectionLabel title={section.title} />
                    )}
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <div key={item.title}>
                          {item.items ? (
                            <div>
                              <Button
                                variant="ghost"
                                className={cn(
                                  'w-full justify-between',
                                  expandedItems.includes(item.title) && 'bg-muted'
                                )}
                                onClick={() => toggleExpand(item.title)}
                              >
                                <span className="flex items-center gap-2">
                                  <item.icon className="h-4 w-4 flex-shrink-0" />
                                  {item.title}
                                </span>
                                {expandedItems.includes(item.title) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                              {expandedItems.includes(item.title) && (
                                <div className="ml-6 mt-1 space-y-1">
                                  {item.items.map((subItem) => (
                                    <Link key={subItem.title} href={subItem.href || '#'}>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                          'w-full justify-start',
                                          isActive(subItem.href || '') && 'bg-muted'
                                        )}
                                      >
                                        <subItem.icon className="mr-2 h-4 w-4" />
                                        {subItem.title}
                                      </Button>
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Link href={item.href || '#'}>
                              <Button
                                variant="ghost"
                                className={cn(
                                  'w-full justify-start',
                                  isActive(item.href || '') && 'bg-muted'
                                )}
                              >
                                <item.icon className="mr-2 h-4 w-4" />
                                {item.title}
                              </Button>
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                    {section.title && sectionIndex < navigationItems.length - 1 && (
                      <div className="my-3 border-b border-border" />
                    )}
                  </div>
                ))}
              </div>
            </nav>
            <div className="flex-shrink-0 border-t p-3 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                HubbHQ v1.3.0
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Ganti Tema Tampilan">
                    {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme('light')}>
                    <Sun className="mr-2 h-4 w-4" /> Mode Terang
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')}>
                    <Moon className="mr-2 h-4 w-4" /> Mode Gelap
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')}>
                    <Monitor className="mr-2 h-4 w-4" /> Ikuti Sistem
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </aside>
        </div>
      )}
    </SidebarContext.Provider>
  )
}
