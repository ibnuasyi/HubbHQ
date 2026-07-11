export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAdmin } from '@/lib/api-auth'

const prisma = new PrismaClient()

// GET /api/gallery/[id] - Get single gallery item (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const item = await prisma.gallery.findUnique({
      where: { id }
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Gallery item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error fetching gallery item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gallery item' },
      { status: 500 }
    )
  }
}

// PATCH /api/gallery/[id] - Update gallery item (admin only)
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

    // Validate URL if provided
    if (body.imageUrl) {
      try {
        new URL(body.imageUrl)
      } catch {
        return NextResponse.json(
          { error: 'Invalid image URL format' },
          { status: 400 }
        )
      }
    }

    const item = await prisma.gallery.update({
      where: { id },
      data: body
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating gallery item:', error)
    return NextResponse.json(
      { error: 'Failed to update gallery item' },
      { status: 500 }
    )
  }
}

// DELETE /api/gallery/[id] - Delete gallery item (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const { authorized, response } = await requireAdmin(request)
    if (!authorized) return response!

    const { id } = await params

    await prisma.gallery.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting gallery item:', error)
    return NextResponse.json(
      { error: 'Failed to delete gallery item' },
      { status: 500 }
    )
  }
}
