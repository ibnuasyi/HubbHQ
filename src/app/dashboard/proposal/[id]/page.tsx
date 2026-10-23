'use client'

import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Download,
  Calendar,
  User,
  History,
  Send,
  Loader2,
  FileCheck,
  Building2,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ProposalHistoryItem {
  id: string
  version: number
  title: string
  description: string | null
  amount: number | string
  proposalFile: string | null
  status: string
  reviewedNote: string | null
  reviewedAt: string | null
  createdAt: string
  reviewedBy?: {
    id: string
    name: string | null
  } | null
}

interface ProposalDetail {
  id: string
  title: string
  description: string | null
  amount: number | string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION' | 'REVISED'
  version: number
  proposalFile: string | null
  revisionFile: string | null
  revisionNote: string | null
  reviewedNote: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
  requester: {
    id: string
    name: string | null
    email: string | null
    avatar?: string | null
  }
  reviewedBy?: {
    id: string
    name: string | null
    email?: string | null
  } | null
  programKerja?: {
    id: string
    title: string
    description?: string | null
    startDate?: string | null
    endDate?: string | null
    divisi?: {
      id: string
      name: string
      color: string
    } | null
    pic?: {
      id: string
      name: string | null
    } | null
  } | null
  history: ProposalHistoryItem[]
}

