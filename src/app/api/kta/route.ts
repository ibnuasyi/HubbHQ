export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getKtaConfig, generateNextNra } from '@/lib/kta-config'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [user, config] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          role: true,
          jabatan: true,
          wilayah: true,
          divisiMembers: {
            where: { isActive: true },
            include: { divisi: true },
          },
        },
      }),
      getKtaConfig(),
    ])

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          fullName: user.fullName || user.name,
          nickname: user.nickname,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          signature: user.signature,
          nra: user.nra,
          bloodType: user.bloodType,
          emergencyContact: user.emergencyContact,
          ktaIssuedAt: user.ktaIssuedAt,
          ktaValidUntil: user.ktaValidUntil,
          ktaCardUrl: user.ktaCardUrl,
          createdAt: user.createdAt,
          role: user.role,
          jabatan: user.jabatan,
          wilayah: user.wilayah,
          divisi: user.divisiMembers?.[0]?.divisi || null,
        },
        config,
      },
    })
  } catch (error) {
    console.error('Error fetching current user KTA:', error)
    return NextResponse.json(
      { error: 'Gagal memuat data KTA anggota' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { bloodType, emergencyContact } = body

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        divisiMembers: {
          where: { isActive: true },
          include: { divisi: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    const config = await getKtaConfig()

    // Jika belum ada NRA, buat otomatis
    let nra = user.nra
    if (!nra) {
      const divisiCode = user.divisiMembers?.[0]?.divisi?.name || 'GEN'
      nra = await generateNextNra(config.formatNra, divisiCode)
    }

    const issuedAt = user.ktaIssuedAt || new Date()
    const validUntil =
      user.ktaValidUntil ||
      new Date(Date.now() + config.masaBerlakuTahun * 365 * 24 * 60 * 60 * 1000)

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        nra,
        bloodType: bloodType !== undefined ? bloodType?.trim() || null : user.bloodType,
        emergencyContact:
          emergencyContact !== undefined ? emergencyContact?.trim() || null : user.emergencyContact,
        ktaIssuedAt: issuedAt,
        ktaValidUntil: validUntil,
      },
      include: {
        role: true,
        jabatan: true,
        wilayah: true,
        divisiMembers: {
          where: { isActive: true },
          include: { divisi: true },
        },
      },
    })

    delete (updatedUser as any).password

    return NextResponse.json({
      success: true,
      message: 'KTA Digital berhasil diterbitkan / diperbarui',
      data: {
        user: updatedUser,
        config,
      },
    })
  } catch (error) {
    console.error('Error generating user KTA:', error)
    return NextResponse.json(
      { error: 'Gagal menerbitkan KTA digital' },
      { status: 500 }
    )
  }
}

