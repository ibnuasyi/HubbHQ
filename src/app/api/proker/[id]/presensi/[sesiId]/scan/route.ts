export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { verifyDynamicQrToken } from '@/lib/presensi-qr'
import { checkRateLimitByIP, getClientIP } from '@/lib/rate-limit'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; sesiId: string }> }
) {
  try {
    const clientIp = getClientIP(request)
    const rateCheck = checkRateLimitByIP(clientIp, 'scan_presensi', { maxRequests: 20, windowMs: 60 * 1000 })
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan presensi. Silakan coba beberapa saat lagi.' },
        { status: 429 }
      )
    }

    const { id: prokerId, sesiId } = await context.params
    const body = await request.json()
    const { token, namaPeserta, nomorIdentitas, instansi, keterangan } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token QR tidak ditemukan dalam permintaan' },
        { status: 400 }
      )
    }

    // Ambil sesi presensi
    const sesi = await prisma.presensiSesi.findFirst({
      where: { id: sesiId, programKerjaId: prokerId },
    })

    if (!sesi) {
      return NextResponse.json(
        { error: 'Sesi presensi kegiatan tidak ditemukan' },
        { status: 404 }
      )
    }

    if (!sesi.isActive) {
      return NextResponse.json(
        { error: 'Sesi presensi telah ditutup oleh panitia' },
        { status: 400 }
      )
    }

    // Validasi Time-based HMAC Token Dinamis
    const validation = verifyDynamicQrToken(
      sesi.id,
      sesi.qrSecret,
      token,
      sesi.tokenTtlSeconds
    )

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.reason || 'Token QR tidak valid' },
        { status: 400 }
      )
    }

    // Ambil session login jika ada
    const session = await auth()
    let userId: string | null = null
    let finalNama = namaPeserta ? String(namaPeserta).trim() : ''
    let finalInstansi = instansi ? String(instansi).trim() : null

    if (session?.user) {
      userId = session.user.id
      finalNama = session.user.name || finalNama || 'Anggota HubbHQ'
      // Cari nama divisi user
      const userWithDivisi = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          divisiMembers: {
            include: { divisi: true },
          },
        },
      })
      if (userWithDivisi?.divisiMembers?.[0]?.divisi?.name) {
        finalInstansi = userWithDivisi.divisiMembers[0].divisi.name
      }
    }

    if (!userId && !finalNama) {
      return NextResponse.json(
        {
          error: 'Nama lengkap wajib diisi untuk presensi peserta tamu.',
          needsGuestInfo: true,
        },
        { status: 400 }
      )
    }

    // Periksa apakah user/peserta sudah absen sebelumnya
    if (userId) {
      const existing = await prisma.presensiKehadiran.findUnique({
        where: {
          presensiSesiId_userId: {
            presensiSesiId: sesi.id,
            userId,
          },
        },
      })

      if (existing) {
        return NextResponse.json({
          success: true,
          alreadyRecorded: true,
          message: `Kehadiran Anda sudah tercatat sebelumnya pada pukul ${new Date(
            existing.waktuHadir
          ).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}.`,
          data: existing,
        })
      }
    }

    // Simpan data presensi baru
    const record = await prisma.presensiKehadiran.create({
      data: {
        presensiSesiId: sesi.id,
        userId: userId || undefined,
        namaPeserta: finalNama,
        nomorIdentitas: nomorIdentitas ? String(nomorIdentitas).trim() : null,
        instansi: finalInstansi,
        status: 'HADIR',
        metodeScan: 'QR_SCAN',
        keterangan: keterangan?.trim() || null,
        waktuHadir: new Date(),
      },
    })

    // Sinkronkan ke LPJ jika sesi aktif ditarik
    if (sesi.isDitarikKeLpj) {
      const lpj = await prisma.lpjProker.findUnique({
        where: { programKerjaId: prokerId },
      })
      if (lpj) {
        const totalHadir = await prisma.presensiKehadiran.count({
          where: {
            presensiSesi: { programKerjaId: prokerId, isDitarikKeLpj: true },
            status: 'HADIR',
          },
        })
        await prisma.lpjProker.update({
          where: { programKerjaId: prokerId },
          data: {
            checklistPresensi: true,
            pesertaHadir: Math.max(lpj.pesertaHadir || 0, totalHadir),
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Presensi berhasil! Terima kasih atas kehadiran Anda, ${finalNama}.`,
      data: record,
    })
  } catch (error) {
    console.error('Error processing QR scan presensi:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memproses presensi' },
      { status: 500 }
    )
  }
}

