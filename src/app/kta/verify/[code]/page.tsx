'use client'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  AlertCircle,
  Calendar,
  MapPin,
  CheckCircle2,
  XCircle,
  Award,
  Loader2,
  Building,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface VerifiedData {
  id: string
  name: string
  nra: string
  avatar: string | null
  bloodType: string | null
  isActive: boolean
  isExpired: boolean
  role: string
  jabatan: string
  divisi: string
  wilayah: string
  ktaIssuedAt: string | null
  ktaValidUntil: string | null
  organization: {
    nama: string
    subNama: string
    logoUrl: string | null
  }
}

export default function KtaVerificationPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = use(params)
  const [data, setData] = useState<VerifiedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    async function checkCode() {
      try {
        setLoading(true)
        const res = await fetch(`/api/kta/verify/${encodeURIComponent(code)}`)
        const json = await res.json()

        if (res.ok && json.isVerified) {
          setData(json.data)
        } else {
          setErrorMsg(json.error || 'Data keanggotaan tidak ditemukan.')
        }
      } catch (err) {
        console.error('Error verifying KTA:', err)
        setErrorMsg('Gagal memverifikasi kartu tanda anggota.')
      } finally {
        setLoading(false)
      }
    }
    checkCode()
  }, [code])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-3 text-muted-foreground text-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span>Memverifikasi keabsahan Kartu Tanda Anggota...</span>
        </div>
      </div>
    )
  }

  if (errorMsg || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-muted/30 to-background p-4">
        <Card className="max-w-md w-full border-destructive/40 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center mb-2">
              <XCircle className="h-7 w-7 text-destructive" />
            </div>
            <CardTitle className="text-xl font-bold text-destructive">
              Kartu Tidak Terverifikasi
            </CardTitle>
            <CardDescription className="text-xs">
              {errorMsg || 'Nomor Registrasi Anggota (NRA) tidak ditemukan dalam basis data resmi organisasi.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 text-center text-xs text-muted-foreground">
            Pastikan kartu yang dipindai merupakan KTA resmi yang diterbitkan oleh sistem HubbHQ dan belum melewati masa berlaku.
          </CardContent>
          <CardFooter className="pt-4 border-t">
            <Button className="w-full" variant="outline" asChild>
              <Link href="/">Kembali ke Beranda</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 via-background to-muted/20 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-2xl border-border overflow-hidden">
        {/* Organization Brand Header */}
        <div className="bg-slate-950 text-white p-5 text-center relative overflow-hidden border-b border-white/10">
          <div className="relative z-10 flex flex-col items-center gap-2">
            {data.organization.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.organization.logoUrl}
                alt="Logo"
                className="h-10 w-10 object-contain rounded"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                <Building className="h-5 w-5 text-amber-300" />
              </div>
            )}
            <div>
              <h2 className="text-sm font-bold tracking-wider uppercase font-serif text-amber-300">
                {data.organization.nama}
              </h2>
              <p className="text-[10px] tracking-widest uppercase text-slate-300 font-mono">
                {data.organization.subNama}
              </p>
            </div>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div className="bg-emerald-600 text-white p-3 text-center flex items-center justify-center gap-2 text-xs font-semibold shadow-inner">
          <ShieldCheck className="h-4 w-4" />
          <span>KARTU TANDA ANGGOTA SAH & TERVERIFIKASI</span>
        </div>

        {/* Member Details */}
        <CardContent className="p-6 space-y-6">
          {/* Avatar & Main Identity */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <Avatar className="h-24 w-24 rounded-2xl border-4 border-emerald-500/30 shadow-lg shrink-0">
              <AvatarImage src={data.avatar || undefined} className="object-cover" />
              <AvatarFallback className="text-2xl font-bold bg-slate-800 text-white">
                {data.name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1 min-w-0">
              <h3 className="text-xl font-bold text-foreground tracking-tight">
                {data.name}
              </h3>
              <p className="font-mono text-sm font-bold text-primary">
                {data.nra}
              </p>
              <div className="pt-1 flex flex-wrap justify-center sm:justify-start gap-1.5">
                <Badge variant="secondary" className="text-xs font-medium">
                  {data.jabatan}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Divisi {data.divisi}
                </Badge>
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="p-4 rounded-xl border bg-muted/30 text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status Keanggotaan:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {data.isActive ? 'Aktif' : 'Non-Aktif'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Wilayah / Cabang:</span>
              <span className="font-medium text-foreground">{data.wilayah}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Golongan Darah:</span>
              <span className="font-bold text-foreground">{data.bloodType || '-'}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tanggal Diterbitkan:</span>
              <span className="font-mono text-muted-foreground">
                {data.ktaIssuedAt
                  ? new Date(data.ktaIssuedAt).toLocaleDateString('id-ID', { dateStyle: 'long' })
                  : '-'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Masa Berlaku:</span>
              <span className={`font-mono font-semibold ${data.isExpired ? 'text-red-600' : 'text-foreground'}`}>
                {data.ktaValidUntil
                  ? new Date(data.ktaValidUntil).toLocaleDateString('id-ID', { dateStyle: 'long' })
                  : 'Seumur Hidup'}
                {data.isExpired && ' (Kedaluwarsa)'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200 text-xs text-center space-y-1">
            <p className="font-semibold">Sistem Verifikasi Digital Terpusat</p>
            <p className="text-[11px] text-muted-foreground">
              Data di atas terdaftar resmi dalam basis data HubbHQ dan dapat digunakan untuk registrasi musyawarah, persidangan, serta delegasi kegiatan organisasi.
            </p>
          </div>
        </CardContent>

        <CardFooter className="pt-3 pb-5 border-t text-center justify-center text-xs text-muted-foreground font-mono">
          <span>Verifikasi Resmi HubbHQ • {new Date().getFullYear()}</span>
        </CardFooter>
      </Card>
    </div>
  )
}

