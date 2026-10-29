export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getKtaConfig } from '@/lib/kta-config'
import { checkRateLimit } from '@/lib/api-security'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'anonymous'
    const rate = checkRateLimit(`kta-verify:${clientIp}`, {
      windowMs: 60000,
      maxRequests: 30,
    })
    if (!rate.allowed) {
      return NextResponse.json(
        { isVerified: false, error: 'Terlalu banyak permintaan verifikasi KTA. Silakan coba lagi nanti.' },
        { status: 429 }
      )
    }

    const { code } = await context.params
    const decodedCode = decodeURIComponent(code).trim()

    // Cari berdasarkan NRA atau ID
    const [user, config] = await Promise.all([
      prisma.user.findFirst({
        where: {
          OR: [{ nra: decodedCode }, { id: decodedCode }],
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          fullName: true,
          avatar: true,
          nra: true,
          bloodType: true,
          isActive: true,
          ktaIssuedAt: true,
          ktaValidUntil: true,
          createdAt: true,
          role: { select: { displayName: true } },
          jabatan: { select: { name: true } },
          wilayah: { select: { name: true } },
          divisiMembers: {
            where: { isActive: true },
            select: { divisi: { select: { name: true } } },
          },
        },
      }),
      getKtaConfig(),
    ])

    if (!user) {
      return NextResponse.json(
        {
          isVerified: false,
          error: 'Nomor Registrasi Anggota (NRA) tidak ditemukan dalam basis data resmi organisasi.',
        },
        { status: 404 }
      )
    }

    const isExpired = user.ktaValidUntil ? new Date(user.ktaValidUntil) < new Date() : false

    return NextResponse.json({
      isVerified: true,
      data: {
        id: user.id,
        name: user.fullName || user.name,
        nra: user.nra,
        avatar: user.avatar,
        bloodType: user.bloodType,
        isActive: user.isActive,
        isExpired,
        role: user.role?.displayName || 'Anggota',
        jabatan: user.jabatan?.name || 'Anggota Aktif',
        divisi: user.divisiMembers?.[0]?.divisi?.name || 'Umum',
        wilayah: user.wilayah?.name || 'Pusat',
        ktaIssuedAt: user.ktaIssuedAt,
        ktaValidUntil: user.ktaValidUntil,
        organization: {
          nama: config.namaOrganisasi,
          subNama: config.subNamaOrganisasi,
          logoUrl: config.logoUrl,
        },
      },
    })
  } catch (error) {
    console.error('Error verifying KTA code:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memverifikasi KTA' },
      { status: 500 }
    )
  }
}

