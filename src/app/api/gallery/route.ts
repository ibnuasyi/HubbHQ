export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/api-auth'

// GET /api/gallery - List all gallery items (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const album = searchParams.get('album')

    const where: Record<string, unknown> = {}
    if (album) where.album = album

    const items = await prisma.gallery.findMany({
      where,
      orderBy: [{ album: 'asc' }, { order: 'asc' }]
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching gallery:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gallery' },
      { status: 500 }
    )
  }
}

// POST /api/gallery - Add a new gallery item (admin only)
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const { authorized, response } = await requireAdmin(request)
    if (!authorized) return response!

    const body = await request.json()
    const { title, album, imageUrl, caption, order } = body

    // Validate required fields
    if (!title || !imageUrl) {
      return NextResponse.json(
        { error: 'Title and imageUrl are required' },
        { status: 400 }
      )
    }

    // Validate image URL format and prevent javascript: XSS
    const trimmedUrl = String(imageUrl).trim()
    if (trimmedUrl.toLowerCase().startsWith('javascript:')) {
      return NextResponse.json(
        { error: 'Invalid image URL format' },
        { status: 400 }
      )
    }

    if (!trimmedUrl.startsWith('/') && !/^https?:\/\//i.test(trimmedUrl)) {
      return NextResponse.json(
        { error: 'Image URL must be a valid relative path or http/https URL' },
        { status: 400 }
      )
    }

    // Get max order if not specified
    let orderToUse = order
    if (orderToUse === undefined) {
      const maxOrder = await prisma.gallery.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true }
      })
      orderToUse = (maxOrder?.order ?? -1) + 1
    }

    const item = await prisma.gallery.create({
      data: {
        title,
        album,
        imageUrl,
        caption,
        order: orderToUse
      }
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error creating gallery item:', error)
    return NextResponse.json(
      { error: 'Failed to create gallery item' },
      { status: 500 }
    )
  }
}
