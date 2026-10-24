'use client'

import React, { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import {
  ShieldCheck,
  Download,
  Printer,
  RotateCw,
  QrCode,
  Calendar,
  Sparkles,
  Award,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { KtaConfig } from '@/lib/kta-config'

export interface KtaMemberData {
  id: string
  name: string | null
  fullName?: string | null
  avatar: string | null
  nra: string | null
  bloodType?: string | null
  emergencyContact?: string | null
  ktaIssuedAt?: string | null
  ktaValidUntil?: string | null
  role?: { displayName: string } | null
  jabatan?: { name: string } | null
  wilayah?: { name: string } | null
  divisi?: { name: string } | null
}

interface KtaCardProps {
  member: KtaMemberData
  config: KtaConfig
  showControls?: boolean
}

const THEME_STYLES: Record<
  string,
  {
    bgGradient: string
    borderAccent: string
    primaryText: string
    accentText: string
    chipColor: string
    badgeBg: string
    badgeText: string
  }
> = {
  'royal-navy': {
    bgGradient: 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white',
    borderAccent: 'border-amber-400/40',
    primaryText: 'text-amber-300',
    accentText: 'text-amber-400',
    chipColor: 'bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500',
    badgeBg: 'bg-amber-400/20 border-amber-400/40',
    badgeText: 'text-amber-200',
  },
  'emerald-prestige': {
    bgGradient: 'bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 text-white',
    borderAccent: 'border-emerald-400/40',
    primaryText: 'text-emerald-300',
    accentText: 'text-emerald-400',
    chipColor: 'bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300',
    badgeBg: 'bg-emerald-400/20 border-emerald-400/40',
    badgeText: 'text-emerald-200',
  },
  'crimson-noble': {
    bgGradient: 'bg-gradient-to-br from-slate-950 via-rose-950 to-red-950 text-white',
    borderAccent: 'border-rose-400/40',
    primaryText: 'text-rose-300',
    accentText: 'text-rose-400',
    chipColor: 'bg-gradient-to-r from-slate-200 via-slate-300 to-zinc-400',
    badgeBg: 'bg-rose-400/20 border-rose-400/40',
    badgeText: 'text-rose-200',
  },
  'obsidian-dark': {
    bgGradient: 'bg-gradient-to-br from-black via-zinc-950 to-neutral-900 text-white',
    borderAccent: 'border-cyan-400/40',
    primaryText: 'text-cyan-300',
    accentText: 'text-cyan-400',
    chipColor: 'bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-400',
    badgeBg: 'bg-cyan-400/20 border-cyan-400/40',
    badgeText: 'text-cyan-200',
  },
}

export function KtaCard({ member, config, showControls = true }: KtaCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [downloading, setDownloading] = useState(false)

  const frontCardRef = useRef<HTMLDivElement>(null)
  const backCardRef = useRef<HTMLDivElement>(null)

  const theme = THEME_STYLES[config.tema] || THEME_STYLES['royal-navy']

  // Generate QR Code URL
  useEffect(() => {
    async function makeQr() {
      if (typeof window === 'undefined') return
      const code = member.nra || member.id
      const verifyUrl = `${window.location.origin}/kta/verify/${encodeURIComponent(code)}`
      try {
        const qrUrl = await QRCode.toDataURL(verifyUrl, {
          width: 250,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        })
        setQrCodeDataUrl(qrUrl)
      } catch (err) {
        console.error('Error generating KTA QR code:', err)
      }
    }
    makeQr()
  }, [member.nra, member.id])

  // Download Sisi Depan / Belakang sebagai PNG
  const handleDownloadImage = async (side: 'front' | 'back') => {
    const targetRef = side === 'front' ? frontCardRef.current : backCardRef.current
    if (!targetRef) return

    try {
      setDownloading(true)
      const canvas = await html2canvas(targetRef, {
        scale: 3, // Ultra-high resolution
        useCORS: true,
        backgroundColor: null,
      })
      const link = document.createElement('a')
      link.download = `KTA_${side.toUpperCase()}_${member.nra || member.name}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Error exporting KTA PNG:', err)
    } finally {
      setDownloading(false)
    }
  }

  // Download PDF Siap Cetak (CR80 Standard atau Lembar Cetak)
  const handleDownloadPdf = async () => {
    if (!frontCardRef.current || !backCardRef.current) return

    try {
      setDownloading(true)
      const [frontCanvas, backCanvas] = await Promise.all([
        html2canvas(frontCardRef.current, { scale: 3, useCORS: true }),
        html2canvas(backCardRef.current, { scale: 3, useCORS: true }),
      ])

      // CR80 dimensions: 85.6mm x 53.98mm
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 53.98],
      })

      // Page 1: Sisi Depan
      const frontImg = frontCanvas.toDataURL('image/png')
      pdf.addImage(frontImg, 'PNG', 0, 0, 85.6, 53.98)

      // Page 2: Sisi Belakang
      pdf.addPage([85.6, 53.98], 'landscape')
      const backImg = backCanvas.toDataURL('image/png')
      pdf.addImage(backImg, 'PNG', 0, 0, 85.6, 53.98)

      pdf.save(`KTA_CR80_${member.nra || member.name}.pdf`)
    } catch (err) {
      console.error('Error exporting KTA PDF:', err)
    } finally {
      setDownloading(false)
    }
  }

  const validUntilText = member.ktaValidUntil
    ? new Date(member.ktaValidUntil).toLocaleDateString('id-ID', {
        month: '2-digit',
        year: 'numeric',
      })
    : 'SEUMUR HIDUP'

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 3D Flip Container */}
      <div className="perspective-1000 w-[360px] sm:w-[440px] h-[228px] sm:h-[278px] relative cursor-pointer select-none">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`w-full h-full transition-transform duration-700 transform-style-3d relative ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* ======================================================== */}
          {/* SISI DEPAN (FRONT CARD) */}
          {/* ======================================================== */}
          <div
            ref={frontCardRef}
            className={`w-full h-full rounded-2xl p-4 sm:p-5 shadow-2xl border-2 ${theme.borderAccent} ${theme.bgGradient} absolute backface-hidden flex flex-col justify-between overflow-hidden`}
          >
            {/* Subtle Watermark Overlay */}
            <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
              <Award className="w-56 h-56 text-white" />
            </div>

            {/* Top Bar: Logo & Organization Header */}
            <div className="flex items-center justify-between gap-3 relative z-10 border-b border-white/10 pb-2">
              <div className="flex items-center gap-2.5">
                {config.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={config.logoUrl}
                    alt="Logo"
                    className="h-9 w-9 object-contain rounded drop-shadow"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                    <ShieldCheck className="h-5 w-5 text-amber-300" />
                  </div>
                )}
                <div>
                  <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-white font-serif line-clamp-1">
                    {config.namaOrganisasi}
                  </h3>
                  <p className="text-[9px] sm:text-[10px] tracking-widest text-slate-300 uppercase line-clamp-1 font-mono">
                    {config.subNamaOrganisasi}
                  </p>
                </div>
              </div>

              {/* Holographic Chip Visual */}
              <div
                className={`w-9 h-7 rounded-md ${theme.chipColor} shadow-inner border border-yellow-200/50 flex flex-col justify-around p-1 shrink-0 opacity-90`}
              >
                <div className="h-[1px] bg-black/30 w-full" />
                <div className="h-[1px] bg-black/30 w-full" />
              </div>
            </div>

            {/* Middle Section: Avatar & Info */}
            <div className="flex items-center gap-4 relative z-10 my-auto">
              {/* Pasfoto */}
              <div className="relative shrink-0">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl border-2 border-amber-300/60 shadow-lg object-cover">
                  <AvatarImage src={member.avatar || undefined} className="object-cover" />
                  <AvatarFallback className="text-lg font-bold bg-slate-800 text-white">
                    {member.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {/* Active Dot */}
                <div
                  className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-slate-900 shadow"
                  title="Anggota Aktif"
                />
              </div>

              {/* Nama & Data */}
              <div className="space-y-1 min-w-0 flex-1">
                <h4 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                  {member.fullName || member.name}
                </h4>

                {/* NRA Monospace Pill */}
                <div className="inline-block">
                  <span className="font-mono text-[10px] sm:text-xs font-bold tracking-widest text-amber-300 bg-black/40 px-2 py-0.5 rounded border border-amber-400/30">
                    {member.nra || 'NRA: BELUM DITERBITKAN'}
                  </span>
                </div>

                {/* Jabatan & Divisi */}
                <div className="text-[10px] sm:text-xs text-slate-300 leading-tight">
                  <p className="font-semibold text-slate-100 truncate">
                    {member.jabatan?.name || member.role?.displayName || 'Anggota Resmi'}
                  </p>
                  <p className="text-slate-400 truncate">
                    {member.divisi ? `Divisi ${member.divisi.name}` : member.wilayah?.name || 'HubbHQ'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Bar: Gol Darah & Masa Berlaku */}
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-300 relative z-10 border-t border-white/10 pt-1.5 font-mono">
              <div className="flex items-center gap-2">
                <span>GOL: <strong className="text-white">{member.bloodType || '-'}</strong></span>
                <span>•</span>
                <span>KTA DIGITAL</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-amber-300" />
                <span>BERLAKU: <strong className="text-white">{validUntilText}</strong></span>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SISI BELAKANG (BACK CARD) */}
          {/* ======================================================== */}
          <div
            ref={backCardRef}
            className={`w-full h-full rounded-2xl p-4 sm:p-5 shadow-2xl border-2 ${theme.borderAccent} ${theme.bgGradient} absolute backface-hidden rotate-y-180 flex flex-col justify-between overflow-hidden`}
          >
            {/* Top Magnetic Stripe Simulation */}
            <div className="-mx-5 -mt-5 mb-2 h-7 bg-slate-950/80 border-b border-white/10 flex items-center justify-end px-4">
              <span className="text-[8px] font-mono tracking-widest text-slate-500">
                HUBBHQ-ID-CARD-STANDARD-CR80
              </span>
            </div>

            {/* Content: Terms & QR Verification */}
            <div className="grid grid-cols-3 gap-3 relative z-10 flex-1 items-center">
              {/* Left Column: Terms */}
              <div className="col-span-2 space-y-1.5 text-[9px] sm:text-[10px] text-slate-300 leading-snug">
                <p className="font-bold text-white uppercase text-[10px] tracking-wide border-b border-white/10 pb-0.5">
                  Ketentuan Kartu Anggota
                </p>
                <ol className="list-decimal list-inside space-y-0.5 text-slate-400">
                  <li>Kartu ini adalah tanda pengenal resmi anggota organisasi.</li>
                  <li>Wajib dibawa saat persidangan, mubes, dan kegiatan kepengurusan.</li>
                  <li>Scan QR Code untuk verifikasi status keaslian anggota di basis data.</li>
                </ol>
                <div className="pt-1 text-[8px] sm:text-[9px] text-slate-400 font-mono">
                  <p className="truncate">{config.alamatSekretariat}</p>
                  <p className="text-amber-300">{config.kontakOrganisasi}</p>
                </div>
              </div>

              {/* Right Column: QR Code */}
              <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-white text-slate-900 shadow">
                {qrCodeDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Verifikasi KTA"
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-900" />
                  </div>
                )}
                <span className="text-[8px] font-mono font-bold tracking-tight mt-1 text-slate-800 text-center">
                  SCAN VERIFIKASI
                </span>
              </div>
            </div>

            {/* Bottom: Signature & Official Stamp */}
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] relative z-10 border-t border-white/10 pt-1 text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-mono text-[9px] text-slate-400">
                  ID: {member.id.substring(0, 10)}...
                </span>
              </div>

              {/* Tanda Tangan & Pimpinan */}
              <div className="text-right">
                <p className="text-[8px] text-slate-400">{config.jabatanPenandatangan},</p>
                <p className="font-semibold text-white underline underline-offset-2">
                  {config.namaKetuaUmum}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      {showControls && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <RotateCw className="mr-1.5 h-3.5 w-3.5" />
            {isFlipped ? 'Lihat Sisi Depan' : 'Lihat Sisi Belakang'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            disabled={downloading}
            onClick={() => handleDownloadImage(isFlipped ? 'back' : 'front')}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {isFlipped ? 'Unduh Belakang (PNG)' : 'Unduh Depan (PNG)'}
          </Button>

          <Button
            size="sm"
            className="text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            disabled={downloading}
            onClick={handleDownloadPdf}
          >
            {downloading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Printer className="mr-1.5 h-3.5 w-3.5" />
            )}
            Unduh PDF Siap Cetak (CR80)
          </Button>
        </div>
      )}
    </div>
  )
}

