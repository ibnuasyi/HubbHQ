import type { Metadata } from 'next'
import { Providers } from '@/components/providers'

// Dynamic metadata based on website config - each page should override this
export const metadata: Metadata = {
  title: {
    default: 'Loading...',
    template: '%s',
  },
  description: 'Website resmi organisasi',
  robots: {
    index: true,
    follow: true,
  },
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
