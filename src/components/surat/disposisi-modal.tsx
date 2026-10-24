'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Send,
  Loader2,
  Users,
  UserCheck,
  Building,
  CheckSquare,
  Square,
  AlertCircle,
} from 'lucide-react'

export interface DisposisiData {
  id?: string
  suratId: string
  nomorAgenda?: string | null
  sifat: 'SANGAT_SEGERA' | 'SEGERA' | 'BIASA' | 'RAHASIA'
  tujuanDivisiId?: string | null
  tujuanDivisi?: { id: string; name: string; color?: string | null } | null
  tujuanUserId?: string | null
  tujuanUser?: { id: string; name: string | null; phone?: string | null } | null
  tujuanCustom?: string | null
  instruksi: string // JSON array
  catatanPimpinan?: string | null
  batasWaktu?: string | null
  pemberiNama?: string | null
  pemberiJabatan?: string | null
  status: 'BELUM_DIPROSES' | 'SEDANG_DIPROSES' | 'SELESAI'
  catatanTindakLanjut?: string | null
  tglSelesai?: string | null
  createdAt?: string
}

interface DisposisiModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  surat: {
    id: string
    letterNumber: string | null
    subject: string
    sender: string | null
    receivedDate: string | null
  } | null
  onSuccess: () => void
}

