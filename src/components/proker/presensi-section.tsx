'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import QRCode from 'qrcode'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
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
import {
  QrCode,
  Users,
  Plus,
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Trash2,
  UserPlus,
  RefreshCw,
  Printer,
  FileCheck,
  Loader2,
  Check,
} from 'lucide-react'

export interface PresensiSesiItem {
  id: string
  programKerjaId: string
  judul: string
  tipe: string
  deskripsi: string | null
  lokasi: string | null
  tanggal: string
  isActive: boolean
  allowManualCheckin: boolean
  isDitarikKeLpj: boolean
  tokenTtlSeconds: number
  createdBy: { id: string; name: string | null; avatar: string | null } | null
  totalPeserta: number
  stats: {
    hadir: number
    izin: number
    sakit: number
    alpa: number
  }
  createdAt: string
}

export interface KehadiranRecord {
  id: string
  userId: string | null
  namaPeserta: string
  nomorIdentitas: string | null
  instansi: string | null
  status: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA'
  metodeScan: string
  keterangan: string | null
  waktuHadir: string
  user: {
    id: string
    name: string | null
    email: string | null
    avatar: string | null
    phone: string | null
  } | null
}

interface PresensiSectionProps {
  prokerId: string
  prokerTitle: string
  members: any[]
  onUpdateLpj?: () => void
}

