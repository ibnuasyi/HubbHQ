export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'

// GET /api/proker/[id]/panitia - List panitia
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const panitia = await prisma.panitiaProker.findMany({
      where: { programKerjaId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            phone: true,
            jabatan: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ success: true, data: panitia })
  } catch (error) {
    console.error('Error fetching panitia:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/proker/[id]/panitia - Add panitia member
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await hasPermission(session.user.id, 'proker.edit')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, roleJabatan } = body

    if (!userId || !roleJabatan) {
      return NextResponse.json(
        { error: 'Anggota dan nama jabatan panitia wajib diisi' },
        { status: 400 }
      )
    }

    const panitia = await prisma.panitiaProker.create({
      data: {
        programKerjaId: id,
        userId,
        roleJabatan,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            phone: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Anggota panitia berhasil ditambahkan',
      data: panitia,
    })
  } catch (error: any) {
    console.error('Error adding panitia:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Anggota tersebut sudah memiliki jabatan yang sama di kepanitiaan ini' },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/proker/[id]/panitia - Remove panitia member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await hasPermission(session.user.id, 'proker.edit')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const panitiaId = searchParams.get('panitiaId')

    if (!panitiaId) {
      return NextResponse.json({ error: 'ID Panitia diperlukan' }, { status: 400 })
    }

    await prisma.panitiaProker.delete({
      where: { id: panitiaId },
    })

    return NextResponse.json({
      success: true,
      message: 'Anggota panitia berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting panitia:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

