export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/api-auth'

// PATCH /api/pages/[slug]/sections/[id] - Update a single section (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    // Require admin authentication
    const { authorized, response } = await requireAdmin(request)
    if (!authorized) return response!

    const { slug, id } = await params

    const page = await prisma.page.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    const existingSection = await prisma.pageSection.findFirst({
      where: { id, pageId: page.id }
    })

    if (!existingSection) {
      return NextResponse.json({ error: 'Section not found on this page' }, { status: 404 })
    }

    const body = await request.json()
    const updateData: any = {}

    if (body.sectionKey !== undefined) updateData.sectionKey = String(body.sectionKey).trim()
    if (body.title !== undefined) updateData.title = body.title ? String(body.title).trim() : null
    if (body.config !== undefined) updateData.config = typeof body.config === 'object' ? body.config : {}
    if (body.content !== undefined) updateData.content = body.content ? String(body.content) : null
    if (body.order !== undefined) updateData.order = Number(body.order)
    if (body.isEnabled !== undefined) updateData.isEnabled = Boolean(body.isEnabled)

    const section = await prisma.pageSection.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(section)
  } catch (error) {
    console.error('Error updating section:', error)
    return NextResponse.json(
      { error: 'Failed to update section' },
      { status: 500 }
    )
  }
}

// DELETE /api/pages/[slug]/sections/[id] - Delete a section (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    // Require admin authentication
    const { authorized, response } = await requireAdmin(request)
    if (!authorized) return response!

    const { slug, id } = await params

    const page = await prisma.page.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    const existingSection = await prisma.pageSection.findFirst({
      where: { id, pageId: page.id }
    })

    if (!existingSection) {
      return NextResponse.json({ error: 'Section not found on this page' }, { status: 404 })
    }

    await prisma.pageSection.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting section:', error)
    return NextResponse.json(
      { error: 'Failed to delete section' },
      { status: 500 }
    )
  }
}
