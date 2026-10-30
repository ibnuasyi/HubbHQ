export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth, hasPermission } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateVotingToken } from '@/lib/voting'

async function canManageElection(userId: string, roleName: string): Promise<boolean> {
  if (['admin', 'ketua'].includes(roleName)) return true
  if (await hasPermission(userId, 'settings.edit')) return true
  if (await hasPermission(userId, 'voting.admin')) return true
  return false
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: votingEventId } = await context.params
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const filter = searchParams.get('filter') // 'ALL' | 'VOTED' | 'NOT_VOTED'

    const where: any = { votingEventId }

    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { nraOrNim: { contains: search } },
        { emailOrPhone: { contains: search } },
      ]
    }

    if (filter === 'VOTED') {
      where.hasVoted = true
    } else if (filter === 'NOT_VOTED') {
      where.hasVoted = false
    }

    const dptList = await prisma.votingDPT.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            nra: true,
          },
        },
      },
      orderBy: { nama: 'asc' },
    })

    const totalDpt = await prisma.votingDPT.count({ where: { votingEventId } })
    const totalVoted = await prisma.votingDPT.count({
      where: { votingEventId, hasVoted: true },
    })

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const isManager = await canManageElection(session.user.id, roleName)

    // Security: Token bilik suara bersifat rahasia. Hanya admin pemilihan atau pemilih pemilik akun yang dapat melihat token miliknya.
    const safeDptList = dptList.map((entry) => {
      const isSelf = Boolean(entry.userId && entry.userId === session.user.id)
      if (isManager || isSelf) {
        return entry
      }
      return {
        ...entry,
        votingToken: '********',
      }
    })

    return NextResponse.json({
      success: true,
      data: safeDptList,
      stats: {
        total: totalDpt,
        voted: totalVoted,
        notVoted: totalDpt - totalVoted,
        percentage:
          totalDpt > 0 ? Math.round((totalVoted / totalDpt) * 100) : 0,
      },
    })
  } catch (error) {
    console.error('Error fetching DPT:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil Daftar Pemilih Tetap' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const isManager = await canManageElection(session.user.id, roleName)
    if (!isManager) {
      return NextResponse.json(
        { error: 'Forbidden: Hanya Panitia Pemilihan atau Admin yang dapat menetapkan DPT' },
        { status: 403 }
      )
    }

    const { id: votingEventId } = await context.params
    const body = await request.json()
    const { action, userId, nama, nraOrNim, emailOrPhone, divisiId } = body

    // 1. Opsi Impor Massal Seluruh Anggota Aktif
    if (action === 'IMPORT_ALL_ACTIVE') {
      const activeUsers = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, name: true, fullName: true, nra: true, email: true, phone: true },
      })

      let addedCount = 0
      for (const u of activeUsers) {
        const displayName = u.fullName || u.name || 'Anggota'
        // Cek jika sudah terdaftar
        const exist = await prisma.votingDPT.findUnique({
          where: {
            votingEventId_userId: { votingEventId, userId: u.id },
          },
        })

        if (!exist) {
          await prisma.votingDPT.create({
            data: {
              votingEventId,
              userId: u.id,
              nama: displayName,
              nraOrNim: u.nra || null,
              emailOrPhone: u.email || u.phone || null,
              votingToken: generateVotingToken(),
              hasVoted: false,
            },
          })
          addedCount++
        }
      }

      return NextResponse.json({
        success: true,
        message: `Berhasil menetapkan ${addedCount} anggota aktif ke dalam DPT`,
      })
    }

    // 2. Opsi Impor Berdasarkan Divisi
    if (action === 'IMPORT_BY_DIVISI' && divisiId) {
      const members = await prisma.divisiMember.findMany({
        where: { divisiId, isActive: true },
        include: { user: true },
      })

      let addedCount = 0
      for (const m of members) {
        const u = m.user
        const displayName = u.fullName || u.name || 'Anggota'
        const exist = await prisma.votingDPT.findUnique({
          where: {
            votingEventId_userId: { votingEventId, userId: u.id },
          },
        })

        if (!exist) {
          await prisma.votingDPT.create({
            data: {
              votingEventId,
              userId: u.id,
              nama: displayName,
              nraOrNim: u.nra || null,
              emailOrPhone: u.email || u.phone || null,
              votingToken: generateVotingToken(),
              hasVoted: false,
            },
          })
          addedCount++
        }
      }

      return NextResponse.json({
        success: true,
        message: `Berhasil menambahkan ${addedCount} anggota divisi ke dalam DPT`,
      })
    }

    // 3. Tambah Manual Satuan
    if (!nama || !nama.trim()) {
      return NextResponse.json(
        { error: 'Nama pemilih wajib diisi' },
        { status: 400 }
      )
    }

    if (userId) {
      const existing = await prisma.votingDPT.findUnique({
        where: {
          votingEventId_userId: { votingEventId, userId },
        },
      })
      if (existing) {
        return NextResponse.json(
          { error: 'Anggota ini sudah terdaftar dalam DPT musyawarah ini' },
          { status: 400 }
        )
      }
    }

    const created = await prisma.votingDPT.create({
      data: {
        votingEventId,
        userId: userId || null,
        nama: nama.trim(),
        nraOrNim: nraOrNim?.trim() || null,
        emailOrPhone: emailOrPhone?.trim() || null,
        votingToken: generateVotingToken(),
        hasVoted: false,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Pemilih berhasil ditambahkan ke DPT',
      data: created,
    })
  } catch (error) {
    console.error('Error adding DPT:', error)
    return NextResponse.json(
      { error: 'Gagal menambahkan pemilih ke DPT' },
      { status: 500 }
    )
  }
}

