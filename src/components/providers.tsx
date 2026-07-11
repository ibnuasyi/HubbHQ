'use client'

import { SessionProvider } from 'next-auth/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/components/theme-provider'
import { WebsiteConfigProvider } from '@/hooks/use-website-config'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <TooltipProvider>
          <WebsiteConfigProvider>
            {children}
          </WebsiteConfigProvider>
        </TooltipProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
