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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ProgramKerja {
  id: string
  title: string
  description: string | null
  status: 'DRAFT' | 'ON_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  startDate: string | null
  endDate: string | null
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
  const [selectedProker, setSelectedProker] = React.useState<ProgramKerja | null>(null)
  const [showDetail, setShowDetail] = React.useState(false)
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

  const viewDetail = (p: ProgramKerja) => {
    setSelectedProker(p)
    setShowDetail(true)
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
                      className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold truncate">{p.title}</h3>
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
                          </div>

                          {p.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {p.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
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

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => viewDetail(p)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/proker/${p.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Program Kerja</DialogTitle>
            <DialogDescription>Informasi lengkap program kerja</DialogDescription>
          </DialogHeader>
          {selectedProker && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedProker.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant="secondary"
                    style={{
                      backgroundColor: `${selectedProker.divisi.color}20`,
                      color: selectedProker.divisi.color,
                    }}
                  >
                    {selectedProker.divisi.name}
                  </Badge>
                  <Badge variant="outline">
                    {statusConfig[selectedProker.status].label}
                  </Badge>
                </div>
              </div>

              {selectedProker.description && (
                <p className="text-muted-foreground">{selectedProker.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                <div>
                  <p className="text-sm text-muted-foreground">PIC</p>
                  <p className="font-medium">{selectedProker.pic?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dibuat Oleh</p>
                  <p className="font-medium">{selectedProker.creator.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal Mulai</p>
                  <p className="font-medium">
                    {selectedProker.startDate
                      ? new Date(selectedProker.startDate).toLocaleDateString('id-ID')
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal Selesai</p>
                  <p className="font-medium">
                    {selectedProker.endDate
                      ? new Date(selectedProker.endDate).toLocaleDateString('id-ID')
                      : '-'}
                  </p>
                </div>
              </div>

              <div>
                <p className="font-medium mb-2">
                  Progress: {selectedProker.progress}%
                </p>
                <Progress value={selectedProker.progress} className="h-3" />
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedProker.completedCheckpoints} dari {selectedProker.totalCheckpoints} checkpoint selesai
                </p>
              </div>

              <div>
                <p className="font-medium mb-2">Checkpoint</p>
                {selectedProker.checkpoints.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedProker.checkpoints.map((cp: any, i: number) => (
                      <li
                        key={cp.id}
                        className={`flex items-center gap-2 p-2 rounded ${
                          cp.isCompleted ? 'bg-green-50' : 'bg-muted'
                        }`}
                      >
                        <CheckCircle
                          className={`h-4 w-4 ${
                            cp.isCompleted ? 'text-green-500' : 'text-muted-foreground'
                          }`}
                        />
                        <span className={cp.isCompleted ? 'line-through' : ''}>
                          {cp.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Belum ada checkpoint</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
