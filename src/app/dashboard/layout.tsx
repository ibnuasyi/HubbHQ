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
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      {/* Main content area with independent scrolling */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
