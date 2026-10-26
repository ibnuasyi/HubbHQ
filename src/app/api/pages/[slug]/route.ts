export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/api-auth'
import { auth, isSuperAdminRole } from '@/lib/auth'

// GET /api/pages/[slug] - Get single page (public for published pages)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const page = await prisma.page.findUnique({
      where: { slug },
      include: {
        theme: true,
        sections: {
          where: { isEnabled: true },
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    // Protect draft pages from unauthenticated/non-admin inspection
    if (!page.isPublished) {
      const session = await auth()
      const roleName = (session?.user as any)?.role?.name?.toLowerCase() || ''
      if (!isSuperAdminRole(roleName) && roleName !== 'admin' && roleName !== 'ketua') {
        return NextResponse.json(
          { error: 'Page not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(page)
  } catch (error) {
    console.error('Error fetching page:', error)
    return NextResponse.json(
      { error: 'Failed to fetch page' },
      { status: 500 }
    )
  }
}

// PATCH /api/pages/[slug] - Update page (admin only)
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

    const updateData: any = {}
    if (body.title !== undefined) updateData.title = String(body.title).trim()
    if (body.description !== undefined) updateData.description = body.description ? String(body.description).trim() : null
    if (body.type !== undefined) updateData.type = String(body.type)
    if (body.themeId !== undefined) updateData.themeId = body.themeId || null
    if (body.seoTitle !== undefined) updateData.seoTitle = body.seoTitle ? String(body.seoTitle).trim() : null
    if (body.seoDesc !== undefined) updateData.seoDesc = body.seoDesc ? String(body.seoDesc).trim() : null
    if (body.isPublished !== undefined) updateData.isPublished = Boolean(body.isPublished)

    // Sanitize slug if provided
    if (body.slug) {
      updateData.slug = String(body.slug).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
    }

    const page = await prisma.page.update({
      where: { slug },
      data: updateData,
      include: {
        theme: true,
        sections: {
          orderBy: { order: 'asc' }
        }
      }
    })

    return NextResponse.json(page)
  } catch (error) {
    console.error('Error updating page:', error)
    return NextResponse.json(
      { error: 'Failed to update page' },
      { status: 500 }
    )
  }
}

// DELETE /api/pages/[slug] - Delete page (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Require admin authentication
    const { authorized, response } = await requireAdmin(request)
    if (!authorized) return response!

    const { slug } = await params

    await prisma.page.delete({
      where: { slug }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting page:', error)
    return NextResponse.json(
      { error: 'Failed to delete page' },
      { status: 500 }
    )
  }
}
