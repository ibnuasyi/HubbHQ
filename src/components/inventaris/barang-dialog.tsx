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
import { Loader2, Upload, Package, Image as ImageIcon } from 'lucide-react'

export interface InventarisItem {
  id: string
  kodeBarang: string
  namaBarang: string
  kategori: string
  merkModel?: string | null
  serialNumber?: string | null
  jumlahTotal: number
  jumlahTersedia: number
  jumlahDipinjam: number
  jumlahRusak: number
  satuan: string
  kondisi: 'BAIK' | 'PERLU_PERBAIKAN' | 'RUSAK_BERAT' | 'HILANG'
  lokasiPenyimpanan: string
  asalPengadaan?: string | null
  tanggalPengadaan?: string | null
  hargaBeli?: number | null
  fotoBarang?: string | null
  catatan?: string | null
  divisiId?: string | null
}

interface BarangDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: InventarisItem | null
  onSuccess: () => void
}

const KATEGORI_OPTIONS = [
  'Elektronik & Multimedia',
  'Perlengkapan Lapangan & Logistik',
  'ATK & Kesekretariatan',
  'Dokumentasi & Media',
  'Properti & Perlengkapan Acara',
  'Fasilitas & Ruangan',
  'Aset Umum Lainnya',
]

const SATUAN_OPTIONS = ['Unit', 'Buah', 'Pcs', 'Set', 'Roll', 'Box', 'Paket', 'Lembar']

