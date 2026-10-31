'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Vote,
  Plus,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  BarChart3,
  ShieldCheck,
  Play,
  Square,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'

interface VotingEventItem {
  id: string
  title: string
  slug: string
  description?: string | null
  startDate: string
  endDate: string
  status: 'DRAFT' | 'AKTIF' | 'SELESAI' | 'DIBATALKAN'
  showLiveCount: boolean
  allowAbstain: boolean
  totalKandidat: number
  totalDpt: number
  totalSuara: number
  partisipasi: number
  kandidat: any[]
}

export default function VotingDashboardPage() {
  const [events, setEvents] = useState<VotingEventItem[]>([])
  const [loading, setLoading] = useState(true)

  // Create modal state
  const [openCreateModal, setOpenCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    rules: '',
    startDate: '',
    endDate: '',
    showLiveCount: true,
    allowAbstain: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/voting')
      const json = await res.json()
      if (json.data) setEvents(json.data)
    } catch (err) {
      console.error('Error fetching voting events:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!formData.title.trim()) {
      setErrorMsg('Judul musyawarah / pemilihan wajib diisi')
      return
    }

    if (!formData.startDate || !formData.endDate) {
      setErrorMsg('Jadwal mulai dan berakhir pemilihan wajib ditentukan')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/voting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal membuat sesi')

      fetchEvents()
      setOpenCreateModal(false)
      setFormData({
        title: '',
        slug: '',
        description: '',
        rules: '',
        startDate: '',
        endDate: '',
        showLiveCount: true,
        allowAbstain: false,
      })
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            <Vote className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0" />
            E-Voting Musyawarah & Mubes
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Sistem pemungutan suara digital berstandar LUBER-JURDIL untuk Musyawarah
            Besar, Konferensi, Kongres, dan PEMIRA.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchEvents} className="w-full sm:w-auto">
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Muat Ulang
          </Button>

          <Button
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => {
              const now = new Date()
              const tomorrow = new Date()
              tomorrow.setDate(tomorrow.getDate() + 1)

              setFormData({
                title: '',
                slug: '',
                description: '',
                rules: '',
                startDate: now.toISOString().slice(0, 16),
                endDate: tomorrow.toISOString().slice(0, 16),
                showLiveCount: true,
                allowAbstain: false,
              })
              setOpenCreateModal(true)
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Buat Sesi Pemilihan
          </Button>
        </div>
      </div>

      {/* Grid Events */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          Memuat data musyawarah & pemilihan...
        </div>
      ) : events.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-card border rounded-2xl space-y-3">
          <Vote className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <h3 className="text-base font-bold text-foreground">
            Belum Ada Sesi Pemilihan
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Buat sesi pemilihan musyawarah untuk memulai pemilihan Ketua Umum,
            Formatur, atau Presidium secara digital dan aman.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Buat Pemilihan Sekarang
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {events.map((ev) => {
            const isAktif = ev.status === 'AKTIF'
            const isSelesai = ev.status === 'SELESAI'

            return (
              <div
                key={ev.id}
                className="bg-card border rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Status Bar Top Indicator */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    isAktif
                      ? 'bg-emerald-500'
                      : isSelesai
                      ? 'bg-slate-400'
                      : 'bg-amber-400'
                  }`}
                />

                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-muted-foreground truncate">
                      /{ev.slug}
                    </span>
                    {ev.status === 'AKTIF' && (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 animate-pulse shrink-0">
                        Pemilihan Berlangsung
                      </Badge>
                    )}
                    {ev.status === 'DRAFT' && (
                      <Badge variant="outline" className="text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800 shrink-0">
                        Draft Persiapan
                      </Badge>
                    )}
                    {ev.status === 'SELESAI' && (
                      <Badge variant="outline" className="text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700 shrink-0">
                        Resmi Selesai
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-foreground leading-snug">
                      {ev.title}
                    </h3>
                    {ev.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {ev.description}
                      </p>
                    )}
                  </div>

                  {/* Statistik Pemilih & Suara */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-muted/40 rounded-xl text-center text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                        Kandidat
                      </span>
                      <span className="font-black text-sm text-foreground tabular-nums">
                        {ev.totalKandidat} Paslon
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                        DPT
                      </span>
                      <span className="font-black text-sm text-foreground tabular-nums">
                        {ev.totalDpt} Jiwa
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                        Suara Masuk
                      </span>
                      <span className="font-black text-sm text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {ev.totalSuara} ({ev.partisipasi}%)
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar Partisipasi */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Partisipasi DPT:</span>
                      <span className="font-bold text-foreground tabular-nums">{ev.partisipasi}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-500"
                        style={{ width: `${Math.min(100, ev.partisipasi)}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1 tabular-nums">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">
                      {new Date(ev.startDate).toLocaleDateString('id-ID')} s/d{' '}
                      {new Date(ev.endDate).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 mt-4 border-t border-border flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => window.open(`/voting/${ev.slug}`, '_blank')}
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1" />
                    Bilik Suara
                  </Button>

                  <Link href={`/dashboard/voting/${ev.id}`}>
                    <Button size="sm" className="text-xs">
                      Kelola Sesi Pleno
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Buat Sesi Pemilihan */}
      <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Vote className="w-5 h-5 text-primary" />
              Buat Sesi Pemilihan Musyawarah Baru
            </DialogTitle>
          </DialogHeader>

          {errorMsg && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="title">
                Judul Agenda Pemilihan <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Contoh: Pemilihan Ketua Umum Musyawarah Besar Ke-XV HubbHQ"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="slug">
                Kustom URL Slug{' '}
                <span className="text-xs text-muted-foreground font-normal">
                  (Kosongkan untuk otomatis dari judul)
                </span>
              </Label>
              <Input
                id="slug"
                placeholder="mubes-xv-ketum"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="startDate">
                  Waktu Mulai Pemungutan Suara <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="endDate">
                  Waktu Penutupan Pemungutan Suara <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Deskripsi Singkat Acara</Label>
              <Textarea
                id="description"
                rows={2}
                placeholder="Contoh: Pemilihan Ketua Umum periode 2026-2027 dalam Sidang Pleno IV Musyawarah Besar..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="rules">Tata Tertib & Ketentuan Pemilihan</Label>
              <Textarea
                id="rules"
                rows={3}
                placeholder="Contoh: 1. Setiap anggota DPT hanya berhak memberikan 1 suara sah. 2. Pilihan bersifat rahasia dan mengikat..."
                value={formData.rules}
                onChange={(e) =>
                  setFormData({ ...formData, rules: e.target.value })
                }
              />
            </div>

            {/* Pengaturan Privasi & Live Count */}
            <div className="p-3.5 bg-muted/40 rounded-xl border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-xs text-foreground">
                    Tampilkan Quick Count Real-Time di Layar Proyektor
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Grafik perolehan suara dapat langsung disaksikan peserta sidang saat pemungutan berjalan.
                  </div>
                </div>
                <Checkbox
                  checked={formData.showLiveCount}
                  onCheckedChange={(checked: boolean) =>
                    setFormData({ ...formData, showLiveCount: Boolean(checked) })
                  }
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <div className="font-semibold text-xs text-foreground">
                    Izinkan Pilihan Abstain / Kotak Kosong
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Pemilih dapat memasukkan suara kosong jika calon tunggal atau sesuai tata tertib.
                  </div>
                </div>
                <Checkbox
                  checked={formData.allowAbstain}
                  onCheckedChange={(checked: boolean) =>
                    setFormData({ ...formData, allowAbstain: Boolean(checked) })
                  }
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenCreateModal(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Buat Sesi Pemilihan'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
