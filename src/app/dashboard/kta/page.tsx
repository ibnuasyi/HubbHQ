'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Edit,
  User,
  ShieldCheck,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { KtaCard, KtaMemberData } from '@/components/kta/kta-card'
import { KtaConfig } from '@/lib/kta-config'

export default function MyKtaPage() {
  const [data, setData] = useState<{ user: KtaMemberData; config: KtaConfig } | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [bloodType, setBloodType] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchKtaData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/kta')
      if (res.ok) {
        const json = await res.json()
        setData(json.data)
        setBloodType(json.data?.user?.bloodType || '')
        setEmergencyContact(json.data?.user?.emergencyContact || '')
      }
    } catch (err) {
      console.error('Error fetching KTA data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKtaData()
  }, [fetchKtaData])

  const handlePublishKta = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/kta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bloodType: bloodType.trim() || undefined,
          emergencyContact: emergencyContact.trim() || undefined,
        }),
      })
      if (res.ok) {
        setShowEditModal(false)
        fetchKtaData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground text-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span>Memuat Kartu Tanda Anggota (KTA) Digital...</span>
        </div>
      </div>
    )
  }

  if (!data?.user) {
    return (
      <div className="flex-1 p-6">
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Data pengguna tidak ditemukan.
          </CardContent>
        </Card>
      </div>
    )
  }

  const { user, config } = data
  const verifyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/kta/verify/${encodeURIComponent(user.nra || user.id)}`
    : ''

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Kartu Tanda Anggota (KTA) Digital
          </h1>
          <p className="text-sm text-muted-foreground">
            Identitas keanggotaan resmi standar CR80 dengan verifikasi publik QR Code
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!user.nra ? (
            <Button onClick={() => setShowEditModal(true)} className="bg-primary text-primary-foreground font-semibold">
              <Sparkles className="mr-1.5 h-4 w-4" />
              Terbitkan KTA Saya
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
              <Edit className="mr-1.5 h-3.5 w-3.5" />
              Edit Info Kartu
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: Card Viewer & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive 3D Card */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl border bg-card/60 backdrop-blur shadow-sm">
          <KtaCard member={user} config={config} showControls={true} />
        </div>

        {/* Right Column: Member Metadata & Verification Portal */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Status Keabsahan Kartu
                </CardTitle>
                {user.nra ? (
                  <Badge className="bg-emerald-600 text-white text-xs">
                    Aktif & Terdaftar
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-700 border-amber-300 dark:text-amber-300 dark:border-amber-800 text-xs">
                    Belum Diterbitkan
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Nomor Registrasi (NRA):</span>
                  <span className="font-mono font-bold text-foreground">
                    {user.nra || 'Belum Terbit'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Nama Pemegang:</span>
                  <span className="font-semibold text-foreground">{user.fullName || user.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Jabatan / Amanah:</span>
                  <span className="font-medium text-foreground">
                    {user.jabatan?.name || user.role?.displayName || 'Anggota Resmi'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Divisi / Wilayah:</span>
                  <span className="text-foreground">
                    {user.divisi ? user.divisi.name : user.wilayah?.name || 'Pusat'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Golongan Darah:</span>
                  <span className="font-semibold text-foreground">{user.bloodType || 'Belum Diisi'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Masa Berlaku:</span>
                  <span className="font-medium text-foreground">
                    {user.ktaValidUntil
                      ? new Date(user.ktaValidUntil).toLocaleDateString('id-ID', { dateStyle: 'long' })
                      : 'Seumur Hidup'}
                  </span>
                </div>
              </div>

              {/* Public Verification Link */}
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs text-muted-foreground">Tautan Verifikasi Keabsahan Publik:</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={verifyUrl}
                    className="font-mono text-[11px] h-8 bg-muted/40"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(verifyUrl)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
                    <a href={verifyUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              </div>

              {!user.avatar && (
                <div className="p-3 rounded-lg border border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-2">
                  <span>Pasfoto profil belum diunggah untuk dicetak di KTA.</span>
                  <Button size="sm" variant="outline" asChild className="h-7 text-[11px] shrink-0">
                    <Link href="/dashboard/profile">Unggah Foto</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* DIALOG: Edit Info Kartu Anggota */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handlePublishKta()
            }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                {user.nra ? 'Perbarui Informasi KTA' : 'Terbitkan Kartu Tanda Anggota'}
              </DialogTitle>
              <DialogDescription>
                {user.nra
                  ? 'Perbarui data pelengkap kartu anggota Anda'
                  : 'Sistem akan otomatis menghasilkan Nomor Registrasi Anggota (NRA) resmi'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs">Golongan Darah</Label>
                <Input
                  placeholder="Contoh: A, B, AB, O"
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Kontak Darurat / Keluarga (Telepon)</Label>
                <Input
                  placeholder="Contoh: 081234567890 (Ibu / Wali)"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {user.nra ? 'Simpan Perubahan' : 'Terbitkan KTA Sekarang'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

