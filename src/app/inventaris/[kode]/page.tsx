'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Calendar,
  Layers,
  ArrowRightLeft,
  ShieldCheck,
  Building2,
  Phone,
  HelpCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function PublicInventarisScanPage() {
  const params = useParams()
  const kode = params?.kode as string

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (kode) {
      fetchItemData(kode)
    }
  }, [kode])

  const fetchItemData = async (kodeBarang: string) => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch(`/api/inventaris/scan/${encodeURIComponent(kodeBarang)}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Barang tidak ditemukan')
      setData(json.data)
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memuat informasi barang')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm font-medium text-muted-foreground">
          Memindai data inventaris barang...
        </p>
      </div>
    )
  }

  if (errorMsg || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Aset Tidak Ditemukan</h2>
          <p className="text-xs text-muted-foreground">
            {errorMsg || 'Data barang inventaris dengan barcode tersebut tidak terdaftar di sistem.'}
          </p>
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Coba Lagi
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const isTersedia = data.jumlahTersedia > 0
  const isDipinjam = data.peminjaman && data.peminjaman.length > 0
  const activeLoan = isDipinjam ? data.peminjaman[0] : null

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4 py-8">
      <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden">
        {/* Header Verifikasi */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                HUBBHQ ASSET VERIFICATION
              </div>
              <h1 className="text-sm font-bold text-white leading-tight">
                {data.organisasi?.nama || 'Inventaris Sekretariat'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-md border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            TERDAFTAR RESMI
          </div>
        </div>

        {/* Status Ketersediaan Banner */}
        <div className="p-4 border-b">
          {isTersedia ? (
            <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  BARANG TERSEDIA DI SEKRETARIAT
                </div>
                <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400 mt-0.5">
                  Tersedia {data.jumlahTersedia} {data.satuan} dari total {data.jumlahTotal} {data.satuan}. Siap dipinjam untuk kegiatan organisasi.
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  BARANG SEDANG HABIS DIPINJAM
                </div>
                <div className="text-[11px] text-amber-700/80 dark:text-amber-400 mt-0.5">
                  Seluruh unit barang inventaris ini saat ini sedang berada di luar sekretariat.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rincian Barang */}
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-4">
            {data.fotoBarang ? (
              <img
                src={data.fotoBarang}
                alt={data.namaBarang}
                className="w-20 h-20 rounded-xl object-cover border shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                <Package className="w-8 h-8 opacity-40" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="font-mono text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded inline-block">
                {data.kodeBarang}
              </div>
              <h2 className="text-base font-bold text-foreground mt-1 leading-snug">
                {data.namaBarang}
              </h2>
              {data.merkModel && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {data.merkModel}
                </p>
              )}
            </div>
          </div>

          {/* Grid Informasi */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
            <div className="p-2.5 bg-muted/40 rounded-lg">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                Kategori
              </span>
              <span className="font-semibold text-foreground">{data.kategori}</span>
            </div>

            <div className="p-2.5 bg-muted/40 rounded-lg">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                Kondisi Fisik
              </span>
              <span className="font-semibold text-foreground">{data.kondisi}</span>
            </div>

            <div className="p-2.5 bg-muted/40 rounded-lg col-span-2">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Lokasi Simpan di Sekretariat
              </span>
              <span className="font-semibold text-foreground">
                {data.lokasiPenyimpanan}
              </span>
            </div>
          </div>

          {/* Jika Ada Peminjam Aktif */}
          {activeLoan && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border space-y-2">
              <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5 text-sky-600" />
                Status Peminjaman Terkini
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  <span className="font-medium text-foreground">Peminjam: </span>
                  {activeLoan.namaPeminjam}{' '}
                  {activeLoan.instansiPeminjam ? `(${activeLoan.instansiPeminjam})` : ''}
                </div>
                <div>
                  <span className="font-medium text-foreground">Batas Pengembalian: </span>
                  <span className="font-bold text-foreground">
                    {new Date(activeLoan.rencanaKembali).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="truncate">
                  <span className="font-medium text-foreground">Keperluan: </span>
                  {activeLoan.keperluan}
                </div>
              </div>
            </div>
          )}

          {data.catatan && (
            <div className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border">
              <span className="font-semibold text-foreground">Catatan / Kelengkapan: </span>
              {data.catatan}
            </div>
          )}

          {/* Footer Info */}
          <div className="pt-2 border-t text-center space-y-2">
            <p className="text-[11px] text-muted-foreground">
              Ingin meminjam peralatan ini? Silakan hubungi divisi logistik sekretariat
              atau login ke dashboard HubbHQ untuk membuat permohonan pinjam.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => (window.location.href = '/dashboard/inventaris')}
              >
                Buka Dashboard Inventaris
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

