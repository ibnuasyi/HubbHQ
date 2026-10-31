import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if database is empty (needs setup)
  let userCount: number | null = null
  try {
    userCount = await prisma.user.count()
  } catch (error) {
    console.warn('DashboardLayout: Database connection unavailable, skipping setup check:', error)
  }

  if (userCount === 0) {
    redirect('/setup')
  }

  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      {/* Skip to Content for Keyboard Accessibility (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring font-medium text-sm transition-transform"
      >
        Lewati ke konten utama
      </a>
      <Sidebar />
      {/* Main content area with independent scrolling */}
      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col overflow-hidden focus:outline-none pt-14 lg:pt-0">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
