'use client'

import React, { useEffect, useState, use } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle, Clock, MapPin, Calendar, UserCheck, ArrowRight, Loader2 } from 'lucide-react'

interface SesiInfo {
  id: string
  programKerjaId: string
  judul: string
  tipe: string
  deskripsi: string | null
  lokasi: string | null
  tanggal: string
  isActive: boolean
  programKerja: {
    id: string
    title: string
    divisi: {
      name: string
      color: string
    }
  }
}

export default function PresensiScanPage({
  params,
}: {
  params: Promise<{ sesiId: string }>
}) {
  const { sesiId } = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('t') || ''

  const [sesi, setSesi] = useState<SesiInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<any | null>(null)

  // Form guest jika tidak login atau manual
  const [namaPeserta, setNamaPeserta] = useState('')
  const [nomorIdentitas, setNomorIdentitas] = useState('')
  const [instansi, setInstansi] = useState('')
  const [isLoggedInUser, setIsLoggedInUser] = useState(false)
  const [loggedInUserName, setLoggedInUserName] = useState('')

  // 1. Fetch Sesi Info & current session
  useEffect(() => {
    async function init() {
      try {
        setLoading(true)
        const [resInfo, resAuth] = await Promise.all([
          fetch(`/api/presensi/${sesiId}/info`),
          fetch('/api/auth/session').catch(() => null),
        ])

        if (resInfo.ok) {
          const json = await resInfo.json()
          setSesi(json.data)
        } else {
          setErrorMsg('Sesi presensi tidak ditemukan atau telah dihapus.')
        }

        if (resAuth && resAuth.ok) {
          const authData = await resAuth.json()
          if (authData?.user) {
            setIsLoggedInUser(true)
            setLoggedInUserName(authData.user.name || authData.user.email || 'Anggota')
            setNamaPeserta(authData.user.name || '')
          }
        }
      } catch (err) {
        console.error('Error fetching presensi page data:', err)
        setErrorMsg('Gagal memuat informasi sesi presensi.')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [sesiId])

  // Submit scan
  const handleSubmitPresence = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!token) {
      setErrorMsg('Token QR tidak valid atau tautan belum lengkap. Silakan scan ulang QR Code di layar.')
      return
    }

    try {
      setSubmitting(true)
      setErrorMsg(null)

      const payload: any = {
        token,
        namaPeserta: namaPeserta.trim() || undefined,
        nomorIdentitas: nomorIdentitas.trim() || undefined,
        instansi: instansi.trim() || undefined,
      }

      if (!sesi) return

      const res = await fetch(`/api/proker/${sesi.programKerjaId}/presensi/${sesiId}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Presensi gagal diproses.')
      } else {
        setSuccessData(data)
      }
    } catch (err) {
      console.error(err)
      setErrorMsg('Terjadi gangguan jaringan saat memproses presensi.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Memuat sesi presensi digital...</p>
        </div>
      </div>
    )
  }

  if (!sesi) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full border-border">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Sesi Tidak Ditemukan
            </CardTitle>
            <CardDescription>
              {errorMsg || 'Tautan presensi tidak valid atau telah dinonaktifkan oleh panitia.'}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" variant="outline" onClick={() => router.push('/')}>
              Kembali ke Beranda
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 to-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-lg border-border">
        {/* Header */}
        <CardHeader className="space-y-3 pb-4 border-b">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="text-xs">
              {sesi.tipe}
            </Badge>
            {sesi.isActive ? (
              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                Sesi Dibuka
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">
                Sesi Ditutup
              </Badge>
            )}
          </div>
          <div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">
              {sesi.judul}
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Program Kerja: <span className="font-semibold text-foreground">{sesi.programKerja.title}</span> ({sesi.programKerja.divisi.name})
            </CardDescription>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-1.5 truncate">
              <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{new Date(sesi.tanggal).toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
            </div>
            {sesi.lokasi && (
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate">{sesi.lokasi}</span>
              </div>
            )}
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="pt-6 space-y-4">
          {/* Sesi Ditutup Alert */}
          {!sesi.isActive && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Presensi Selesai / Ditutup</AlertTitle>
              <AlertDescription>
                Panitia telah menutup sesi presensi ini. Anda tidak dapat melakukan check-in lagi.
              </AlertDescription>
            </Alert>
          )}

          {/* Sukses Presensi */}
          {successData && (
            <div className="p-5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200 text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <h3 className="font-bold text-lg">Presensi Berhasil Dicatat</h3>
              <p className="text-xs text-emerald-900/80 dark:text-emerald-300">
                {successData.message}
              </p>
              {successData.data?.waktuHadir && (
                <div className="pt-2 text-[11px] font-mono text-muted-foreground flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" />
                  Waktu: {new Date(successData.data.waktuHadir).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                </div>
              )}
            </div>
          )}

          {/* Error Alert */}
          {errorMsg && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Presensi Gagal</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          {/* Token Tidak Ditemukan Alert */}
          {!token && !successData && (
            <Alert className="bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle>Token QR Tidak Ditemukan</AlertTitle>
              <AlertDescription>
                Halaman ini harus diakses dengan memindai (scan) QR Code dinamis yang tampil di layar pertemuan.
              </AlertDescription>
            </Alert>
          )}

          {/* Form Konfirmasi Kehadiran */}
          {sesi.isActive && !successData && (
            <form onSubmit={handleSubmitPresence} className="space-y-4">
              {isLoggedInUser ? (
                <div className="p-3.5 rounded-lg border bg-muted/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Teridentifikasi sebagai Akun:</span>
                  </div>
                  <p className="text-base font-semibold text-foreground">{loggedInUserName}</p>
                  <p className="text-xs text-muted-foreground">
                    Kehadiran Anda akan dicatat langsung terhubung ke profil akun HubbHQ.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nama Lengkap Peserta *</Label>
                    <Input
                      placeholder="Masukkan nama lengkap Anda..."
                      value={namaPeserta}
                      onChange={(e) => setNamaPeserta(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">NIM / NIK / No. Anggota</Label>
                      <Input
                        placeholder="Opsional"
                        value={nomorIdentitas}
                        onChange={(e) => setNomorIdentitas(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Asal Divisi / Instansi</Label>
                      <Input
                        placeholder="Contoh: Divisi Acara"
                        value={instansi}
                        onChange={(e) => setInstansi(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full font-semibold"
                size="lg"
                disabled={submitting || !token}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memverifikasi Kehadiran...
                  </>
                ) : (
                  <>
                    Konfirmasi Kehadiran Sekarang
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="pt-2 pb-4 border-t flex flex-col items-center gap-2 text-center text-xs text-muted-foreground">
          <span>Sistem Presensi Digital Terverifikasi - HubbHQ</span>
        </CardFooter>
      </Card>
    </div>
  )
}

