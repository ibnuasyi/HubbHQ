'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  Loader2,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardHeader,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Proposal {
  id: string
  title: string
  description: string | null
  amount: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION' | 'REVISED'
  proposalFile: string | null
  revisionFile: string | null
  revisionNote: string | null
  reviewedNote: string | null
  requester: { id: string; name: string | null }
  programKerja: { id: string; title: string } | null
  createdAt: string
  updatedAt: string
}

const formatCurrency = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num)
}

const statusConfig = {
  PENDING: { label: 'Menunggu Review', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300', icon: Clock },
  APPROVED: { label: 'Disetujui', color: 'bg-green-100 text-green-800 dark:bg-emerald-950/60 dark:text-emerald-300', icon: CheckCircle },
  REJECTED: { label: 'Ditolak', color: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300', icon: XCircle },
  NEEDS_REVISION: { label: 'Butuh Revisi', color: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300', icon: AlertCircle },
  REVISED: { label: 'Revisi Diajukan', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300', icon: RefreshCw },
}

export default function ProposalPage() {
  const router = useRouter()
  const [proposals, setProposals] = React.useState<Proposal[]>([])
  const [loading, setLoading] = React.useState(true)
  const [status, setStatus] = React.useState<string>('')
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [showAdd, setShowAdd] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  const limit = 20

  // Form state
  const [formTitle, setFormTitle] = React.useState('')
  const [formDescription, setFormDescription] = React.useState('')
  const [formAmount, setFormAmount] = React.useState('')
  const [formProgramKerjaId, setFormProgramKerjaId] = React.useState('')
  const [proker, setProker] = React.useState<any[]>([])

  const fetchProposals = React.useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      if (status) params.append('status', status)

      const res = await fetch(`/api/proposal?${params}`)
      const data = await res.json()

      if (data.data) {
        setProposals(data.data)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Error fetching proposals:', error)
    } finally {
      setLoading(false)
    }
  }, [page, status])

  const fetchProker = async () => {
    try {
      const res = await fetch('/api/proker')
      if (res.ok) {
        const data = await res.json()
        setProker(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching proker:', error)
    }
  }

  React.useEffect(() => {
    fetchProposals()
    fetchProker()
  }, [fetchProposals])

  const handleSubmit = async () => {
    if (!formTitle || !formAmount) return

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', formTitle)
      formData.append('description', formDescription)
      formData.append('amount', formAmount)
      if (formProgramKerjaId) formData.append('programKerjaId', formProgramKerjaId)

      const fileInput = document.getElementById('proposalFile') as HTMLInputElement
      if (fileInput?.files?.[0]) {
        formData.append('proposalFile', fileInput.files[0])
      }

      const res = await fetch('/api/proposal', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        setShowAdd(false)
        setFormTitle('')
        setFormDescription('')
        setFormAmount('')
        setFormProgramKerjaId('')
        fetchProposals()
      }
    } catch (error) {
      console.error('Error submitting proposal:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proposal Dana</h1>
          <p className="text-muted-foreground">
            Kelola pengajuan proposal dana ({total} proposal)
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajukan Proposal
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua</SelectItem>
                <SelectItem value="PENDING">Menunggu Review</SelectItem>
                <SelectItem value="NEEDS_REVISION">Butuh Revisi</SelectItem>
                <SelectItem value="REVISED">Revisi Diajukan</SelectItem>
                <SelectItem value="APPROVED">Disetujui</SelectItem>
                <SelectItem value="REJECTED">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : proposals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p>Belum ada proposal</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {proposals.map((p) => {
                  const config = statusConfig[p.status]
                  const StatusIcon = config.icon

                  return (
                    <div
                      key={p.id}
                      className="flex items-start justify-between p-4 rounded-lg border hover:border-primary/50 hover:bg-muted/40 cursor-pointer transition-all shadow-sm group"
                      onClick={() => router.push(`/dashboard/proposal/${p.id}`)}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
                        <div className={`p-2 rounded-full shrink-0 ${config.color}`}>
                          <StatusIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/dashboard/proposal/${p.id}`}
                            className="font-semibold text-base text-foreground group-hover:text-primary transition-colors hover:underline block truncate"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {p.title}
                          </Link>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                            <span>{p.requester.name || 'Pengguna'}</span>
                            {p.programKerja && (
                              <>
                                <span>•</span>
                                <span className="truncate">{p.programKerja.title}</span>
                              </>
                            )}
                          </div>
                          {(p.status === 'NEEDS_REVISION' || p.status === 'REVISED') && p.revisionNote && (
                            <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 shrink-0" />
                              <span className="truncate">{p.revisionNote}</span>
                            </p>
                          )}
                          {p.reviewedNote && p.status === 'REJECTED' && (
                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                              <XCircle className="h-3 w-3 shrink-0" />
                              <span className="truncate">{p.reviewedNote}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 text-right">
                        <div>
                          <p className="font-bold text-foreground">{formatCurrency(p.amount)}</p>
                          <Badge className={`${config.color} text-xs mt-1`}>{config.label}</Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="hidden sm:inline-flex text-xs h-8"
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link href={`/dashboard/proposal/${p.id}`}>
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            Buka Proposal
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Halaman {page} dari {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                      Sebelumnya
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === totalPages}>
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Proposal Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajukan Proposal Dana</DialogTitle>
            <DialogDescription>
              Ajukan proposal dana untuk program kerja
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Judul Proposal *</Label>
              <Input
                placeholder="Judul proposal"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                placeholder="Deskripsi proposal"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Jumlah (Rp) *</Label>
              <Input
                type="number"
                placeholder="0"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Program Kerja</Label>
              <Select value={formProgramKerjaId} onValueChange={setFormProgramKerjaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih program kerja" />
                </SelectTrigger>
                <SelectContent>
                  {proker.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>File Proposal (PDF/DOCX)</Label>
              <Input id="proposalFile" type="file" accept=".pdf,.doc,.docx" />
              <p className="text-xs text-muted-foreground">
                Upload file proposal dalam format PDF atau Word
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !formTitle || !formAmount}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajukan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
