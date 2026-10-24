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
import { Loader2, ArrowRightLeft, Upload, FileText, UserCheck, Users } from 'lucide-react'
import { InventarisItem } from './barang-dialog'

interface PeminjamanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: InventarisItem | null
  itemList?: InventarisItem[]
  onSuccess: () => void
}

export function PeminjamanDialog({
  open,
  onOpenChange,
  item,
  itemList = [],
  onSuccess,
}: PeminjamanDialogProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>('')
  const [jumlah, setJumlah] = useState<number>(1)
  const [peminjamType, setPeminjamType] = useState<'ANGGOTA' | 'EKSTERNAL'>('ANGGOTA')

  // Data peminjam
  const [userId, setUserId] = useState<string>('')
  const [namaPeminjam, setNamaPeminjam] = useState<string>('')
  const [kontakPeminjam, setKontakPeminjam] = useState<string>('')
  const [instansiPeminjam, setInstansiPeminjam] = useState<string>('')
  const [nomorIdentitas, setNomorIdentitas] = useState<string>('')

  // Keperluan & Tanggal
  const [keperluan, setKeperluan] = useState<string>('')
  const [programKerjaId, setProgramKerjaId] = useState<string>('')
  const [tanggalPinjam, setTanggalPinjam] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [rencanaKembali, setRencanaKembali] = useState<string>('')

  // File
  const [buktiFotoPinjam, setBuktiFotoPinjam] = useState<string>('')
  const [uploadingBukti, setUploadingBukti] = useState<boolean>(false)

  // External reference data
  const [members, setMembers] = useState<any[]>([])
  const [prokers, setProkers] = useState<any[]>([])
  const [loadingRefs, setLoadingRefs] = useState<boolean>(false)

  const [submitting, setSubmitting] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string>('')

  // Resolve current active item
  const currentItem = item || itemList.find((b) => b.id === selectedItemId)
  const maxAvailable = currentItem ? currentItem.jumlahTersedia : 1

  useEffect(() => {
    if (open) {
      if (item) {
        setSelectedItemId(item.id)
      } else if (itemList.length > 0 && !selectedItemId) {
        const availableOne = itemList.find((b) => b.jumlahTersedia > 0)
        if (availableOne) setSelectedItemId(availableOne.id)
      }

      setJumlah(1)
      setPeminjamType('ANGGOTA')
      setUserId('')
      setNamaPeminjam('')
      setKontakPeminjam('')
      setInstansiPeminjam('')
      setNomorIdentitas('')
      setKeperluan('')
      setProgramKerjaId('')
      setTanggalPinjam(new Date().toISOString().split('T')[0])

      // Default rencana kembali = 3 hari dari sekarang
      const threeDaysLater = new Date()
      threeDaysLater.setDate(threeDaysLater.getDate() + 3)
      setRencanaKembali(threeDaysLater.toISOString().split('T')[0])

      setBuktiFotoPinjam('')
      setErrorMsg('')

      // Fetch anggota & proker
      loadReferences()
    }
  }, [open, item, itemList])

  const loadReferences = async () => {
    setLoadingRefs(true)
    try {
      const [membersRes, prokerRes] = await Promise.all([
        fetch('/api/anggota?limit=100&isActive=true'),
        fetch('/api/proker?limit=50'),
      ])

      const membersData = await membersRes.json()
      if (membersData.data) {
        setMembers(membersData.data)
      }

      const prokerData = await prokerRes.json()
      if (prokerData.data) {
        setProkers(prokerData.data)
      }
    } catch (err) {
      console.error('Error fetching members/prokers:', err)
    } finally {
      setLoadingRefs(false)
    }
  }

  const handleSelectMember = (selectedUserId: string) => {
    setUserId(selectedUserId)
    const found = members.find((m) => m.id === selectedUserId)
    if (found) {
      setNamaPeminjam(found.name || found.fullName || '')
      setKontakPeminjam(found.phone || '')
      setInstansiPeminjam(
        found.divisiMembers?.[0]?.divisi?.name || 'Internal Pengurus'
      )
      setNomorIdentitas(found.nra || '')
    }
  }

  const handleUploadBukti = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingBukti(true)
    setErrorMsg('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'peminjaman')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mengunggah berkas/foto')

      setBuktiFotoPinjam(data.url)
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal upload berkas')
    } finally {
      setUploadingBukti(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!currentItem) {
      setErrorMsg('Pilih barang inventaris yang ingin dipinjam')
      return
    }

    if (currentItem.jumlahTersedia <= 0) {
      setErrorMsg('Barang ini saat ini sedang tidak tersedia di gudang inventaris')
      return
    }

    if (jumlah > currentItem.jumlahTersedia) {
      setErrorMsg(
        `Jumlah melebihi stok yang tersedia (${currentItem.jumlahTersedia} ${currentItem.satuan})`
      )
      return
    }

    if (!namaPeminjam.trim()) {
      setErrorMsg('Nama peminjam wajib diisi')
      return
    }

    if (!kontakPeminjam.trim()) {
      setErrorMsg('Nomor kontak WhatsApp/telepon peminjam wajib diisi')
      return
    }

    if (!rencanaKembali) {
      setErrorMsg('Rencana tanggal pengembalian wajib ditentukan')
      return
    }

    if (!keperluan.trim()) {
      setErrorMsg('Keperluan peminjaman barang wajib dijelaskan')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/inventaris/peminjaman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barangId: currentItem.id,
          jumlah,
          peminjamType,
          userId: peminjamType === 'ANGGOTA' ? userId || null : null,
          namaPeminjam,
          kontakPeminjam,
          instansiPeminjam,
          nomorIdentitas,
          keperluan,
          programKerjaId: programKerjaId || null,
          tanggalPinjam,
          rencanaKembali,
          buktiFotoPinjam: buktiFotoPinjam || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mencatat peminjaman')

      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses peminjaman')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <ArrowRightLeft className="w-5 h-5 text-primary" />
            Catat Formulir Peminjaman Barang
          </DialogTitle>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pilih Barang & Kuantitas */}
          <div className="p-3.5 bg-muted/40 rounded-lg border space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 space-y-1">
                <Label htmlFor="barangSelector">Barang Inventaris</Label>
                {item ? (
                  <div className="p-2 bg-background border rounded-md">
                    <div className="font-semibold text-sm">{item.namaBarang}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {item.kodeBarang} - {item.lokasiPenyimpanan}
                    </div>
                  </div>
                ) : (
                  <Select
                    value={selectedItemId}
                    onValueChange={(val) => {
                      setSelectedItemId(val)
                      setJumlah(1)
                    }}
                  >
                    <SelectTrigger id="barangSelector">
                      <SelectValue placeholder="Pilih Barang Inventaris..." />
                    </SelectTrigger>
                    <SelectContent>
                      {itemList.map((b) => (
                        <SelectItem
                          key={b.id}
                          value={b.id}
                          disabled={b.jumlahTersedia <= 0}
                        >
                          {b.namaBarang} ({b.kodeBarang}) - Tersedia: {b.jumlahTersedia} {b.satuan}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="jumlah">
                  Jumlah Pinjam ({currentItem?.satuan || 'Unit'})
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="jumlah"
                    type="number"
                    min="1"
                    max={maxAvailable}
                    value={jumlah}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1
                      setJumlah(Math.min(maxAvailable, Math.max(1, val)))
                    }}
                    required
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    / Maks {maxAvailable}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tipe Peminjam */}
          <div className="space-y-2">
            <Label>Kategori Peminjam</Label>
            <Tabs
              value={peminjamType}
              onValueChange={(v) => setPeminjamType(v as 'ANGGOTA' | 'EKSTERNAL')}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ANGGOTA" className="gap-2">
                  <UserCheck className="w-4 h-4" />
                  Anggota / Pengurus Internal
                </TabsTrigger>
                <TabsTrigger value="EKSTERNAL" className="gap-2">
                  <Users className="w-4 h-4" />
                  Pihak Luar / Eksternal
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ANGGOTA" className="pt-2 space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="memberSelect">Pilih Anggota</Label>
                  <Select
                    value={userId}
                    onValueChange={handleSelectMember}
                    disabled={loadingRefs}
                  >
                    <SelectTrigger id="memberSelect">
                      <SelectValue
                        placeholder={
                          loadingRefs ? 'Memuat data anggota...' : 'Cari nama anggota...'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name || m.fullName} ({m.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="EKSTERNAL" className="pt-2">
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  Peminjam dari pihak luar organisasi (UKM lain, lembaga kampus, sponsor,
                  atau perorangan).
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Data Identitas Peminjam */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="namaPeminjam">
                Nama Penanggung Jawab <span className="text-red-500">*</span>
              </Label>
              <Input
                id="namaPeminjam"
                placeholder="Nama lengkap peminjam"
                value={namaPeminjam}
                onChange={(e) => setNamaPeminjam(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="kontakPeminjam">
                Nomor WhatsApp / Telp <span className="text-red-500">*</span>
              </Label>
              <Input
                id="kontakPeminjam"
                placeholder="Contoh: 081234567890"
                value={kontakPeminjam}
                onChange={(e) => setKontakPeminjam(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="instansiPeminjam">Asal Divisi / Instansi / Lembaga</Label>
              <Input
                id="instansiPeminjam"
                placeholder="Contoh: Divisi Humas / BEM Fakultas / Komunitas X"
                value={instansiPeminjam}
                onChange={(e) => setInstansiPeminjam(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="nomorIdentitas">Nomor Identitas (NRA / NIM / NIK)</Label>
              <Input
                id="nomorIdentitas"
                placeholder="Contoh: 21081010023 / NRA-2024-001"
                value={nomorIdentitas}
                onChange={(e) => setNomorIdentitas(e.target.value)}
              />
            </div>
          </div>

          {/* Jadwal Pinjam & Program Kerja */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="tanggalPinjam">Tanggal Pengambilan / Pinjam</Label>
              <Input
                id="tanggalPinjam"
                type="date"
                value={tanggalPinjam}
                onChange={(e) => setTanggalPinjam(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="rencanaKembali">
                Rencana Tanggal Pengembalian <span className="text-red-500">*</span>
              </Label>
              <Input
                id="rencanaKembali"
                type="date"
                min={tanggalPinjam}
                value={rencanaKembali}
                onChange={(e) => setRencanaKembali(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="prokerSelect">
                Terkait Program Kerja Tertentu{' '}
                <span className="text-xs text-muted-foreground font-normal">
                  (Opsional, jika dipakai untuk kepanitiaan)
                </span>
              </Label>
              <Select
                value={programKerjaId}
                onValueChange={(val) => setProgramKerjaId(val === 'NONE' ? '' : val)}
              >
                <SelectTrigger id="prokerSelect">
                  <SelectValue placeholder="Bukan untuk kegiatan proker spesifik" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Bukan untuk proker spesifik</SelectItem>
                  {prokers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="keperluan">
                Keperluan / Agenda Peminjaman <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="keperluan"
                rows={2}
                placeholder="Contoh: Digunakan untuk presentasi rapat kerja divisi di Aula Gd. 3"
                value={keperluan}
                onChange={(e) => setKeperluan(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label>Bukti Surat Permohonan / Foto Serah Terima Fisik (Opsional)</Label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer">
                  <div className="inline-flex items-center gap-2 px-3 py-2 border rounded-md text-sm hover:bg-muted font-medium transition-colors">
                    {uploadingBukti ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>Unggah Berkas/Foto</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleUploadBukti}
                    disabled={uploadingBukti}
                  />
                </label>
                {buktiFotoPinjam && (
                  <span className="text-xs text-emerald-600 font-medium">
                    Berkas berhasil diunggah.
                  </span>
                )}
              </div>
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
                  Mencatat Transaksi...
                </>
              ) : (
                'Catat Peminjaman'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

