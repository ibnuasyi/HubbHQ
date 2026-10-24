'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Vote,
  ArrowLeft,
  Users,
  UserPlus,
  Plus,
  Play,
  Square,
  BarChart3,
  FileCheck,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Printer,
  Calendar,
  Maximize2,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Key,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KandidatModal } from '@/components/voting/kandidat-modal'
import { DptModal } from '@/components/voting/dpt-modal'
import { BeritaAcaraVotingModal } from '@/components/voting/berita-acara-voting-modal'

export default function VotingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [event, setEvent] = useState<any>(null)
  const [kandidat, setKandidat] = useState<any[]>([])
  const [dptList, setDptList] = useState<any[]>([])
  const [dptStats, setDptStats] = useState({
    total: 0,
    voted: 0,
    notVoted: 0,
    percentage: 0,
  })
  const [loading, setLoading] = useState(true)

  // Modals state
  const [openKandidatModal, setOpenKandidatModal] = useState(false)
  const [selectedKandidatEdit, setSelectedKandidatEdit] = useState<any>(null)
  const [openDptModal, setOpenDptModal] = useState(false)
  const [openBahpModal, setOpenBahpModal] = useState(false)

  // Tab & Filters
  const [activeTab, setActiveTab] = useState('kandidat')
  const [searchDpt, setSearchDpt] = useState('')
  const [filterDptStatus, setFilterDptStatus] = useState<'ALL' | 'VOTED' | 'NOT_VOTED'>('ALL')

  // Projector live count state
  const [quickCountData, setQuickCountData] = useState<any>(null)
  const [isFullScreen, setIsFullScreen] = useState(false)

  useEffect(() => {
    if (id) {
      loadEventDetail()
      loadKandidat()
      loadDpt()
      loadQuickCount()
    }
  }, [id])

  // Polling Quick Count every 4 seconds when in proyektor tab
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (activeTab === 'proyektor') {
      interval = setInterval(() => {
        loadQuickCount()
        loadEventDetail()
      }, 4000)
    }
    return () => clearInterval(interval)
  }, [activeTab, id])

  const loadEventDetail = async () => {
    try {
      const res = await fetch(`/api/voting/${id}`)
      const json = await res.json()
      if (json.data) setEvent(json.data)
    } catch (err) {
      console.error('Error loading voting detail:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadKandidat = async () => {
    try {
      const res = await fetch(`/api/voting/${id}/kandidat`)
      const json = await res.json()
      if (json.data) setKandidat(json.data)
    } catch (err) {
      console.error('Error loading kandidat:', err)
    }
  }

  const loadDpt = async () => {
    try {
      const res = await fetch(`/api/voting/${id}/dpt`)
      const json = await res.json()
      if (json.data) {
        setDptList(json.data)
        if (json.stats) setDptStats(json.stats)
      }
    } catch (err) {
      console.error('Error loading DPT:', err)
    }
  }

  const loadQuickCount = async () => {
    try {
      const res = await fetch(`/api/voting/${id}/quick-count`)
      const json = await res.json()
      if (json.data) setQuickCountData(json.data)
    } catch (err) {
      console.error('Error loading quick count:', err)
    }
  }

  const handleUpdateStatus = async (newStatus: 'DRAFT' | 'AKTIF' | 'SELESAI') => {
    const confirmMsg =
      newStatus === 'AKTIF'
        ? 'Buka pemungutan suara sekarang? Pemilih di DPT akan dapat mulai mencoblos di bilik suara.'
        : newStatus === 'SELESAI'
        ? 'Tutup dan kunci pemungutan suara? Hasil suara tidak dapat diubah lagi.'
        : 'Kembalikan status sesi ke Draft?'

    if (!confirm(confirmMsg)) return

    try {
      const res = await fetch(`/api/voting/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal mengubah status')

      loadEventDetail()
      loadQuickCount()
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan')
    }
  }

  const filteredDpt = dptList.filter((d) => {
    const matchSearch =
      !searchDpt ||
      d.nama.toLowerCase().includes(searchDpt.toLowerCase()) ||
      (d.nraOrNim && d.nraOrNim.toLowerCase().includes(searchDpt.toLowerCase())) ||
      d.votingToken.toLowerCase().includes(searchDpt.toLowerCase())

    const matchStatus =
      filterDptStatus === 'ALL' ||
      (filterDptStatus === 'VOTED' && d.hasVoted) ||
      (filterDptStatus === 'NOT_VOTED' && !d.hasVoted)

    return matchSearch && matchStatus
  })

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Memuat data musyawarah...</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="p-8 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold">Sesi Pemilihan Tidak Ditemukan</h2>
        <Link href="/dashboard/voting">
          <Button variant="outline" size="sm">
            Kembali ke Daftar Musyawarah
          </Button>
        </Link>
      </div>
    )
  }

  const isAktif = event.status === 'AKTIF'
  const isSelesai = event.status === 'SELESAI'

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Navigation & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/voting')}
            className="h-9 w-9 p-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                /{event.slug}
              </span>
              {isAktif && (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse">
                  Pemilihan Sedang Aktif
                </Badge>
              )}
              {event.status === 'DRAFT' && (
                <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200">
                  Draft Persiapan
                </Badge>
              )}
              {isSelesai && (
                <Badge variant="outline" className="text-slate-700 bg-slate-100 border-slate-300">
                  Pemilihan Selesai (Terkunci)
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-black text-foreground mt-0.5">
              {event.title}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/voting/${event.slug}`, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-1.5" />
            Buka Bilik Suara
          </Button>

          {event.status === 'DRAFT' && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => handleUpdateStatus('AKTIF')}
            >
              <Play className="w-4 h-4 mr-1.5" />
              Buka Pemungutan Suara
            </Button>
          )}

          {isAktif && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleUpdateStatus('SELESAI')}
            >
              <Square className="w-4 h-4 mr-1.5" />
              Tutup & Kunci Pleno
            </Button>
          )}

          {isSelesai && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setOpenBahpModal(true)}
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Berita Acara (BAHP)
            </Button>
          )}
        </div>
      </div>

      {/* Ringkasan Suara & DPT */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-card border rounded-2xl shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1.5">
            <Vote className="w-4 h-4 text-primary" />
            Total Kandidat
          </span>
          <div className="text-2xl font-black mt-1">{kandidat.length} Paslon</div>
          <div className="text-[11px] text-muted-foreground">Peserta pemilihan</div>
        </div>

        <div className="p-4 bg-card border rounded-2xl shadow-xs">
          <span className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-500" />
            Daftar Pemilih (DPT)
          </span>
          <div className="text-2xl font-black mt-1">{dptStats.total} Jiwa</div>
          <div className="text-[11px] text-muted-foreground">Hak suara terdaftar</div>
        </div>

        <div className="p-4 bg-card border rounded-2xl shadow-xs">
          <span className="text-xs text-emerald-600 uppercase font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Suara Masuk
          </span>
          <div className="text-2xl font-black mt-1 text-emerald-700 dark:text-emerald-400">
            {event.totalSuara} Suara
          </div>
          <div className="text-[11px] text-muted-foreground">
            {dptStats.percentage}% partisipasi
          </div>
        </div>

        <div className="p-4 bg-card border rounded-2xl shadow-xs">
          <span className="text-xs text-amber-600 uppercase font-semibold flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            Belum Mencoblos
          </span>
          <div className="text-2xl font-black mt-1 text-amber-700 dark:text-amber-400">
            {dptStats.notVoted} Jiwa
          </div>
          <div className="text-[11px] text-muted-foreground">Menunggu giliran</div>
        </div>
      </div>

      {/* Tabs Konten */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 max-w-2xl">
          <TabsTrigger value="kandidat" className="gap-2">
            <Vote className="w-4 h-4" />
            Kandidat ({kandidat.length})
          </TabsTrigger>
          <TabsTrigger value="dpt" className="gap-2">
            <Users className="w-4 h-4" />
            DPT ({dptStats.total})
          </TabsTrigger>
          <TabsTrigger value="proyektor" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Layar Proyektor
          </TabsTrigger>
          <TabsTrigger value="bahp" className="gap-2">
            <FileCheck className="w-4 h-4" />
            Berita Acara
          </TabsTrigger>
        </TabsList>

        {/* ==================== TAB 1: KANDIDAT ==================== */}
        <TabsContent value="kandidat" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base">Pasangan Calon Peserta Pemilihan</h3>
              <p className="text-xs text-muted-foreground">
                Kandidat yang telah diverifikasi dan ditetapkan oleh panitia musyawarah.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setSelectedKandidatEdit(null)
                setOpenKandidatModal(true)
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Paslon
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {kandidat.length === 0 ? (
              <div className="col-span-3 p-12 text-center bg-card border rounded-2xl text-muted-foreground">
                Belum ada kandidat yang didaftarkan pada sesi ini.
              </div>
            ) : (
              kandidat.map((k) => (
                <div
                  key={k.id}
                  className="bg-card border rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between"
                >
                  <div className="p-5 space-y-4">
                    {/* Header Nomor Urut */}
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-lg">
                        {k.nomorUrut}
                      </div>
                      <Badge variant="outline" className="font-mono text-xs">
                        Paslon #{k.nomorUrut}
                      </Badge>
                    </div>

                    {/* Foto & Nama */}
                    <div className="flex items-center gap-4">
                      {k.fotoUrl ? (
                        <img
                          src={k.fotoUrl}
                          alt={k.namaKetua}
                          className="w-20 h-24 rounded-xl object-cover border"
                        />
                      ) : (
                        <div className="w-20 h-24 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                          <Vote className="w-8 h-8 opacity-40" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-base text-foreground leading-tight">
                          {k.namaKetua}
                        </div>
                        {k.namaWakil && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Wakil: {k.namaWakil}
                          </div>
                        )}
                        <div className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          Perolehan: {k.suaraSah || 0} Suara Sah
                        </div>
                      </div>
                    </div>

                    {/* Visi Misi */}
                    {k.visi && (
                      <div className="text-xs space-y-1 pt-2 border-t">
                        <span className="font-bold text-foreground block">Visi:</span>
                        <p className="text-muted-foreground italic line-clamp-2">
                          "{k.visi}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* ==================== TAB 2: DPT ==================== */}
        <TabsContent value="dpt" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border">
            <div className="relative w-full sm:w-80">
              <Input
                placeholder="Cari nama, NRA/NIM, atau token..."
                value={searchDpt}
                onChange={(e) => setSearchDpt(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border bg-muted p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterDptStatus('ALL')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    filterDptStatus === 'ALL'
                      ? 'bg-background font-bold text-foreground shadow-xs'
                      : 'text-muted-foreground'
                  }`}
                >
                  Semua ({dptStats.total})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterDptStatus('VOTED')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    filterDptStatus === 'VOTED'
                      ? 'bg-background font-bold text-foreground shadow-xs'
                      : 'text-muted-foreground'
                  }`}
                >
                  Sudah ({dptStats.voted})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterDptStatus('NOT_VOTED')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    filterDptStatus === 'NOT_VOTED'
                      ? 'bg-background font-bold text-foreground shadow-xs'
                      : 'text-muted-foreground'
                  }`}
                >
                  Belum ({dptStats.notVoted})
                </button>
              </div>

              <Button size="sm" onClick={() => setOpenDptModal(true)}>
                <UserPlus className="w-4 h-4 mr-1.5" />
                Tetapkan DPT
              </Button>
            </div>
          </div>

          {/* Tabel DPT */}
          <div className="bg-card border rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Nama Pemilih</th>
                    <th className="px-4 py-3 text-left">NRA / Identitas</th>
                    <th className="px-4 py-3 text-center">Token Bilik Suara</th>
                    <th className="px-4 py-3 text-center">Status Kehadiran / Mencoblos</th>
                    <th className="px-4 py-3 text-left">Waktu Masuk Suara</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredDpt.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        Tidak ada data pemilih yang sesuai.
                      </td>
                    </tr>
                  ) : (
                    filteredDpt.map((d) => (
                      <tr key={d.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="font-bold text-foreground">{d.nama}</div>
                          <div className="text-xs text-muted-foreground">
                            {d.emailOrPhone || '-'}
                          </div>
                        </td>

                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {d.nraOrNim || '-'}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span className="font-mono font-bold text-xs bg-muted px-2 py-1 rounded border">
                            {d.votingToken}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center">
                          {d.hasVoted ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                              Sudah Mencoblos
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200">
                              Belum Mencoblos
                            </Badge>
                          )}
                        </td>

                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {d.votedAt
                            ? new Date(d.votedAt).toLocaleString('id-ID')
                            : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ==================== TAB 3: LAYAR PROYEKTOR QUICK COUNT ==================== */}
        <TabsContent value="proyektor" className="space-y-4">
          <div className="p-6 bg-slate-950 text-white rounded-3xl shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="text-[10px] uppercase font-black tracking-widest text-emerald-400">
                  REAL-TIME QUICK COUNT PLENO
                </div>
                <h2 className="text-xl font-black text-white">{event.title}</h2>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-slate-900 border-slate-800 text-white hover:bg-slate-800"
                  onClick={loadQuickCount}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  Segarkan
                </Button>
              </div>
            </div>

            {/* Quick Count Bars */}
            <div className="space-y-5">
              {quickCountData?.kandidat?.map((k: any) => (
                <div
                  key={k.id}
                  className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-sm">
                        {k.nomorUrut}
                      </div>
                      <div>
                        <div className="font-bold text-white text-base">
                          {k.namaKetua}
                        </div>
                        {k.namaWakil && (
                          <div className="text-xs text-slate-400">
                            Wakil: {k.namaWakil}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black text-emerald-400">
                        {k.persentase !== null ? `${k.persentase}%` : 'Terkunci'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {k.suaraSah !== null ? `${k.suaraSah} Suara` : 'Sesuai Pleno'}
                      </div>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-700"
                      style={{ width: `${Math.min(100, k.persentase || 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Turnout Footer */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-center text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">
                  DPT Terdaftar
                </span>
                <span className="text-lg font-black text-white">
                  {quickCountData?.totalDpt || 0}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">
                  Suara Masuk
                </span>
                <span className="text-lg font-black text-emerald-400">
                  {quickCountData?.totalSuaraMasuk || 0}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">
                  Partisipasi Pleno
                </span>
                <span className="text-lg font-black text-white">
                  {quickCountData?.partisipasi || 0}%
                </span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ==================== TAB 4: BERITA ACARA (BAHP) ==================== */}
        <TabsContent value="bahp" className="space-y-4">
          <div className="p-6 bg-card border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-primary" />
                Berita Acara Hasil Pemilihan (BAHP)
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                Dokumen yuridis resmi penetapan hasil pemungutan suara pleno untuk
                ditandatangani oleh Presidium Sidang I, II, III dan para saksi kandidat.
              </p>
            </div>

            <Button onClick={() => setOpenBahpModal(true)}>
              <Printer className="w-4 h-4 mr-2" />
              Buka & Cetak BAHP
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <KandidatModal
        open={openKandidatModal}
        onOpenChange={setOpenKandidatModal}
        votingEventId={event.id}
        kandidat={selectedKandidatEdit}
        onSuccess={() => {
          loadKandidat()
          loadQuickCount()
        }}
      />

      <DptModal
        open={openDptModal}
        onOpenChange={setOpenDptModal}
        votingEventId={event.id}
        onSuccess={() => {
          loadDpt()
          loadQuickCount()
        }}
      />

      <BeritaAcaraVotingModal
        open={openBahpModal}
        onOpenChange={setOpenBahpModal}
        event={event}
        kandidatList={kandidat}
        totalDpt={dptStats.total}
        totalSuaraMasuk={event.totalSuara}
      />
    </div>
  )
}

