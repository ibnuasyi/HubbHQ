'use client'

import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  Plus,
  Loader2,
  Calendar,
  AlertCircle,
  CheckSquare,
  Users,
  Target,
  DollarSign,
  FileText,
  FileSpreadsheet,
  Download,
  History,
  Send,
  XCircle,
  MapPin,
  RefreshCw,
  ExternalLink,
  Receipt,
  FileCheck,
  BookOpen,
  Upload,
  Award,
  ShieldCheck,
  Layers,
  Settings2,
  Printer,
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
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Checkpoint {
  id: string
  title: string
  description: string | null
  isCompleted: boolean
  completedAt: string | null
  order: number
}

interface PanitiaMember {
  id: string
  roleJabatan: string
  nomorSertifikat?: string | null
  sertifikatUrl?: string | null
  sertifikatGeneratedAt?: string | null
  user: {
    id: string
    name: string | null
    email: string | null
    avatar: string | null
    phone: string | null
  }
}

interface ProposalHistoryItem {
  id: string
  version: number
  title: string
  amount: number | string
  proposalFile: string | null
  status: string
  reviewedNote: string | null
  reviewedAt: string | null
  reviewedBy: { id: string; name: string | null } | null
  createdAt: string
}

interface ProposalData {
  id: string
  title: string
  description: string | null
  amount: number | string
  status: string
  version: number
  proposalFile: string | null
  reviewedNote: string | null
  reviewedAt: string | null
  reviewedBy: { id: string; name: string | null } | null
  requester: { id: string; name: string | null; avatar: string | null }
  history: ProposalHistoryItem[]
}

interface LpjItemData {
  id: string
  type: 'INCOME' | 'EXPENSE'
  kategori: string
  namaBarang: string
  qty: number | string
  satuan: string | null
  hargaSatuan: number | string
  totalHarga: number | string
  buktiNota: string | null
  keterangan: string | null
  sumberDana?: 'DANA_AJUAN' | 'KAS_PROKER' | 'DANA_LUAR' | string | null
  createdAt: string
}

interface LpjData {
  id: string
  ringkasanKegiatan: string | null
  pesertaHadir: number | null
  ketercapaianTarget: string | null
  kendala: string | null
  solusi: string | null
  rekomendasi: string | null
  totalPemasukan: number | string
  totalPengeluaran: number | string
  saldoAkhir: number | string
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
  reviewedNote: string | null
  reviewedAt: string | null
  reviewedBy: { id: string; name: string | null } | null
  dokumenFinalLpj?: string | null
  dokumenFinalName?: string | null
  surplusAction?: string | null
  surplusNote?: string | null
  surplusAmount?: number | string | null
  isSurplusSettled?: boolean
  checklistNotaFisik?: boolean
  checklistPresensi?: boolean
  checklistDokumentasi?: boolean
  checklistBeritaAcara?: boolean
  checklistVerifiedAt?: string | null
  items: LpjItemData[]
}

interface ProgramKerja {
  id: string
  title: string
  description: string | null
  status: 'DRAFT' | 'ON_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  startDate: string | null
  endDate: string | null
  kategori: string | null
  sasaran: string | null
  indikator: string | null
  anggaranEstimasi: number | string | null
  sumberDana: string | null
  lokasi: string | null
  sertifikatTemplate?: string | null
  sertifikatPrefix?: string | null
  sertifikatSigner1Name?: string | null
  sertifikatSigner1Role?: string | null
  sertifikatSigner2Name?: string | null
  sertifikatSigner2Role?: string | null
  createdAt: string
  updatedAt: string
  divisi: {
    id: string
    name: string
    color: string
    shortName?: string | null
  }
  picId?: string | null
  pic: {
    id: string
    name: string | null
    avatar: string | null
  } | null
  creator: {
    id: string
    name: string | null
  }
  checkpoints: Checkpoint[]
  panitia: PanitiaMember[]
  proposals: ProposalData[]
  lpj: LpjData | null
  progress: number
  completedCheckpoints: number
  totalCheckpoints: number
}

const statusConfig = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700' },
  ON_PROGRESS: { label: 'On Progress / Berjalan', color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800' },
  COMPLETED: { label: 'Selesai (LPJ Di-ACC)', color: 'bg-green-100 text-green-800 border-green-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' },
  CANCELLED: { label: 'Dibatalkan', color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800' },
}

const formatCurrency = (amount: number | string | null | undefined) => {
  const num = Number(amount || 0)
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num)
}

