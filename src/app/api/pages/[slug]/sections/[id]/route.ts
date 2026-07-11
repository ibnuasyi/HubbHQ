export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAdmin } from '@/lib/api-auth'

const prisma = new PrismaClient()

// PATCH /api/pages/[slug]/sections/[id] - Update a single section (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    // Require admin authentication
    const { authorized, response } = await requireAdmin(request)
    if (!authorized) return response!

    const { id } = await params
    const body = await request.json()

    const section = await prisma.pageSection.update({
      where: { id },
      data: body
    })

    return NextResponse.json(section)
  } catch (error) {
    console.error('Error updating section:', error)
    return NextResponse.json(
      { error: 'Failed to update section' },
      { status: 500 }
    )
  }
}

// DELETE /api/pages/[slug]/sections/[id] - Delete a section (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    // Require admin authentication
    const { authorized, response } = await requireAdmin(request)
    if (!authorized) return response!

    const { id } = await params

    await prisma.pageSection.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting section:', error)
    return NextResponse.json(
      { error: 'Failed to delete section' },
      { status: 500 }
    )
  }
}
