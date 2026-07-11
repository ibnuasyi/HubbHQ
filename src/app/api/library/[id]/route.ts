export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'

// GET /api/library/[id] - Get single book
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

    const book = await prisma.libraryBook.findUnique({
      where: { id },
    })

    if (!book) {
      return NextResponse.json(
        { error: 'Buku tidak ditemukan' },
        { status: 404 }
      )
    }

    // Increment view count
    await prisma.libraryBook.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    return NextResponse.json({
      data: book,
    })
  } catch (error) {
    console.error('Error fetching book:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/library/[id] - Update book
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await hasPermission(session.user.id, 'library.upload')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, author, description, category } = body

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (author !== undefined) updateData.author = author
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category

    const book = await prisma.libraryBook.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'Buku berhasil diupdate',
      data: book,
    })
  } catch (error) {
    console.error('Error updating book:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/library/[id] - Delete book
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await hasPermission(session.user.id, 'library.upload')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Soft delete
    await prisma.libraryBook.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({
      success: true,
      message: 'Buku berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting book:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