const SIFAT_OPTIONS = [
  { value: 'SANGAT_SEGERA', label: 'Sangat Segera', color: 'text-red-700 bg-red-50 border-red-200' },
  { value: 'SEGERA', label: 'Segera', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { value: 'BIASA', label: 'Biasa', color: 'text-slate-700 bg-slate-50 border-slate-200' },
  { value: 'RAHASIA', label: 'Rahasia', color: 'text-purple-700 bg-purple-50 border-purple-200' },
]

const INSTRUKSI_LIST = [
  { id: 'TINDAKLANJUTI', label: 'Tindaklanjuti sesuai ketentuan' },
  { id: 'TANGGAPI_BALAS', label: 'Tanggapi / siapkan surat balasan' },
  { id: 'HADIRI_WAKILI', label: 'Hadiri / penuhi undangan (delegasi)' },
  { id: 'KOORDINASIKAN', label: 'Koordinasikan dengan pihak terkait' },
  { id: 'PELAJARI_LAPORKAN', label: 'Pelajari, telaah & laporkan hasilnya' },
  { id: 'ARSIPKAN', label: 'Simpan sebagai arsip sekretariat' },
]

export function DisposisiModal({
  open,
  onOpenChange,
  surat,
  onSuccess,
}: DisposisiModalProps) {
  const [nomorAgenda, setNomorAgenda] = useState('')
  const [sifat, setSifat] = useState<'SANGAT_SEGERA' | 'SEGERA' | 'BIASA' | 'RAHASIA'>('BIASA')
  const [tujuanType, setTujuanType] = useState<'DIVISI' | 'USER' | 'CUSTOM'>('DIVISI')

  const [tujuanDivisiId, setTujuanDivisiId] = useState('')
  const [tujuanUserId, setTujuanUserId] = useState('')
  const [tujuanCustom, setTujuanCustom] = useState('')

  const [selectedInstruksi, setSelectedInstruksi] = useState<string[]>([
    'TINDAKLANJUTI',
  ])
  const [catatanPimpinan, setCatatanPimpinan] = useState('')
  const [batasWaktu, setBatasWaktu] = useState('')
  const [pemberiJabatan, setPemberiJabatan] = useState('Ketua Umum')
  const [pemberiNama, setPemberiNama] = useState('')

  // References
  const [divisiList, setDivisiList] = useState<any[]>([])
  const [memberList, setMemberList] = useState<any[]>([])
  const [loadingRefs, setLoadingRefs] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (open && surat) {
      const year = new Date().getFullYear()
      const randNum = Math.floor(100 + Math.random() * 900)
      setNomorAgenda(`AGD/${year}/${randNum}`)
      setSifat('BIASA')
      setTujuanType('DIVISI')
      setTujuanDivisiId('')
      setTujuanUserId('')
      setTujuanCustom('')
      setSelectedInstruksi(['TINDAKLANJUTI'])
      setCatatanPimpinan('')

      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      setBatasWaktu(nextWeek.toISOString().split('T')[0])

      setPemberiJabatan('Ketua Umum')
      setPemberiNama('')
      setErrorMsg('')

      loadRefs()
    }
  }, [open, surat])

  const loadRefs = async () => {
    setLoadingRefs(true)
    try {
      const [divRes, memRes] = await Promise.all([
        fetch('/api/divisi'),
        fetch('/api/anggota?limit=100&isActive=true'),
      ])
      const divData = await divRes.json()
      if (divData.data) setDivisiList(divData.data)

      const memData = await memRes.json()
      if (memData.data) setMemberList(memData.data)
    } catch (err) {
      console.error('Error loading refs for disposisi:', err)
    } finally {
      setLoadingRefs(false)
    }
  }

  const toggleInstruksi = (id: string) => {
    if (selectedInstruksi.includes(id)) {
      setSelectedInstruksi(selectedInstruksi.filter((item) => item !== id))
    } else {
      setSelectedInstruksi([...selectedInstruksi, id])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!surat) return
    setErrorMsg('')

    if (tujuanType === 'DIVISI' && !tujuanDivisiId) {
      setErrorMsg('Pilih divisi pelaksana tujuan disposisi')
      return
    }

    if (tujuanType === 'USER' && !tujuanUserId) {
      setErrorMsg('Pilih anggota penanggung jawab tujuan disposisi')
      return
    }

    if (tujuanType === 'CUSTOM' && !tujuanCustom.trim()) {
      setErrorMsg('Tuliskan nama jabatan / panitia tujuan disposisi')
      return
    }

    if (selectedInstruksi.length === 0) {
      setErrorMsg('Pilih minimal satu petunjuk instruksi disposisi')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/surat/${surat.id}/disposisi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomorAgenda,
          sifat,
          tujuanDivisiId: tujuanType === 'DIVISI' ? tujuanDivisiId : null,
          tujuanUserId: tujuanType === 'USER' ? tujuanUserId : null,
          tujuanCustom: tujuanType === 'CUSTOM' ? tujuanCustom : null,
          instruksi: selectedInstruksi,
          catatanPimpinan: catatanPimpinan.trim() || null,
          batasWaktu: batasWaktu || null,
          pemberiJabatan,
          pemberiNama,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan disposisi')

      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat membuat disposisi')
    } finally {
      setSubmitting(false)
    }
  }

  if (!surat) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <FileText className="w-5 h-5 text-primary" />
            Buat Lembar Disposisi Surat Masuk
          </DialogTitle>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {errorMsg}
          </div>
        )}

        {/* Ringkasan Surat Masuk */}
        <div className="p-3.5 bg-muted/40 rounded-xl border space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-muted-foreground uppercase text-[10px]">
              SURAT MASUK
            </span>
            <span className="font-mono font-medium text-foreground">
              {surat.letterNumber || 'Tanpa Nomor Surat'}
            </span>
          </div>
          <div className="font-bold text-sm text-foreground">
            {surat.subject}
          </div>
          <div className="flex items-center gap-4 text-muted-foreground pt-1 border-t border-border">
            <span>Dari: <strong className="text-foreground">{surat.sender || '-'}</strong></span>
            {surat.receivedDate && (
              <span>Diterima: <strong className="text-foreground">{new Date(surat.receivedDate).toLocaleDateString('id-ID')}</strong></span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nomor Agenda */}
            <div className="space-y-1">
              <Label htmlFor="nomorAgenda">Nomor Agenda Surat</Label>
              <Input
                id="nomorAgenda"
                value={nomorAgenda}
                onChange={(e) => setNomorAgenda(e.target.value)}
                placeholder="AGD/2026/001"
              />
            </div>

            {/* Sifat Disposisi */}
            <div className="space-y-1">
              <Label>Sifat Disposisi</Label>
              <Select
                value={sifat}
                onValueChange={(val) => setSifat(val as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Sifat" />
                </SelectTrigger>
                <SelectContent>
                  {SIFAT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Diteruskan Kepada (Tujuan Disposisi) */}
          <div className="space-y-2">
            <Label>Diteruskan / Disposisi Kepada</Label>
            <Tabs
              value={tujuanType}
              onValueChange={(v) => setTujuanType(v as any)}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="DIVISI" className="gap-1.5 text-xs">
                  <Building className="w-3.5 h-3.5" />
                  Divisi / Bidang
                </TabsTrigger>
                <TabsTrigger value="USER" className="gap-1.5 text-xs">
                  <UserCheck className="w-3.5 h-3.5" />
                  Anggota Spesifik
                </TabsTrigger>
                <TabsTrigger value="CUSTOM" className="gap-1.5 text-xs">
                  <Users className="w-3.5 h-3.5" />
                  Jabatan / Panitia
                </TabsTrigger>
              </TabsList>

              <TabsContent value="DIVISI" className="pt-2">
                <Select
                  value={tujuanDivisiId}
                  onValueChange={setTujuanDivisiId}
                  disabled={loadingRefs}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Divisi Pelaksana..." />
                  </SelectTrigger>
                  <SelectContent>
                    {divisiList.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>

              <TabsContent value="USER" className="pt-2">
                <Select
                  value={tujuanUserId}
                  onValueChange={setTujuanUserId}
                  disabled={loadingRefs}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Anggota..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {memberList.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name || m.fullName} ({m.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>

              <TabsContent value="CUSTOM" className="pt-2">
                <Input
                  placeholder="Contoh: Ketua Panitia Milad / Bendahara Umum / Tim Teknis"
                  value={tujuanCustom}
                  onChange={(e) => setTujuanCustom(e.target.value)}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Checklist Instruksi Disposisi */}
          <div className="space-y-2">
            <Label>Petunjuk / Instruksi Disposisi Pimpinan</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-muted/20 border rounded-xl">
              {INSTRUKSI_LIST.map((ins) => {
                const isSelected = selectedInstruksi.includes(ins.id)
                return (
                  <div
                    key={ins.id}
                    onClick={() => toggleInstruksi(ins.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 text-primary font-semibold'
                        : 'border-border text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <span>{ins.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Catatan Khusus Pimpinan */}
          <div className="space-y-1">
            <Label htmlFor="catatanPimpinan">Catatan / Instruksi Tertulis Pimpinan</Label>
            <Textarea
              id="catatanPimpinan"
              rows={3}
              placeholder="Contoh: Mohon Divisi Humas segera mengutus 2 orang delegasi dan konfirmasi ke pihak pengundang sebelum tanggal 28."
              value={catatanPimpinan}
              onChange={(e) => setCatatanPimpinan(e.target.value)}
            />
          </div>

          {/* Batas Waktu & Pimpinan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="batasWaktu">Target Waktu Penyelesaian</Label>
              <Input
                id="batasWaktu"
                type="date"
                value={batasWaktu}
                onChange={(e) => setBatasWaktu(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="pemberiJabatan">Jabatan Pimpinan</Label>
              <Input
                id="pemberiJabatan"
                value={pemberiJabatan}
                onChange={(e) => setPemberiJabatan(e.target.value)}
                placeholder="Ketua Umum"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="pemberiNama">Nama Pimpinan</Label>
              <Input
                id="pemberiNama"
                value={pemberiNama}
                onChange={(e) => setPemberiNama(e.target.value)}
                placeholder="Nama Ketua / Sekretaris"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menerbitkan Disposisi...
                </>
              ) : (
                'Terbitkan Lembar Disposisi'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

