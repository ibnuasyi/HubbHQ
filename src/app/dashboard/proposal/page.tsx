'use client'

import * as React from 'react'
import {
  Plus,
  Loader2,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  Upload,
  History,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
  PENDING: { label: 'Menunggu Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  APPROVED: { label: 'Disetujui', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REJECTED: { label: 'Ditolak', color: 'bg-red-100 text-red-800', icon: XCircle },
  NEEDS_REVISION: { label: 'Butuh Revisi', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
  REVISED: { label: 'Revisi Diajukan', color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
}

export default function ProposalPage() {
  const [proposals, setProposals] = React.useState<Proposal[]>([])
  const [loading, setLoading] = React.useState(true)
  const [status, setStatus] = React.useState<string>('')
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [showAdd, setShowAdd] = React.useState(false)
  const [showDetail, setShowDetail] = React.useState(false)
  const [selectedProposal, setSelectedProposal] = React.useState<Proposal | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)
  const [note, setNote] = React.useState('')
  const [revisionFile, setRevisionFile] = React.useState<File | null>(null)

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

  const handleAction = async (id: string, action: string) => {
    setActionLoading(id)
    try {
      let body: any = { action }

      // For request_revision, include the note
      if (action === 'request_revision' && note) {
        body.note = note
      }

      const res = await fetch(`/api/proposal/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setShowDetail(false)
        setNote('')
        fetchProposals()
      }
    } catch (error) {
      console.error('Error action:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleSubmitRevision = async () => {
    if (!selectedProposal || !revisionFile) return

    setActionLoading(selectedProposal.id)
    try {
      const formData = new FormData()
      formData.append('action', 'submit_revision')
      formData.append('revisionFile', revisionFile)

      const res = await fetch(`/api/proposal/${selectedProposal.id}`, {
        method: 'PATCH',
        body: formData,
      })

      if (res.ok) {
        setShowDetail(false)
        setRevisionFile(null)
        setNote('')
        fetchProposals()
      }
    } catch (error) {
      console.error('Error submitting revision:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const openDetail = async (proposal: Proposal) => {
    setSelectedProposal(proposal)
    setShowDetail(true)
    setNote('')
    setRevisionFile(null)
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
                      className="flex items-start justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => openDetail(p)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${config.color}`}>
                          <StatusIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{p.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{p.requester.name || 'Unknown'}</span>
                            {p.programKerja && (
                              <>
                                <span>•</span>
                                <span>{p.programKerja.title}</span>
                              </>
                            )}
                          </div>
                          {/* Show revision note preview */}
                          {(p.status === 'NEEDS_REVISION' || p.status === 'REVISED') && p.revisionNote && (
                            <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {p.revisionNote.substring(0, 60)}...
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(p.amount)}</p>
                        <Badge className={config.color}>{config.label}</Badge>
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

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedProposal?.title}
              {selectedProposal && (
                <Badge className={statusConfig[selectedProposal.status].color}>
                  {statusConfig[selectedProposal.status].label}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedProposal && (
            <Tabs defaultValue="detail" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="detail">Detail</TabsTrigger>
                <TabsTrigger value="files">File</TabsTrigger>
                <TabsTrigger value="revision">
                  Revisi
                  {selectedProposal.status === 'NEEDS_REVISION' && (
                    <AlertCircle className="h-4 w-4 text-orange-500 ml-1" />
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Detail Tab */}
              <TabsContent value="detail" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Jumlah</p>
                    <p className="font-bold text-lg">{formatCurrency(selectedProposal.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tanggal</p>
                    <p>{new Date(selectedProposal.createdAt).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pengaju</p>
                    <p className="font-medium">{selectedProposal.requester.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Program Kerja</p>
                    <p className="font-medium">{selectedProposal.programKerja?.title || '-'}</p>
                  </div>
                </div>

                {selectedProposal.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Deskripsi</p>
                    <p className="mt-1">{selectedProposal.description}</p>
                  </div>
                )}

                {/* Revision Note Alert */}
                {selectedProposal.status === 'NEEDS_REVISION' && selectedProposal.revisionNote && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-orange-900">Catatan Revisi dari Bendahara</p>
                        <p className="text-orange-800 mt-1 whitespace-pre-wrap">{selectedProposal.revisionNote}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedProposal.reviewedNote && selectedProposal.status !== 'NEEDS_REVISION' && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Catatan Review</p>
                    <p className="mt-1">{selectedProposal.reviewedNote}</p>
                  </div>
                )}

                {/* Actions for Bendahara */}
                {selectedProposal.status === 'PENDING' && (
                  <div className="border-t pt-4 mt-4">
                    <Label>Catatan Review (opsional)</Label>
                    <Textarea
                      className="mt-2"
                      placeholder="Tambahkan catatan untuk proposal ini..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="destructive"
                        onClick={() => handleAction(selectedProposal.id, 'reject')}
                        disabled={actionLoading === selectedProposal.id}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Tolak
                      </Button>
                      <Button
                        variant="outline"
                        className="border-orange-500 text-orange-600 hover:bg-orange-50"
                        onClick={() => handleAction(selectedProposal.id, 'request_revision')}
                        disabled={actionLoading === selectedProposal.id || !note}
                      >
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Minta Revisi
                      </Button>
                      <Button
                        onClick={() => handleAction(selectedProposal.id, 'approve')}
                        disabled={actionLoading === selectedProposal.id}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Setujui
                      </Button>
                    </div>
                    {!note && (
                      <p className="text-xs text-muted-foreground mt-2">
                        * Catatan diperlukan untuk "Minta Revisi"
                      </p>
                    )}
                  </div>
                )}

                {selectedProposal.status === 'REVISED' && (
                  <div className="border-t pt-4 mt-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-2">
                        <RefreshCw className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900">Proposal Sudah Direvisi</p>
                          <p className="text-blue-800 text-sm mt-1">
                            Mohon review kembali proposal yang sudah direvisi.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={() => handleAction(selectedProposal.id, 'reject')}
                        disabled={actionLoading === selectedProposal.id}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Tolak
                      </Button>
                      <Button
                        onClick={() => handleAction(selectedProposal.id, 'approve')}
                        disabled={actionLoading === selectedProposal.id}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Setujui
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Files Tab */}
              <TabsContent value="files" className="space-y-4">
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="font-medium">Proposal Awal</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedProposal.proposalFile ? 'File uploaded' : 'Tidak ada file'}
                          </p>
                        </div>
                      </div>
                      {selectedProposal.proposalFile && (
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          Lihat
                        </Button>
                      )}
                    </div>
                  </div>

                  {selectedProposal.revisionFile && (
                    <div className="border rounded-lg p-4 border-blue-200 bg-blue-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <RefreshCw className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="font-medium text-blue-900">Proposal Revisi</p>
                            <p className="text-sm text-blue-700">
                              Diupload: {new Date(selectedProposal.updatedAt).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="border-blue-300">
                          <Eye className="mr-2 h-4 w-4" />
                          Lihat
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Revision Tab */}
              <TabsContent value="revision" className="space-y-4">
                {selectedProposal.status === 'NEEDS_REVISION' ? (
                  <div className="space-y-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-orange-900">Butuh Revisi</p>
                          <p className="text-orange-800 text-sm mt-1">
                            Silakan perbaiki proposal sesuai catatan dari bendahara, lalu upload ulang.
                          </p>
                        </div>
                      </div>
                    </div>

                    {selectedProposal.revisionNote && (
                      <div className="bg-white border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground font-medium">Catatan dari Bendahara:</p>
                        <p className="mt-2 whitespace-pre-wrap text-orange-900">{selectedProposal.revisionNote}</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Upload Proposal Revisi (PDF/DOCX)</Label>
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setRevisionFile(e.target.files?.[0] || null)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Pastikan file sudah diperbaiki sesuai catatan sebelum diupload.
                      </p>
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleSubmitRevision}
                      disabled={!revisionFile || actionLoading === selectedProposal.id}
                    >
                      {actionLoading === selectedProposal.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Submit Revisi
                    </Button>
                  </div>
                ) : selectedProposal.revisionNote ? (
                  <div className="space-y-4">
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Riwayat Revisi</p>
                      <p className="mt-2 whitespace-pre-wrap">{selectedProposal.revisionNote}</p>
                    </div>

                    {selectedProposal.revisionFile && (
                      <div className="border rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <RefreshCw className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="font-medium">File Revisi</p>
                            <p className="text-sm text-muted-foreground">
                              Sudah diupload
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          Lihat
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Belum ada revisi untuk proposal ini</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
