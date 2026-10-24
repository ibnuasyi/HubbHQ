export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin, requireAuth } from '@/lib/api-auth'

// GET /api/pages - List all pages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const published = searchParams.get('published')

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (published !== null) where.isPublished = published === 'true'

    const pages = await prisma.page.findMany({
      where,
      include: {
        theme: {
          select: {
            name: true,
            slug: true,
            thumbnail: true
          }
        },
        _count: {
          select: { sections: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(pages)
  } catch (error) {
    console.error('Error fetching pages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 }
    )
  }
}

// POST /api/pages - Create a new page (admin only)
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const { authorized, response } = await requireAdmin(request)
    if (!authorized) return response!

    const body = await request.json()
    const { title, slug, description, type, themeId, seoTitle, seoDesc } = body

    // Validate required fields
    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      )
    }

    // Sanitize slug
    const sanitizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')

    // Check if slug already exists
    const existing = await prisma.page.findUnique({
      where: { slug: sanitizedSlug }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Page with this slug already exists' },
        { status: 400 }
      )
    }

    // Get active theme if not specified
    let themeIdToUse = themeId
    if (!themeIdToUse) {
      const activeTheme = await prisma.theme.findFirst({
        where: { isActive: true }
      })
      themeIdToUse = activeTheme?.id
    }

    const page = await prisma.page.create({
      data: {
        title,
        slug: sanitizedSlug,
        description,
        type: type || 'page',
        themeId: themeIdToUse,
        seoTitle,
        seoDesc,
        isPublished: false
      },
      include: {
        theme: true
      }
    })

    return NextResponse.json(page, { status: 201 })
  } catch (error) {
    console.error('Error creating page:', error)
    return NextResponse.json(
      { error: 'Failed to create page' },
      { status: 500 }
    )
  }
}
