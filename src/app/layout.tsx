import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { prisma } from '@/lib/db'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

// Dynamic metadata based on website config
export async function generateMetadata(): Promise<Metadata> {
  try {
    const configs = await prisma.websiteConfig.findMany()

    const configData: Record<string, string> = {}
    configs.forEach((config) => {
      // Konversi JsonValue ke string
      const value = typeof config.value === 'string' ? config.value : JSON.stringify(config.value)
      configData[config.key] = value
    })

    const appName = configData.appName || 'HubbHQ'
    const appDescription = configData.appDescription || 'Sistem Informasi Organisasi Modern'
    const faviconUrl = configData.faviconUrl

    return {
      title: {
        default: appName,
        template: `%s | ${appName}`,
      },
      description: appDescription,
      icons: faviconUrl ? {
        icon: faviconUrl,
      } : undefined,
      robots: {
        index: false,
        follow: false,
      },
    }
  } catch (error) {
    // Fallback metadata if database fails
    return {
      title: {
        default: 'HubbHQ',
        template: '%s | HubbHQ',
      },
      description: 'Sistem Informasi Organisasi Modern',
      robots: {
        index: false,
        follow: false,
      },
    }
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
