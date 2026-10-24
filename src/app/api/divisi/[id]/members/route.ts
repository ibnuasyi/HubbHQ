export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'

// POST /api/divisi/[id]/members - Add member to division
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

    const hasAccess = await hasPermission(session.user.id, 'divisi.edit')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, position } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID diperlukan' },
        { status: 400 }
      )
    }

    // Check if already a member
    const existing = await prisma.divisiMember.findUnique({
      where: {
        userId_divisiId: {
          userId,
          divisiId: id,
        },
      },
    })

    if (existing) {
      // Reactivate if inactive
      if (!existing.isActive) {
        await prisma.divisiMember.update({
          where: { id: existing.id },
          data: { isActive: true },
        })
        return NextResponse.json({
          success: true,
          message: 'Anggota berhasil diaktifkan kembali',
        })
      }
      return NextResponse.json(
        { error: 'Anggota sudah ada di divisi ini' },
        { status: 400 }
      )
    }

    const member = await prisma.divisiMember.create({
      data: {
        userId,
        divisiId: id,
        position,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        divisi: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Anggota berhasil ditambahkan',
      data: member,
    })
  } catch (error) {
    console.error('Error adding member to divisi:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
