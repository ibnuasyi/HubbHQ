'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Loader2,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Trash2,
  Edit,
  Eye,
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
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Transaction {
  id: string
  type: 'INCOME' | 'EXPENSE'
  category: string
  amount: string
  description: string | null
  date: string
  status: string
  receipt: string | null
  createdBy: { id: string; name: string | null }
  kasPayment: {
    user: { id: string; name: string | null }
  } | null
}

const formatCurrency = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num)
}

const categoryLabels: Record<string, string> = {
  kas_anggota: 'Kas Anggota',
  sumbangan: 'Sumbangan',
  bisnis: 'Bisnis',
  operasional: 'Operasional',
  lainnya: 'Lainnya',
}

export default function KeuanganPage() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [type, setType] = React.useState<string>('')
  const [category, setCategory] = React.useState<string>('')
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [showAdd, setShowAdd] = React.useState(false)
  const [showDetail, setShowDetail] = React.useState(false)
  const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null)
  const [summary, setSummary] = React.useState({ income: 0, expense: 0, balance: 0 })
  const [pendingKas, setPendingKas] = React.useState(0)

  const limit = 20

  // Form state
  const [formType, setFormType] = React.useState<'INCOME' | 'EXPENSE'>('INCOME')
  const [formCategory, setFormCategory] = React.useState('kas_anggota')
  const [formAmount, setFormAmount] = React.useState('')
  const [formDescription, setFormDescription] = React.useState('')
  const [formDate, setFormDate] = React.useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = React.useState(false)

  const fetchTransactions = React.useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      if (type) params.append('type', type)
      if (category) params.append('category', category)

      const res = await fetch(`/api/keuangan?${params}`)
      const data = await res.json()

      if (data.data) {
        setTransactions(data.data)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }, [page, type, category])

  const fetchSummary = async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7)
      const [incomeRes, expenseRes, kasRes] = await Promise.all([
        fetch(`/api/keuangan?type=INCOME&startDate=${currentMonth}-01`),
        fetch(`/api/keuangan?type=EXPENSE&startDate=${currentMonth}-01`),
        fetch(`/api/keuangan/kas?status=PENDING`),
      ])

      const incomeData = await incomeRes.json()
      const expenseData = await expenseRes.json()
      const kasData = await kasRes.json()

      const totalIncome = incomeData.data?.reduce(
        (sum: number, t: any) => sum + parseFloat(t.amount || 0),
        0
      ) || 0
      const totalExpense = expenseData.data?.reduce(
        (sum: number, t: any) => sum + parseFloat(t.amount || 0),
        0
      ) || 0

      setSummary({
        income: totalIncome,
        expense: totalExpense,
        balance: totalIncome - totalExpense,
      })
      setPendingKas(kasData.total || 0)
    } catch (error) {
      console.error('Error fetching summary:', error)
    }
  }

  React.useEffect(() => {
    fetchTransactions()
    fetchSummary()
  }, [fetchTransactions])

  const handleAddTransaction = async () => {
    if (!formAmount) return

    setSaving(true)
    try {
      const res = await fetch('/api/keuangan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formType,
          category: formCategory,
          amount: formAmount,
          description: formDescription,
          date: formDate,
        }),
      })

      if (res.ok) {
        setShowAdd(false)
        resetForm()
        fetchTransactions()
        fetchSummary()
      }
    } catch (error) {
      console.error('Error adding transaction:', error)
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormType('INCOME')
    setFormCategory('kas_anggota')
    setFormAmount('')
    setFormDescription('')
    setFormDate(new Date().toISOString().split('T')[0])
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Keuangan</h1>
          <p className="text-sm text-muted-foreground">
            Kelola keuangan organisasi
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
            <Link href="/dashboard/keuangan/kas">
              Kas Anggota ({pendingKas} pending)
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
            <Link href="/dashboard/keuangan/rekap">
              <Download className="mr-2 h-4 w-4" />
              Rekap
            </Link>
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Transaksi
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pemasukan Bulan Ini</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatCurrency(summary.income)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pengeluaran Bulan Ini</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              {formatCurrency(summary.expense)}
            </div>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            {summary.balance >= 0 ? (
              <ChevronUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold tabular-nums ${summary.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(summary.balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                type="search"
                placeholder="Cari transaksi..."
                className="pl-9 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Cari transaksi"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[140px]" aria-label="Filter berdasarkan tipe transaksi">
                  <SelectValue placeholder="Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Tipe</SelectItem>
                  <SelectItem value="INCOME">Pemasukan</SelectItem>
                  <SelectItem value="EXPENSE">Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
              <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[160px]" aria-label="Filter berdasarkan kategori">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua</SelectItem>
                  <SelectItem value="kas_anggota">Kas Anggota</SelectItem>
                  <SelectItem value="sumbangan">Sumbangan</SelectItem>
                  <SelectItem value="bisnis">Bisnis</SelectItem>
                  <SelectItem value="operasional">Operasional</SelectItem>
                  <SelectItem value="lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Belum ada transaksi</p>
              <Button variant="link" onClick={() => setShowAdd(true)}>
                Tambah transaksi pertama
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {transactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer gap-3"
                    onClick={() => {
                      setSelectedTransaction(t)
                      setShowDetail(true)
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelectedTransaction(t)
                        setShowDetail(true)
                      }
                    }}
                    aria-label={`Lihat detail transaksi ${categoryLabels[t.category] || t.category}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`p-2 rounded-full shrink-0 ${
                          t.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                        }`}
                      >
                        {t.type === 'INCOME' ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base truncate">{categoryLabels[t.category] || t.category}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {t.description || '-'}
                          {t.kasPayment && ` • ${t.kasPayment.user?.name}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`font-semibold text-sm sm:text-base tabular-nums ${
                          t.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {t.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(t.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {new Date(t.date).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-xs sm:text-sm text-muted-foreground tabular-nums">
                    Menampilkan {(page - 1) * limit + 1}-
                    {Math.min(page * limit, total)} dari {total}
                  </p>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="flex-1 sm:flex-initial"
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      className="flex-1 sm:flex-initial"
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

      {/* Add Transaction Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Transaksi</DialogTitle>
            <DialogDescription>
              Tambahkan transaksi baru ke keuangan organisasi
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipe</Label>
                <Select value={formType} onValueChange={(v: any) => setFormType(v)}>
                  <SelectTrigger aria-label="Pilih tipe transaksi">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">Pemasukan</SelectItem>
                    <SelectItem value="EXPENSE">Pengeluaran</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger aria-label="Pilih kategori transaksi">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kas_anggota">Kas Anggota</SelectItem>
                    <SelectItem value="sumbangan">Sumbangan</SelectItem>
                    <SelectItem value="bisnis">Bisnis</SelectItem>
                    <SelectItem value="operasional">Operasional</SelectItem>
                    <SelectItem value="lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-amount">Jumlah (Rp)</Label>
              <Input
                id="form-amount"
                type="number"
                placeholder="0"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-desc">Keterangan</Label>
              <Input
                id="form-desc"
                placeholder="Deskripsi transaksi"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-date">Tanggal</Label>
              <Input
                id="form-date"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Batal
            </Button>
            <Button onClick={handleAddTransaction} disabled={saving || !formAmount}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Transaksi</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <Badge variant={selectedTransaction.type === 'INCOME' ? 'default' : 'destructive'}
                  className={selectedTransaction.type === 'INCOME' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : ''}>
                  {selectedTransaction.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                </Badge>
                <p className={`text-xl sm:text-2xl font-bold tabular-nums ${
                  selectedTransaction.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {selectedTransaction.type === 'INCOME' ? '+' : '-'}
                  {formatCurrency(selectedTransaction.amount)}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border p-4">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Kategori</p>
                  <p className="font-medium text-sm sm:text-base">{categoryLabels[selectedTransaction.category] || selectedTransaction.category}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Tanggal</p>
                  <p className="font-medium text-sm sm:text-base">
                    {new Date(selectedTransaction.date).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Dibuat Oleh</p>
                  <p className="font-medium text-sm sm:text-base">{selectedTransaction.createdBy.name || '-'}</p>
                </div>
                {selectedTransaction.kasPayment && (
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Pembayar Kas</p>
                    <p className="font-medium text-sm sm:text-base">{selectedTransaction.kasPayment.user?.name || '-'}</p>
                  </div>
                )}
                <div className="col-span-1 sm:col-span-2">
                  <p className="text-xs sm:text-sm text-muted-foreground">Keterangan</p>
                  <p className="text-sm sm:text-base">{selectedTransaction.description || '-'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
