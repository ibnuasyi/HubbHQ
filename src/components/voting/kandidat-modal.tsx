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
import { Loader2, UserCheck, Upload, Image as ImageIcon } from 'lucide-react'

export interface KandidatItem {
  id?: string
  nomorUrut: number
  namaKetua: string
  namaWakil?: string | null
  fotoUrl?: string | null
  visi?: string | null
  misi?: string | null
  programUnggulan?: string | null
  suaraSah?: number
}

interface KandidatModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  votingEventId: string
  kandidat?: KandidatItem | null
  onSuccess: () => void
}

export function KandidatModal({
  open,
  onOpenChange,
  votingEventId,
  kandidat,
  onSuccess,
}: KandidatModalProps) {
  const isEdit = !!kandidat

  const [nomorUrut, setNomorUrut] = useState<string>('1')
  const [namaKetua, setNamaKetua] = useState<string>('')
  const [namaWakil, setNamaWakil] = useState<string>('')
  const [fotoUrl, setFotoUrl] = useState<string>('')
  const [visi, setVisi] = useState<string>('')
  const [misi, setMisi] = useState<string>('')
  const [programUnggulan, setProgramUnggulan] = useState<string>('')

  const [uploadingFoto, setUploadingFoto] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string>('')

  useEffect(() => {
    if (kandidat) {
      setNomorUrut(kandidat.nomorUrut.toString())
      setNamaKetua(kandidat.namaKetua)
      setNamaWakil(kandidat.namaWakil || '')
      setFotoUrl(kandidat.fotoUrl || '')
      setVisi(kandidat.visi || '')
      setMisi(kandidat.misi || '')
      setProgramUnggulan(kandidat.programUnggulan || '')
    } else {
      setNomorUrut('1')
      setNamaKetua('')
      setNamaWakil('')
      setFotoUrl('')
      setVisi('')
      setMisi('')
      setProgramUnggulan('')
    }
    setErrorMsg('')
  }, [kandidat, open])

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFoto(true)
    setErrorMsg('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'voting-kandidat')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mengunggah foto paslon')

      setFotoUrl(data.url)
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal upload foto')
    } finally {
      setUploadingFoto(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!namaKetua.trim()) {
      setErrorMsg('Nama calon ketua wajib diisi')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/voting/${votingEventId}/kandidat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomorUrut: parseInt(nomorUrut) || 1,
          namaKetua: namaKetua.trim(),
          namaWakil: namaWakil.trim() || null,
          fotoUrl: fotoUrl.trim() || null,
          visi: visi.trim() || null,
          misi: misi.trim() || null,
          programUnggulan: programUnggulan.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan data kandidat')

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <UserCheck className="w-5 h-5 text-primary" />
            {isEdit ? 'Ubah Data Paslon' : 'Tambah Pasangan Calon / Kandidat'}
          </DialogTitle>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="nomorUrut">
                Nomor Urut <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nomorUrut"
                type="number"
                min="1"
                value={nomorUrut}
                onChange={(e) => setNomorUrut(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="namaKetua">
                Nama Calon Ketua <span className="text-red-500">*</span>
              </Label>
              <Input
                id="namaKetua"
                placeholder="Nama lengkap calon ketua"
                value={namaKetua}
                onChange={(e) => setNamaKetua(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1 md:col-span-3">
              <Label htmlFor="namaWakil">Nama Calon Wakil Ketua (Opsional)</Label>
              <Input
                id="namaWakil"
                placeholder="Nama lengkap calon wakil (kosongkan jika pemilihan tunggal)"
                value={namaWakil}
                onChange={(e) => setNamaWakil(e.target.value)}
              />
            </div>

            {/* Foto Paslon */}
            <div className="space-y-1 md:col-span-3">
              <Label>Foto Pasangan Calon / Kandidat</Label>
              <div className="flex items-center gap-4">
                {fotoUrl ? (
                  <div className="relative w-24 h-28 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
                    <img
                      src={fotoUrl}
                      alt="Foto Paslon"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-28 rounded-lg border border-dashed border-border bg-muted/40 flex flex-col items-center justify-center text-muted-foreground text-xs text-center p-2">
                    <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                    <span>Belum ada foto</span>
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
                      <span>Unggah Foto Paslon</span>
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
                    Disarankan foto rasio potret (3:4) dengan latar belakang formal.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1 md:col-span-3">
              <Label htmlFor="visi">Visi Kepemimpinan</Label>
              <Textarea
                id="visi"
                rows={2}
                placeholder="Visi utama kandidat..."
                value={visi}
                onChange={(e) => setVisi(e.target.value)}
              />
            </div>

            <div className="space-y-1 md:col-span-3">
              <Label htmlFor="misi">Misi & Rencana Strategis</Label>
              <Textarea
                id="misi"
                rows={3}
                placeholder="1. Meningkatkan solidaritas anggota&#10;2. Menjalin sinergi eksternal..."
                value={misi}
                onChange={(e) => setMisi(e.target.value)}
              />
            </div>

            <div className="space-y-1 md:col-span-3">
              <Label htmlFor="programUnggulan">Program Kerja Unggulan / Quick Wins</Label>
              <Textarea
                id="programUnggulan"
                rows={2}
                placeholder="Inovasi utama yang ditawarkan..."
                value={programUnggulan}
                onChange={(e) => setProgramUnggulan(e.target.value)}
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
                  Menyimpan...
                </>
              ) : (
                'Simpan Data Kandidat'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

