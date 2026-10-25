import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  FolderKanban,
  Wallet,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth()

  // Fetch stats
  const [
    totalMembers,
    activeMembers,
    totalDivisi,
    totalProker,
    prokerOnProgress,
    prokerCompleted,
    pendingKas,
    pendingTransactions,
  ] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.divisi.count({ where: { isActive: true } }),
    prisma.programKerja.count(),
    prisma.programKerja.count({ where: { status: 'ON_PROGRESS' } }),
    prisma.programKerja.count({ where: { status: 'COMPLETED' } }),
    prisma.kasPayment.count({ where: { status: 'PENDING' } }),
    prisma.transaction.count({ where: { status: 'PENDING' } }),
  ])

  // Recent activities
  const recentProker = await prisma.programKerja.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      divisi: true,
      pic: true,
    },
  })

  // Quick stats for financial overview
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const monthTransactions = await prisma.transaction.findMany({
    where: {
      status: 'APPROVED',
      date: {
        gte: new Date(currentYear, currentMonth - 1, 1),
        lt: new Date(currentYear, currentMonth, 1),
      },
    },
  })

  const monthIncome = monthTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const monthExpense = monthTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const stats = [
    {
      title: 'Total Anggota',
      value: totalMembers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Divisi Aktif',
      value: totalDivisi,
      icon: FolderKanban,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Program Kerja',
      value: totalProker,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Kas Pending',
      value: pendingKas,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ]

  const prokerStats = [
    {
      title: 'On Progress',
      value: prokerOnProgress,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Selesai',
      value: prokerCompleted,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ]

  return (
    <>
      <Header title="Dashboard" description={`Selamat datang, ${session?.user?.name || 'User'}`} />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats Grid */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} rounded-full p-2`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Program Kerja Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Program Kerja</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {prokerStats.map((stat) => (
                  <div key={stat.title} className="flex items-center gap-3">
                    <div className={`${stat.bgColor} rounded-full p-2`}>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">
                        {stat.title}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Financial Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Keuangan Bulan Ini</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pemasukan</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(monthIncome)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pengeluaran</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(monthExpense)}
                  </span>
                </div>
                <div className="border-t pt-4 flex items-center justify-between">
                  <span className="font-medium">Saldo</span>
                  <span
                    className={`font-bold ${
                      monthIncome - monthExpense >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(monthIncome - monthExpense)}
                  </span>
                </div>
                {pendingTransactions > 0 && (
                  <Badge variant="warning" className="mt-2">
                    {pendingTransactions} transaksi pending approval
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Program Kerja */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Program Kerja Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {recentProker.length === 0 ? (
              <p className="text-muted-foreground">Belum ada program kerja</p>
            ) : (
              <div className="space-y-4">
                {recentProker.map((proker) => (
                  <div
                    key={proker.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{proker.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {proker.divisi?.name} • PIC: {proker.pic?.name || 'Belum ditentukan'}
                      </p>
                    </div>
                    <Badge
                      variant={
                        proker.status === 'COMPLETED'
                          ? 'success'
                          : proker.status === 'ON_PROGRESS'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {proker.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
