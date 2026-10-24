export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { auth, hasPermission } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getKtaConfig } from '@/lib/kta-config'

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const canGenerate =
      ['admin', 'ketua', 'sekretaris'].includes(roleName) ||
      (await hasPermission(session.user.id, 'members.edit')) ||
      (await hasPermission(session.user.id, 'settings.edit'))

    if (!canGenerate) {
      return NextResponse.json(
        { error: 'Forbidden: Hanya pengurus berwenang yang dapat menerbitkan NRA massal' },
        { status: 403 }
      )
    }

    const [membersWithoutNra, config] = await Promise.all([
      prisma.user.findMany({
        where: {
          nra: null,
          isActive: true,
          deletedAt: null,
        },
        include: {
          divisiMembers: {
            where: { isActive: true },
            include: { divisi: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      getKtaConfig(),
    ])

    if (membersWithoutNra.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Seluruh anggota aktif sudah memiliki Nomor Registrasi Anggota (NRA).',
        count: 0,
      })
    }

    const currentYear = new Date().getFullYear().toString()
    const pattern = config.formatNra || 'NRA-{YYYY}-{NO}'

    // Ambil nomor urut awal
    const existingCount = await prisma.user.count({
      where: { nra: { not: null } },
    })

    let counter = existingCount
    let generatedCount = 0

    for (const member of membersWithoutNra) {
      counter++
      const nextNumber = counter.toString().padStart(4, '0')
      const divisiCode = (member.divisiMembers?.[0]?.divisi?.name || 'GEN')
        .toUpperCase()
        .substring(0, 4)

      const nra = pattern
        .replace('{YYYY}', currentYear)
        .replace('{YEAR}', currentYear)
        .replace('{DIVISI}', divisiCode)
        .replace('{DIV}', divisiCode)
        .replace('{NO}', nextNumber)

      const issuedAt = new Date()
      const validUntil = new Date(
        Date.now() + config.masaBerlakuTahun * 365 * 24 * 60 * 60 * 1000
      )

      await prisma.user.update({
        where: { id: member.id },
        data: {
          nra,
          ktaIssuedAt: issuedAt,
          ktaValidUntil: validUntil,
        },
      })

      generatedCount++
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menerbitkan ${generatedCount} NRA anggota baru secara massal.`,
      count: generatedCount,
    })
  } catch (error) {
    console.error('Error generating bulk NRA:', error)
    return NextResponse.json(
      { error: 'Gagal menerbitkan NRA massal' },
      { status: 500 }
    )
  }
}

