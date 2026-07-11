'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Loader2, TrendingUp, TrendingDown, FileText, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4']

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    notation: 'compact',
  }).format(amount)
}

export default function RekapKeuanganPage() {
  const [loading, setLoading] = React.useState(true)
  const [exporting, setExporting] = React.useState(false)
  const [year, setYear] = React.useState(new Date().getFullYear().toString())
  const [summary, setSummary] = React.useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  })
  const [monthlyData, setMonthlyData] = React.useState<any[]>([])
  const [categoryData, setCategoryData] = React.useState<any[]>([])
  const [recentTransactions, setRecentTransactions] = React.useState<any[]>([])

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`

      const [transactionsRes] = await Promise.all([
        fetch(`/api/keuangan?startDate=${startDate}&endDate=${endDate}&limit=100`),
      ])

      const data = await transactionsRes.json()
      const transactions = data.data || []

      // Calculate summary
      const totalIncome = transactions
        .filter((t: any) => t.type === 'INCOME')
        .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0)
      const totalExpense = transactions
        .filter((t: any) => t.type === 'EXPENSE')
        .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0)

      setSummary({
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      })

      // Monthly data
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
      ]
      const monthly = months.map((name, i) => {
        const monthTransactions = transactions.filter((t: any) => {
          const date = new Date(t.date)
          return date.getMonth() === i
        })
        const income = monthTransactions
          .filter((t: any) => t.type === 'INCOME')
          .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0)
        const expense = monthTransactions
          .filter((t: any) => t.type === 'EXPENSE')
          .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0)

        return { name, income, expense }
      })
      setMonthlyData(monthly)

      // Category data (income)
      const incomeByCategory: Record<string, number> = {}
      transactions
        .filter((t: any) => t.type === 'INCOME')
        .forEach((t: any) => {
          incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + parseFloat(t.amount || 0)
        })
      const categoryArr = Object.entries(incomeByCategory).map(([name, value]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        value,
      }))
      setCategoryData(categoryArr)

      // Recent transactions
      setRecentTransactions(transactions.slice(0, 5))
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [year])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleExport = async (format: 'pdf' | 'excel') => {
    setExporting(true)
    try {
      const res = await fetch(`/api/export/keuangan?format=${format}&year=${year}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `laporan-keuangan-${year}.${format === 'excel' ? 'xlsx' : 'pdf'}`
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

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
            <h1 className="text-2xl font-bold">Rekap Keuangan</h1>
            <p className="text-muted-foreground">
              Ringkasan keuangan organisasi tahun {year}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027].map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
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
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pemasukan
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totalIncome)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pengeluaran
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.totalExpense)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo
            </CardTitle>
            <Badge variant={summary.balance >= 0 ? 'default' : 'destructive'}
              className={summary.balance >= 0 ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
              {summary.balance >= 0 ? 'Positif' : 'Negatif'}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Pemasukan & Pengeluaran Bulanan</CardTitle>
            <CardDescription>Perbandingan per bulan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Pemasukan</CardTitle>
            <CardDescription>Berdasarkan kategori</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Belum ada data</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Transaksi Terbaru</CardTitle>
          <CardDescription>5 transaksi terakhir</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{t.description || t.category}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(t.date).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <p className={`font-bold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(parseFloat(t.amount))}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Belum ada transaksi
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
