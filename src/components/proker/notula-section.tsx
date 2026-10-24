'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
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
  FileText,
  Plus,
  Calendar,
  MapPin,
  User,
  Users,
  CheckCircle2,
  FileCheck,
  Printer,
  Trash2,
  Edit,
  ExternalLink,
  Loader2,
  BookOpen,
} from 'lucide-react'

export interface NotulaItem {
  id: string
  programKerjaId: string
  presensiSesiId: string | null
  judul: string
  tanggal: string
  tempat: string | null
  pimpinanRapat: string
  notulisId: string | null
  notulisName: string | null
  agenda: string | null
  pembahasan: string
  kesimpulan: string
  actionItems: string | null
  lampiranUrl: string | null
  isDitarikKeLpj: boolean
  createdAt: string
  notulis: { id: string; name: string | null; avatar: string | null } | null
  presensiSesi: {
    id: string
    judul: string
    tanggal: string
    _count: { kehadiran: number }
  } | null
}

interface NotulaSectionProps {
  prokerId: string
  prokerTitle: string
  members: any[]
  sesiList: { id: string; judul: string; tanggal: string }[]
  onUpdateLpj?: () => void
}

export function NotulaSection({
  prokerId,
  prokerTitle,
  members,
  sesiList,
  onUpdateLpj,
}: NotulaSectionProps) {
  const [notulaList, setNotulaList] = useState<NotulaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Dialog State: Buat / Edit Notula
  const [showModal, setShowModal] = useState(false)
  const [editNotulaId, setEditNotulaId] = useState<string | null>(null)
  const [judul, setJudul] = useState('')
  const [tanggal, setTanggal] = useState('')
  const [tempat, setTempat] = useState('')
  const [pimpinanRapat, setPimpinanRapat] = useState('')
  const [notulisId, setNotulisId] = useState('')
  const [notulisName, setNotulisName] = useState('')
  const [presensiSesiId, setPresensiSesiId] = useState('')
  const [agenda, setAgenda] = useState('')
  const [pembahasan, setPembahasan] = useState('')
  const [kesimpulan, setKesimpulan] = useState('')
  const [actionItems, setActionItems] = useState('')
  const [lampiranUrl, setLampiranUrl] = useState('')
  const [isDitarikKeLpj, setIsDitarikKeLpj] = useState(true)

  // Dialog State: Pratinjau Cetak Berita Acara Rapat Resmi
  const [selectedNotula, setSelectedNotula] = useState<NotulaItem | null>(null)

  // 1. Fetch Notula List
  const fetchNotulaList = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/proker/${prokerId}/notula`)
      if (res.ok) {
        const json = await res.json()
        setNotulaList(json.data || [])
      }
    } catch (err) {
      console.error('Error fetching notula:', err)
    } finally {
      setLoading(false)
    }
  }, [prokerId])

  useEffect(() => {
    fetchNotulaList()
  }, [fetchNotulaList])

  // Reset Form
  const resetForm = () => {
    setEditNotulaId(null)
    setJudul('')
    setTanggal(new Date().toISOString().split('T')[0])
    setTempat('')
    setPimpinanRapat('')
    setNotulisId('')
    setNotulisName('')
    setPresensiSesiId('')
    setAgenda('')
    setPembahasan('')
    setKesimpulan('')
    setActionItems('')
    setLampiranUrl('')
    setIsDitarikKeLpj(true)
  }

  // Open Edit Modal
  const openEditModal = (item: NotulaItem) => {
    setEditNotulaId(item.id)
    setJudul(item.judul)
    setTanggal(new Date(item.tanggal).toISOString().split('T')[0])
    setTempat(item.tempat || '')
    setPimpinanRapat(item.pimpinanRapat)
    setNotulisId(item.notulisId || '')
    setNotulisName(item.notulisName || '')
    setPresensiSesiId(item.presensiSesiId || '')
    setAgenda(item.agenda || '')
    setPembahasan(item.pembahasan)
    setKesimpulan(item.kesimpulan)
    setActionItems(item.actionItems || '')
    setLampiranUrl(item.lampiranUrl || '')
    setIsDitarikKeLpj(item.isDitarikKeLpj)
    setShowModal(true)
  }

  // Save / Update Notula
  const handleSaveNotula = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!judul.trim() || !pimpinanRapat.trim() || !pembahasan.trim() || !kesimpulan.trim()) {
      return
    }

    try {
      setSaving(true)
      const payload = {
        judul: judul.trim(),
        tanggal: tanggal ? new Date(tanggal) : new Date(),
        tempat: tempat.trim() || undefined,
        pimpinanRapat: pimpinanRapat.trim(),
        notulisId: notulisId || undefined,
        notulisName: notulisName.trim() || undefined,
        presensiSesiId: presensiSesiId || undefined,
        agenda: agenda.trim() || undefined,
        pembahasan: pembahasan.trim(),
        kesimpulan: kesimpulan.trim(),
        actionItems: actionItems.trim() || undefined,
        lampiranUrl: lampiranUrl.trim() || undefined,
        isDitarikKeLpj,
      }

      const url = editNotulaId
        ? `/api/proker/${prokerId}/notula/${editNotulaId}`
        : `/api/proker/${prokerId}/notula`
      const method = editNotulaId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setShowModal(false)
        resetForm()
        fetchNotulaList()
        if (onUpdateLpj) onUpdateLpj()
      }
    } catch (err) {
      console.error('Error saving notula:', err)
    } finally {
      setSaving(false)
    }
  }

  // Toggle Tarik ke LPJ
  const handleToggleLpj = async (item: NotulaItem) => {
    try {
      const res = await fetch(`/api/proker/${prokerId}/notula/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDitarikKeLpj: !item.isDitarikKeLpj }),
      })
      if (res.ok) {
        fetchNotulaList()
        if (onUpdateLpj) onUpdateLpj()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Hapus Notula
  const handleDeleteNotula = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus arsip notula rapat ini?')) return
    try {
      const res = await fetch(`/api/proker/${prokerId}/notula/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchNotulaList()
        if (onUpdateLpj) onUpdateLpj()
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Notula & Berita Acara Rapat Terintegrasi
          </CardTitle>
          <CardDescription>
            Dokumentasi keputusan sidang, jalannya rapat panitia, dan tindak lanjut yang dapat langsung dilampirkan ke buku LPJ
          </CardDescription>
        </div>
        <Button
          size="sm"
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Tulis Notula Rapat
        </Button>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
            Memuat arsip notula...
          </div>
        ) : notulaList.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-lg text-muted-foreground text-sm">
            Belum ada arsip notula rapat kegiatan. Klik &quot;Tulis Notula Rapat&quot; untuk mencatat hasil pertemuan.
          </div>
        ) : (
          <div className="space-y-3">
            {notulaList.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-foreground">
                        {item.judul}
                      </h4>
                      {item.isDitarikKeLpj && (
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 text-[10px]">
                          Dilampirkan ke LPJ
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-primary" />
                        {new Date(item.tanggal).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                      </span>
                      {item.tempat && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-primary" />
                          {item.tempat}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-primary" />
                        Pimpinan: <span className="font-medium text-foreground">{item.pimpinanRapat}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-primary" />
                        Notulis: <span className="font-medium text-foreground">{item.notulisName || item.notulis?.name || '-'}</span>
                      </span>
                      {item.presensiSesi && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-emerald-600" />
                          Sesi Presensi: <span className="font-medium text-foreground">{item.presensiSesi.judul} ({item.presensiSesi._count.kehadiran} Hadir)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => setSelectedNotula(item)}
                    >
                      <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                      Baca / Cetak
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => openEditModal(item)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteNotula(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Excerpt Ringkasan Keputusan */}
                <div className="p-3 rounded-lg border bg-muted/20 text-xs space-y-1.5">
                  {item.agenda && (
                    <div className="text-muted-foreground">
                      <span className="font-semibold text-foreground">Agenda: </span>
                      {item.agenda}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-foreground">Kesimpulan & Kesepakatan: </span>
                    <span className="text-muted-foreground line-clamp-2">{item.kesimpulan}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-7 px-2 text-[11px] ${
                      item.isDitarikKeLpj ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-muted-foreground'
                    }`}
                    onClick={() => handleToggleLpj(item)}
                  >
                    <FileCheck className="mr-1 h-3.5 w-3.5" />
                    {item.isDitarikKeLpj ? 'Masuk Lampiran LPJ' : 'Tarik ke Lampiran LPJ'}
                  </Button>

                  {item.lampiranUrl && (
                    <a
                      href={item.lampiranUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-[11px]"
                    >
                      Lihat Berkas Lampiran <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* ======================================================== */}
      {/* DIALOG: Tulis / Edit Notula Rapat */}
      {/* ======================================================== */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveNotula}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {editNotulaId ? 'Perbarui Notula Rapat' : 'Tulis Notula Rapat Baru'}
              </DialogTitle>
              <DialogDescription>
                Catat risalah jalannya rapat, keputusan pleno, dan tindak lanjut kegiatan
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs">Judul Rapat / Sidang *</Label>
                <Input
                  placeholder="Contoh: Rapat Koordinasi Panitia #1, Rapat Pleno Evaluasi"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tanggal Pelaksanaan *</Label>
                  <Input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tempat / Media Pertemuan</Label>
                  <Input
                    placeholder="Contoh: Ruang Sidang / Google Meet"
                    value={tempat}
                    onChange={(e) => setTempat(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Pimpinan Rapat / Sidang *</Label>
                  <Input
                    placeholder="Nama pimpinan rapat"
                    value={pimpinanRapat}
                    onChange={(e) => setPimpinanRapat(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Notulis Rapat</Label>
                  <Select
                    value={notulisId}
                    onValueChange={(val) => {
                      setNotulisId(val)
                      const m = members.find((x) => x.id === val)
                      if (m) setNotulisName(m.fullName || m.name || '')
                    }}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Pilih notulis..." />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.fullName || m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Hubungkan ke Sesi Presensi */}
              <div className="space-y-1.5">
                <Label className="text-xs">Hubungkan ke Sesi Presensi Terkait (Opsional)</Label>
                <Select
                  value={presensiSesiId || 'NONE'}
                  onValueChange={(val) => setPresensiSesiId(val === 'NONE' ? '' : val)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Pilih sesi presensi untuk menyatukan daftar hadir..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">-- Tidak dihubungkan --</SelectItem>
                    {sesiList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.judul} ({new Date(s.tanggal).toLocaleDateString('id-ID')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Poin Agenda Pembahasan</Label>
                <Textarea
                  placeholder="Poin 1: Laporan divisi acara&#10;Poin 2: Fiksasi anggaran RAB&#10;Poin 3: Alur timeline teknis"
                  rows={2}
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Uraian Pembahasan & Jalannya Diskusi *</Label>
                <Textarea
                  placeholder="Uraikan jalannya rapat, masukan tiap divisi, dan dinamika pembahasan..."
                  rows={4}
                  value={pembahasan}
                  onChange={(e) => setPembahasan(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Kesimpulan & Keputusan Final *</Label>
                <Textarea
                  placeholder="Ringkasan poin kesepakatan mufakat atau hasil voting pleno..."
                  rows={3}
                  value={kesimpulan}
                  onChange={(e) => setKesimpulan(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Tindak Lanjut / Action Items</Label>
                <Textarea
                  placeholder="Contoh:&#10;- Divisi Acara: Fiksasi rundown H-3 (PIC: Ahmad)&#10;- Bendahara: Pencairan dana tahap 1 (PIC: Siti)"
                  rows={2}
                  value={actionItems}
                  onChange={(e) => setActionItems(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Tautan Berkas Foto Dokumentasi / Lampiran (URL)</Label>
                <Input
                  placeholder="https://... atau /uploads/dokumentasi-rapat.jpg"
                  value={lampiranUrl}
                  onChange={(e) => setLampiranUrl(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="tarikLpjCheck"
                  checked={isDitarikKeLpj}
                  onCheckedChange={(c) => setIsDitarikKeLpj(Boolean(c))}
                />
                <label
                  htmlFor="tarikLpjCheck"
                  className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Otomatis tarik dan cantumkan notula ini ke naskah Lampiran LPJ Program Kerja
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={saving || !judul.trim() || !pimpinanRapat.trim() || !pembahasan.trim() || !kesimpulan.trim()}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editNotulaId ? 'Simpan Perubahan' : 'Terbitkan Notula Rapat'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* DIALOG: Pratinjau Cetak Berita Acara Rapat Resmi */}
      {/* ======================================================== */}
      <Dialog open={!!selectedNotula} onOpenChange={(open) => !open && setSelectedNotula(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-8">
          <DialogHeader className="border-b pb-4 text-center">
            <h2 className="text-lg font-bold tracking-wide uppercase text-foreground">
              Berita Acara & Risalah Rapat
            </h2>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {prokerTitle}
            </p>
          </DialogHeader>

          {selectedNotula && (
            <div className="space-y-5 text-xs text-foreground leading-relaxed pt-2">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border bg-muted/20">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Nama Pertemuan:</span>
                  <p className="font-semibold">{selectedNotula.judul}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Waktu & Tempat:</span>
                  <p className="font-semibold">
                    {new Date(selectedNotula.tanggal).toLocaleDateString('id-ID', { dateStyle: 'full' })} - {selectedNotula.tempat || 'Sekretariat'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Pimpinan Rapat:</span>
                  <p className="font-semibold">{selectedNotula.pimpinanRapat}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Notulis:</span>
                  <p className="font-semibold">{selectedNotula.notulisName || selectedNotula.notulis?.name || '-'}</p>
                </div>
              </div>

              {/* Agenda */}
              {selectedNotula.agenda && (
                <div>
                  <h4 className="font-bold text-sm border-b pb-1 mb-2 text-foreground">
                    I. Agenda Pembahasan
                  </h4>
                  <p className="whitespace-pre-wrap text-muted-foreground leading-normal">
                    {selectedNotula.agenda}
                  </p>
                </div>
              )}

              {/* Pembahasan */}
              <div>
                <h4 className="font-bold text-sm border-b pb-1 mb-2 text-foreground">
                  II. Jalannya Pembahasan & Dinamika Sidang
                </h4>
                <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {selectedNotula.pembahasan}
                </p>
              </div>

              {/* Kesimpulan */}
              <div>
                <h4 className="font-bold text-sm border-b pb-1 mb-2 text-foreground">
                  III. Kesimpulan & Keputusan Final
                </h4>
                <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed font-medium">
                  {selectedNotula.kesimpulan}
                </p>
              </div>

              {/* Action Items */}
              {selectedNotula.actionItems && (
                <div>
                  <h4 className="font-bold text-sm border-b pb-1 mb-2 text-foreground">
                    IV. Tindak Lanjut & Penugasan (Action Items)
                  </h4>
                  <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                    {selectedNotula.actionItems}
                  </p>
                </div>
              )}

              {/* Tanda Tangan */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs border-t">
                <div>
                  <p className="text-muted-foreground mb-12">Pimpinan Rapat / Sidang,</p>
                  <p className="font-bold underline text-foreground">{selectedNotula.pimpinanRapat}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-12">Notulis Rapat,</p>
                  <p className="font-bold underline text-foreground">
                    {selectedNotula.notulisName || selectedNotula.notulis?.name || 'Notulis'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t pt-4 flex justify-between items-center sm:justify-between">
            <Button variant="outline" size="sm" onClick={() => setSelectedNotula(null)}>
              Tutup
            </Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => window.print()}
            >
              <Printer className="mr-1.5 h-3.5 w-3.5" />
              Cetak Dokumen Resmi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

