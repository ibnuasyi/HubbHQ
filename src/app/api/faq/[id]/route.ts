export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAdmin } from '@/lib/api-auth'

const prisma = new PrismaClient()

// PATCH /api/faq/[id] - Update FAQ item (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const { authorized, response } = await requireAdmin(request)
    if (!authorized) return response!

    const { id } = await params
    const body = await request.json()

    // Validate required fields
    if (body.question === '' || body.answer === '') {
      return NextResponse.json(
        { error: 'Question and answer cannot be empty' },
        { status: 400 }
      )
    }

    const item = await prisma.faq.update({
      where: { id },
      data: body
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating FAQ:', error)
    return NextResponse.json(
      { error: 'Failed to update FAQ' },
      { status: 500 }
    )
  }
}

// DELETE /api/faq/[id] - Delete FAQ item (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const { authorized, response } = await requireAdmin(request)
    if (!authorized) return response!

    const { id } = await params

    await prisma.faq.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting FAQ:', error)
    return NextResponse.json(
      { error: 'Failed to delete FAQ' },
      { status: 500 }
    )
  }
}
