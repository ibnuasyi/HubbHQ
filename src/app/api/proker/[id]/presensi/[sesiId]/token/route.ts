export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { generateDynamicQrToken } from '@/lib/presensi-qr'
import { canManageProker } from '@/lib/proker-auth'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; sesiId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: prokerId, sesiId } = await context.params
    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const canManage = await canManageProker(session.user.id, roleName, prokerId)
    if (!canManage) {
      return NextResponse.json(
        { error: 'Forbidden: Hanya panitia proker atau admin yang dapat menampilkan token presensi kegiatan' },
        { status: 403 }
      )
    }

    const sesi = await prisma.presensiSesi.findFirst({
      where: { id: sesiId, programKerjaId: prokerId },
      include: {
        _count: {
          select: { kehadiran: true },
        },
      },
    })

    if (!sesi) {
      return NextResponse.json(
        { error: 'Sesi presensi tidak ditemukan' },
        { status: 404 }
      )
    }

    if (!sesi.isActive) {
      return NextResponse.json({
        success: true,
        data: {
          isActive: false,
          message: 'Sesi presensi telah ditutup.',
          totalHadir: sesi._count.kehadiran,
        },
      })
    }

    // Generate token dynamic HMAC
    const tokenInfo = generateDynamicQrToken(sesi.id, sesi.qrSecret, sesi.tokenTtlSeconds)

    // Build scan URL safely (prevent Host Header Injection)
    let baseOrigin = process.env.NEXTAUTH_URL?.trim().replace(/\/+$/, '') || ''
    if (!baseOrigin) {
      const rawHost = request.headers.get('host') || 'localhost:3000'
      const safeHost = rawHost.replace(/[^a-zA-Z0-9.\-:]/g, '') || 'localhost:3000'
      const proto = request.nextUrl.protocol === 'https:' ? 'https' : 'http'
      baseOrigin = `${proto}://${safeHost}`
    }
    const scanUrl = `${baseOrigin}/presensi/${sesi.id}?t=${tokenInfo.token}`

    return NextResponse.json({
      success: true,
      data: {
        isActive: true,
        sesiId: sesi.id,
        judul: sesi.judul,
        tipe: sesi.tipe,
        token: tokenInfo.token,
        remainingSeconds: tokenInfo.remainingSeconds,
        ttlSeconds: tokenInfo.ttlSeconds,
        expiresAt: tokenInfo.expiresAt,
        scanUrl,
        totalHadir: sesi._count.kehadiran,
      },
    })
  } catch (error) {
    console.error('Error generating presensi token:', error)
    return NextResponse.json(
      { error: 'Gagal membuat token QR dinamis' },
      { status: 500 }
    )
  }
}

