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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, UserPlus, Building2, Loader2, CheckCircle2 } from 'lucide-react'

interface DptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  votingEventId: string
  onSuccess: () => void
}

export function DptModal({
  open,
  onOpenChange,
  votingEventId,
  onSuccess,
}: DptModalProps) {
  const [activeTab, setActiveTab] = useState<'ALL' | 'DIVISI' | 'MANUAL'>('ALL')
  const [divisiList, setDivisiList] = useState<any[]>([])
  const [selectedDivisiId, setSelectedDivisiId] = useState<string>('')

  // Manual fields
  const [nama, setNama] = useState<string>('')
  const [nraOrNim, setNraOrNim] = useState<string>('')
  const [emailOrPhone, setEmailOrPhone] = useState<string>('')

  const [loadingDivisi, setLoadingDivisi] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string>('')

  useEffect(() => {
    if (open) {
      setErrorMsg('')
      setNama('')
      setNraOrNim('')
      setEmailOrPhone('')
      loadDivisi()
    }
  }, [open])

  const loadDivisi = async () => {
    setLoadingDivisi(true)
    try {
      const res = await fetch('/api/divisi')
      const json = await res.json()
      if (json.data) setDivisiList(json.data)
    } catch (err) {
      console.error('Error fetching divisi:', err)
    } finally {
      setLoadingDivisi(false)
    }
  }

  const handleImportAll = async () => {
    setSubmitting(true)
    setErrorMsg('')
    try {
      const res = await fetch(`/api/voting/${votingEventId}/dpt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'IMPORT_ALL_ACTIVE' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal mengimpor anggota')

      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleImportDivisi = async () => {
    if (!selectedDivisiId) {
      setErrorMsg('Pilih divisi yang ingin diimpor anggotanya')
      return
    }

    setSubmitting(true)
    setErrorMsg('')
    try {
      const res = await fetch(`/api/voting/${votingEventId}/dpt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'IMPORT_BY_DIVISI',
          divisiId: selectedDivisiId,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal mengimpor anggota divisi')

      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nama.trim()) {
      setErrorMsg('Nama pemilih wajib diisi')
      return
    }

    setSubmitting(true)
    setErrorMsg('')
    try {
      const res = await fetch(`/api/voting/${votingEventId}/dpt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: nama.trim(),
          nraOrNim: nraOrNim.trim() || null,
          emailOrPhone: emailOrPhone.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menambahkan pemilih')

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
            <Users className="w-5 h-5 text-primary" />
            Tetapkan Daftar Pemilih Tetap (DPT)
          </DialogTitle>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {errorMsg}
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ALL" className="gap-1.5 text-xs">
              <Users className="w-3.5 h-3.5" />
              Semua Anggota
            </TabsTrigger>
            <TabsTrigger value="DIVISI" className="gap-1.5 text-xs">
              <Building2 className="w-3.5 h-3.5" />
              Per Divisi
            </TabsTrigger>
            <TabsTrigger value="MANUAL" className="gap-1.5 text-xs">
              <UserPlus className="w-3.5 h-3.5" />
              Tambah Manual
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: ALL ACTIVE MEMBERS */}
          <TabsContent value="ALL" className="space-y-3 pt-2">
            <div className="p-4 bg-muted/40 rounded-xl border space-y-2 text-xs">
              <div className="font-bold text-foreground text-sm">
                Impor Otomatis Seluruh Anggota Aktif
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Sistem akan memverifikasi database anggota organisasi yang berstatus
                aktif dan menetapkannya ke dalam Daftar Pemilih Tetap (DPT). Setiap
                anggota akan otomatis diterbitkan kode Token Bilik Suara sekali pakai.
              </p>
            </div>

            <Button
              type="button"
              className="w-full"
              onClick={handleImportAll}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mengimpor Anggota...
                </>
              ) : (
                'Tetapkan Seluruh Anggota Aktif Sebagai DPT'
              )}
            </Button>
          </TabsContent>

          {/* TAB 2: BY DIVISI */}
          <TabsContent value="DIVISI" className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label>Pilih Divisi / Bidang</Label>
              <Select
                value={selectedDivisiId}
                onValueChange={setSelectedDivisiId}
                disabled={loadingDivisi}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Divisi..." />
                </SelectTrigger>
                <SelectContent>
                  {divisiList.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              className="w-full"
              onClick={handleImportDivisi}
              disabled={submitting || !selectedDivisiId}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mengimpor Anggota Divisi...
                </>
              ) : (
                'Impor Anggota Divisi Terpilih'
              )}
            </Button>
          </TabsContent>

          {/* TAB 3: MANUAL ENTRY */}
          <TabsContent value="MANUAL" className="pt-2">
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="manualNama">
                  Nama Lengkap Pemilih <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="manualNama"
                  placeholder="Contoh: Muhammad Ihsan"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="manualNra">NRA / NIM / No. Anggota</Label>
                  <Input
                    id="manualNra"
                    placeholder="Contoh: NRA-2024-005"
                    value={nraOrNim}
                    onChange={(e) => setNraOrNim(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="manualKontak">WhatsApp / Email</Label>
                  <Input
                    id="manualKontak"
                    placeholder="081234567890"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                  />
                </div>
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
                    'Tambahkan ke DPT'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

