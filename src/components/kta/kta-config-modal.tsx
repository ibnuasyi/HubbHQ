'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Settings2, Loader2, CreditCard } from 'lucide-react'
import { KtaConfig } from '@/lib/kta-config'

interface KtaConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialConfig: KtaConfig
  onConfigSaved: (newConfig: KtaConfig) => void
}

export function KtaConfigModal({
  open,
  onOpenChange,
  initialConfig,
  onConfigSaved,
}: KtaConfigModalProps) {
  const [saving, setSaving] = useState(false)
  const [namaOrganisasi, setNamaOrganisasi] = useState(initialConfig.namaOrganisasi)
  const [subNamaOrganisasi, setSubNamaOrganisasi] = useState(initialConfig.subNamaOrganisasi)
  const [logoUrl, setLogoUrl] = useState(initialConfig.logoUrl)
  const [namaKetuaUmum, setNamaKetuaUmum] = useState(initialConfig.namaKetuaUmum)
  const [jabatanPenandatangan, setJabatanPenandatangan] = useState(initialConfig.jabatanPenandatangan)
  const [formatNra, setFormatNra] = useState(initialConfig.formatNra)
  const [tema, setTema] = useState(initialConfig.tema)
  const [masaBerlakuTahun, setMasaBerlakuTahun] = useState(initialConfig.masaBerlakuTahun.toString())
  const [alamatSekretariat, setAlamatSekretariat] = useState(initialConfig.alamatSekretariat)
  const [kontakOrganisasi, setKontakOrganisasi] = useState(initialConfig.kontakOrganisasi)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const payload: Partial<KtaConfig> = {
        namaOrganisasi: namaOrganisasi.trim(),
        subNamaOrganisasi: subNamaOrganisasi.trim(),
        logoUrl: logoUrl.trim(),
        namaKetuaUmum: namaKetuaUmum.trim(),
        jabatanPenandatangan: jabatanPenandatangan.trim(),
        formatNra: formatNra.trim(),
        tema,
        masaBerlakuTahun: parseInt(masaBerlakuTahun) || 2,
        alamatSekretariat: alamatSekretariat.trim(),
        kontakOrganisasi: kontakOrganisasi.trim(),
      }

      const res = await fetch('/api/kta/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const json = await res.json()
        onConfigSaved(json.data)
        onOpenChange(false)
      }
    } catch (err) {
      console.error('Error saving KTA config:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Pengaturan Format & Desain KTA Organisasi
            </DialogTitle>
            <DialogDescription>
              Atur identitas resmi organisasi, tema kartu standar CR80, format penomoran NRA, dan penandatangan kartu
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs">
            {/* Nama Organisasi & Sub Header */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nama Organisasi (Header Kartu) *</Label>
                <Input
                  value={namaOrganisasi}
                  onChange={(e) => setNamaOrganisasi(e.target.value)}
                  placeholder="Contoh: HIMPUNAN MAHASISWA / BEM"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tingkatan / Cabang Organisasi</Label>
                <Input
                  value={subNamaOrganisasi}
                  onChange={(e) => setSubNamaOrganisasi(e.target.value)}
                  placeholder="Contoh: PENGURUS PUSAT / KOMISARIAT"
                />
              </div>
            </div>

            {/* Tema Desain & Masa Berlaku */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Tema Warna Kartu</Label>
                <Select value={tema} onValueChange={(val: any) => setTema(val)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="royal-navy">Royal Navy (Biru Tua & Emas)</SelectItem>
                    <SelectItem value="emerald-prestige">Emerald Prestige (Hijau Zamrud & Emas)</SelectItem>
                    <SelectItem value="crimson-noble">Crimson Noble (Merah Marun & Perak)</SelectItem>
                    <SelectItem value="obsidian-dark">Obsidian Dark (Hitam Karbon Modern)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Masa Berlaku Kartu (Tahun)</Label>
                <Select value={masaBerlakuTahun} onValueChange={setMasaBerlakuTahun}>
                  <SelectTrigger className="text-xs font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Tahun (1 Periode Kepengurusan)</SelectItem>
                    <SelectItem value="2">2 Tahun</SelectItem>
                    <SelectItem value="3">3 Tahun</SelectItem>
                    <SelectItem value="5">5 Tahun</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Format Penomoran NRA */}
            <div className="space-y-1.5">
              <Label className="text-xs">Pola Format Nomor Registrasi Anggota (NRA)</Label>
              <Input
                value={formatNra}
                onChange={(e) => setFormatNra(e.target.value)}
                placeholder="NRA-{YYYY}-{NO} atau NRA/{YYYY}/{DIVISI}/{NO}"
                className="font-mono"
                required
              />
              <span className="text-[11px] text-muted-foreground block">
                Variabel yang didukung: <code className="text-primary">{'{YYYY}'}</code> (Tahun aktif),{' '}
                <code className="text-primary">{'{DIVISI}'}</code> (Kode Divisi),{' '}
                <code className="text-primary">{'{NO}'}</code> (Nomor urut otomatis 4 digit).
              </span>
            </div>

            {/* Pimpinan Penandatangan */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nama Ketua Umum / Pimpinan Penandatangan *</Label>
                <Input
                  value={namaKetuaUmum}
                  onChange={(e) => setNamaKetuaUmum(e.target.value)}
                  placeholder="Nama Lengkap Ketua Umum"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Jabatan Penandatangan</Label>
                <Input
                  value={jabatanPenandatangan}
                  onChange={(e) => setJabatanPenandatangan(e.target.value)}
                  placeholder="Contoh: Ketua Umum BPH"
                />
              </div>
            </div>

            {/* Logo URL */}
            <div className="space-y-1.5">
              <Label className="text-xs">Tautan Logo Resmi Organisasi (URL / Path)</Label>
              <Input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://... atau /uploads/logo.png"
              />
            </div>

            {/* Kontak & Sekretariat */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Alamat Sekretariat Organisasi</Label>
                <Input
                  value={alamatSekretariat}
                  onChange={(e) => setAlamatSekretariat(e.target.value)}
                  placeholder="Gedung / Jalan Sekretariat"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email / Kontak Resmi</Label>
                <Input
                  value={kontakOrganisasi}
                  onChange={(e) => setKontakOrganisasi(e.target.value)}
                  placeholder="sekretariat@organisasi.id"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Konfigurasi KTA
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

