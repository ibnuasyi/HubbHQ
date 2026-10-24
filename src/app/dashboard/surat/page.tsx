'use client'

import * as React from 'react'
import {
  Plus,
  Search,
  Loader2,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  FileText,
  QrCode,
  Download,
  Eye,
  Send,
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
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DynamicForm } from '@/components/dynamic-form'
import { DisposisiModal, DisposisiData } from '@/components/surat/disposisi-modal'
import { LembarDisposisiPrint } from '@/components/surat/lembar-disposisi-print'
import { TindakLanjutDialog } from '@/components/surat/tindak-lanjut-dialog'

interface Surat {
  id: string
  type: 'MASUK' | 'KELUAR'
  letterNumber: string | null
  subject: string
  content: string | null
  sender: string | null
  senderContact: string | null
  receivedDate: string | null
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
  requester: { id: string; name: string | null }
  approver: { id: string; name: string | null } | null
  jenisSurat: { id: string; name: string; code: string } | null
  disposisi?: DisposisiData[]
  qrCodeUrl: string | null
  qrCodeDataUrl?: string
  createdAt: string
}

const statusLabels: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  PENDING_APPROVAL: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { label: 'Disetujui', color: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Ditolak', color: 'bg-red-100 text-red-800' },
}

export default function SuratPage() {
  const [surat, setSurat] = React.useState<Surat[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [status, setStatus] = React.useState<string>('')
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [showAdd, setShowAdd] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<'masuk' | 'keluar'>('masuk')
  const [jenisSurat, setJenisSurat] = React.useState<any[]>([])
  const [saving, setSaving] = React.useState(false)

  // QR Code modal state
  const [showQrModal, setShowQrModal] = React.useState(false)
  const [selectedSurat, setSelectedSurat] = React.useState<Surat | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState<string | null>(null)
  const [generatingQr, setGeneratingQr] = React.useState(false)
  const [verifyUrl, setVerifyUrl] = React.useState<string | null>(null)

  // Detail modal state
  const [showDetail, setShowDetail] = React.useState(false)
  const [detailSurat, setDetailSurat] = React.useState<Surat | null>(null)

  // Dynamic form state
  const [selectedFormSchema, setSelectedFormSchema] = React.useState<any>(null)
  const [formData, setFormData] = React.useState<Record<string, any>>({})

  // Export state
  const [exporting, setExporting] = React.useState(false)
  const [exportYear, setExportYear] = React.useState(new Date().getFullYear().toString())

  // Disposisi states
  const [showDisposisiModal, setShowDisposisiModal] = React.useState(false)
  const [selectedSuratDisposisi, setSelectedSuratDisposisi] = React.useState<Surat | null>(null)
  const [showPrintDisposisi, setShowPrintDisposisi] = React.useState(false)
  const [selectedDisposisiPrint, setSelectedDisposisiPrint] = React.useState<DisposisiData | null>(null)
  const [showTindakLanjut, setShowTindakLanjut] = React.useState(false)
  const [selectedDisposisiTindakLanjut, setSelectedDisposisiTindakLanjut] = React.useState<DisposisiData | null>(null)

  // Form state
  const [formType, setFormType] = React.useState<'MASUK' | 'KELUAR'>('MASUK')
  const [formSubject, setFormSubject] = React.useState('')
  const [formContent, setFormContent] = React.useState('')
  const [formSender, setFormSender] = React.useState('')
  const [formSenderContact, setFormSenderContact] = React.useState('')
  const [formReceivedDate, setFormReceivedDate] = React.useState('')
  const [formLetterNumber, setFormLetterNumber] = React.useState('')
  const [formJenisSuratId, setFormJenisSuratId] = React.useState('')

  const limit = 20

  const fetchSurat = React.useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        type: activeTab === 'masuk' ? 'MASUK' : 'KELUAR',
      })
      if (status) params.append('status', status)

      const res = await fetch(`/api/surat?${params}`)
      const data = await res.json()

      if (data.data) {
        setSurat(data.data)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Error fetching surat:', error)
    } finally {
      setLoading(false)
    }
  }, [page, status, activeTab])

  const fetchJenisSurat = async () => {
    try {
      const res = await fetch('/api/jenis-surat')
      if (res.ok) {
        const data = await res.json()
        setJenisSurat(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching jenis surat:', error)
    }
  }

  const fetchFormSchema = async (jenisSuratId: string) => {
    try {
      const res = await fetch(`/api/jenis-surat/${jenisSuratId}/form`)
      if (res.ok) {
        const data = await res.json()
        setSelectedFormSchema(data.data)
        setFormData({})
      }
    } catch (error) {
      console.error('Error fetching form schema:', error)
    }
  }

  React.useEffect(() => {
    fetchSurat()
    fetchJenisSurat()
  }, [fetchSurat])

  const handleAddSurat = async () => {
    if (!formSubject) return

    setSaving(true)
    try {
      const res = await fetch('/api/surat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formType,
          subject: formSubject,
          content: formContent,
          sender: formSender || null,
          senderContact: formSenderContact || null,
          receivedDate: formReceivedDate || null,
          letterNumber: formLetterNumber || null,
          jenisSuratId: formJenisSuratId || null,
          formData: Object.keys(formData).length > 0 ? formData : null,
          // Auto-set status based on type:
          // - MASUK: Draft (uploaded by sekretaris)
          // - KELUAR: Pending approval (request by member)
          status: formType === 'KELUAR' ? 'PENDING_APPROVAL' : 'DRAFT',
        }),
      })

      if (res.ok) {
        setShowAdd(false)
        resetForm()
        fetchSurat()
      }
    } catch (error) {
      console.error('Error adding surat:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (suratId: string) => {
    try {
      const res = await fetch(`/api/surat/${suratId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'APPROVED',
        }),
      })

      if (res.ok) {
        fetchSurat()
      }
    } catch (error) {
      console.error('Error approving surat:', error)
    }
  }

  const handleReject = async (suratId: string) => {
    const note = prompt('Alasan penolakan:')
    if (note === null) return

    try {
      const res = await fetch(`/api/surat/${suratId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REJECTED',
          rejectionNote: note,
        }),
      })

      if (res.ok) {
        fetchSurat()
      }
    } catch (error) {
      console.error('Error rejecting surat:', error)
    }
  }

  const handleViewDetail = async (surat: Surat) => {
    setDetailSurat(surat)
    setShowDetail(true)
  }

  const resetForm = () => {
    setFormType('MASUK')
    setFormSubject('')
    setFormContent('')
    setFormSender('')
    setFormSenderContact('')
    setFormReceivedDate('')
    setFormLetterNumber('')
    setFormJenisSuratId('')
    setSelectedFormSchema(null)
    setFormData({})
  }

  const handleJenisSuratChange = (jenisSuratId: string) => {
    setFormJenisSuratId(jenisSuratId)
    if (jenisSuratId) {
      fetchFormSchema(jenisSuratId)
    } else {
      setSelectedFormSchema(null)
      setFormData({})
    }
  }

  const handleShowQrCode = async (surat: Surat) => {
    setSelectedSurat(surat)
    setShowQrModal(true)

    // If already has QR code, use existing
    if (surat.qrCodeUrl) {
      setQrCodeUrl(surat.qrCodeUrl)
      // Fetch the data URL if needed
      try {
        const res = await fetch(`/api/surat/${surat.id}/qrcode`)
        if (res.ok) {
          const data = await res.json()
          if (data.data?.qrCodeUrl) {
            setQrCodeUrl(data.data.qrCodeUrl)
          }
        }
      } catch (error) {
        console.error('Error fetching QR code:', error)
      }
      return
    }

    // Generate new QR code
    setGeneratingQr(true)
    try {
      const res = await fetch(`/api/surat/${surat.id}/qrcode`, {
        method: 'POST',
      })
      const data = await res.json()
      if (data.success) {
        setQrCodeUrl(data.data.qrCodeUrl)
        setQrCodeDataUrl(data.data.qrCodeDataUrl)
        setVerifyUrl(data.data.verifyUrl)
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
    } finally {
      setGeneratingQr(false)
    }
  }

  const handleDownloadQr = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a')
      link.href = qrCodeDataUrl
      link.download = `qr-surat-${selectedSurat?.id}.png`
      link.click()
    } else if (qrCodeUrl) {
      const link = document.createElement('a')
      link.href = qrCodeUrl
      link.download = `qr-surat-${selectedSurat?.id}.png`
      link.click()
    }
  }

  const handleCopyVerifyUrl = () => {
    if (verifyUrl) {
      navigator.clipboard.writeText(verifyUrl)
      alert('URL verifikasi berhasil disalin!')
    }
  }

  const handleExport = async (format: 'pdf' | 'excel') => {
    setExporting(true)
    try {
      const typeParam = activeTab === 'masuk' ? 'MASUK' : 'KELUAR'
      const res = await fetch(`/api/export/surat?format=${format}&type=${typeParam}&year=${exportYear}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `laporan-surat-${typeParam.toLowerCase()}-${exportYear}.${format === 'excel' ? 'xlsx' : 'pdf'}`
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

  const getStatusBadge = (status: string) => {
    const config = statusLabels[status] || statusLabels.DRAFT
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Surat</h1>
          <p className="text-muted-foreground">
            Kelola surat masuk dan keluar
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
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Surat
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="mb-4">
          <TabsTrigger value="masuk" className="flex items-center gap-2">
            <ArrowDownLeft className="h-4 w-4" />
            Surat Masuk ({surat.filter((s) => s.type === 'MASUK').length})
          </TabsTrigger>
          <TabsTrigger value="keluar" className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4" />
            Surat Keluar ({surat.filter((s) => s.type === 'KELUAR').length})
          </TabsTrigger>
        </TabsList>

        {['masuk', 'keluar'].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Cari surat..."
                      className="pl-9"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Semua</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PENDING_APPROVAL">Menunggu</SelectItem>
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
                ) : surat.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p>Belum ada surat {tab === 'masuk' ? 'masuk' : 'keluar'}</p>
                    <Button variant="link" onClick={() => setShowAdd(true)}>
                      Tambah surat pertama
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {surat
                        .filter((s) => s.type === (tab === 'masuk' ? 'MASUK' : 'KELUAR'))
                        .map((s) => (
                          <div
                            key={s.id}
                            className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <button
                                  onClick={() => handleViewDetail(s)}
                                  className="flex items-start gap-3 flex-1 text-left hover:bg-muted/50 p-2 -m-2 rounded-lg transition-colors"
                                >
                                  <div className={`p-2 rounded-full ${
                                    s.type === 'MASUK' ? 'bg-blue-100' : 'bg-green-100'
                                  }`}>
                                    {s.type === 'MASUK' ? (
                                      <ArrowDownLeft className="h-4 w-4 text-blue-600" />
                                    ) : (
                                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium">{s.subject}</p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      {s.jenisSurat && (
                                        <Badge variant="outline">{s.jenisSurat.code}</Badge>
                                      )}
                                      {s.letterNumber && (
                                        <span>No: {s.letterNumber}</span>
                                      )}
                                      {s.sender && <span>Pengirim: {s.sender}</span>}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {new Date(s.createdAt).toLocaleDateString('id-ID')}
                                    </p>
                                  </div>
                                </button>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                {getStatusBadge(s.status)}
                                {/* Approval buttons for pending surat */}
                                {s.status === 'PENDING_APPROVAL' && (
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-green-600 hover:text-green-700"
                                      onClick={() => handleApprove(s.id)}
                                    >
                                      Setuju
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 hover:text-red-700"
                                      onClick={() => handleReject(s.id)}
                                    >
                                      Tolak
                                    </Button>
                                  </div>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleShowQrCode(s)}
                                  className="text-muted-foreground hover:text-indigo-600"
                                >
                                  <QrCode className="h-4 w-4 mr-1" />
                                  QR
                                </Button>
                              </div>
                            </div>

                            {/* Lembar Disposisi khusus Surat Masuk */}
                            {s.type === 'MASUK' && (
                              <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
                                {s.disposisi && s.disposisi.length > 0 ? (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className={
                                        s.disposisi[0].sifat === 'SANGAT_SEGERA'
                                          ? 'bg-red-50 text-red-700 border-red-200'
                                          : s.disposisi[0].sifat === 'SEGERA'
                                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                                          : 'bg-slate-50 text-slate-700 border-slate-200'
                                      }
                                    >
                                      Disposisi: {s.disposisi[0].sifat.replace('_', ' ')}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      Tujuan:{' '}
                                      <strong className="text-foreground">
                                        {s.disposisi[0].tujuanDivisi?.name ||
                                          s.disposisi[0].tujuanUser?.name ||
                                          s.disposisi[0].tujuanCustom ||
                                          'Pelaksana'}
                                      </strong>
                                    </span>
                                    <Badge
                                      className={
                                        s.disposisi[0].status === 'SELESAI'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : s.disposisi[0].status === 'SEDANG_DIPROSES'
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-slate-100 text-slate-800'
                                      }
                                    >
                                      {s.disposisi[0].status === 'SELESAI'
                                        ? 'Selesai'
                                        : s.disposisi[0].status === 'SEDANG_DIPROSES'
                                        ? 'Sedang Berjalan'
                                        : 'Belum Diproses'}
                                    </Badge>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">
                                    Belum ada lembar disposisi pimpinan
                                  </span>
                                )}

                                <div className="flex items-center gap-1.5 ml-auto">
                                  {s.disposisi && s.disposisi.length > 0 ? (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs"
                                        onClick={() => {
                                          setSelectedSuratDisposisi(s)
                                          setSelectedDisposisiPrint(s.disposisi![0])
                                          setShowPrintDisposisi(true)
                                        }}
                                      >
                                        <FileText className="h-3.5 w-3.5 mr-1" />
                                        Lembar Disposisi
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-7 text-xs"
                                        onClick={() => {
                                          setSelectedDisposisiTindakLanjut(s.disposisi![0])
                                          setShowTindakLanjut(true)
                                        }}
                                      >
                                        Update Tindak Lanjut
                                      </Button>
                                    </>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs border-primary text-primary hover:bg-primary/5"
                                      onClick={() => {
                                        setSelectedSuratDisposisi(s)
                                        setShowDisposisiModal(true)
                                      }}
                                    >
                                      <Plus className="h-3.5 w-3.5 mr-1" />
                                      Buat Disposisi
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
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
          </TabsContent>
        ))}
      </Tabs>

      {/* Add Surat Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Surat</DialogTitle>
            <DialogDescription>
              Tambahkan surat {activeTab === 'masuk' ? 'masuk' : 'keluar'} baru
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={formType === 'MASUK' ? 'default' : 'outline'}
                onClick={() => setFormType('MASUK')}
                className="flex-1"
              >
                <ArrowDownLeft className="mr-2 h-4 w-4" />
                Masuk
              </Button>
              <Button
                variant={formType === 'KELUAR' ? 'default' : 'outline'}
                onClick={() => setFormType('KELUAR')}
                className="flex-1"
              >
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Keluar
              </Button>
            </div>

            {formType === 'KELUAR' && (
              <div className="space-y-2">
                <Label>Jenis Surat *</Label>
                <Select value={formJenisSuratId} onValueChange={handleJenisSuratChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis surat" />
                  </SelectTrigger>
                  <SelectContent>
                    {jenisSurat.map((js) => (
                      <SelectItem key={js.id} value={js.id}>
                        {js.name} ({js.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Dynamic Form */}
            {selectedFormSchema?.formSchema && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Form {selectedFormSchema.jenisSurat.name}</h4>
                <DynamicForm
                  formSchema={selectedFormSchema.formSchema}
                  formData={formData}
                  onChange={setFormData}
                />
              </div>
            )}

            {/* Default fields when no jenis surat selected or for MASUK */}
            {(!selectedFormSchema?.formSchema || formType === 'MASUK') && (
              <>
                <div className="space-y-2">
                  <Label>Perihal / Subjek *</Label>
                  <Input
                    placeholder="Perihal surat"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                  />
                </div>

                {formType === 'MASUK' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Pengirim</Label>
                        <Input
                          placeholder="Nama pengirim"
                          value={formSender}
                          onChange={(e) => setFormSender(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Kontak Pengirim</Label>
                        <Input
                          placeholder="No. Telepon/Email"
                          value={formSenderContact}
                          onChange={(e) => setFormSenderContact(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Tanggal Terima</Label>
                      <Input
                        type="date"
                        value={formReceivedDate}
                        onChange={(e) => setFormReceivedDate(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label>Isi Ringkasan</Label>
                  <Textarea
                    placeholder="Ringkasan isi surat..."
                    rows={3}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                  />
                </div>
              </>
            )}

            {formType === 'KELUAR' && (
              <div className="space-y-2">
                <Label>Nomor Surat (opsional)</Label>
                <Input
                  placeholder="Kosongkan untuk auto-generate"
                  value={formLetterNumber}
                  onChange={(e) => setFormLetterNumber(e.target.value)}
                />
                {selectedFormSchema?.jenisSurat?.autoNumber && (
                  <p className="text-xs text-muted-foreground">
                    Nomor akan digenerate otomatis jika dikosongkan
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); resetForm() }}>
              Batal
            </Button>
            <Button
              onClick={handleAddSurat}
              disabled={saving || (!formSubject && !selectedFormSchema?.formSchema)}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {formType === 'KELUAR' ? 'Ajukan Permohonan' : 'Simpan Draft'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code Verifikasi Surat</DialogTitle>
            <DialogDescription>
              Scan QR code ini untuk verifikasi keaslian surat
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {generatingQr ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
                <p className="text-sm text-muted-foreground">Generating QR Code...</p>
              </div>
            ) : qrCodeUrl || qrCodeDataUrl ? (
              <>
                <div className="flex flex-col items-center">
                  <img
                    src={qrCodeDataUrl || qrCodeUrl || ''}
                    alt="QR Code"
                    className="w-48 h-48 border rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Detail Surat:</p>
                  <div className="text-sm text-muted-foreground">
                    <p><strong>Perihal:</strong> {selectedSurat?.subject}</p>
                    <p><strong>Nomor:</strong> {selectedSurat?.letterNumber || '-'}</p>
                    <p><strong>Status:</strong> {selectedSurat?.status}</p>
                  </div>
                </div>
                {verifyUrl && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">URL Verifikasi:</p>
                    <code className="text-xs break-all">{verifyUrl}</code>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>Gagal memuat QR Code</p>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleCopyVerifyUrl}
              disabled={!verifyUrl}
            >
              Copy URL
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadQr}
              disabled={!qrCodeUrl && !qrCodeDataUrl}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            {qrCodeUrl && (
              <Button
                variant="default"
                onClick={() => window.open(`/verify/surat/${selectedSurat?.id}`, '_blank')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Lihat Verifikasi
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Surat Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Surat</DialogTitle>
            <DialogDescription>
              {detailSurat?.letterNumber || detailSurat?.subject}
            </DialogDescription>
          </DialogHeader>
          {detailSurat && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {detailSurat.jenisSurat && (
                  <Badge variant="outline">{detailSurat.jenisSurat.code}</Badge>
                )}
                {getStatusBadge(detailSurat.status)}
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Perihal</p>
                  <p className="font-medium">{detailSurat.subject}</p>
                </div>
                {detailSurat.letterNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground">Nomor Surat</p>
                    <p>{detailSurat.letterNumber}</p>
                  </div>
                )}
                {detailSurat.sender && (
                  <div>
                    <p className="text-sm text-muted-foreground">Pengirim</p>
                    <p>{detailSurat.sender}</p>
                  </div>
                )}
                {detailSurat.content && (
                  <div>
                    <p className="text-sm text-muted-foreground">Isi Ringkasan</p>
                    <p className="whitespace-pre-wrap">{detailSurat.content}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Dibuat</p>
                  <p>{new Date(detailSurat.createdAt).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}</p>
                </div>
                {detailSurat.requester && (
                  <div>
                    <p className="text-sm text-muted-foreground">Pemohon</p>
                    <p>{detailSurat.requester.name}</p>
                  </div>
                )}
                {detailSurat.approver && (
                  <div>
                    <p className="text-sm text-muted-foreground">Disetujui Oleh</p>
                    <p>{detailSurat.approver.name}</p>
                  </div>
                )}
              </div>

              {/* Approval actions */}
              {detailSurat.status === 'PENDING_APPROVAL' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 hover:text-red-700"
                    onClick={() => {
                      handleReject(detailSurat.id)
                      setShowDetail(false)
                    }}
                  >
                    Tolak
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      handleApprove(detailSurat.id)
                      setShowDetail(false)
                    }}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Setujui
                  </Button>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetail(false)}>
              Tutup
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowDetail(false)
                if (detailSurat) handleShowQrCode(detailSurat)
              }}
            >
              <QrCode className="h-4 w-4 mr-2" />
              Lihat QR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Disposisi Surat Masuk */}
      <DisposisiModal
        open={showDisposisiModal}
        onOpenChange={setShowDisposisiModal}
        surat={selectedSuratDisposisi}
        onSuccess={() => {
          fetchSurat()
        }}
      />

      <LembarDisposisiPrint
        open={showPrintDisposisi}
        onOpenChange={setShowPrintDisposisi}
        disposisi={selectedDisposisiPrint}
        surat={selectedSuratDisposisi}
      />

      <TindakLanjutDialog
        open={showTindakLanjut}
        onOpenChange={setShowTindakLanjut}
        disposisi={selectedDisposisiTindakLanjut}
        onSuccess={() => {
          fetchSurat()
        }}
      />
    </div>
  )
}
