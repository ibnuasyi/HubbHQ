export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/api-auth'
import { auth, hasPermission, isSuperAdminRole } from '@/lib/auth'

// GET /api/pages/[slug]/sections - Get sections for a page (public for published pages)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const page = await prisma.page.findUnique({
      where: { slug },
      select: { id: true, isPublished: true }
    })

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    if (!page.isPublished) {
      const session = await auth()
      let canViewDrafts = false
      if (session?.user?.id) {
        const role = (session.user as any)?.role
        const roleName = (typeof role === 'string' ? role : role?.name || '').toLowerCase()
        canViewDrafts =
          isSuperAdminRole(role) ||
          ['admin', 'superadmin', 'ketua'].includes(roleName) ||
          (await hasPermission(session.user.id, 'content.view')) ||
          (await hasPermission(session.user.id, 'content.edit'))
      }
      if (!canViewDrafts) {
        return NextResponse.json(
          { error: 'Page not found' },
          { status: 404 }
        )
      }
    }

    const sections = await prisma.pageSection.findMany({
      where: { pageId: page.id },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(sections)
  } catch (error) {
    console.error('Error fetching sections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    )
  }
}

// POST /api/pages/[slug]/sections - Add a new section (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Require admin authentication
    const { authorized, response } = await requireAdmin(request)
    if (!authorized) return response!

    const { slug } = await params
    const body = await request.json()
    const { sectionKey, title, config, content, order, isEnabled } = body

    // Validate required fields
    if (!sectionKey) {
      return NextResponse.json(
        { error: 'Section key is required' },
        { status: 400 }
      )
    }

    const page = await prisma.page.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    // Get max order if not specified
    let orderToUse = order
    if (orderToUse === undefined) {
      const maxOrder = await prisma.pageSection.findFirst({
        where: { pageId: page.id },
        orderBy: { order: 'desc' },
        select: { order: true }
      })
      orderToUse = (maxOrder?.order ?? -1) + 1
    }

    const section = await prisma.pageSection.create({
      data: {
        pageId: page.id,
        sectionKey,
        title,
        config: config || {},
        content,
        order: orderToUse,
        isEnabled: isEnabled !== false
      }
    })

    return NextResponse.json(section, { status: 201 })
  } catch (error) {
    console.error('Error creating section:', error)
    return NextResponse.json(
      { error: 'Failed to create section' },
      { status: 500 }
    )
  }
}

// PATCH /api/pages/[slug]/sections - Update/reorder sections (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Require admin authentication
    const { authorized, response } = await requireAdmin(request)
    if (!authorized) return response!

    const { slug } = await params
    const body = await request.json()
    const { sections } = body // Array of { id, order, config, content, isEnabled }

    const page = await prisma.page.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    // Validate sections array
    if (!Array.isArray(sections)) {
      return NextResponse.json(
        { error: 'Invalid sections data' },
        { status: 400 }
      )
    }

    // Verify all section IDs belong to this page (BOLA protection)
    const sectionIds = sections.map((s: any) => s.id).filter(Boolean)
    const existingSections = await prisma.pageSection.findMany({
      where: {
        id: { in: sectionIds },
        pageId: page.id,
      },
      select: { id: true },
    })

    const validIds = new Set(existingSections.map((s) => s.id))
    const invalidIds = sectionIds.filter((id: string) => !validIds.has(id))
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: 'Beberapa section ID tidak valid atau bukan milik halaman ini' },
        { status: 400 }
      )
    }

    // Update multiple sections
    const updates = sections.map((s: { id: string; order?: number; config?: Record<string, unknown>; content?: string; title?: string; isEnabled?: boolean }) =>
      prisma.pageSection.update({
        where: { id: s.id },
        data: {
          order: s.order,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          config: s.config as any,
          content: s.content,
          title: s.title,
          isEnabled: s.isEnabled
        }
      })
    )

    const updated = await prisma.$transaction(updates)

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating sections:', error)
    return NextResponse.json(
      { error: 'Failed to update sections' },
      { status: 500 }
    )
  }
}
