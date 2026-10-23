'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Target,
  FileText,
  FileSpreadsheet,
  DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ProgramKerja {
  id: string
  title: string
  description: string | null
  status: 'DRAFT' | 'ON_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  startDate: string | null
  endDate: string | null
  kategori?: string | null
  sasaran?: string | null
  indikator?: string | null
  anggaranEstimasi?: number | string | null
  sumberDana?: string | null
  lokasi?: string | null
  divisi: {
    id: string
    name: string
    color: string
  }
  pic: {
    id: string
    name: string | null
    avatar: string | null
  } | null
  creator: {
    id: string
    name: string | null
  }
  checkpoints: any[]
  panitia?: any[]
  proposals?: any[]
  lpj?: {
    id: string
    status: string
    totalPemasukan: number | string
    totalPengeluaran: number | string
    saldoAkhir: number | string
  } | null
  progress: number
  completedCheckpoints: number
  totalCheckpoints: number
  createdAt: string
}

const statusConfig = {
  DRAFT: { label: 'Draft', color: 'bg-gray-500', icon: AlertCircle },
  ON_PROGRESS: { label: 'On Progress', color: 'bg-blue-500', icon: Clock },
  COMPLETED: { label: 'Selesai', color: 'bg-green-500', icon: CheckCircle },
  CANCELLED: { label: 'Dibatalkan', color: 'bg-red-500', icon: AlertCircle },
}

const formatCurrency = (amount: number | string | null | undefined) => {
  const num = Number(amount || 0)
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num)
}

export default function ProkerPage() {
  const router = useRouter()
  const [proker, setProker] = React.useState<ProgramKerja[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [status, setStatus] = React.useState<string>('')
  const [divisiId, setDivisiId] = React.useState<string>('')
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [divisi, setDivisi] = React.useState<any[]>([])
  const [exporting, setExporting] = React.useState(false)
  const [exportYear, setExportYear] = React.useState(new Date().getFullYear().toString())

  const limit = 10

  const fetchProker = React.useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      if (search) params.append('search', search)
      if (status) params.append('status', status)
      if (divisiId) params.append('divisiId', divisiId)

      const [prokerRes, divisiRes] = await Promise.all([
        fetch(`/api/proker?${params}`),
        fetch('/api/divisi'),
      ])

      if (prokerRes.ok) {
        const data = await prokerRes.json()
        setProker(data.data || [])
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
      if (divisiRes.ok) {
        const data = await divisiRes.json()
        setDivisi(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching proker:', error)
    } finally {
      setLoading(false)
    }
  }, [page, search, status, divisiId])

  React.useEffect(() => {
    fetchProker()
  }, [fetchProker])

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleExport = async (format: 'pdf' | 'excel') => {
    setExporting(true)
    try {
      const res = await fetch(`/api/export/proker?format=${format}&year=${exportYear}${divisiId ? `&divisiId=${divisiId}` : ''}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `laporan-proker-${exportYear}.${format === 'excel' ? 'xlsx' : 'pdf'}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting:', error)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Program Kerja</h1>
          <p className="text-muted-foreground">
            Kelola program kerja organisasi ({total} program)
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={exportYear} onValueChange={setExportYear}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleExport('pdf')} disabled={exporting}>
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" onClick={() => handleExport('excel')} disabled={exporting}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button asChild>
            <Link href="/dashboard/proker/baru">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Proker
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari program kerja..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ON_PROGRESS">On Progress</SelectItem>
                <SelectItem value="COMPLETED">Selesai</SelectItem>
                <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
            <Select value={divisiId} onValueChange={(v) => { setDivisiId(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Divisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Divisi</SelectItem>
                {divisi.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : proker.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p>Belum ada program kerja</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/dashboard/proker/baru">Buat program kerja pertama</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                {proker.map((p) => {
                  const statusInfo = statusConfig[p.status]
                  const StatusIcon = statusInfo.icon

                  return (
                    <div
                      key={p.id}
                      onClick={() => router.push(`/dashboard/proker/${p.id}`)}
                      className="rounded-lg border p-4 hover:border-primary/50 hover:bg-muted/40 cursor-pointer transition-all shadow-sm group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Link
                              href={`/dashboard/proker/${p.id}`}
                              className="font-semibold text-base text-foreground group-hover:text-primary transition-colors hover:underline truncate"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {p.title}
                            </Link>
                            <Badge
                              variant="secondary"
                              className="flex items-center gap-1"
                              style={{
                                backgroundColor: `${p.divisi.color}20`,
                                color: p.divisi.color,
                              }}
                            >
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: p.divisi.color }}
                              />
                              {p.divisi.name}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              <StatusIcon className="h-3 w-3" />
                              {statusInfo.label}
                            </Badge>
                            {p.kategori && (
                              <Badge variant="secondary" className="text-xs font-normal">
                                {p.kategori}
                              </Badge>
                            )}
                            {p.proposals?.[0] && (
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  p.proposals[0].status === 'APPROVED'
                                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                    : p.proposals[0].status === 'REJECTED'
                                    ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800'
                                    : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-800'
                                }`}
                              >
                                Proposal: {p.proposals[0].status}
                              </Badge>
                            )}
                            {p.lpj && (
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  p.lpj.status === 'APPROVED'
                                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                    : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                                }`}
                              >
                                LPJ: {p.lpj.status}
                              </Badge>
                            )}
                          </div>

                          {p.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {p.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            {p.pic && (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={p.pic.avatar || undefined} />
                                  <AvatarFallback className="text-[10px]">
                                    {getInitials(p.pic.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span>PIC: {p.pic.name}</span>
                              </div>
                            )}
                            {p.anggaranEstimasi && (
                              <div className="flex items-center gap-1 font-medium text-foreground">
                                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{formatCurrency(Number(p.anggaranEstimasi))}</span>
                              </div>
                            )}
                            {p.startDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {new Date(p.startDate).toLocaleDateString('id-ID')}
                                </span>
                              </div>
                            )}
                            <span>
                              {p.completedCheckpoints}/{p.totalCheckpoints} checkpoint
                            </span>
                          </div>

                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{p.progress}%</span>
                            </div>
                            <Progress value={p.progress} className="h-2" />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="hidden sm:inline-flex text-xs h-8"
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link href={`/dashboard/proker/${p.id}`}>
                              <Eye className="mr-1.5 h-3.5 w-3.5" />
                              Buka Proker
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/proker/${p.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Buka Halaman Proker
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/proker/${p.id}`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit & Kelola
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Menampilkan {(page - 1) * limit + 1}-
                    {Math.min(page * limit, total)} dari {total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
