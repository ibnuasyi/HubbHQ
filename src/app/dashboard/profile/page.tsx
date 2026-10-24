import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/layout/header'
import { ProfileForm } from '@/components/profile-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreditCard } from 'lucide-react'
import { DivisiMemberBadge } from './_components/divisi-member-badge'

export default async function ProfilePage() {
  const session = await auth()
  if (!session) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      role: true,
      wilayah: true,
      jabatan: true,
      divisiMembers: {
        where: { isActive: true },
        include: { divisi: true },
      },
    },
  })

  if (!user) {
    redirect('/login')
  }

  return (
    <>
      <Header title="Profil Saya" description="Kelola informasi profil Anda" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div>
                  <CardTitle>{user.name}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
                <div className="ml-auto flex flex-wrap gap-2">
                  {user.role && (
                    <Badge
                      style={{
                        backgroundColor: user.role.color + '20',
                        color: user.role.color,
                      }}
                    >
                      {user.role.displayName}
                    </Badge>
                  )}
                  {user.jabatan && (
                    <Badge variant="secondary">
                      {user.jabatan.name}
                    </Badge>
                  )}
                  <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                    <Link href="/dashboard/kta">
                      <CreditCard className="mr-1.5 h-3.5 w-3.5 text-primary" />
                      KTA Digital
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {user.wilayah && (
                  <span>Wilayah: {user.wilayah.name}</span>
                )}
                {user.divisiMembers.length > 0 && (
                  <span className="flex items-center gap-1">
                    Divisi:
                    {user.divisiMembers.map((dm) => (
                      <DivisiMemberBadge key={dm.id} member={dm} />
                    ))}
                  </span>
                )}
                <span>Bergabung: {new Date(user.createdAt).toLocaleDateString('id-ID')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Profile Form */}
          <ProfileForm user={user} />
        </div>
      </div>
    </>
  )
}