const statusConfig = {
  PENDING: { label: 'Menunggu Review', color: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-800', icon: Clock },
  APPROVED: { label: 'Disetujui (ACC)', color: 'bg-green-100 text-green-800 border-green-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800', icon: CheckCircle },
  REJECTED: { label: 'Ditolak', color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800', icon: XCircle },
  NEEDS_REVISION: { label: 'Butuh Revisi', color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800', icon: AlertCircle },
  REVISED: { label: 'Revisi Diajukan', color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800', icon: RefreshCw },
}

const formatCurrency = (amount: number | string | null | undefined) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount || 0)
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num)
}

export default function ProposalDetailPage() {
  const router = useRouter()
  const params = useParams()
  const proposalId = params.id as string

  const [proposal, setProposal] = React.useState<ProposalDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null)

  // Review Dialog State
  const [showReviewDialog, setShowReviewDialog] = React.useState(false)
  const [reviewAction, setReviewAction] = React.useState<'approve' | 'reject' | 'request_revision'>('approve')
  const [reviewNote, setReviewNote] = React.useState('')

  // Revision Form State (for resubmission when rejected/needs revision)
  const [showRevisionForm, setShowRevisionForm] = React.useState(false)
  const [revisedTitle, setRevisedTitle] = React.useState('')
  const [revisedAmount, setRevisedAmount] = React.useState('')
  const [revisedDesc, setRevisedDesc] = React.useState('')
  const [revisedFile, setRevisedFile] = React.useState('')

  const fetchProposal = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/proposal/${proposalId}`)
      if (res.ok) {
        const json = await res.json()
        const data: ProposalDetail = json.data
        setProposal(data)
        setRevisedTitle(data.title)
        setRevisedAmount(data.amount.toString())
        setRevisedDesc(data.description || '')
        setRevisedFile(data.proposalFile || '')
      } else {
        const d = await res.json()
        setError(d.error || 'Proposal tidak ditemukan')
      }
    } catch (err) {
      console.error('Error fetching proposal:', err)
      setError('Gagal memuat data proposal')
    } finally {
      setLoading(false)
    }
  }, [proposalId])

  React.useEffect(() => {
    fetchProposal()
  }, [fetchProposal])

  // Handle Review (Approve / Reject / Request Revision)
  const handleReviewSubmit = async () => {
    if ((reviewAction === 'reject' || reviewAction === 'request_revision') && !reviewNote.trim()) {
      setError('Catatan / alasan wajib diisi saat menolak atau meminta revisi.')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const res = await fetch(`/api/proposal/${proposalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: reviewAction,
          note: reviewNote.trim(),
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setShowReviewDialog(false)
        setReviewNote('')
        setSuccessMsg(
          reviewAction === 'approve'
            ? 'Proposal dana telah disetujui (ACC)!'
            : reviewAction === 'request_revision'
            ? 'Permintaan revisi telah dikirim ke pemohon.'
            : 'Proposal dana telah ditolak dengan catatan.'
        )
        fetchProposal()
      } else {
        setError(data.error || 'Gagal memproses peninjauan proposal')
      }
    } catch (err) {
      console.error('Error reviewing proposal:', err)
      setError('Terjadi kesalahan saat memproses peninjauan proposal')
    } finally {
      setSaving(false)
    }
  }

  // Handle Revision Submission (Git-like commit to history and bump version)
  const handleRevisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!revisedTitle.trim() || !revisedAmount) {
      setError('Judul proposal dan nominal anggaran wajib diisi.')
      return
    }

    try {
      setSaving(true)
      setError(null)
      const res = await fetch(`/api/proposal/${proposalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_revision',
          title: revisedTitle.trim(),
          amount: revisedAmount,
          description: revisedDesc.trim(),
          revisionFile: revisedFile.trim() || null,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setShowRevisionForm(false)
        setSuccessMsg('Proposal revisi berhasil dinaikkan. Versi sebelumnya tersimpan dalam riwayat!')
        fetchProposal()
      } else {
        setError(data.error || 'Gagal menaikkan proposal revisi')
      }
    } catch (err) {
      console.error('Error submitting revision:', err)
      setError('Terjadi kesalahan saat menaikkan proposal revisi')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Memuat data proposal dana...</p>
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Tidak Ditemukan</AlertTitle>
          <AlertDescription>{error || 'Proposal dana tidak ditemukan dalam basis data.'}</AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href="/dashboard/proposal">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar Proposal
          </Link>
        </Button>
      </div>
    )
  }

  const currentStatusConfig = statusConfig[proposal.status] || statusConfig.PENDING
  const StatusIcon = currentStatusConfig.icon
  const canBeReviewed = ['PENDING', 'REVISED', 'NEEDS_REVISION'].includes(proposal.status)
  const canBeResubmitted = ['NEEDS_REVISION', 'REJECTED'].includes(proposal.status)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <Button variant="ghost" asChild className="mb-2 pl-0">
            <Link href="/dashboard/proposal">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Daftar Proposal Dana
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{proposal.title}</h1>
            <Badge variant="outline" className={`text-xs px-2.5 py-0.5 ${currentStatusConfig.color}`}>
              <StatusIcon className="mr-1 h-3.5 w-3.5" />
              {currentStatusConfig.label}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Versi {proposal.version}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Diajukan oleh <span className="font-medium text-foreground">{proposal.requester.name || 'Pengguna'}</span> pada{' '}
            {new Date(proposal.createdAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {proposal.programKerja && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/proker/${proposal.programKerja.id}`}>
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Halaman Program Kerja
              </Link>
            </Button>
          )}

          {canBeReviewed && (
            <Button
              size="sm"
              onClick={() => {
                setReviewAction('approve')
                setShowReviewDialog(true)
              }}
            >
              <FileCheck className="mr-1.5 h-3.5 w-3.5" />
              Tinjau & Putuskan
            </Button>
          )}

          {canBeResubmitted && (
            <Button
              variant="default"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowRevisionForm(!showRevisionForm)}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              {showRevisionForm ? 'Tutup Form Revisi' : 'Naikkan Proposal Revisi'}
            </Button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Perhatian</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMsg && (
        <Alert className="bg-green-50 text-green-900 border-green-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-emerald-400" />
          <AlertTitle>Berhasil</AlertTitle>
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}

      {/* Key Metric Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-muted/20">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Nominal Anggaran Diajukan</CardDescription>
            <CardTitle className="text-xl font-bold text-primary">
              {formatCurrency(proposal.amount)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Anggaran Versi {proposal.version}
          </CardContent>
        </Card>

        <Card className="bg-muted/20">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Program Kerja Terkait</CardDescription>
            <CardTitle className="text-base font-semibold truncate">
              {proposal.programKerja ? proposal.programKerja.title : 'Tidak Terikat Proker'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            {proposal.programKerja?.divisi ? `Divisi: ${proposal.programKerja.divisi.name}` : 'Proposal Mandiri'}
          </CardContent>
        </Card>

        <Card className="bg-muted/20">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Peninjau (Reviewer)</CardDescription>
            <CardTitle className="text-base font-semibold">
              {proposal.reviewedBy?.name || 'Belum Ditinjau'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            {proposal.reviewedAt
              ? `Pada ${new Date(proposal.reviewedAt).toLocaleDateString('id-ID')}`
              : 'Menunggu keputusan'}
          </CardContent>
        </Card>

        <Card className="bg-muted/20">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Status Realisasi</CardDescription>
            <CardTitle className="text-base font-semibold">
              {proposal.status === 'APPROVED' ? (
                <span className="text-green-600">Disetujui untuk Cair</span>
              ) : proposal.status === 'REJECTED' ? (
                <span className="text-red-600">Ditolak</span>
              ) : (
                <span className="text-yellow-600">Proses Peninjauan</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            {proposal.status === 'APPROVED' ? 'Tercatat di LPJ Proker' : 'Belum dapat dicairkan'}
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Detail & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Proposal Body, Review Decision, Resubmission */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form Revisi (Jika Dimunculkan) */}
          {showRevisionForm && (
            <Card className="border-blue-300 bg-blue-50/20 dark:border-blue-800 dark:bg-blue-950/20 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-blue-900 dark:text-blue-200">
                  <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Form Pengajuan Proposal Revisi (Versi {proposal.version + 1})
                </CardTitle>
                <CardDescription>
                  Proposal terdahulu (Versi {proposal.version}) akan diarsipkan secara otomatis ke dalam rekam riwayat versi untuk pembelajaran organisasi.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleRevisionSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="revisedTitle">Judul Proposal</Label>
                    <Input
                      id="revisedTitle"
                      value={revisedTitle}
                      onChange={(e) => setRevisedTitle(e.target.value)}
                      placeholder="Contoh: Proposal Pengadaan Konsumsi & Perlengkapan (Revisi)"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="revisedAmount">Nominal Anggaran Diajukan (Rp)</Label>
                      <Input
                        id="revisedAmount"
                        type="number"
                        min="1000"
                        value={revisedAmount}
                        onChange={(e) => setRevisedAmount(e.target.value)}
                        placeholder="Contoh: 1500000"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="revisedFile">Link Dokumen Proposal Baru (URL/G-Drive)</Label>
                      <Input
                        id="revisedFile"
                        value={revisedFile}
                        onChange={(e) => setRevisedFile(e.target.value)}
                        placeholder="https://drive.google.com/file/..."
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="revisedDesc">Keterangan / Rangkuman Perubahan Revisi</Label>
                    <Textarea
                      id="revisedDesc"
                      value={revisedDesc}
                      onChange={(e) => setRevisedDesc(e.target.value)}
                      rows={3}
                      placeholder="Jelaskan penyesuaian yang dilakukan berdasarkan catatan peninjau..."
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowRevisionForm(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                    Kirim Proposal Revisi (v{proposal.version + 1})
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          {/* Rincian Proposal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Rincian & Informasi Pengajuan Dana
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Deskripsi & Latar Belakang Kebutuhan Dana
                </p>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-muted/20 p-3.5 rounded-lg border">
                  {proposal.description || 'Tidak ada keterangan tambahan yang dicantumkan pada proposal ini.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Dokumen Proposal (File Lampiran)</p>
                  {proposal.proposalFile ? (
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {proposal.proposalFile}
                      </span>
                      <Button variant="outline" size="sm" asChild>
                        <a href={proposal.proposalFile} target="_blank" rel="noopener noreferrer">
                          <Download className="mr-1.5 h-3.5 w-3.5" />
                          Unduh / Buka
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      Tidak ada file berkas lampiran yang dilampirkan.
                    </p>
                  )}
                </div>

                <div className="border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Dokumen Revisi Terbaru</p>
                  {proposal.revisionFile ? (
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {proposal.revisionFile}
                      </span>
                      <Button variant="outline" size="sm" asChild>
                        <a href={proposal.revisionFile} target="_blank" rel="noopener noreferrer">
                          <Download className="mr-1.5 h-3.5 w-3.5" />
                          Unduh Revisi
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      Belum ada berkas revisi tambahan.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Catatan Reviewer & Keputusan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                Catatan Peninjau & Keputusan Organisasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {proposal.status === 'APPROVED' && (
                <div className="p-4 rounded-lg bg-green-50/70 border border-green-200 dark:bg-emerald-950/30 dark:border-emerald-800 space-y-2">
                  <div className="flex items-center gap-2 text-green-800 dark:text-emerald-300 font-semibold text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-emerald-400" />
                    Proposal Disetujui (ACC) oleh {proposal.reviewedBy?.name || 'Pimpinan / Bendahara'}
                  </div>
                  {proposal.reviewedNote ? (
                    <p className="text-sm text-green-900 bg-white/70 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800 p-3 rounded border border-green-200">
                      Catatan: {proposal.reviewedNote}
                    </p>
                  ) : (
                    <p className="text-xs text-green-700 dark:text-emerald-400 italic">Disetujui tanpa catatan tambahan.</p>
                  )}
                  {proposal.reviewedAt && (
                    <p className="text-xs text-green-700 dark:text-emerald-400">
                      Waktu persetujuan: {new Date(proposal.reviewedAt).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              )}

              {proposal.status === 'REJECTED' && (
                <div className="p-4 rounded-lg bg-red-50/70 border border-red-200 dark:bg-red-950/30 dark:border-red-800 space-y-2">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-300 font-semibold text-sm">
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    Proposal Ditolak oleh {proposal.reviewedBy?.name || 'Pimpinan / Bendahara'}
                  </div>
                  {proposal.reviewedNote && (
                    <p className="text-sm text-red-900 bg-white/70 dark:bg-red-950/50 dark:text-red-200 dark:border-red-800 p-3 rounded border border-red-200">
                      Alasan Penolakan: {proposal.reviewedNote}
                    </p>
                  )}
                  <p className="text-xs text-red-700 dark:text-red-400">
                    Anda dapat menaikkan proposal revisi dengan mengklik tombol &quot;Naikkan Proposal Revisi&quot; di atas. Riwayat proposal ditolak ini akan tetap diarsipkan sebagai bahan pembelajaran.
                  </p>
                </div>
              )}

              {proposal.status === 'NEEDS_REVISION' && (
                <div className="p-4 rounded-lg bg-orange-50/70 border border-orange-200 dark:bg-orange-950/30 dark:border-orange-800 space-y-2">
                  <div className="flex items-center gap-2 text-orange-800 dark:text-orange-300 font-semibold text-sm">
                    <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    Proposal Membutuhkan Revisi
                  </div>
                  {proposal.revisionNote && (
                    <p className="text-sm text-orange-900 bg-white/70 dark:bg-orange-950/50 dark:text-orange-200 dark:border-orange-800 p-3 rounded border border-orange-200">
                      Catatan Perbaikan: {proposal.revisionNote}
                    </p>
                  )}
                  <p className="text-xs text-orange-700 dark:text-orange-400">
                    Silakan sesuaikan dokumen dan nominal proposal Anda lalu kirim ulang melalui tombol &quot;Naikkan Proposal Revisi&quot;.
                  </p>
                </div>
              )}

              {proposal.status === 'PENDING' && (
                <div className="p-4 rounded-lg bg-yellow-50/70 border border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800 text-sm text-yellow-800 dark:text-yellow-300 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    Menunggu Keputusan Peninjau
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">
                    Proposal ini sedang dalam antrean pemeriksaan oleh Bendahara / Pimpinan Organisasi.
                  </p>
                </div>
              )}

              {proposal.status === 'REVISED' && (
                <div className="p-4 rounded-lg bg-blue-50/70 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Revisi Telah Diajukan
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Pemohon telah mengirimkan pembaruan proposal. Menunggu verifikasi lanjutan oleh bendahara/pimpinan.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Program Kerja, Requester Card, Version History Timeline */}
        <div className="space-y-6">
          {/* Program Kerja Link Card */}
          {proposal.programKerja ? (
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">Program Kerja Induk</CardDescription>
                <CardTitle className="text-base">
                  <Link
                    href={`/dashboard/proker/${proposal.programKerja.id}`}
                    className="hover:underline hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    {proposal.programKerja.title}
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground pt-0">
                {proposal.programKerja.divisi && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">Divisi:</span>
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: `${proposal.programKerja.divisi.color}20`,
                        color: proposal.programKerja.divisi.color,
                      }}
                      className="text-[11px]"
                    >
                      {proposal.programKerja.divisi.name}
                    </Badge>
                  </div>
                )}
                {proposal.programKerja.pic && (
                  <div>
                    <span className="font-medium text-foreground">PIC Proker:</span> {proposal.programKerja.pic.name}
                  </div>
                )}
                {proposal.programKerja.startDate && (
                  <div>
                    <span className="font-medium text-foreground">Jadwal:</span>{' '}
                    {new Date(proposal.programKerja.startDate).toLocaleDateString('id-ID')}
                  </div>
                )}
                <div className="pt-2">
                  <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                    <Link href={`/dashboard/proker/${proposal.programKerja.id}`}>
                      Buka Halaman Proker
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">Program Kerja Induk</CardDescription>
                <CardTitle className="text-base text-muted-foreground">Tidak Terikat</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground pt-0">
                Proposal ini diajukan secara independen di luar program kerja terdaftar.
              </CardContent>
            </Card>
          )}

          {/* Requester Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="text-xs">Informasi Pemohon</CardDescription>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                {proposal.requester.name || 'Pengguna'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1 pt-0">
              <p>Email: {proposal.requester.email || '-'}</p>
              <p>Waktu Diajukan: {new Date(proposal.createdAt).toLocaleString('id-ID')}</p>
            </CardContent>
          </Card>

          {/* Git-like Version History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <History className="h-4 w-4 text-primary" />
                Riwayat Versi (History & Pembelajaran)
              </CardTitle>
              <CardDescription className="text-xs">
                Rekam jejak setiap iterasi proposal untuk transparansi
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {proposal.history && proposal.history.length > 0 ? (
                <div className="relative pl-4 border-l space-y-4 text-xs">
                  {proposal.history.map((h) => (
                    <div key={h.id} className="relative">
                      <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-muted-foreground/50 border-2 border-background" />
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <span>Versi {h.version}</span>
                        <Badge variant="outline" className="text-[10px] py-0 px-1">
                          {h.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-0.5">
                        Nominal: <span className="font-medium text-foreground">{formatCurrency(h.amount)}</span>
                      </p>
                      {h.reviewedNote && (
                        <p className="text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900 p-1.5 rounded mt-1 border border-red-200">
                          Catatan: {h.reviewedNote}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(h.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground italic text-center py-2">
                  Belum ada riwayat revisi (ini adalah Versi {proposal.version} pertama).
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Review Dialog (Approve / Reject / Revision) */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tinjau Proposal Dana</DialogTitle>
            <DialogDescription>
              Tentukan keputusan peninjauan untuk proposal &quot;{proposal.title}&quot; ({formatCurrency(proposal.amount)})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Keputusan Peninjau</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={reviewAction === 'approve' ? 'default' : 'outline'}
                  size="sm"
                  className={reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={() => setReviewAction('approve')}
                >
                  <CheckCircle className="mr-1 h-3.5 w-3.5" />
                  Setujui
                </Button>
                <Button
                  type="button"
                  variant={reviewAction === 'request_revision' ? 'default' : 'outline'}
                  size="sm"
                  className={reviewAction === 'request_revision' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                  onClick={() => setReviewAction('request_revision')}
                >
                  <AlertCircle className="mr-1 h-3.5 w-3.5" />
                  Minta Revisi
                </Button>
                <Button
                  type="button"
                  variant={reviewAction === 'reject' ? 'default' : 'outline'}
                  size="sm"
                  className={reviewAction === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
                  onClick={() => setReviewAction('reject')}
                >
                  <XCircle className="mr-1 h-3.5 w-3.5" />
                  Tolak
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reviewNote">
                {reviewAction === 'approve' ? 'Catatan Persetujuan (Opsional)' : 'Alasan / Catatan Peninjau (Wajib)'}
              </Label>
              <Textarea
                id="reviewNote"
                rows={3}
                placeholder={
                  reviewAction === 'approve'
                    ? 'Catatan khusus pencairan atau pengawasan anggaran...'
                    : reviewAction === 'request_revision'
                    ? 'Jelaskan poin rincian anggaran yang perlu direvisi oleh pemohon...'
                    : 'Jelaskan alasan penolakan proposal ini sebagai arsip evaluasi...'
                }
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                required={reviewAction !== 'approve'}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={handleReviewSubmit}
              disabled={saving}
              className={
                reviewAction === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : reviewAction === 'reject'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-orange-600 hover:bg-orange-700'
              }
            >
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Konfirmasi Keputusan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

