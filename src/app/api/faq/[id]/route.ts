export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/api-auth'

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
    const { question, answer, category, order, isPublished } = body

    // Validate required fields if updated
    if (question !== undefined && !question.trim()) {
      return NextResponse.json(
        { error: 'Question cannot be empty' },
        { status: 400 }
      )
    }

    if (answer !== undefined && !answer.trim()) {
      return NextResponse.json(
        { error: 'Answer cannot be empty' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (question !== undefined) updateData.question = question.trim()
    if (answer !== undefined) updateData.answer = answer.trim()
    if (category !== undefined) updateData.category = category ? category.trim() : null
    if (order !== undefined) updateData.order = Number(order)
    if (isPublished !== undefined) updateData.isPublished = Boolean(isPublished)

    const item = await prisma.faq.update({
      where: { id },
      data: updateData,
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
