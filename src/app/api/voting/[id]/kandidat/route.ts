export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth, hasPermission } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: votingEventId } = await context.params

    const kandidat = await prisma.votingKandidat.findMany({
      where: { votingEventId },
      orderBy: { nomorUrut: 'asc' },
    })

    return NextResponse.json({ success: true, data: kandidat })
  } catch (error) {
    console.error('Error fetching kandidat:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data kandidat' },
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
    const canManage =
      ['admin', 'ketua'].includes(roleName) ||
      (await hasPermission(session.user.id, 'settings.edit')) ||
      (await hasPermission(session.user.id, 'voting.admin'))

    if (!canManage) {
      return NextResponse.json(
        { error: 'Forbidden: Hanya Panitia Musyawarah atau Admin yang dapat mendaftarkan kandidat' },
        { status: 403 }
      )
    }

    const { id: votingEventId } = await context.params
    const body = await request.json()
    const {
      nomorUrut,
      namaKetua,
      namaWakil,
      fotoUrl,
      visi,
      misi,
      programUnggulan,
    } = body

    if (!namaKetua || !namaKetua.trim()) {
      return NextResponse.json(
        { error: 'Nama calon ketua wajib diisi' },
        { status: 400 }
      )
    }

    // Hitung nomor urut jika belum ditentukan
    let noUrut = parseInt(nomorUrut)
    if (!noUrut || isNaN(noUrut)) {
      const count = await prisma.votingKandidat.count({
        where: { votingEventId },
      })
      noUrut = count + 1
    }

    // Periksa keunikan nomor urut
    const existing = await prisma.votingKandidat.findUnique({
      where: {
        votingEventId_nomorUrut: {
          votingEventId,
          nomorUrut: noUrut,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Nomor urut ${noUrut} sudah digunakan oleh paslon lain.` },
        { status: 400 }
      )
    }

    const created = await prisma.votingKandidat.create({
      data: {
        votingEventId,
        nomorUrut: noUrut,
        namaKetua: namaKetua.trim(),
        namaWakil: namaWakil?.trim() || null,
        fotoUrl: fotoUrl?.trim() || null,
        visi: visi?.trim() || null,
        misi: misi?.trim() || null,
        programUnggulan: programUnggulan?.trim() || null,
        suaraSah: 0,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Kandidat paslon berhasil didaftarkan',
      data: created,
    })
  } catch (error) {
    console.error('Error creating kandidat:', error)
    return NextResponse.json(
      { error: 'Gagal menambahkan kandidat' },
      { status: 500 }
    )
  }
}

