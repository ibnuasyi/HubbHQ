export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/api-auth'

// POST /api/themes/[slug]/activate - Activate a theme (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Require admin authentication
    const { authorized, response } = await requireAdmin(request)
    if (!authorized) return response!

    const { slug } = await params

    // Check if theme exists
    const existingTheme = await prisma.theme.findUnique({ where: { slug } })
    if (!existingTheme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
    }

    // First, deactivate all themes
    await prisma.theme.updateMany({
      data: { isActive: false }
    })

    // Then activate the selected theme
    const theme = await prisma.theme.update({
      where: { slug },
      data: { isActive: true }
    })

    return NextResponse.json({
      success: true,
      theme
    })
  } catch (error) {
    console.error('Error activating theme:', error)
    return NextResponse.json(
      { error: 'Failed to activate theme' },
      { status: 500 }
    )
  }
}
