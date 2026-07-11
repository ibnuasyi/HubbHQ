import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/layout/header'
import { DivisiList } from './_components/divisi-list'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function DivisiPage() {
  const session = await auth()
  if (!session) {
    redirect('/login')
  }

  // Check permission
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { role: { include: { permissions: true } } },
  })

  const canView = user?.role?.permissions.some((p) => p.name === 'divisi.view')
  const canCreate = user?.role?.permissions.some((p) => p.name === 'divisi.create')

  if (!canView) {
    redirect('/dashboard')
  }

  return (
    <>
      <Header
        title="Divisi"
        description="Kelola divisi dan anggota divisi"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Daftar Divisi</h2>
            <p className="text-sm text-muted-foreground">
              Kelola divisi organisasi dan tentukan anggotanya
            </p>
          </div>
          {canCreate && (
            <Button asChild>
              <Link href="/divisi/baru">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Divisi
              </Link>
            </Button>
          )}
        </div>

        <DivisiList />
      </div>
    </>
  )
}
