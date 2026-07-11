export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'

// GET /api/categories - List all categories (public) or filter by slug
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    // If slug provided, return single category or empty
    if (slug) {
      const category = await prisma.category.findUnique({
        where: { slug },
      })

      if (!category) {
        return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 })
      }

      return NextResponse.json(category)
    }

    // Otherwise return all categories (public)
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create new category (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await hasPermission(session.user.id, 'settings.edit')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, slug, description, color, icon } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Nama kategori diperlukan' },
        { status: 400 }
      )
    }

    // Generate slug if not provided
    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const category = await prisma.category.create({
      data: {
        name,
        slug: generatedSlug,
        description,
        color: color || '#6366f1',
        icon,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Kategori berhasil dibuat',
      category,
    })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
