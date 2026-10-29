export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/api-auth'
import { sanitizeCss } from '@/lib/sanitize'

// GET /api/themes - List all themes
export async function GET(request: NextRequest) {
  try {
    // Public - anyone can view themes
    const themes = await prisma.theme.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(themes)
  } catch (error) {
    console.error('Error fetching themes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch themes' },
      { status: 500 }
    )
  }
}

// POST /api/themes - Install/Create a theme (admin only)
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const { authorized, response } = await requireAdmin(request)
    if (!authorized) return response!

    const body = await request.json()
    const { name, slug, version, description, author, thumbnail, config, css } = body

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Sanitize slug
    const sanitizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')

    // Check if theme already exists
    const existing = await prisma.theme.findUnique({
      where: { slug: sanitizedSlug }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Theme with this slug already exists' },
        { status: 400 }
      )
    }

    const theme = await prisma.theme.create({
      data: {
        name,
        slug: sanitizedSlug,
        version: version || '1.0.0',
        description,
        author,
        thumbnail,
        config: config || {},
        css: css ? sanitizeCss(css) : null,
        isActive: false
      }
    })

    return NextResponse.json(theme, { status: 201 })
  } catch (error) {
    console.error('Error creating theme:', error)
    return NextResponse.json(
      { error: 'Failed to create theme' },
      { status: 500 }
    )
  }
}