export default function ProkerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const prokerId = params.id as string

  const [proker, setProker] = React.useState<ProgramKerja | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null)

  // Dialogs
  const [showAddCheckpoint, setShowAddCheckpoint] = React.useState(false)
  const [newCheckpointTitle, setNewCheckpointTitle] = React.useState('')
  const [newCheckpointDesc, setNewCheckpointDesc] = React.useState('')
  const [showDeleteAlert, setShowDeleteAlert] = React.useState(false)

  // Panitia Dialog
  const [showAddPanitia, setShowAddPanitia] = React.useState(false)
  const [panitiaUserId, setPanitiaUserId] = React.useState('')
  const [panitiaRole, setPanitiaRole] = React.useState('')

  // Proposal Dialog & Form
  const [showProposalDialog, setShowProposalDialog] = React.useState(false)
  const [proposalTitle, setProposalTitle] = React.useState('')
  const [proposalAmount, setProposalAmount] = React.useState('')
  const [proposalDesc, setProposalDesc] = React.useState('')
  const [proposalFile, setProposalFile] = React.useState('')

  // Proposal Review Dialog
  const [showReviewProposalDialog, setShowReviewProposalDialog] = React.useState(false)
  const [reviewAction, setReviewAction] = React.useState<'APPROVED' | 'REJECTED'>('APPROVED')
  const [reviewNote, setReviewNote] = React.useState('')

  // LPJ Item Dialog
  const [showAddLpjItem, setShowAddLpjItem] = React.useState(false)
  const [itemType, setItemType] = React.useState<'EXPENSE' | 'INCOME'>('EXPENSE')
  const [itemKategori, setItemKategori] = React.useState('Konsumsi')
  const [itemNama, setItemNama] = React.useState('')
  const [itemQty, setItemQty] = React.useState('1')
  const [itemSatuan, setItemSatuan] = React.useState('item')
  const [itemHarga, setItemHarga] = React.useState('')
  const [itemBukti, setItemBukti] = React.useState('')
  const [itemKet, setItemKet] = React.useState('')
  const [itemSumberDana, setItemSumberDana] = React.useState<'DANA_AJUAN' | 'KAS_PROKER' | 'DANA_LUAR'>('DANA_AJUAN')

  // LPJ Narrative State
  const [lpjRingkasan, setLpjRingkasan] = React.useState('')
  const [lpjPeserta, setLpjPeserta] = React.useState('0')
  const [lpjTarget, setLpjTarget] = React.useState('')
  const [lpjKendala, setLpjKendala] = React.useState('')
  const [lpjSolusi, setLpjSolusi] = React.useState('')
  const [lpjRekomendasi, setLpjRekomendasi] = React.useState('')

  // LPJ Review & Surplus State
  const [showReviewLpjDialog, setShowReviewLpjDialog] = React.useState(false)
  const [lpjReviewAction, setLpjReviewAction] = React.useState<'APPROVED' | 'REJECTED'>('APPROVED')
  const [lpjReviewNote, setLpjReviewNote] = React.useState('')
  const [surplusAction, setSurplusAction] = React.useState<'KEMBALIKAN_KAS_UMUM' | 'SYUKURAN_PANITIA' | 'KAS_DIVISI' | 'NONE'>('KEMBALIKAN_KAS_UMUM')
  const [surplusNote, setSurplusNote] = React.useState('')

  // Checklist Kelaikan Berkas Fisik Pra-Sidang LPJ (Audit Compliance)
  const [chkNotaFisik, setChkNotaFisik] = React.useState(false)
  const [chkPresensi, setChkPresensi] = React.useState(false)
  const [chkDokumentasi, setChkDokumentasi] = React.useState(false)
  const [chkBeritaAcara, setChkBeritaAcara] = React.useState(false)

  // E-Sertifikat Kepanitiaan per Proker
  const [showSertifikatModal, setShowSertifikatModal] = React.useState(false)
  const [sertifTemplateInput, setSertifTemplateInput] = React.useState('')
  const [sertifPrefixInput, setSertifPrefixInput] = React.useState('')
  const [sertifSigner1Name, setSertifSigner1Name] = React.useState('')
  const [sertifSigner1Role, setSertifSigner1Role] = React.useState('Ketua Pelaksana')
  const [sertifSigner2Name, setSertifSigner2Name] = React.useState('')
  const [sertifSigner2Role, setSertifSigner2Role] = React.useState('Ketua Umum')
  const [generatingSertif, setGeneratingSertif] = React.useState(false)
  const [selectedCertPanitia, setSelectedCertPanitia] = React.useState<PanitiaMember | null>(null)
  const [showCertPreviewModal, setShowCertPreviewModal] = React.useState(false)

  // Official Master LPJ Template (Managed by Bendahara / Sekretaris)
  const [lpjTemplate, setLpjTemplate] = React.useState<{
    url: string | null
    name: string
    description: string
    updatedAt: string | null
    updatedBy: string
  } | null>(null)
  const [showTemplateModal, setShowTemplateModal] = React.useState(false)
  const [templateUrlInput, setTemplateUrlInput] = React.useState('')
  const [templateNameInput, setTemplateNameInput] = React.useState('')
  const [templateDescInput, setTemplateDescInput] = React.useState('')

  // Upload Dokumen Final LPJ (Uploaded by Panitia Proker)
  const [showUploadFinalModal, setShowUploadFinalModal] = React.useState(false)
  const [finalDocUrl, setFinalDocUrl] = React.useState('')
  const [finalDocName, setFinalDocName] = React.useState('')

  // Edit Proker State
  const [isEditing, setIsEditing] = React.useState(false)
  const [editTitle, setEditTitle] = React.useState('')
  const [editDescription, setEditDescription] = React.useState('')
  const [editStatus, setEditStatus] = React.useState<any>('DRAFT')
  const [editStartDate, setEditStartDate] = React.useState('')
  const [editEndDate, setEditEndDate] = React.useState('')
  const [editPicId, setEditPicId] = React.useState('')
  const [editKategori, setEditKategori] = React.useState('INSIDENTAL')
  const [editSasaran, setEditSasaran] = React.useState('')
  const [editIndikator, setEditIndikator] = React.useState('')
  const [editAnggaran, setEditAnggaran] = React.useState('')
  const [editSumberDana, setEditSumberDana] = React.useState('')
  const [editLokasi, setEditLokasi] = React.useState('')

  const [members, setMembers] = React.useState<any[]>([])

  const fetchLpjTemplate = React.useCallback(async () => {
    try {
      const res = await fetch('/api/proker/lpj/template')
      if (res.ok) {
        const json = await res.json()
        setLpjTemplate(json.data)
        if (json.data?.url) {
          setTemplateUrlInput(json.data.url)
          setTemplateNameInput(json.data.name || '')
          setTemplateDescInput(json.data.description || '')
        }
      }
    } catch (err) {
      console.error('Error fetching LPJ template:', err)
    }
  }, [])

  const fetchProker = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/proker/${prokerId}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Gagal mengambil data program kerja')
        return
      }

      const p: ProgramKerja = data.data
      setProker(p)

      // Sync edit states
      setEditTitle(p.title)
      setEditDescription(p.description || '')
      setEditStatus(p.status)
      setEditStartDate(p.startDate ? p.startDate.split('T')[0] : '')
      setEditEndDate(p.endDate ? p.endDate.split('T')[0] : '')
      setEditPicId(p.pic?.id || '')
      setEditKategori(p.kategori || 'INSIDENTAL')
      setEditSasaran(p.sasaran || '')
      setEditIndikator(p.indikator || '')
      setEditAnggaran(p.anggaranEstimasi ? p.anggaranEstimasi.toString() : '')
      setEditSumberDana(p.sumberDana || '')
      setEditLokasi(p.lokasi || '')

      // Sync proposal form defaults
      setProposalTitle(`Proposal Dana: ${p.title}`)
      setProposalAmount(p.anggaranEstimasi ? p.anggaranEstimasi.toString() : '')

      // Sync Sertifikat states
      setSertifTemplateInput(p.sertifikatTemplate || '')
      setSertifPrefixInput(p.sertifikatPrefix || '')
      setSertifSigner1Name(p.sertifikatSigner1Name || p.pic?.name || '')
      setSertifSigner1Role(p.sertifikatSigner1Role || 'Ketua Pelaksana')
      setSertifSigner2Name(p.sertifikatSigner2Name || '')
      setSertifSigner2Role(p.sertifikatSigner2Role || 'Ketua Umum')

      // Sync LPJ states if exists
      if (p.lpj) {
        setLpjRingkasan(p.lpj.ringkasanKegiatan || '')
        setLpjPeserta(p.lpj.pesertaHadir ? p.lpj.pesertaHadir.toString() : '0')
        setLpjTarget(p.lpj.ketercapaianTarget || '')
        setLpjKendala(p.lpj.kendala || '')
        setLpjSolusi(p.lpj.solusi || '')
        setLpjRekomendasi(p.lpj.rekomendasi || '')
        setFinalDocUrl(p.lpj.dokumenFinalLpj || '')
        setFinalDocName(p.lpj.dokumenFinalName || '')
        setChkNotaFisik(Boolean(p.lpj.checklistNotaFisik))
        setChkPresensi(Boolean(p.lpj.checklistPresensi))
        setChkDokumentasi(Boolean(p.lpj.checklistDokumentasi))
        setChkBeritaAcara(Boolean(p.lpj.checklistBeritaAcara))
        if (p.lpj.surplusAction) setSurplusAction(p.lpj.surplusAction as any)
        if (p.lpj.surplusNote) setSurplusNote(p.lpj.surplusNote)
      }
    } catch (err) {
      console.error('Error fetching proker:', err)
      setError('Terjadi kesalahan saat memuat program kerja')
    } finally {
      setLoading(false)
    }
  }, [prokerId])

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/anggota')
      if (res.ok) {
        const data = await res.json()
        setMembers(data.data || [])
      }
    } catch (err) {
      console.error('Error fetching members:', err)
    }
  }

  React.useEffect(() => {
    fetchProker()
    fetchMembers()
    fetchLpjTemplate()
  }, [fetchProker, fetchLpjTemplate])

  // Save Edit Proker
  const saveChanges = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/proker/${prokerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          status: editStatus,
          startDate: editStartDate || null,
          endDate: editEndDate || null,
          picId: editPicId || null,
          kategori: editKategori,
          sasaran: editSasaran,
          indikator: editIndikator,
          anggaranEstimasi: editAnggaran ? parseFloat(editAnggaran) : null,
          sumberDana: editSumberDana,
          lokasi: editLokasi,
        }),
      })

      if (res.ok) {
        setIsEditing(false)
        setSuccessMsg('Program kerja berhasil diperbarui')
        fetchProker()
      } else {
        const d = await res.json()
        setError(d.error || 'Gagal menyimpan perubahan')
      }
    } catch (err) {
      console.error('Error saving changes:', err)
    } finally {
      setSaving(false)
    }
  }

  // Delete Proker
  const deleteProker = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/proker/${prokerId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        router.push('/dashboard/proker')
      }
    } catch (err) {
      console.error('Error deleting proker:', err)
    } finally {
      setSaving(false)
    }
  }

  // Checkpoint Toggle / Add / Delete
  const toggleCheckpoint = async (checkpointId: string) => {
    try {
      const res = await fetch(`/api/proker/${prokerId}/checkpoints`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkpointId, action: 'toggle' }),
      })
      if (res.ok) fetchProker()
    } catch (err) {
      console.error(err)
    }
  }

  const addCheckpoint = async () => {
    if (!newCheckpointTitle.trim()) return
    try {
      setSaving(true)
      const res = await fetch(`/api/proker/${prokerId}/checkpoints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newCheckpointTitle,
          description: newCheckpointDesc,
        }),
      })
      if (res.ok) {
        setNewCheckpointTitle('')
        setNewCheckpointDesc('')
        setShowAddCheckpoint(false)
        fetchProker()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const deleteCheckpoint = async (checkpointId: string) => {
    try {
      const res = await fetch(`/api/proker/${prokerId}/checkpoints`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkpointId, action: 'delete' }),
      })
      if (res.ok) fetchProker()
    } catch (err) {
      console.error(err)
    }
  }

  // Panitia Add / Delete
  const handleAddPanitia = async () => {
    if (!panitiaUserId || !panitiaRole.trim()) return
    try {
      setSaving(true)
      const res = await fetch(`/api/proker/${prokerId}/panitia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: panitiaUserId,
          roleJabatan: panitiaRole.trim(),
        }),
      })
      if (res.ok) {
        setPanitiaUserId('')
        setPanitiaRole('')
        setShowAddPanitia(false)
        setSuccessMsg('Anggota panitia pelaksana berhasil ditambahkan')
        fetchProker()
      } else {
        const d = await res.json()
        setError(d.error || 'Gagal menambahkan panitia')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePanitia = async (panitiaId: string) => {
    try {
      const res = await fetch(`/api/proker/${prokerId}/panitia?panitiaId=${panitiaId}`, {
        method: 'DELETE',
      })
      if (res.ok) fetchProker()
    } catch (err) {
      console.error(err)
    }
  }

  // Proposal Submission / Revision (Versioned Git-like)
  const handleRaiseProposal = async () => {
    if (!proposalTitle.trim() || !proposalAmount) return
    try {
      setSaving(true)
      setError(null)
      const res = await fetch(`/api/proker/${prokerId}/proposal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: proposalTitle.trim(),
          amount: proposalAmount,
          description: proposalDesc.trim(),
          proposalFile: proposalFile.trim() || null,
        }),
      })
      const result = await res.json()
      if (res.ok) {
        setShowProposalDialog(false)
        setSuccessMsg(result.message || 'Proposal berhasil dinaikkan!')
        fetchProker()
      } else {
        setError(result.error || 'Gagal menaikkan proposal')
      }
    } catch (err) {
      console.error(err)
      setError('Terjadi kesalahan saat memproses proposal')
    } finally {
      setSaving(false)
    }
  }

  // Proposal Review (ACC or Reject with note)
  const handleReviewProposal = async () => {
    if (reviewAction === 'REJECTED' && !reviewNote.trim()) {
      setError('Catatan alasan penolakan wajib diisi.')
      return
    }
    try {
      setSaving(true)
      const res = await fetch(`/api/proker/${prokerId}/proposal/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: reviewAction,
          note: reviewNote.trim(),
        }),
      })
      const result = await res.json()
      if (res.ok) {
        setShowReviewProposalDialog(false)
        setReviewNote('')
        setSuccessMsg(result.message)
        fetchProker()
      } else {
        setError(result.error || 'Gagal meninjau proposal')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // LPJ Line Item Add / Delete
  const handleAddLpjItem = async () => {
    if (!itemNama.trim() || !itemHarga) return
    try {
      setSaving(true)
      const res = await fetch(`/api/proker/${prokerId}/lpj/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: itemType,
          kategori: itemKategori,
          namaBarang: itemNama.trim(),
          qty: itemQty || 1,
          satuan: itemSatuan || 'item',
          hargaSatuan: itemHarga,
          buktiNota: itemBukti.trim() || null,
          keterangan: itemKet.trim() || null,
          sumberDana: itemSumberDana,
        }),
      })
      if (res.ok) {
        setItemNama('')
        setItemHarga('')
        setItemBukti('')
        setItemKet('')
        setShowAddLpjItem(false)
        setSuccessMsg('Item realisasi belanja/pemasukan berhasil dicatat')
        fetchProker()
      } else {
        const d = await res.json()
        setError(d.error || 'Gagal menambah item LPJ')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLpjItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/proker/${prokerId}/lpj/items?itemId=${itemId}`, {
        method: 'DELETE',
      })
      if (res.ok) fetchProker()
    } catch (err) {
      console.error(err)
    }
  }

  // LPJ Narrative Save / Submit
  const handleSaveLpjNarrative = async (submitForReview: boolean) => {
    try {
      setSaving(true)
      const res = await fetch(`/api/proker/${prokerId}/lpj`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ringkasanKegiatan: lpjRingkasan,
          pesertaHadir: lpjPeserta ? parseInt(lpjPeserta) : 0,
          ketercapaianTarget: lpjTarget,
          kendala: lpjKendala,
          solusi: lpjSolusi,
          rekomendasi: lpjRekomendasi,
          submitForReview,
        }),
      })
      const result = await res.json()
      if (res.ok) {
        setSuccessMsg(result.message)
        fetchProker()
      } else {
        setError(result.error || 'Gagal menyimpan LPJ')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // LPJ Review by BPH (Approve -> COMPLETED)
  const handleReviewLpj = async () => {
    if (lpjReviewAction === 'REJECTED' && !lpjReviewNote.trim()) {
      setError('Catatan revisi LPJ wajib diisi.')
      return
    }
    try {
      setSaving(true)
      const res = await fetch(`/api/proker/${prokerId}/lpj/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: lpjReviewAction,
          note: lpjReviewNote.trim(),
          surplusAction,
          surplusNote: surplusNote.trim() || null,
          checklistNotaFisik: chkNotaFisik,
          checklistPresensi: chkPresensi,
          checklistDokumentasi: chkDokumentasi,
          checklistBeritaAcara: chkBeritaAcara,
        }),
      })
      const result = await res.json()
      if (res.ok) {
        setShowReviewLpjDialog(false)
        setLpjReviewNote('')
        setSuccessMsg(result.message)
        fetchProker()
      } else {
        setError(result.error || 'Gagal meninjau LPJ')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // E-Sertifikat Handlers
  const handleSaveSertifikatConfig = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/proker/${prokerId}/sertifikat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sertifikatTemplate: sertifTemplateInput.trim() || null,
          sertifikatPrefix: sertifPrefixInput.trim() || null,
          sertifikatSigner1Name: sertifSigner1Name.trim() || null,
          sertifikatSigner1Role: sertifSigner1Role.trim() || 'Ketua Pelaksana',
          sertifikatSigner2Name: sertifSigner2Name.trim() || null,
          sertifikatSigner2Role: sertifSigner2Role.trim() || 'Ketua Umum',
        }),
      })
      const result = await res.json()
      if (res.ok) {
        setShowSertifikatModal(false)
        setSuccessMsg(result.message || 'Konfigurasi sertifikat berhasil disimpan')
        fetchProker()
      } else {
        setError(result.error || 'Gagal menyimpan konfigurasi sertifikat')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateSertifikat = async () => {
    try {
      setGeneratingSertif(true)
      const res = await fetch(`/api/proker/${prokerId}/sertifikat`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })
      const result = await res.json()
      if (res.ok) {
        setSuccessMsg(result.message)
        fetchProker()
      } else {
        setError(result.error || 'Gagal generate nomor sertifikat')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setGeneratingSertif(false)
    }
  }

  // Official Master LPJ Template Save (Bendahara/Sekretaris/Admin)
  const handleSaveOfficialTemplate = async () => {
    if (!templateUrlInput.trim()) {
      setError('Tautan atau URL berkas template LPJ wajib diisi')
      return
    }
    try {
      setSaving(true)
      const res = await fetch('/api/proker/lpj/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: templateUrlInput.trim(),
          name: templateNameInput.trim() || 'Template_Resmi_LPJ.docx',
          description: templateDescInput.trim(),
        }),
      })
      const result = await res.json()
      if (res.ok) {
        setShowTemplateModal(false)
        setSuccessMsg(result.message || 'Template resmi LPJ berhasil disimpan!')
        fetchLpjTemplate()
      } else {
        setError(result.error || 'Gagal menyimpan template LPJ')
      }
    } catch (err) {
      console.error(err)
      setError('Terjadi kesalahan saat menyimpan template LPJ')
    } finally {
      setSaving(false)
    }
  }

  // Upload / Update Berkas Dokumen Final LPJ (Panitia)
  const handleSaveFinalLpjDoc = async () => {
    if (!finalDocUrl.trim()) {
      setError('Tautan atau berkas dokumen final LPJ wajib diisi')
      return
    }
    try {
      setSaving(true)
      const res = await fetch(`/api/proker/${prokerId}/lpj`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dokumenFinalLpj: finalDocUrl.trim(),
          dokumenFinalName: finalDocName.trim() || 'Buku_Final_LPJ.pdf',
        }),
      })
      const result = await res.json()
      if (res.ok) {
        setShowUploadFinalModal(false)
        setSuccessMsg('Dokumen final LPJ berhasil dilampirkan!')
        fetchProker()
      } else {
        setError(result.error || 'Gagal menyimpan dokumen final LPJ')
      }
    } catch (err) {
      console.error(err)
      setError('Terjadi kesalahan saat melampirkan berkas final LPJ')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && !proker) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Program kerja tidak ditemukan'}</AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href="/dashboard/proker">Kembali ke Daftar Proker</Link>
        </Button>
      </div>
    )
  }

  if (!proker) return null

  const activeProposal = proker.proposals?.[0]
  const lpj = proker.lpj
  const expenseItems = lpj?.items?.filter((i) => i.type === 'EXPENSE') || []
  const incomeItems = lpj?.items?.filter((i) => i.type === 'INCOME') || []

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Navigation & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <Button variant="ghost" asChild className="mb-2 pl-0">
            <Link href="/dashboard/proker">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Daftar Program Kerja
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{proker.title}</h1>
            <Badge
              variant="secondary"
              style={{
                backgroundColor: `${proker.divisi.color}20`,
                color: proker.divisi.color,
              }}
            >
              {proker.divisi.name}
            </Badge>
            <Badge variant="outline" className={statusConfig[proker.status].color}>
              {statusConfig[proker.status].label}
            </Badge>
            {proker.kategori && (
              <Badge variant="secondary" className="text-xs">
                Sifat: {proker.kategori}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            PIC: <span className="font-medium text-foreground">{proker.pic?.name || 'Belum Ditentukan'}</span> | Dibuat oleh {proker.creator.name}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {lpj && (
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/export/proker/${prokerId}/lpj?format=pdf`} target="_blank">
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Cetak LPJ (PDF)
              </a>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit className="mr-1.5 h-3.5 w-3.5" />
            {isEditing ? 'Tutup Edit' : 'Edit Proker'}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteAlert(true)}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Hapus
          </Button>
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

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-muted/20">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Estimasi Anggaran (RAB)</CardDescription>
            <CardTitle className="text-lg font-bold">
              {formatCurrency(proker.anggaranEstimasi)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Sumber: {proker.sumberDana || 'Belum ditentukan'}
          </CardContent>
        </Card>

        <Card className="bg-muted/20">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Status Proposal Dana</CardDescription>
            <CardTitle className="text-lg font-bold">
              {activeProposal ? (
                <span className={activeProposal.status === 'APPROVED' ? 'text-green-600' : activeProposal.status === 'REJECTED' ? 'text-red-600' : 'text-yellow-600'}>
                  {activeProposal.status} (v{activeProposal.version})
                </span>
              ) : (
                <span className="text-muted-foreground">Belum Diajukan</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            {activeProposal ? `Diajukan: ${formatCurrency(activeProposal.amount)}` : 'Proposal siap dinaikkan'}
          </CardContent>
        </Card>

        <Card className="bg-muted/20">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Progress Checkpoints</CardDescription>
            <CardTitle className="text-lg font-bold flex items-center justify-between">
              <span>{proker.progress}%</span>
              <span className="text-xs font-normal text-muted-foreground">
                {proker.completedCheckpoints}/{proker.totalCheckpoints} selesai
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Progress value={proker.progress} className="h-2" />
          </CardContent>
        </Card>

        <Card className="bg-muted/20">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Realisasi Keuangan LPJ</CardDescription>
            <CardTitle className="text-lg font-bold">
              {lpj ? (
                <span className={Number(lpj.saldoAkhir) >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(lpj.saldoAkhir)}
                </span>
              ) : (
                <span className="text-muted-foreground">Belum LPJ</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            {lpj ? `Pengeluaran: ${formatCurrency(lpj.totalPengeluaran)}` : 'Dibuat setelah pelaksanaan'}
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="overview" className="flex items-center gap-1.5">
            <Target className="h-4 w-4" />
            1. Matriks & Tahapan
          </TabsTrigger>
          <TabsTrigger value="panitia" className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            2. Panitia Pelaksana ({proker.panitia?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="proposal" className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4" />
            3. Proposal Dana {activeProposal && `(v${activeProposal.version})`}
          </TabsTrigger>
          <TabsTrigger value="lpj" className="flex items-center gap-1.5">
            <FileCheck className="h-4 w-4" />
            4. LPJ & Realisasi Belanja
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW & CHECKPOINTS */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Checkpoints Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckSquare className="h-5 w-5 text-primary" />
                      Tahapan & Checkpoint Kegiatan
                    </CardTitle>
                    <CardDescription>
                      Centang tahapan yang telah dicapai tim untuk memperbarui progress otomatis
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setShowAddCheckpoint(true)}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Tambah Tahapan
                  </Button>
                </CardHeader>
                <CardContent>
                  {proker.checkpoints.length === 0 ? (
                    <div className="text-center py-6 border border-dashed rounded-lg text-muted-foreground text-sm">
                      Belum ada tahapan checkpoint. Tambahkan tahapan teknis pelaksanaan kegiatan.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {proker.checkpoints.map((cp) => (
                        <div
                          key={cp.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                            cp.isCompleted
                              ? 'bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-700'
                              : 'bg-card border-border hover:bg-muted/40'
                          }`}
                        >
                          <Checkbox
                            checked={cp.isCompleted}
                            onCheckedChange={() => toggleCheckpoint(cp.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-medium text-sm transition-colors ${
                                cp.isCompleted
                                  ? 'line-through text-slate-500 dark:text-slate-100 font-semibold'
                                  : 'text-foreground'
                              }`}
                            >
                              {cp.title}
                            </p>
                            {cp.description && (
                              <p className="text-xs text-muted-foreground dark:text-slate-300 mt-0.5">
                                {cp.description}
                              </p>
                            )}
                            {cp.completedAt && (
                              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 inline shrink-0" />
                                Selesai: {new Date(cp.completedAt).toLocaleDateString('id-ID')}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive dark:hover:text-red-400 shrink-0"
                            onClick={() => deleteCheckpoint(cp.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Deskripsi & Latar Belakang */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Latar Belakang & Deskripsi</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {proker.description || 'Tidak ada keterangan deskripsi tambahan.'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Matriks Detail */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Detail Matriks Organisasi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Nama Proker</Label>
                        <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Status</Label>
                        <Select value={editStatus} onValueChange={setEditStatus}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DRAFT">Draft</SelectItem>
                            <SelectItem value="ON_PROGRESS">On Progress</SelectItem>
                            <SelectItem value="COMPLETED">Selesai</SelectItem>
                            <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">PIC (Penanggung Jawab)</Label>
                        <Select value={editPicId} onValueChange={setEditPicId}>
                          <SelectTrigger><SelectValue placeholder="Pilih PIC" /></SelectTrigger>
                          <SelectContent>
                            {members.map((m) => (
                              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Sasaran Audiens</Label>
                        <Input value={editSasaran} onChange={(e) => setEditSasaran(e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Tolok Ukur (KPI)</Label>
                        <Input value={editIndikator} onChange={(e) => setEditIndikator(e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Estimasi RAB (Rp)</Label>
                        <Input type="number" value={editAnggaran} onChange={(e) => setEditAnggaran(e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Lokasi</Label>
                        <Input value={editLokasi} onChange={(e) => setEditLokasi(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Mulai</Label>
                          <Input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-xs">Selesai</Label>
                          <Input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} />
                        </div>
                      </div>
                      <Button className="w-full mt-2" size="sm" onClick={saveChanges} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan Perubahan
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="text-xs text-muted-foreground block">Sasaran Audiens / Peserta:</span>
                        <p className="font-medium mt-0.5">{proker.sasaran || '-'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Tolok Ukur Keberhasilan (KPI):</span>
                        <p className="font-medium mt-0.5">{proker.indikator || '-'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Lokasi Pelaksanaan:</span>
                        <p className="font-medium flex items-center gap-1.5 mt-0.5">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          {proker.lokasi || '-'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Jadwal Pelaksanaan:</span>
                        <p className="font-medium flex items-center gap-1.5 mt-0.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {proker.startDate ? new Date(proker.startDate).toLocaleDateString('id-ID') : '-'}
                          {' s/d '}
                          {proker.endDate ? new Date(proker.endDate).toLocaleDateString('id-ID') : '-'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Penanggung Jawab (PIC):</span>
                        <div className="flex items-center gap-2 mt-1">
                          {proker.pic ? (
                            <>
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={proker.pic.avatar || undefined} />
                                <AvatarFallback className="text-xs">{proker.pic.name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{proker.pic.name}</span>
                            </>
                          ) : (
                            <span className="text-destructive font-medium">Belum ada PIC</span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: PANITIA PELAKSANA (OC) & E-SERTIFIKAT */}
        <TabsContent value="panitia" className="space-y-6">
          {/* Certificate Management Banner Card */}
          <Card className="border bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-background dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-background">
            <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  E-Sertifikat Kepanitiaan Proker
                </CardTitle>
                <CardDescription className="text-xs">
                  Konfigurasi desain template khusus program kerja dan penomoran baku panitia pelaksana
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowSertifikatModal(true)}>
                  <Settings2 className="mr-1.5 h-3.5 w-3.5 text-primary" />
                  Template Sertifikat Proker
                </Button>
                <Button
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={handleGenerateSertifikat}
                  disabled={generatingSertif || !proker.panitia || proker.panitia.length === 0}
                >
                  {generatingSertif ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Award className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Generate Nomor Sertifikat
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-lg border bg-card/60 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Format Penomoran Baku:</span>
                  <p className="font-mono font-medium mt-0.5 text-foreground truncate">
                    {proker.sertifikatPrefix || `[NO]/SERT-OC/${proker.divisi?.shortName || 'DIV'}/.../${new Date().getFullYear()}`}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Template Desain Proker:</span>
                  <p className="font-medium mt-0.5 text-foreground truncate">
                    {proker.sertifikatTemplate ? 'Desain Kustom Terpasang' : 'Template Standar Sistem'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Penandatangan Dokumen:</span>
                  <p className="font-medium mt-0.5 text-foreground truncate">
                    {proker.sertifikatSigner1Name || proker.pic?.name || 'Ketua Pelaksana'} & {proker.sertifikatSigner2Name || 'Ketua Umum'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Committee List Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Struktur Panitia Pelaksana Kegiatan
                </CardTitle>
                <CardDescription>
                  Susunan panitia pelaksana (Organizing Committee) yang bertanggung jawab atas pelaksanaan teknis
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowAddPanitia(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Tambah Anggota Panitia
              </Button>
            </CardHeader>
            <CardContent>
              {proker.panitia?.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-lg text-muted-foreground text-sm">
                  Belum ada susunan panitia. Klik tombol Tambah Anggota Panitia untuk menugaskan anggota.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {proker.panitia.map((p) => (
                    <div key={p.id} className="p-4 border rounded-lg bg-card flex flex-col justify-between gap-3 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={p.user.avatar || undefined} />
                            <AvatarFallback>{p.user.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm">{p.user.name}</p>
                            <Badge variant="secondary" className="mt-1 text-xs font-normal">
                              {p.roleJabatan}
                            </Badge>
                            {p.user.phone && (
                              <p className="text-xs text-muted-foreground mt-1">{p.user.phone}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => handleDeletePanitia(p.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Certificate Section per member */}
                      <div className="pt-2 border-t mt-1 flex items-center justify-between gap-2">
                        {p.nomorSertifikat ? (
                          <div className="truncate">
                            <span className="text-[10px] text-muted-foreground block">No. Sertifikat:</span>
                            <span className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-400 block truncate">
                              {p.nomorSertifikat}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">
                            Belum digenerate
                          </span>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs shrink-0"
                          disabled={!p.nomorSertifikat}
                          onClick={() => {
                            setSelectedCertPanitia(p)
                            setShowCertPreviewModal(true)
                          }}
                        >
                          <Award className="mr-1 h-3.5 w-3.5 text-amber-500" />
                          Piagam
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: PROPOSAL DANA & GIT-LIKE VERSIONING */}
        <TabsContent value="proposal" className="space-y-6">
          {/* Validation Banner: Must have PIC */}
          {!proker.pic && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>PIC Belum Ditentukan</AlertTitle>
              <AlertDescription>
                Proposal dana hanya dapat dinaikkan setelah PIC (Penanggung Jawab) ditentukan. Silakan klik tombol Edit Proker di atas untuk memilih PIC.
              </AlertDescription>
            </Alert>
          )}

          {/* Active Proposal Card */}
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Status Proposal Dana
                  </CardTitle>
                  {activeProposal && (
                    <Badge variant="outline" className="font-semibold">
                      Versi {activeProposal.version}
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Alur pengajuan dan pencairan dana kegiatan langsung dari halaman program kerja
                </CardDescription>
              </div>

              <div className="flex flex-wrap gap-2">
                {activeProposal && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/proposal/${activeProposal.id}`}>
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      Halaman Proposal
                    </Link>
                  </Button>
                )}

                {proker.pic && (!activeProposal || activeProposal.status === 'REJECTED') && (
                  <Button size="sm" onClick={() => setShowProposalDialog(true)}>
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    {activeProposal?.status === 'REJECTED' ? 'Ajukan Revisi Proposal (v' + (activeProposal.version + 1) + ')' : 'Naikkan Proposal Dana'}
                  </Button>
                )}

                {activeProposal && activeProposal.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        setReviewAction('APPROVED')
                        setShowReviewProposalDialog(true)
                      }}
                    >
                      <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                      ACC / Setujui Proposal
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setReviewAction('REJECTED')
                        setShowReviewProposalDialog(true)
                      }}
                    >
                      <XCircle className="mr-1.5 h-3.5 w-3.5" />
                      Tolak Proposal
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {activeProposal ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg border bg-muted/20">
                    <div>
                      <span className="text-xs text-muted-foreground block">Judul Proposal</span>
                      <p className="font-medium text-sm mt-0.5">{activeProposal.title}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Nominal Dana Diajukan</span>
                      <p className="font-bold text-base text-primary mt-0.5">{formatCurrency(activeProposal.amount)}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Status Peninjauan</span>
                      <Badge
                        variant="secondary"
                        className={`mt-1 font-semibold ${
                          activeProposal.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                            : activeProposal.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-800'
                        }`}
                      >
                        {activeProposal.status === 'APPROVED' ? 'DISETUJUI (ACC)' : activeProposal.status === 'REJECTED' ? 'DITOLAK (PERLU REVISI)' : 'MENUNGGU REVIEW'}
                      </Badge>
                    </div>
                  </div>

                  {activeProposal.description && (
                    <div className="text-sm">
                      <span className="text-xs text-muted-foreground block mb-1">Rincian Anggaran / Keterangan:</span>
                      <p className="text-muted-foreground whitespace-pre-wrap">{activeProposal.description}</p>
                    </div>
                  )}

                  {activeProposal.proposalFile && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <FileText className="h-4 w-4" />
                      <a href={activeProposal.proposalFile} target="_blank" rel="noreferrer" className="underline hover:text-primary/80 flex items-center gap-1">
                        Lihat Berkas Proposal Lampiran <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {/* Rejection Note Alert if REJECTED */}
                  {activeProposal.status === 'REJECTED' && activeProposal.reviewedNote && (
                    <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <AlertTitle className="font-bold">Alasan Penolakan dari Peninjau (v{activeProposal.version})</AlertTitle>
                      <AlertDescription className="mt-1">
                        {activeProposal.reviewedNote}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Approval Banner if APPROVED */}
                  {activeProposal.status === 'APPROVED' && (
                    <Alert className="bg-green-50 border-green-200 text-green-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-emerald-400" />
                      <AlertTitle className="font-bold">Proposal Disetujui (ACC)</AlertTitle>
                      <AlertDescription className="mt-1">
                        Proposal telah disetujui. Program kerja telah aktif berjalan (ON_PROGRESS). Setelah kegiatan selesai, tim dapat menyusun Laporan Pertanggungjawaban (LPJ).
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed rounded-lg text-muted-foreground text-sm">
                  Belum ada proposal dana yang dinaikkan untuk program kerja ini. Klik tombol Naikkan Proposal Dana untuk mengajukan anggaran ke pengurus.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Git-like Historical Version Audit Trail */}
          {activeProposal?.history && activeProposal.history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Riwayat Versi Proposal (Audit Trail untuk Pembelajaran)
                </CardTitle>
                <CardDescription>
                  Semua versi proposal dan catatan penolakan tetap diarsipkan permanen untuk evaluasi kepanitiaan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-20">Versi</TableHead>
                        <TableHead>Judul & Nominal</TableHead>
                        <TableHead>Status Keputusan</TableHead>
                        <TableHead>Catatan Evaluasi / Alasan Penolakan</TableHead>
                        <TableHead className="text-right">Tanggal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeProposal.history.map((hist) => (
                        <TableRow key={hist.id}>
                          <TableCell className="font-bold">v{hist.version}</TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">{hist.title}</div>
                            <div className="text-xs text-muted-foreground">{formatCurrency(hist.amount)}</div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                hist.status === 'APPROVED'
                                  ? 'bg-green-100 text-green-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                  : hist.status === 'REJECTED'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300 dark:border-yellow-800'
                              }`}
                            >
                              {hist.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm max-w-xs">
                            {hist.reviewedNote ? (
                              <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded">
                                {hist.reviewedNote}
                              </p>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {new Date(hist.createdAt).toLocaleDateString('id-ID')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB 4: LPJ & REALISASI BELANJA OTOMATIS */}
        <TabsContent value="lpj" className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg bg-card shadow-sm">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Laporan Pertanggungjawaban (LPJ) & Realisasi Anggaran
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pencatatan realisasi belanja riil, nota kwitansi, evaluasi acara, dan cetak naskah LPJ otomatis
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" asChild>
                <a href={`/api/export/proker/${prokerId}/lpj?format=excel`} target="_blank">
                  <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-green-600" />
                  Ekspor Excel
                </a>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={`/api/export/proker/${prokerId}/lpj?format=pdf`} target="_blank">
                  <Download className="mr-1.5 h-3.5 w-3.5 text-red-600" />
                  Cetak LPJ (PDF)
                </a>
              </Button>
              {lpj && lpj.status === 'SUBMITTED' && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setShowReviewLpjDialog(true)}
                >
                  <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                  Sahkan LPJ
                </Button>
              )}
            </div>
          </div>

          {/* LPJ Status Banner */}
          {lpj && (
            <Alert className={lpj.status === 'APPROVED' ? 'bg-green-50 border-green-200 text-green-950 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200' : lpj.status === 'REJECTED' ? 'bg-red-50 border-red-200 text-red-950 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200' : 'bg-blue-50 border-blue-200 text-blue-950 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-200'}>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle className="font-bold">Status LPJ: {lpj.status}</AlertTitle>
              <AlertDescription className="text-xs mt-1">
                {lpj.status === 'APPROVED'
                  ? 'LPJ telah disahkan oleh pengurus/BPH. Program kerja resmi selesai.'
                  : lpj.status === 'SUBMITTED'
                  ? 'LPJ telah diajukan dan sedang menunggu review/pengesahan pimpinan.'
                  : lpj.status === 'REJECTED'
                  ? `LPJ dikembalikan untuk revisi: ${lpj.reviewedNote || '-'}`
                  : 'Draf LPJ sedang disusun oleh panitia pelaksana.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Dual Card: Master Template LPJ & Dokumen Final LPJ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Master Template LPJ Organisasi */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Master Template LPJ Organisasi</CardTitle>
                      <CardDescription className="text-xs">
                        Pedoman baku & format resmi LPJ organisasi
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                    Resmi BPH
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {lpjTemplate?.description || 'Template resmi untuk penyusunan laporan pertanggungjawaban kegiatan.'}
                </p>
                <div className="p-2.5 rounded-md bg-muted/40 border text-xs flex items-center justify-between gap-2">
                  <div className="truncate">
                    <span className="font-medium text-foreground block truncate">
                      {lpjTemplate?.name || 'Template_Resmi_LPJ.docx'}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {lpjTemplate?.updatedAt
                        ? `Diperbarui: ${new Date(lpjTemplate.updatedAt).toLocaleDateString('id-ID')}`
                        : 'Format standar organisasi'}
                    </span>
                  </div>
                  {lpjTemplate?.url ? (
                    <Button size="sm" variant="outline" asChild className="shrink-0 h-8 text-xs">
                      <a href={lpjTemplate.url} target="_blank" rel="noreferrer">
                        <Download className="mr-1.5 h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        Unduh Template
                      </a>
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled className="shrink-0 h-8 text-xs">
                      Belum Diunggah
                    </Button>
                  )}
                </div>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    Dikelola oleh Bendahara / Sekretaris
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-primary hover:text-primary/80"
                    onClick={() => setShowTemplateModal(true)}
                  >
                    <Upload className="mr-1.5 h-3 w-3" />
                    Kelola Template
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Berkas Dokumen Final LPJ Kegiatan */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Naskah Dokumen Final LPJ</CardTitle>
                      <CardDescription className="text-xs">
                        Buku LPJ lengkap beserta tanda tangan panitia & bukti fisik
                      </CardDescription>
                    </div>
                  </div>
                  {lpj?.dokumenFinalLpj ? (
                    <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                      Sudah Dilampirkan
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                      Belum Dilampirkan
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Panitia proker dapat melampirkan berkas naskah utuh / buku LPJ final (PDF/DOCX) sebelum diajukan ke BPH.
                </p>
                <div className="p-2.5 rounded-md bg-muted/40 border text-xs flex items-center justify-between gap-2">
                  <div className="truncate">
                    <span className="font-medium text-foreground block truncate">
                      {lpj?.dokumenFinalName || 'Buku_Final_LPJ.pdf'}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {lpj?.dokumenFinalLpj ? 'Berkas siap ditinjau pimpinan' : 'Belum ada berkas yang diunggah'}
                    </span>
                  </div>
                  {lpj?.dokumenFinalLpj ? (
                    <Button size="sm" variant="outline" asChild className="shrink-0 h-8 text-xs">
                      <a href={lpj.dokumenFinalLpj} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        Buka Dokumen
                      </a>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="default"
                      className="shrink-0 h-8 text-xs"
                      onClick={() => setShowUploadFinalModal(true)}
                    >
                      <Upload className="mr-1.5 h-3.5 w-3.5" />
                      Unggah Sekarang
                    </Button>
                  )}
                </div>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {lpj?.dokumenFinalLpj ? 'Dapat diperbarui sebelum LPJ disahkan' : 'Wajib diunggah sebelum pengesahan'}
                  </span>
                  {lpj?.dokumenFinalLpj && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-primary hover:text-primary/80"
                      onClick={() => {
                        setFinalDocUrl(lpj.dokumenFinalLpj || '')
                        setFinalDocName(lpj.dokumenFinalName || '')
                        setShowUploadFinalModal(true)
                      }}
                    >
                      <Upload className="mr-1.5 h-3 w-3" />
                      Perbarui Berkas
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Checklist Kelaikan Berkas Fisik Pra-Sidang LPJ (Audit Compliance Gate) */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    Checklist Kelaikan Berkas Fisik Pra-Sidang LPJ
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Verifikasi kepatuhan administratif berkas fisik oleh BPH / Verifikator sebelum pengesahan resmi
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {chkNotaFisik && chkPresensi && chkDokumentasi && chkBeritaAcara ? (
                    <Badge className="bg-emerald-600 text-white text-xs">
                      <CheckCircle className="mr-1 h-3 w-3" /> Berkas Lengkap & Layak Disahkan
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-700 border-amber-300 dark:text-amber-300 dark:border-amber-800 text-xs">
                      Pemeriksaan Belum Lengkap
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    chkNotaFisik
                      ? 'bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-700'
                      : 'bg-muted/30 border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setChkNotaFisik(!chkNotaFisik)}
                >
                  <div className="flex items-center gap-2.5">
                    <Checkbox checked={chkNotaFisik} onCheckedChange={(v: any) => setChkNotaFisik(Boolean(v))} />
                    <div>
                      <p className="text-xs font-semibold">Nota Asli & Stempel</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Nota belanja ditempel & berstempel toko</p>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    chkPresensi
                      ? 'bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-700'
                      : 'bg-muted/30 border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setChkPresensi(!chkPresensi)}
                >
                  <div className="flex items-center gap-2.5">
                    <Checkbox checked={chkPresensi} onCheckedChange={(v: any) => setChkPresensi(Boolean(v))} />
                    <div>
                      <p className="text-xs font-semibold">Presensi & Notula</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Absensi peserta & risalah rapat ada</p>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    chkDokumentasi
                      ? 'bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-700'
                      : 'bg-muted/30 border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setChkDokumentasi(!chkDokumentasi)}
                >
                  <div className="flex items-center gap-2.5">
                    <Checkbox checked={chkDokumentasi} onCheckedChange={(v: any) => setChkDokumentasi(Boolean(v))} />
                    <div>
                      <p className="text-xs font-semibold">Dokumentasi Foto</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Foto kegiatan & arsip publikasi</p>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    chkBeritaAcara
                      ? 'bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-700'
                      : 'bg-muted/30 border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setChkBeritaAcara(!chkBeritaAcara)}
                >
                  <div className="flex items-center gap-2.5">
                    <Checkbox checked={chkBeritaAcara} onCheckedChange={(v: any) => setChkBeritaAcara(Boolean(v))} />
                    <div>
                      <p className="text-xs font-semibold">Berita Acara Acara</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">BAST & tanda tangan ketua panitia</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Realization Table Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Tabel Realisasi Belanja & Bukti Nota
                </CardTitle>
                <CardDescription>
                  Daftar pos belanja yang dibeli panitia beserta bukti nota/struk pengeluaran
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowAddLpjItem(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Catat Item Belanja / Pemasukan
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead className="w-24">Tipe</TableHead>
                      <TableHead className="w-28">Sumber Dana</TableHead>
                      <TableHead>Kategori Pos</TableHead>
                      <TableHead>Nama Barang / Uraian Belanja</TableHead>
                      <TableHead className="text-right">Kuantitas</TableHead>
                      <TableHead className="text-right">Harga Satuan</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="text-center w-24">Bukti Nota</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!lpj?.items || lpj.items.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-6 text-muted-foreground text-sm">
                          Belum ada item realisasi belanja atau pemasukan yang dicatat.
                        </TableCell>
                      </TableRow>
                    ) : (
                      lpj.items.map((it, idx) => (
                        <TableRow key={it.id}>
                          <TableCell className="font-medium text-xs">{idx + 1}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                it.type === 'INCOME'
                                  ? 'bg-green-50 text-green-700 border-green-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                  : 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800'
                              }`}
                            >
                              {it.type === 'INCOME' ? 'PEMASUKAN' : 'PENGELUARAN'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                it.sumberDana === 'KAS_PROKER'
                                  ? 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                                  : it.sumberDana === 'DANA_LUAR'
                                  ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                                  : 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                              }`}
                            >
                              {it.sumberDana === 'KAS_PROKER'
                                ? 'Kas Mandiri'
                                : it.sumberDana === 'DANA_LUAR'
                                ? 'Dana Luar'
                                : 'Dana Ajuan'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-medium">{it.kategori}</TableCell>
                          <TableCell className="text-sm">
                            <span className="font-medium">{it.namaBarang}</span>
                            {it.keterangan && (
                              <p className="text-xs text-muted-foreground">{it.keterangan}</p>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            {Number(it.qty)} {it.satuan}
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            {formatCurrency(it.hargaSatuan)}
                          </TableCell>
                          <TableCell className="text-right text-xs font-bold">
                            {formatCurrency(it.totalHarga)}
                          </TableCell>
                          <TableCell className="text-center">
                            {it.buktiNota ? (
                              <a
                                href={it.buktiNota}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary underline hover:text-primary/80"
                              >
                                Nota <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteLpjItem(it.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Financial Balance Summary Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-muted/40 border">
                <div>
                  <span className="text-xs text-muted-foreground block">Total Pemasukan Riil:</span>
                  <p className="text-lg font-bold text-green-700 dark:text-emerald-400">{formatCurrency(lpj?.totalPemasukan)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Total Pengeluaran Riil:</span>
                  <p className="text-lg font-bold text-red-700 dark:text-rose-400">{formatCurrency(lpj?.totalPengeluaran)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Saldo Akhir (Surplus / Defisit):</span>
                  <p className={`text-lg font-bold ${Number(lpj?.saldoAkhir) >= 0 ? 'text-green-700 dark:text-emerald-400' : 'text-red-700 dark:text-rose-400'}`}>
                    {formatCurrency(lpj?.saldoAkhir)}
                  </p>
                  {lpj?.surplusAction && (
                    <Badge variant="outline" className="text-[10px] mt-1 bg-background text-foreground">
                      Alokasi Surplus: {lpj.surplusAction === 'KEMBALIKAN_KAS_UMUM' ? 'Setor Kas Umum BPH' : lpj.surplusAction === 'SYUKURAN_PANITIA' ? 'Syukuran / Apresiasi Panitia' : lpj.surplusAction === 'KAS_DIVISI' ? 'Kas Cadangan Divisi' : lpj.surplusAction}
                    </Badge>
                  )}
                </div>
              </div>

              {/* 3-Pocket Funds Breakdown Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-lg border bg-card text-xs">
                <div className="p-2 rounded bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40">
                  <span className="font-semibold text-blue-800 dark:text-blue-300 block">1. Dana Ajuan (Kas Organisasi)</span>
                  <span className="text-muted-foreground block text-[11px] mt-0.5">
                    Total: {formatCurrency(
                      (lpj?.items || []).filter(i => (i.sumberDana === 'DANA_AJUAN' || !i.sumberDana)).reduce((a, b) => a + (b.type === 'INCOME' ? Number(b.totalHarga) : -Number(b.totalHarga)), 0)
                    )}
                  </span>
                </div>
                <div className="p-2 rounded bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40">
                  <span className="font-semibold text-purple-800 dark:text-purple-300 block">2. Kas Mandiri Proker (Iuran/Danus)</span>
                  <span className="text-muted-foreground block text-[11px] mt-0.5">
                    Total: {formatCurrency(
                      (lpj?.items || []).filter(i => i.sumberDana === 'KAS_PROKER').reduce((a, b) => a + (b.type === 'INCOME' ? Number(b.totalHarga) : -Number(b.totalHarga)), 0)
                    )}
                  </span>
                </div>
                <div className="p-2 rounded bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
                  <span className="font-semibold text-amber-800 dark:text-amber-300 block">3. Dana Luar (Sponsor/HTM)</span>
                  <span className="text-muted-foreground block text-[11px] mt-0.5">
                    Total: {formatCurrency(
                      (lpj?.items || []).filter(i => i.sumberDana === 'DANA_LUAR').reduce((a, b) => a + (b.type === 'INCOME' ? Number(b.totalHarga) : -Number(b.totalHarga)), 0)
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Narrative & Evaluation Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Laporan Narasi, Kendala & Evaluasi Pelaksanaan
              </CardTitle>
              <CardDescription>
                Dokumentasi kualitatif pelaksanaan acara untuk pertanggungjawaban di sidang LPJ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jumlah Peserta Hadir Riil</Label>
                  <Input
                    type="number"
                    placeholder="Contoh: 125"
                    value={lpjPeserta}
                    onChange={(e) => setLpjPeserta(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ketercapaian Target Sasaran (KPI)</Label>
                  <Input
                    placeholder="Contoh: Tercapai 90% dari target 150 peserta"
                    value={lpjTarget}
                    onChange={(e) => setLpjTarget(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ringkasan Pelaksanaan Acara</Label>
                <Textarea
                  placeholder="Ceritakan jalannya acara, antusiasme peserta, dan hasil kegiatan..."
                  rows={3}
                  value={lpjRingkasan}
                  onChange={(e) => setLpjRingkasan(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kendala / Hambatan Lapangan</Label>
                  <Textarea
                    placeholder="Apa saja kendala teknis atau logistik yang dihadapi..."
                    rows={2}
                    value={lpjKendala}
                    onChange={(e) => setLpjKendala(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Solusi yang Dijalankan</Label>
                  <Textarea
                    placeholder="Langkah cepat yang diambil panitia untuk mengatasi kendala..."
                    rows={2}
                    value={lpjSolusi}
                    onChange={(e) => setLpjSolusi(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Rekomendasi untuk Periode Kepengurusan Selanjutnya</Label>
                <Textarea
                  placeholder="Saran perbaikan untuk panitia tahun depan agar kegiatan lebih sukses..."
                  rows={2}
                  value={lpjRekomendasi}
                  onChange={(e) => setLpjRekomendasi(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button
                variant="outline"
                onClick={() => handleSaveLpjNarrative(false)}
                disabled={saving}
              >
                Simpan Draf Narasi
              </Button>
              <Button
                className="gap-2"
                onClick={() => handleSaveLpjNarrative(true)}
                disabled={saving}
              >
                <Send className="h-4 w-4" />
                Ajukan LPJ ke Pimpinan
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOG: Tambah Checkpoint */}
      <Dialog open={showAddCheckpoint} onOpenChange={setShowAddCheckpoint}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Checkpoint</DialogTitle>
            <DialogDescription>Tambahkan target tahapan persiapan kegiatan</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Judul Tahapan</Label>
              <Input
                placeholder="Contoh: Rapat Koordinasi Panitia & Sponsor"
                value={newCheckpointTitle}
                onChange={(e) => setNewCheckpointTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Textarea
                placeholder="Deskripsi target tahapan..."
                value={newCheckpointDesc}
                onChange={(e) => setNewCheckpointDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCheckpoint(false)}>Batal</Button>
            <Button onClick={addCheckpoint} disabled={saving || !newCheckpointTitle.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Tambah Panitia */}
      <Dialog open={showAddPanitia} onOpenChange={setShowAddPanitia}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tugaskan Panitia Pelaksana</DialogTitle>
            <DialogDescription>Pilih anggota organisasi dan jabatan dalam kepanitiaan ini</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Anggota</Label>
              <Select value={panitiaUserId} onValueChange={setPanitiaUserId}>
                <SelectTrigger><SelectValue placeholder="Pilih Anggota" /></SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Jabatan / Penugasan dalam Panitia</Label>
              <Input
                placeholder="Contoh: Ketua Pelaksana, Sekretaris, Bendahara, Divisi Acara"
                value={panitiaRole}
                onChange={(e) => setPanitiaRole(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPanitia(false)}>Batal</Button>
            <Button onClick={handleAddPanitia} disabled={saving || !panitiaUserId || !panitiaRole.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tugaskan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Naikkan / Revisi Proposal Dana */}
      <Dialog open={showProposalDialog} onOpenChange={setShowProposalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {activeProposal?.status === 'REJECTED' ? `Ajukan Revisi Proposal (Versi ${activeProposal.version + 1})` : 'Naikkan Proposal Dana Kegiatan'}
            </DialogTitle>
            <DialogDescription>
              Proposal akan dinaikkan langsung atas nama PIC ({proker.pic?.name}) untuk ditinjau oleh pimpinan/bendahara
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Judul Proposal *</Label>
              <Input
                value={proposalTitle}
                onChange={(e) => setProposalTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Nominal Anggaran Diajukan (Rp) *</Label>
              <Input
                type="number"
                placeholder="Contoh: 5000000"
                value={proposalAmount}
                onChange={(e) => setProposalAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tautan / Berkas Proposal (URL / PDF)</Label>
              <Input
                placeholder="https://... atau /uploads/proposal.pdf"
                value={proposalFile}
                onChange={(e) => setProposalFile(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Rincian Kebutuhan / Catatan</Label>
              <Textarea
                placeholder="Uraikan alasan pengajuan dan pos pengeluaran utama..."
                rows={3}
                value={proposalDesc}
                onChange={(e) => setProposalDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProposalDialog(false)}>Batal</Button>
            <Button onClick={handleRaiseProposal} disabled={saving || !proposalTitle.trim() || !proposalAmount}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Naikkan Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Review Proposal by BPH / Bendahara */}
      <Dialog open={showReviewProposalDialog} onOpenChange={setShowReviewProposalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'APPROVED' ? 'Persetujuan (ACC) Proposal Dana' : 'Penolakan & Evaluasi Proposal'}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'APPROVED'
                ? 'Jika disetujui, status program kerja akan otomatis aktif berjalan (ON_PROGRESS).'
                : 'Catatan penolakan akan disimpan permanen dalam riwayat versi untuk pembelajaran panitia.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{reviewAction === 'APPROVED' ? 'Catatan Persetujuan (Opsional)' : 'Alasan Penolakan / Catatan Perbaikan *'}</Label>
              <Textarea
                placeholder={reviewAction === 'APPROVED' ? 'Catatan tambahan...' : 'Jelaskan alasan penolakan dan bagian yang harus diperbaiki oleh PIC...'}
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewProposalDialog(false)}>Batal</Button>
            <Button
              variant={reviewAction === 'APPROVED' ? 'default' : 'destructive'}
              className={reviewAction === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : ''}
              onClick={handleReviewProposal}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {reviewAction === 'APPROVED' ? 'ACC Proposal' : 'Tolak Proposal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Tambah Item Realisasi Belanja LPJ */}
      <Dialog open={showAddLpjItem} onOpenChange={setShowAddLpjItem}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Catat Item Realisasi Anggaran</DialogTitle>
            <DialogDescription>Masukkan rincian barang/jasa yang dibeli beserta bukti nota kwitansi</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sumber Dana / Kantong Anggaran</Label>
              <Select value={itemSumberDana} onValueChange={(v: any) => setItemSumberDana(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DANA_AJUAN">Dana Ajuan Proposal (Kas Organisasi)</SelectItem>
                  <SelectItem value="KAS_PROKER">Kas Mandiri Proker (Iuran Panitia / Danus)</SelectItem>
                  <SelectItem value="DANA_LUAR">Dana Luar (Sponsor, Donatur, HTM Tiket)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipe</Label>
                <Select value={itemType} onValueChange={(v: any) => setItemType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXPENSE">Pengeluaran / Belanja</SelectItem>
                    <SelectItem value="INCOME">Pemasukan Riil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kategori Pos</Label>
                <Select value={itemKategori} onValueChange={setItemKategori}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Konsumsi">Konsumsi</SelectItem>
                    <SelectItem value="Kesekretariatan">Kesekretariatan</SelectItem>
                    <SelectItem value="Perlengkapan">Perlengkapan</SelectItem>
                    <SelectItem value="Humas & Publikasi">Humas & Publikasi</SelectItem>
                    <SelectItem value="Transportasi">Transportasi</SelectItem>
                    <SelectItem value="Akomodasi">Akomodasi</SelectItem>
                    <SelectItem value="Sponsorship">Sponsorship</SelectItem>
                    <SelectItem value="Pendaftaran">Pendaftaran</SelectItem>
                    <SelectItem value="Kas Organisasi">Kas Organisasi</SelectItem>
                    <SelectItem value="Apresiasi & Pembubaran Panitia">Apresiasi & Pembubaran Panitia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nama Barang / Uraian Belanja *</Label>
              <Input
                placeholder="Contoh: Nasi Kotak Siang 50 Porsi"
                value={itemNama}
                onChange={(e) => setItemNama(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label>Kuantitas</Label>
                <Input
                  type="number"
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Satuan</Label>
                <Input
                  placeholder="kotak, rim, hari"
                  value={itemSatuan}
                  onChange={(e) => setItemSatuan(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Harga Satuan (Rp) *</Label>
                <Input
                  type="number"
                  placeholder="25000"
                  value={itemHarga}
                  onChange={(e) => setItemHarga(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tautan Bukti Nota / Kwitansi (URL Gambar/PDF)</Label>
              <Input
                placeholder="https://... atau /uploads/nota-konsumsi.jpg"
                value={itemBukti}
                onChange={(e) => setItemBukti(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Keterangan Tambahan (Opsional)</Label>
              <Input
                placeholder="Nama vendor, toko, atau no kuitansi"
                value={itemKet}
                onChange={(e) => setItemKet(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddLpjItem(false)}>Batal</Button>
            <Button onClick={handleAddLpjItem} disabled={saving || !itemNama.trim() || !itemHarga}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Review & Sahkan LPJ */}
      <Dialog open={showReviewLpjDialog} onOpenChange={setShowReviewLpjDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pengesahan Laporan Pertanggungjawaban (LPJ)</DialogTitle>
            <DialogDescription>
              Menyetujui LPJ akan secara resmi menyelesaikan program kerja ini (COMPLETED)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {lpj?.dokumenFinalLpj && (
              <div className="p-3 rounded-lg border bg-muted/40 text-xs flex items-center justify-between gap-2">
                <div className="truncate">
                  <span className="font-semibold text-foreground block truncate">
                    {lpj.dokumenFinalName || 'Buku_Final_LPJ.pdf'}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Dokumen naskah LPJ utuh yang dilampirkan panitia
                  </span>
                </div>
                <Button size="sm" variant="outline" asChild className="shrink-0 h-7 text-xs">
                  <a href={lpj.dokumenFinalLpj} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-1 h-3 w-3" />
                    Buka Berkas
                  </a>
                </Button>
              </div>
            )}
            {/* Checklist Compliance Gate Preview */}
            <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
              <span className="text-xs font-semibold block text-foreground">
                Verifikasi Berkas Fisik:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <Checkbox checked={chkNotaFisik} onCheckedChange={(v: any) => setChkNotaFisik(Boolean(v))} />
                  <span>Nota Asli & Stempel</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <Checkbox checked={chkPresensi} onCheckedChange={(v: any) => setChkPresensi(Boolean(v))} />
                  <span>Presensi & Notula</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <Checkbox checked={chkDokumentasi} onCheckedChange={(v: any) => setChkDokumentasi(Boolean(v))} />
                  <span>Dokumentasi Foto</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <Checkbox checked={chkBeritaAcara} onCheckedChange={(v: any) => setChkBeritaAcara(Boolean(v))} />
                  <span>Berita Acara Kegiatan</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tindakan Pengesahan</Label>
              <Select value={lpjReviewAction} onValueChange={(v: any) => setLpjReviewAction(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPROVED">Setujui & Sahkan LPJ (Proker Selesai)</SelectItem>
                  <SelectItem value="REJECTED">Kembalikan untuk Revisi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Surplus Allocation Form if Approved and Saldo > 0 */}
            {lpjReviewAction === 'APPROVED' && Number(lpj?.saldoAkhir) > 0 && (
              <div className="p-3.5 rounded-lg border bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                    Sisa Saldo Kas (Surplus): {formatCurrency(lpj?.saldoAkhir)}
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                    Kebijakan Surplus
                  </Badge>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Kebijakan Alokasi Sisa Kas</Label>
                  <Select value={surplusAction} onValueChange={(v: any) => setSurplusAction(v)}>
                    <SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KEMBALIKAN_KAS_UMUM">Setor Kembali ke Kas Umum BPH (Auto-Jurnal Kas Organisasi)</SelectItem>
                      <SelectItem value="SYUKURAN_PANITIA">Alokasikan untuk Syukuran / Apresiasi Panitia (Auto-Balance Rp 0)</SelectItem>
                      <SelectItem value="KAS_DIVISI">Simpan sebagai Tabungan Kas Cadangan Divisi</SelectItem>
                      <SelectItem value="NONE">Biarkan di Kas Panitia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Catatan / Rincian Kesepakatan</Label>
                  <Input
                    placeholder="Contoh: Kesepakatan evaluasi BPH dan panitia untuk konsumsi syukuran pembubaran"
                    className="h-8 text-xs bg-background"
                    value={surplusNote}
                    onChange={(e) => setSurplusNote(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Catatan Pengesahan</Label>
              <Textarea
                placeholder="Catatan dari pimpinan/BPH..."
                rows={3}
                value={lpjReviewNote}
                onChange={(e) => setLpjReviewNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewLpjDialog(false)}>Batal</Button>
            <Button
              className={lpjReviewAction === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              onClick={handleReviewLpj}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Keputusan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Hapus Proker Confirmation */}
      <Dialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Program Kerja</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus program kerja ini beserta seluruh checkpoint, susunan panitia, dan proposal yang terhubung? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteAlert(false)}>Batal</Button>
            <Button variant="destructive" onClick={deleteProker} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus Proker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Kelola Master Template LPJ Organisasi (Bendahara/Sekretaris) */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Master Template LPJ Organisasi</DialogTitle>
            <DialogDescription>
              Diunggah oleh Bendahara atau Sekretaris untuk dijadikan acuan baku seluruh kepanitiaan kegiatan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Template / Berkas *</Label>
              <Input
                placeholder="Contoh: Template_Resmi_LPJ_Organisasi.docx"
                value={templateNameInput}
                onChange={(e) => setTemplateNameInput(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tautan / URL Berkas Template *</Label>
              <Input
                placeholder="https://drive.google.com/... atau /templates/lpj-resmi.docx"
                value={templateUrlInput}
                onChange={(e) => setTemplateUrlInput(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Tautkan file Google Drive, cloud storage organisasi, atau path file dokumen resmi.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Petunjuk & Keterangan Format</Label>
              <Textarea
                placeholder="Panduan penulisan font, margin, lampiran nota asli, susunan bab..."
                rows={3}
                value={templateDescInput}
                onChange={(e) => setTemplateDescInput(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateModal(false)}>Batal</Button>
            <Button onClick={handleSaveOfficialTemplate} disabled={saving || !templateUrlInput.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Template Resmi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Unggah Dokumen Final LPJ Kegiatan (Panitia Proker) */}
      <Dialog open={showUploadFinalModal} onOpenChange={setShowUploadFinalModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Lampirkan Dokumen Final LPJ</DialogTitle>
            <DialogDescription>
              Unggah atau tautkan berkas naskah utuh laporan pertanggungjawaban program kerja ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Dokumen *</Label>
              <Input
                placeholder="Contoh: LPJ_LDKO_2026_Final_Tertandatangan.pdf"
                value={finalDocName}
                onChange={(e) => setFinalDocName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tautan / URL Berkas Dokumen LPJ *</Label>
              <Input
                placeholder="https://drive.google.com/... atau /uploads/lpj-ldko-final.pdf"
                value={finalDocUrl}
                onChange={(e) => setFinalDocUrl(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Dapat berupa PDF bertanda tangan scan lengkap, Google Drive publik panitia, dsb.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadFinalModal(false)}>Batal</Button>
            <Button onClick={handleSaveFinalLpjDoc} disabled={saving || !finalDocUrl.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan & Lampirkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Konfigurasi Template & Nomor Sertifikat Proker */}
      <Dialog open={showSertifikatModal} onOpenChange={setShowSertifikatModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Template Sertifikat Khusus Program Kerja
            </DialogTitle>
            <DialogDescription>
              Tiap kegiatan dapat memiliki desain latar belakang piagam dan format nomor sertifikat tersendiri
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pola / Format Penomoran Sertifikat</Label>
              <Input
                placeholder="[NO]/SERT-OC/DIV/LDKO/X/2026"
                value={sertifPrefixInput}
                onChange={(e) => setSertifPrefixInput(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Gunakan <code className="bg-muted px-1 rounded">[NO]</code> sebagai penanda nomor urut 3 digit (cth: 001, 002).
              </p>
            </div>

            <div className="space-y-2">
              <Label>Tautan Background Template Desain Piagam (URL Gambar / Canva / Drive)</Label>
              <Input
                placeholder="https://... atau /templates/sertif-ldko.png"
                value={sertifTemplateInput}
                onChange={(e) => setSertifTemplateInput(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Blanko sertifikat berorientasi landscape A4 tanpa nama & jabatan.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Penandatangan 1 (Nama)</Label>
                <Input
                  placeholder="Nama Ketua Pelaksana"
                  value={sertifSigner1Name}
                  onChange={(e) => setSertifSigner1Name(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Jabatan 1</Label>
                <Input
                  value={sertifSigner1Role}
                  onChange={(e) => setSertifSigner1Role(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Penandatangan 2 (Nama)</Label>
                <Input
                  placeholder="Nama Ketua Umum BPH"
                  value={sertifSigner2Name}
                  onChange={(e) => setSertifSigner2Name(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Jabatan 2</Label>
                <Input
                  value={sertifSigner2Role}
                  onChange={(e) => setSertifSigner2Role(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSertifikatModal(false)}>Batal</Button>
            <Button onClick={handleSaveSertifikatConfig} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Konfigurasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Pratinjau Piagam E-Sertifikat Panitia */}
      <Dialog open={showCertPreviewModal} onOpenChange={setShowCertPreviewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Piagam Sertifikat Penghargaan Kepanitiaan
            </DialogTitle>
            <DialogDescription>
              Dokumen e-sertifikat sah kegiatan {proker.title}
            </DialogDescription>
          </DialogHeader>

          {selectedCertPanitia && (
            <div className="p-6 rounded-xl border-4 border-double border-amber-600/40 bg-gradient-to-br from-amber-50/50 via-background to-orange-50/30 dark:from-amber-950/20 dark:via-background dark:to-orange-950/20 text-center space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] font-mono tracking-widest uppercase text-muted-foreground">
                  Nomor: {selectedCertPanitia.nomorSertifikat}
                </span>
                <h3 className="text-xl font-serif font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide">
                  Sertifikat Penghargaan
                </h3>
                <p className="text-xs text-muted-foreground">Diberikan dengan bangga dan hormat kepada:</p>
              </div>

              <div className="py-2">
                <h2 className="text-2xl font-bold text-foreground border-b-2 border-primary/20 inline-block px-6 pb-1">
                  {selectedCertPanitia.user.name}
                </h2>
                <p className="text-sm font-semibold text-primary mt-1">
                  Sebagai: {selectedCertPanitia.roleJabatan}
                </p>
              </div>

              <p className="text-xs text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Atas dedikasi, loyalitas, dan kontribusi nyata dalam menyukseskan pelaksanaan kegiatan{' '}
                <span className="font-semibold text-foreground">{proker.title}</span> yang diselenggarakan oleh{' '}
                <span className="font-semibold text-foreground">{proker.divisi?.name}</span>.
              </p>

              <div className="pt-4 grid grid-cols-2 gap-6 text-xs border-t">
                <div>
                  <p className="font-semibold text-foreground underline underline-offset-4">
                    {proker.sertifikatSigner1Name || proker.pic?.name || 'Ketua Pelaksana'}
                  </p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    {proker.sertifikatSigner1Role || 'Ketua Pelaksana'}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-foreground underline underline-offset-4">
                    {proker.sertifikatSigner2Name || 'Ketua Umum BPH'}
                  </p>
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    {proker.sertifikatSigner2Role || 'Ketua Umum'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Terverifikasi dalam basis data HubbHQ
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCertPreviewModal(false)}>Tutup</Button>
              <Button
                variant="default"
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => window.print()}
              >
                <Printer className="mr-1.5 h-4 w-4" />
                Cetak Piagam
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
