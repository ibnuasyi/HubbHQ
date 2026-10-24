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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2, Clock, Loader2, ArrowRightLeft } from 'lucide-react'
import { DisposisiData } from './disposisi-modal'

interface TindakLanjutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  disposisi: DisposisiData | null
  onSuccess: () => void
}

export function TindakLanjutDialog({
  open,
  onOpenChange,
  disposisi,
  onSuccess,
}: TindakLanjutDialogProps) {
  const [status, setStatus] = useState<'BELUM_DIPROSES' | 'SEDANG_DIPROSES' | 'SELESAI'>(
    'SEDANG_DIPROSES'
  )
  const [catatanTindakLanjut, setCatatanTindakLanjut] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (open && disposisi) {
      setStatus(disposisi.status || 'SEDANG_DIPROSES')
      setCatatanTindakLanjut(disposisi.catatanTindakLanjut || '')
      setErrorMsg('')
    }
  }, [open, disposisi])

  if (!disposisi) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!disposisi.id) return
    setErrorMsg('')
    setSubmitting(true)

    try {
      const res = await fetch(`/api/surat/disposisi/${disposisi.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          catatanTindakLanjut,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal memperbarui status')

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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Laporan Tindak Lanjut Disposisi
          </DialogTitle>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {errorMsg}
          </div>
        )}

        <div className="p-3 bg-muted/40 rounded-xl border text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-muted-foreground uppercase text-[10px]">
              Tujuan Disposisi:
            </span>
            <span className="font-bold text-foreground">
              {disposisi.tujuanDivisi?.name ||
                disposisi.tujuanUser?.name ||
                disposisi.tujuanCustom ||
                'Internal'}
            </span>
          </div>
          {disposisi.catatanPimpinan && (
            <div className="pt-1 border-t text-muted-foreground">
              <span className="font-medium text-foreground">Instruksi Pimpinan: </span>
              {disposisi.catatanPimpinan}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Status Pelaksanaan Tindak Lanjut</Label>
            <Select
              value={status}
              onValueChange={(val) => setStatus(val as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BELUM_DIPROSES">Belum Diproses</SelectItem>
                <SelectItem value="SEDANG_DIPROSES">Sedang Berjalan / Dikerjakan</SelectItem>
                <SelectItem value="SELESAI">Selesai Ditindaklanjuti</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="catatanTindakLanjut">
              Laporan Hasil Tindak Lanjut / Catatan Pelaksana
            </Label>
            <Textarea
              id="catatanTindakLanjut"
              rows={3}
              placeholder="Contoh: Telah berkoordinasi dengan pihak pengundang dan mengirimkan 2 perwakilan (Ahmad & Siti) untuk menghadiri acara."
              value={catatanTindakLanjut}
              onChange={(e) => setCatatanTindakLanjut(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="pt-2 border-t">
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
                'Simpan Laporan'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

