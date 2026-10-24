'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Upload,
  Calendar,
} from 'lucide-react'

export interface PeminjamanRecord {
  id: string
  kodePeminjaman: string
  barangId: string
  barang: {
    id: string
    kodeBarang: string
    namaBarang: string
    kategori: string
    satuan: string
    lokasiPenyimpanan: string
  }
  jumlah: number
  peminjamType: string
  namaPeminjam: string
  kontakPeminjam: string
  instansiPeminjam?: string | null
  keperluan: string
  tanggalPinjam: string
  rencanaKembali: string
  tanggalKembali?: string | null
  status: 'DIPINJAM' | 'DIKEMBALIKAN' | 'TERLAMBAT' | 'HILANG_RUSAK'
  kondisiPinjam: string
  kondisiKembali?: string | null
  catatanKembali?: string | null
  buktiFotoKembali?: string | null
}

interface PengembalianDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  peminjaman: PeminjamanRecord | null
  onSuccess: () => void
}

export function PengembalianDialog({
  open,
  onOpenChange,
  peminjaman,
  onSuccess,
}: PengembalianDialogProps) {
  const [kondisiKembali, setKondisiKembali] = useState<
    'BAIK' | 'PERLU_PERBAIKAN' | 'RUSAK_BERAT' | 'HILANG'
  >('BAIK')
  const [tanggalKembali, setTanggalKembali] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [catatanKembali, setCatatanKembali] = useState<string>('')
  const [buktiFotoKembali, setBuktiFotoKembali] = useState<string>('')
  const [uploadingFoto, setUploadingFoto] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string>('')

  if (!peminjaman) return null

  const isOverdue =
    peminjaman.status === 'TERLAMBAT' ||
    new Date(peminjaman.rencanaKembali) < new Date()

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFoto(true)
    setErrorMsg('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'pengembalian')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mengunggah foto bukti')

      setBuktiFotoKembali(data.url)
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal upload foto')
    } finally {
      setUploadingFoto(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSubmitting(true)

    try {
      const res = await fetch(
        `/api/inventaris/peminjaman/${peminjaman.id}/kembali`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kondisiKembali,
            tanggalKembali,
            catatanKembali: catatanKembali.trim() || null,
            buktiFotoKembali: buktiFotoKembali || null,
          }),
        }
      )

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal memproses pengembalian')

      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Proses Pengembalian Barang
          </DialogTitle>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {errorMsg}
          </div>
        )}

        {/* Ringkasan Transaksi */}
        <div className="p-3.5 bg-muted/40 rounded-lg border text-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-xs text-muted-foreground">
              {peminjaman.kodePeminjaman}
            </span>
            {isOverdue ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                <AlertTriangle className="w-3 h-3" />
                Terlambat Dikembalikan
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">
                Masa Pinjam Aktif
              </span>
            )}
          </div>

          <div className="font-semibold text-base text-foreground">
            {peminjaman.barang.namaBarang} ({peminjaman.jumlah} {peminjaman.barang.satuan})
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1 border-t border-border">
            <div>
              <span className="font-medium text-foreground">Peminjam: </span>
              {peminjaman.namaPeminjam} ({peminjaman.instansiPeminjam || 'Internal'})
            </div>
            <div>
              <span className="font-medium text-foreground">Kontak: </span>
              {peminjaman.kontakPeminjam}
            </div>
            <div>
              <span className="font-medium text-foreground">Tgl Pinjam: </span>
              {new Date(peminjaman.tanggalPinjam).toLocaleDateString('id-ID')}
            </div>
            <div>
              <span className="font-medium text-foreground">Batas Kembali: </span>
              {new Date(peminjaman.rencanaKembali).toLocaleDateString('id-ID')}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tanggal Kembali */}
          <div className="space-y-1">
            <Label htmlFor="tglKembali">Tanggal Fisik Barang Diterima Kembali</Label>
            <Input
              id="tglKembali"
              type="date"
              value={tanggalKembali}
              onChange={(e) => setTanggalKembali(e.target.value)}
              required
            />
          </div>

          {/* Pilihan Kondisi Barang */}
          <div className="space-y-2">
            <Label>Kondisi Fisik & Fungsi Barang Saat Kembali</Label>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  kondisiKembali === 'BAIK'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-500'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <input
                  type="radio"
                  name="kondisi"
                  value="BAIK"
                  checked={kondisiKembali === 'BAIK'}
                  onChange={() => setKondisiKembali('BAIK')}
                  className="mt-1"
                />
                <div>
                  <div className="font-semibold text-xs text-emerald-700 dark:text-emerald-400">
                    Baik & Lengkap
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Barang utuh, berfungsi normal, stok otomatis kembali tersedia.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  kondisiKembali === 'PERLU_PERBAIKAN'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-500'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <input
                  type="radio"
                  name="kondisi"
                  value="PERLU_PERBAIKAN"
                  checked={kondisiKembali === 'PERLU_PERBAIKAN'}
                  onChange={() => setKondisiKembali('PERLU_PERBAIKAN')}
                  className="mt-1"
                />
                <div>
                  <div className="font-semibold text-xs text-amber-700 dark:text-amber-400">
                    Perlu Perbaikan
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Kerusakan ringan/kendala fungsi, dipindahkan ke kuota perbaikan.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  kondisiKembali === 'RUSAK_BERAT'
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 ring-1 ring-rose-500'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <input
                  type="radio"
                  name="kondisi"
                  value="RUSAK_BERAT"
                  checked={kondisiKembali === 'RUSAK_BERAT'}
                  onChange={() => setKondisiKembali('RUSAK_BERAT')}
                  className="mt-1"
                />
                <div>
                  <div className="font-semibold text-xs text-rose-700 dark:text-rose-400">
                    Rusak Berat
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Barang tidak dapat beroperasi sama sekali.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  kondisiKembali === 'HILANG'
                    ? 'border-red-600 bg-red-50/50 dark:bg-red-950/20 ring-1 ring-red-600'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <input
                  type="radio"
                  name="kondisi"
                  value="HILANG"
                  checked={kondisiKembali === 'HILANG'}
                  onChange={() => setKondisiKembali('HILANG')}
                  className="mt-1"
                />
                <div>
                  <div className="font-semibold text-xs text-red-700 dark:text-red-400">
                    Barang Hilang
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Total stok aset dikurangi, peminjam wajib menindaklanjuti.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Catatan */}
          <div className="space-y-1">
            <Label htmlFor="catatanKembali">Catatan Serah Terima Kembali</Label>
            <Textarea
              id="catatanKembali"
              rows={2}
              placeholder="Contoh: Kabel power dan remote lengkap, bodi bersih tanpa goresan baru."
              value={catatanKembali}
              onChange={(e) => setCatatanKembali(e.target.value)}
            />
          </div>

          {/* Bukti Foto */}
          <div className="space-y-1">
            <Label>Foto Bukti Kondisi Fisik Saat Pengembalian (Opsional)</Label>
            <div className="flex items-center gap-3">
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
              {buktiFotoKembali && (
                <span className="text-xs text-emerald-600 font-medium">
                  Foto berhasil diunggah.
                </span>
              )}
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
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Konfirmasi Pengembalian'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

