export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'

// DELETE /api/divisi/[id]/members/[memberId] - Remove member from division
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { memberId } = await params

    const hasAccess = await hasPermission(session.user.id, 'divisi.edit')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.divisiMember.delete({
      where: {
        id: memberId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Anggota berhasil dihapus dari divisi',
    })
  } catch (error) {
    console.error('Error removing member from divisi:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
