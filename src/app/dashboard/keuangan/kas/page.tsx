'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, X, Loader2, User, Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

interface KasPayment {
  id: string
  month: number
  year: number
  amount: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  proof: string | null
  notes: string | null
  user: {
    id: string
    name: string | null
    email: string
    avatar: string | null
  }
  createdAt: string
}

const formatCurrency = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num)
}

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export default function KasAnggotaPage() {
  const [kasPayments, setKasPayments] = React.useState<KasPayment[]>([])
  const [loading, setLoading] = React.useState(true)
  const [status, setStatus] = React.useState<string>('')
  const [month, setMonth] = React.useState<string>('')
  const [year, setYear] = React.useState<string>(new Date().getFullYear().toString())
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)

  const limit = 20

  const fetchKasPayments = React.useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      if (status) params.append('status', status)
      if (month) params.append('month', month)
      if (year) params.append('year', year)

      const res = await fetch(`/api/keuangan/kas?${params}`)
      const data = await res.json()

      if (data.data) {
        setKasPayments(data.data)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Error fetching kas payments:', error)
    } finally {
      setLoading(false)
    }
  }, [page, status, month, year])

  React.useEffect(() => {
    fetchKasPayments()
  }, [fetchKasPayments])

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/keuangan/kas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (res.ok) {
        fetchKasPayments()
      }
    } catch (error) {
      console.error('Error action:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const pendingCount = kasPayments.filter((k) => k.status === 'PENDING').length

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 pl-0">
          <Link href="/dashboard/keuangan">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Kas Anggota</h1>
            <p className="text-muted-foreground">
              Kelola pembayaran kas anggota
            </p>
          </div>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="text-sm px-3 py-1">
              {pendingCount} menunggu persetujuan
            </Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Disetujui</SelectItem>
                <SelectItem value="REJECTED">Ditolak</SelectItem>
              </SelectContent>
            </Select>
            <Select value={month} onValueChange={(v) => { setMonth(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Bulan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Bulan</SelectItem>
                {monthNames.map((name, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={(v) => { setYear(v); setPage(1); }}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027].map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
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
          ) : kasPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Belum ada pembayaran kas</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {kasPayments.map((kas) => (
                  <div
                    key={kas.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={kas.user.avatar || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(kas.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{kas.user.name || kas.user.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {monthNames[kas.month - 1]} {kas.year}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(kas.amount)}</p>
                        <Badge
                          variant={
                            kas.status === 'APPROVED'
                              ? 'default'
                              : kas.status === 'REJECTED'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className={
                            kas.status === 'APPROVED' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''
                          }
                        >
                          {kas.status === 'PENDING' && 'Menunggu'}
                          {kas.status === 'APPROVED' && 'Disetujui'}
                          {kas.status === 'REJECTED' && 'Ditolak'}
                        </Badge>
                      </div>
                      {kas.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleAction(kas.id, 'approve')}
                            disabled={actionLoading === kas.id}
                          >
                            {actionLoading === kas.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleAction(kas.id, 'reject')}
                            disabled={actionLoading === kas.id}
                          >
                            {actionLoading === kas.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
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