export function BarangDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: BarangDialogProps) {
  const isEdit = !!item

  const [formData, setFormData] = useState({
    namaBarang: '',
    kodeBarang: '',
    kategori: KATEGORI_OPTIONS[0],
    merkModel: '',
    serialNumber: '',
    jumlahTotal: '1',
    satuan: 'Unit',
    kondisi: 'BAIK',
    lokasiPenyimpanan: '',
    asalPengadaan: '',
    tanggalPengadaan: new Date().toISOString().split('T')[0],
    hargaBeli: '',
    fotoBarang: '',
    catatan: '',
  })

  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (item) {
      setFormData({
        namaBarang: item.namaBarang || '',
        kodeBarang: item.kodeBarang || '',
        kategori: item.kategori || KATEGORI_OPTIONS[0],
        merkModel: item.merkModel || '',
        serialNumber: item.serialNumber || '',
        jumlahTotal: item.jumlahTotal.toString(),
        satuan: item.satuan || 'Unit',
        kondisi: item.kondisi || 'BAIK',
        lokasiPenyimpanan: item.lokasiPenyimpanan || '',
        asalPengadaan: item.asalPengadaan || '',
        tanggalPengadaan: item.tanggalPengadaan
          ? new Date(item.tanggalPengadaan).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        hargaBeli: item.hargaBeli ? item.hargaBeli.toString() : '',
        fotoBarang: item.fotoBarang || '',
        catatan: item.catatan || '',
      })
    } else {
      setFormData({
        namaBarang: '',
        kodeBarang: '',
        kategori: KATEGORI_OPTIONS[0],
        merkModel: '',
        serialNumber: '',
        jumlahTotal: '1',
        satuan: 'Unit',
        kondisi: 'BAIK',
        lokasiPenyimpanan: '',
        asalPengadaan: '',
        tanggalPengadaan: new Date().toISOString().split('T')[0],
        hargaBeli: '',
        fotoBarang: '',
        catatan: '',
      })
    }
    setErrorMsg('')
  }, [item, open])

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFoto(true)
    setErrorMsg('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'inventaris')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mengunggah foto barang')

      setFormData((prev) => ({ ...prev, fotoBarang: data.url }))
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal upload foto')
    } finally {
      setUploadingFoto(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!formData.namaBarang.trim()) {
      setErrorMsg('Nama barang inventaris wajib diisi')
      return
    }

    if (!formData.lokasiPenyimpanan.trim()) {
      setErrorMsg('Lokasi penyimpanan barang di sekretariat wajib diisi')
      return
    }

    setSubmitting(true)
    try {
      const url = isEdit ? `/api/inventaris/${item.id}` : '/api/inventaris'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          jumlahTotal: parseInt(formData.jumlahTotal) || 1,
          hargaBeli: formData.hargaBeli ? parseFloat(formData.hargaBeli) : null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan')

      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan barang inventaris')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Package className="w-5 h-5 text-primary" />
            {isEdit ? 'Ubah Data Barang Inventaris' : 'Tambah Barang Inventaris Baru'}
          </DialogTitle>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="namaBarang">
                Nama Barang <span className="text-red-500">*</span>
              </Label>
              <Input
                id="namaBarang"
                placeholder="Contoh: Proyektor Epson EB-X400, Sound Wireless, Tenda Dome"
                value={formData.namaBarang}
                onChange={(e) =>
                  setFormData({ ...formData, namaBarang: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="kategori">Kategori</Label>
              <Select
                value={formData.kategori}
                onValueChange={(val) => setFormData({ ...formData, kategori: val })}
              >
                <SelectTrigger id="kategori">
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent>
                  {KATEGORI_OPTIONS.map((kat) => (
                    <SelectItem key={kat} value={kat}>
                      {kat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="kodeBarang">
                Kode Barang / Barcode{' '}
                <span className="text-xs text-muted-foreground font-normal">
                  (Kosongkan untuk otomatis)
                </span>
              </Label>
              <Input
                id="kodeBarang"
                placeholder="INV-ELC-2026-0001"
                value={formData.kodeBarang}
                onChange={(e) =>
                  setFormData({ ...formData, kodeBarang: e.target.value.toUpperCase() })
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="merkModel">Merk / Tipe / Model</Label>
              <Input
                id="merkModel"
                placeholder="Contoh: Sony Alpha 7 IV / Krisbow 50M"
                value={formData.merkModel}
                onChange={(e) =>
                  setFormData({ ...formData, merkModel: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="serialNumber">Nomor Seri Pabrik (S/N)</Label>
              <Input
                id="serialNumber"
                placeholder="Contoh: SN-84920492"
                value={formData.serialNumber}
                onChange={(e) =>
                  setFormData({ ...formData, serialNumber: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="jumlahTotal">
                Jumlah Total <span className="text-red-500">*</span>
              </Label>
              <Input
                id="jumlahTotal"
                type="number"
                min="1"
                value={formData.jumlahTotal}
                onChange={(e) =>
                  setFormData({ ...formData, jumlahTotal: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="satuan">Satuan</Label>
              <Select
                value={formData.satuan}
                onValueChange={(val) => setFormData({ ...formData, satuan: val })}
              >
                <SelectTrigger id="satuan">
                  <SelectValue placeholder="Pilih Satuan" />
                </SelectTrigger>
                <SelectContent>
                  {SATUAN_OPTIONS.map((sat) => (
                    <SelectItem key={sat} value={sat}>
                      {sat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="kondisi">Kondisi Barang Saat Ini</Label>
              <Select
                value={formData.kondisi}
                onValueChange={(val) => setFormData({ ...formData, kondisi: val })}
              >
                <SelectTrigger id="kondisi">
                  <SelectValue placeholder="Pilih Kondisi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAIK">Baik & Siap Pakai</SelectItem>
                  <SelectItem value="PERLU_PERBAIKAN">Perlu Perbaikan</SelectItem>
                  <SelectItem value="RUSAK_BERAT">Rusak Berat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="lokasiPenyimpanan">
                Lokasi Penyimpanan di Sekretariat <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lokasiPenyimpanan"
                placeholder="Contoh: Lemari Kaca A, Gudang Belakang, Rak 2"
                value={formData.lokasiPenyimpanan}
                onChange={(e) =>
                  setFormData({ ...formData, lokasiPenyimpanan: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="asalPengadaan">Asal Pengadaan / Sumber Aset</Label>
              <Input
                id="asalPengadaan"
                placeholder="Contoh: Anggaran Kas 2024, Hibah Alumni 2023"
                value={formData.asalPengadaan}
                onChange={(e) =>
                  setFormData({ ...formData, asalPengadaan: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="tanggalPengadaan">Tanggal Pengadaan</Label>
              <Input
                id="tanggalPengadaan"
                type="date"
                value={formData.tanggalPengadaan}
                onChange={(e) =>
                  setFormData({ ...formData, tanggalPengadaan: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="hargaBeli">Estimasi Harga Beli / Unit (Rp)</Label>
              <Input
                id="hargaBeli"
                type="number"
                placeholder="Contoh: 4500000"
                value={formData.hargaBeli}
                onChange={(e) =>
                  setFormData({ ...formData, hargaBeli: e.target.value })
                }
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label>Foto Fisik Barang</Label>
              <div className="flex items-center gap-4">
                {formData.fotoBarang ? (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
                    <img
                      src={formData.fotoBarang}
                      alt="Barang"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg border border-dashed border-border bg-muted/40 flex flex-col items-center justify-center text-muted-foreground text-xs">
                    <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                    <span>Belum ada</span>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="cursor-pointer">
                    <div className="inline-flex items-center gap-2 px-3 py-2 border rounded-md text-sm hover:bg-muted font-medium transition-colors">
                      {uploadingFoto ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>Unggah Foto</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadFoto}
                      disabled={uploadingFoto}
                    />
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Format PNG, JPG, atau WEBP maks 5MB.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="catatan">Catatan / Kelengkapan Aksesoris</Label>
              <Textarea
                id="catatan"
                rows={2}
                placeholder="Contoh: Termasuk tas, kabel HDMI 5M, kabel power, remote control."
                value={formData.catatan}
                onChange={(e) =>
                  setFormData({ ...formData, catatan: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
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
                  Menyimpan...
                </>
              ) : isEdit ? (
                'Perbarui Barang'
              ) : (
                'Simpan ke Inventaris'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

