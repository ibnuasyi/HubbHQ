'use client'

import * as React from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Bell, Search, LogOut, User, Settings, Sun, Moon, Monitor } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { getInitials } from '@/lib/utils'

interface HeaderProps {
  title?: string
  description?: string
}

export function Header({ title, description }: HeaderProps) {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div>
        {title && (
          <h1 className="text-xl font-semibold">{title}</h1>
        )}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari..."
            className="w-64 pl-9"
          />
        </div>

        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Ganti Tema">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5 transition-all" />
              ) : (
                <Sun className="h-5 w-5 transition-all" />
              )}
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

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1">
              <span className="font-medium">Proposal Dana Disetujui</span>
              <span className="text-xs text-muted-foreground">
                Proposal &quot;Kerja Bakti&quot; telah disetujui bendahara
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1">
              <span className="font-medium">Kas Bulan Ini</span>
              <span className="text-xs text-muted-foreground">
                5 anggota belum membayar kas
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1">
              <span className="font-medium">Tanda Tangan Diperlukan</span>
              <span className="text-xs text-muted-foreground">
                Upload TTD untuk surat yang menunggu
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || ''} />
                <AvatarFallback>
                  {session?.user?.name ? getInitials(session.user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {session?.user?.email}
                </p>
                {session?.user?.role && (
                  <Badge
                    variant="secondary"
                    className="w-fit"
                    style={{
                      backgroundColor: session.user.role.color + '20',
                      color: session.user.role.color,
                    }}
                  >
                    {session.user.role.displayName}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/profile" className="flex cursor-pointer items-center">
                <User className="mr-2 h-4 w-4" />
                Profil Saya
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/settings" className="flex cursor-pointer items-center">
                <Settings className="mr-2 h-4 w-4" />
                Pengaturan
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