export function PresensiSection({
  prokerId,
  prokerTitle,
  members,
  onUpdateLpj,
}: PresensiSectionProps) {
  const [sesiList, setSesiList] = useState<PresensiSesiItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  // Dialog State: Buat Sesi Baru
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [formJudul, setFormJudul] = useState('')
  const [formTipe, setFormTipe] = useState('RAPAT')
  const [formLokasi, setFormLokasi] = useState('')
  const [formDeskripsi, setFormDeskripsi] = useState('')
  const [formTanggal, setFormTanggal] = useState('')
  const [formTtl, setFormTtl] = useState('20')

  // Dialog State: Proyektor Layar QR Dinamis
  const [activeQrSesi, setActiveQrSesi] = useState<PresensiSesiItem | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [scanUrl, setScanUrl] = useState<string>('')
  const [tokenInfo, setTokenInfo] = useState<{
    token: string
    remainingSeconds: number
    ttlSeconds: number
    totalHadir: number
  } | null>(null)
  const qrPollingRef = useRef<NodeJS.Timeout | null>(null)
  const qrCountdownRef = useRef<NodeJS.Timeout | null>(null)

  // Dialog State: Daftar Hadir & Kelola Manual
  const [activeDetailSesi, setActiveDetailSesi] = useState<PresensiSesiItem | null>(null)
  const [kehadiranList, setKehadiranList] = useState<KehadiranRecord[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

  // Manual Check-in State
  const [showManualCheckin, setShowManualCheckin] = useState(false)
  const [manualUserId, setManualUserId] = useState('')
  const [manualNama, setManualNama] = useState('')
  const [manualIdentitas, setManualIdentitas] = useState('')
  const [manualInstansi, setManualInstansi] = useState('')
  const [manualStatus, setManualStatus] = useState<'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA'>('HADIR')
  const [manualKeterangan, setManualKeterangan] = useState('')

  // 1. Fetch Daftar Sesi
  const fetchSesiList = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/proker/${prokerId}/presensi`)
      if (res.ok) {
        const json = await res.json()
        setSesiList(json.data || [])
      }
    } catch (err) {
      console.error('Error fetching sesi presensi:', err)
    } finally {
      setLoading(false)
    }
  }, [prokerId])

  useEffect(() => {
    fetchSesiList()
  }, [fetchSesiList])

  // 2. Buat Sesi Baru
  const handleCreateSesi = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formJudul.trim()) return

    try {
      setSaving(true)
      const res = await fetch(`/api/proker/${prokerId}/presensi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judul: formJudul.trim(),
          tipe: formTipe,
          lokasi: formLokasi.trim(),
          deskripsi: formDeskripsi.trim(),
          tanggal: formTanggal ? new Date(formTanggal) : new Date(),
          tokenTtlSeconds: parseInt(formTtl) || 20,
        }),
      })

      if (res.ok) {
        setShowCreateDialog(false)
        setFormJudul('')
        setFormLokasi('')
        setFormDeskripsi('')
        setFormTanggal('')
        fetchSesiList()
      }
    } catch (err) {
      console.error('Error creating sesi:', err)
    } finally {
      setSaving(false)
    }
  }

  // 3. Toggle Status Sesi (Buka / Tutup)
  const handleToggleActive = async (sesi: PresensiSesiItem) => {
    try {
      const res = await fetch(`/api/proker/${prokerId}/presensi/${sesi.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !sesi.isActive }),
      })
      if (res.ok) {
        fetchSesiList()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // 4. Toggle Tarik ke LPJ
  const handleToggleLpj = async (sesi: PresensiSesiItem) => {
    try {
      const res = await fetch(`/api/proker/${prokerId}/presensi/${sesi.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDitarikKeLpj: !sesi.isDitarikKeLpj }),
      })
      if (res.ok) {
        fetchSesiList()
        if (onUpdateLpj) onUpdateLpj()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // 5. Hapus Sesi
  const handleDeleteSesi = async (sesiId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus sesi presensi ini? Seluruh data rekap kehadiran di dalamnya akan terhapus.')) {
      return
    }
    try {
      const res = await fetch(`/api/proker/${prokerId}/presensi/${sesiId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchSesiList()
        if (onUpdateLpj) onUpdateLpj()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // 6. Polling Dynamic QR Token for Projector Mode
  const fetchDynamicToken = useCallback(
    async (sesiId: string) => {
      try {
        const res = await fetch(`/api/proker/${prokerId}/presensi/${sesiId}/token`)
        if (res.ok) {
          const json = await res.json()
          if (json.data && json.data.isActive) {
            setScanUrl(json.data.scanUrl)
            setTokenInfo({
              token: json.data.token,
              remainingSeconds: json.data.remainingSeconds,
              ttlSeconds: json.data.ttlSeconds,
              totalHadir: json.data.totalHadir,
            })

            // Generate QR Code image
            const qrData = await QRCode.toDataURL(json.data.scanUrl, {
              width: 380,
              margin: 2,
              color: {
                dark: '#0f172a',
                light: '#ffffff',
              },
            })
            setQrCodeUrl(qrData)
          }
        }
      } catch (err) {
        console.error('Error fetching dynamic token:', err)
      }
    },
    [prokerId]
  )

  // Start projector modal
  const openProjectorMode = (sesi: PresensiSesiItem) => {
    setActiveQrSesi(sesi)
    fetchDynamicToken(sesi.id)

    // Polling token server every 4 seconds
    if (qrPollingRef.current) clearInterval(qrPollingRef.current)
    qrPollingRef.current = setInterval(() => {
      fetchDynamicToken(sesi.id)
    }, 4000)

    // Local countdown timer every 1s
    if (qrCountdownRef.current) clearInterval(qrCountdownRef.current)
    qrCountdownRef.current = setInterval(() => {
      setTokenInfo((prev) => {
        if (!prev) return null
        const nextSec = prev.remainingSeconds - 1
        return {
          ...prev,
          remainingSeconds: nextSec > 0 ? nextSec : prev.ttlSeconds,
        }
      })
    }, 1000)
  }

  const closeProjectorMode = () => {
    setActiveQrSesi(null)
    setQrCodeUrl('')
    setTokenInfo(null)
    if (qrPollingRef.current) clearInterval(qrPollingRef.current)
    if (qrCountdownRef.current) clearInterval(qrCountdownRef.current)
    fetchSesiList()
  }

  // 7. Detail Sesi & Rekap Kehadiran
  const openDetailSesi = async (sesi: PresensiSesiItem) => {
    setActiveDetailSesi(sesi)
    try {
      setLoadingDetail(true)
      const res = await fetch(`/api/proker/${prokerId}/presensi/${sesi.id}`)
      if (res.ok) {
        const json = await res.json()
        setKehadiranList(json.data.kehadiran || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingDetail(false)
    }
  }

  // 8. Manual Check-in Submit
  const handleManualCheckin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeDetailSesi) return

    try {
      setSaving(true)
      const res = await fetch(`/api/proker/${prokerId}/presensi/${activeDetailSesi.id}/kehadiran`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: manualUserId || undefined,
          namaPeserta: manualNama.trim() || undefined,
          nomorIdentitas: manualIdentitas.trim() || undefined,
          instansi: manualInstansi.trim() || undefined,
          status: manualStatus,
          keterangan: manualKeterangan.trim() || undefined,
        }),
      })

      if (res.ok) {
        setShowManualCheckin(false)
        setManualUserId('')
        setManualNama('')
        setManualIdentitas('')
        setManualInstansi('')
        setManualKeterangan('')
        openDetailSesi(activeDetailSesi)
        fetchSesiList()
        if (onUpdateLpj) onUpdateLpj()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // 9. Update Status Kehadiran
  const handleUpdateStatusKehadiran = async (kehadiranId: string, newStatus: string) => {
    if (!activeDetailSesi) return
    try {
      const res = await fetch(`/api/proker/${prokerId}/presensi/${activeDetailSesi.id}/kehadiran`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kehadiranId,
          status: newStatus,
        }),
      })
      if (res.ok) {
        openDetailSesi(activeDetailSesi)
        fetchSesiList()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // 10. Hapus Record Kehadiran
  const handleDeleteKehadiran = async (kehadiranId: string) => {
    if (!confirm('Hapus catatan kehadiran peserta ini?')) return
    if (!activeDetailSesi) return

    try {
      const res = await fetch(
        `/api/proker/${prokerId}/presensi/${activeDetailSesi.id}/kehadiran?kehadiranId=${kehadiranId}`,
        { method: 'DELETE' }
      )
      if (res.ok) {
        openDetailSesi(activeDetailSesi)
        fetchSesiList()
        if (onUpdateLpj) onUpdateLpj()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Filter Kehadiran
  const filteredKehadiran = kehadiranList.filter((k) => {
    const matchSearch =
      k.namaPeserta.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (k.instansi && k.instansi.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (k.nomorIdentitas && k.nomorIdentitas.includes(searchQuery))
    const matchStatus = filterStatus === 'ALL' || k.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Presensi Digital Berbasis QR Dinamis
          </CardTitle>
          <CardDescription>
            Sistem presensi anti-titip absen untuk rapat koordinasi, kepanitiaan, dan pelaksanaan hari-H kegiatan
          </CardDescription>
        </div>
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Buat Sesi Pertemuan
        </Button>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
            Memuat sesi presensi...
          </div>
        ) : sesiList.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-lg text-muted-foreground text-sm">
            Belum ada sesi presensi kegiatan. Klik &quot;Buat Sesi Pertemuan&quot; untuk memulai pencatatan kehadiran.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sesiList.map((sesi) => (
              <div
                key={sesi.id}
                className="p-4 rounded-lg border bg-card flex flex-col justify-between gap-4 shadow-sm hover:border-primary/50 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="text-xs">
                      {sesi.tipe}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      {sesi.isActive ? (
                        <Badge className="bg-emerald-600 text-white text-[11px]">
                          Aktif Dibuka
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[11px] text-muted-foreground">
                          Ditutup
                        </Badge>
                      )}
                    </div>
                  </div>

                  <h4 className="font-semibold text-sm text-foreground line-clamp-1">
                    {sesi.judul}
                  </h4>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{new Date(sesi.tanggal).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
                    </div>
                    {sesi.lokasi && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate">{sesi.lokasi}</span>
                      </div>
                    )}
                  </div>

                  {/* Stat Bar Kehadiran */}
                  <div className="pt-2 border-t space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Total Tercatat:</span>
                      <span className="font-bold text-foreground">{sesi.totalPeserta} Peserta</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-[11px] text-center font-mono">
                      <div className="p-1 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                        H: {sesi.stats.hadir}
                      </div>
                      <div className="p-1 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                        I: {sesi.stats.izin}
                      </div>
                      <div className="p-1 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                        S: {sesi.stats.sakit}
                      </div>
                      <div className="p-1 rounded bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300">
                        A: {sesi.stats.alpa}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      className="w-full text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => openProjectorMode(sesi)}
                    >
                      <QrCode className="mr-1.5 h-3.5 w-3.5" />
                      Layar QR
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => openDetailSesi(sesi)}
                    >
                      <Users className="mr-1.5 h-3.5 w-3.5" />
                      Daftar Hadir
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 px-2 text-[11px] ${
                        sesi.isDitarikKeLpj ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-muted-foreground'
                      }`}
                      onClick={() => handleToggleLpj(sesi)}
                      title="Klik untuk menyinkronkan daftar presensi ke buku LPJ"
                    >
                      <FileCheck className="mr-1 h-3.5 w-3.5" />
                      {sesi.isDitarikKeLpj ? 'Ditarik ke LPJ' : 'Tarik ke LPJ'}
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                        onClick={() => handleToggleActive(sesi)}
                      >
                        {sesi.isActive ? 'Tutup Sesi' : 'Buka Sesi'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteSesi(sesi.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* ======================================================== */}
      {/* DIALOG 1: Buat Sesi Presensi Baru */}
      {/* ======================================================== */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreateSesi}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                Buat Sesi Presensi Kegiatan
              </DialogTitle>
              <DialogDescription>
                Buat sesi presensi baru yang dilindungi token QR dinamis anti-titip absen
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Nama Pertemuan / Sesi *</Label>
                <Input
                  placeholder="Contoh: Rapat Pleno I Panitia, Briefing Gladi, dsb."
                  value={formJudul}
                  onChange={(e) => setFormJudul(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipe Sesi</Label>
                  <Select value={formTipe} onValueChange={setFormTipe}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RAPAT">Rapat Panitia</SelectItem>
                      <SelectItem value="KEGIATAN">Pelaksanaan Hari-H</SelectItem>
                      <SelectItem value="EVALUASI">Rapat Evaluasi</SelectItem>
                      <SelectItem value="GLADI">Gladi Bersih</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Interval Ganti QR (Detik)</Label>
                  <Select value={formTtl} onValueChange={setFormTtl}>
                    <SelectTrigger className="text-xs font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 Detik (Sangat Ketat)</SelectItem>
                      <SelectItem value="20">20 Detik (Standar Rekomendasi)</SelectItem>
                      <SelectItem value="30">30 Detik (Santai)</SelectItem>
                      <SelectItem value="60">60 Detik</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Lokasi Pertemuan</Label>
                  <Input
                    placeholder="Contoh: Ruang Sidang / Zoom"
                    value={formLokasi}
                    onChange={(e) => setFormLokasi(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tanggal Pelaksanaan</Label>
                  <Input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Deskripsi / Agenda Singkat</Label>
                <Textarea
                  placeholder="Catatan tambahan mengenai sesi pertemuan..."
                  rows={2}
                  value={formDeskripsi}
                  onChange={(e) => setFormDeskripsi(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={saving || !formJudul.trim()}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buat Sesi Presensi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* DIALOG 2: Layar Proyektor QR Dinamis (Anti-Titip Absen) */}
      {/* ======================================================== */}
      <Dialog open={!!activeQrSesi} onOpenChange={(open) => !open && closeProjectorMode()}>
        <DialogContent className="max-w-xl text-center p-6 space-y-4">
          <DialogHeader className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="text-xs">
                {activeQrSesi?.tipe}
              </Badge>
              <Badge className="bg-emerald-600 text-white text-xs">
                Layar Presensi Berjalan
              </Badge>
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
              {activeQrSesi?.judul}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Arahkan kamera HP ke QR Code di bawah. Token otomatis diperbarui untuk mencegah titip absen.
            </DialogDescription>
          </DialogHeader>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl border-4 border-primary/20 bg-white dark:bg-slate-900 shadow-xl max-w-sm mx-auto">
            {qrCodeUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrCodeUrl}
                alt="QR Presensi Dinamis"
                className="w-64 h-64 object-contain rounded-lg transition-transform duration-300"
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-muted-foreground text-sm">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {/* Countdown Bar */}
            {tokenInfo && (
              <div className="w-full mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Pergantian QR:
                  </span>
                  <span className="font-bold text-primary">
                    {tokenInfo.remainingSeconds}s
                  </span>
                </div>
                <Progress
                  value={((tokenInfo.ttlSeconds - tokenInfo.remainingSeconds) / tokenInfo.ttlSeconds) * 100}
                  className="h-2"
                />
              </div>
            )}
          </div>

          {/* Live Attendance Counter */}
          <div className="p-3 rounded-lg border bg-muted/40 flex items-center justify-around max-w-sm mx-auto text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">Kehadiran Masuk:</span>
              <span className="text-lg font-bold text-foreground">
                {tokenInfo?.totalHadir || 0} Orang
              </span>
            </div>
            <div className="border-l h-8" />
            <div>
              <span className="text-xs text-muted-foreground block">Status Perlindungan:</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                HMAC Terenkripsi
              </span>
            </div>
          </div>

          {/* Direct Scan Link Copy */}
          {scanUrl && (
            <div className="flex items-center justify-center gap-2 text-xs">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => {
                  navigator.clipboard.writeText(scanUrl)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
              >
                {copied ? <Check className="mr-1.5 h-3.5 w-3.5 text-green-600" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
                {copied ? 'Tersalin' : 'Salin Tautan Scan'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                asChild
              >
                <a href={scanUrl} target="_blank" rel="noreferrer">
                  Buka Portal Peserta <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          )}

          <DialogFooter className="flex justify-center sm:justify-center pt-2">
            <Button variant="secondary" onClick={closeProjectorMode}>
              Tutup Layar Proyektor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* DIALOG 3: Rekap Daftar Hadir & Kelola Kehadiran Manual */}
      {/* ======================================================== */}
      <Dialog open={!!activeDetailSesi} onOpenChange={(open) => !open && setActiveDetailSesi(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6">
          <DialogHeader className="border-b pb-3 space-y-1">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Rekap Kehadiran: {activeDetailSesi?.judul}
              </DialogTitle>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={() => setShowManualCheckin(true)}
              >
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                Input Kehadiran Manual
              </Button>
            </div>
            <DialogDescription className="text-xs">
              Daftar peserta terverifikasi, jam scan, status kehadiran, dan sinkronisasi ke buku LPJ
            </DialogDescription>
          </DialogHeader>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Input
                placeholder="Cari nama peserta, NIM, atau instansi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 text-xs w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="HADIR">Hadir</SelectItem>
                  <SelectItem value="IZIN">Izin</SelectItem>
                  <SelectItem value="SAKIT">Sakit</SelectItem>
                  <SelectItem value="ALPA">Alpa</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => window.print()}
              >
                <Printer className="mr-1.5 h-3.5 w-3.5" />
                Cetak Rekap
              </Button>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-y-auto border rounded-lg mt-3">
            {loadingDetail ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                Memuat catatan kehadiran...
              </div>
            ) : filteredKehadiran.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Belum ada data kehadiran yang sesuai filter.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b font-medium text-muted-foreground uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="p-2.5">No</th>
                    <th className="p-2.5">Nama Peserta</th>
                    <th className="p-2.5">Instansi / Divisi</th>
                    <th className="p-2.5">Waktu Scan</th>
                    <th className="p-2.5">Metode</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredKehadiran.map((k, idx) => (
                    <tr key={k.id} className="hover:bg-muted/20">
                      <td className="p-2.5 text-muted-foreground">{idx + 1}</td>
                      <td className="p-2.5 font-medium text-foreground">
                        <div>{k.namaPeserta}</div>
                        {k.nomorIdentitas && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {k.nomorIdentitas}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-muted-foreground">{k.instansi || '-'}</td>
                      <td className="p-2.5 font-mono text-[11px] text-muted-foreground">
                        {new Date(k.waktuHadir).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-2.5">
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {k.metodeScan === 'QR_SCAN' ? 'Scan HP' : 'Manual'}
                        </Badge>
                      </td>
                      <td className="p-2.5">
                        <Select
                          value={k.status}
                          onValueChange={(val) => handleUpdateStatusKehadiran(k.id, val)}
                        >
                          <SelectTrigger className="h-7 text-[11px] w-[90px] font-semibold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HADIR">Hadir</SelectItem>
                            <SelectItem value="IZIN">Izin</SelectItem>
                            <SelectItem value="SAKIT">Sakit</SelectItem>
                            <SelectItem value="ALPA">Alpa</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2.5 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteKehadiran(k.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <DialogFooter className="pt-3 border-t flex justify-between items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">
              Total {filteredKehadiran.length} catatan ditampilkan
            </span>
            <Button variant="outline" size="sm" onClick={() => setActiveDetailSesi(null)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* DIALOG 4: Sub-Modal Manual Check-in */}
      {/* ======================================================== */}
      <Dialog open={showManualCheckin} onOpenChange={setShowManualCheckin}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleManualCheckin}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Input Kehadiran Manual
              </DialogTitle>
              <DialogDescription>
                Catat kehadiran untuk anggota yang tidak membawa HP, baterai habis, atau peserta tamu luar
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3">
              {/* Pilih Anggota Sistem atau Tamu */}
              <div className="space-y-1.5">
                <Label className="text-xs">Pilih Anggota Terdaftar (Opsional)</Label>
                <Select
                  value={manualUserId}
                  onValueChange={(val) => {
                    setManualUserId(val)
                    const selected = members.find((m) => m.id === val)
                    if (selected) {
                      setManualNama(selected.fullName || selected.name || '')
                      if (selected.divisiMembers?.[0]?.divisi?.name) {
                        setManualInstansi(selected.divisiMembers[0].divisi.name)
                      }
                    }
                  }}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Pilih dari daftar anggota..." />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.fullName || m.name} ({m.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Nama Lengkap Peserta *</Label>
                <Input
                  placeholder="Masukkan nama lengkap..."
                  value={manualNama}
                  onChange={(e) => setManualNama(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">NIM / NIK / No. Anggota</Label>
                  <Input
                    placeholder="Opsional"
                    value={manualIdentitas}
                    onChange={(e) => setManualIdentitas(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Divisi / Instansi</Label>
                  <Input
                    placeholder="Contoh: Divisi Humas"
                    value={manualInstansi}
                    onChange={(e) => setManualInstansi(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Status Kehadiran</Label>
                  <Select
                    value={manualStatus}
                    onValueChange={(val: any) => setManualStatus(val)}
                  >
                    <SelectTrigger className="text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HADIR">Hadir</SelectItem>
                      <SelectItem value="IZIN">Izin</SelectItem>
                      <SelectItem value="SAKIT">Sakit</SelectItem>
                      <SelectItem value="ALPA">Alpa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Keterangan / Catatan</Label>
                  <Input
                    placeholder="Alasan izin / sakit..."
                    value={manualKeterangan}
                    onChange={(e) => setManualKeterangan(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowManualCheckin(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={saving || !manualNama.trim()}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Kehadiran
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

