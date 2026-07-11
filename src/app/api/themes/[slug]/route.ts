export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAdmin } from '@/lib/api-auth'

const prisma = new PrismaClient()

// GET /api/themes/[slug] - Get single theme (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const theme = await prisma.theme.findUnique({
      where: { slug }
    })

    if (!theme) {
      return NextResponse.json(
        { error: 'Theme not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(theme)
  } catch (error) {
    console.error('Error fetching theme:', error)
    return NextResponse.json(
      { error: 'Failed to fetch theme' },
      { status: 500 }
    )
  }
}

// PATCH /api/themes/[slug] - Update theme (admin only)
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

    // Prevent changing critical fields
    const allowedFields = ['name', 'description', 'author', 'thumbnail', 'config', 'css']
    const sanitizedBody: Record<string, unknown> = {}

    for (const key of allowedFields) {
      if (key in body) {
        sanitizedBody[key] = body[key]
      }
    }

    const theme = await prisma.theme.update({
      where: { slug },
      data: sanitizedBody
    })

    return NextResponse.json(theme)
  } catch (error) {
    console.error('Error updating theme:', error)
    return NextResponse.json(
      { error: 'Failed to update theme' },
      { status: 500 }
    )
  }
}

// DELETE /api/themes/[slug] - Delete theme (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Require admin authentication
    const { authorized, response } = await requireAdmin(request)
    if (!authorized) return response!

    const { slug } = await params

    // Check if theme exists
    const theme = await prisma.theme.findUnique({
      where: { slug }
    })

    if (!theme) {
      return NextResponse.json(
        { error: 'Theme not found' },
        { status: 404 }
      )
    }

    if (theme.isActive) {
      return NextResponse.json(
        { error: 'Cannot delete active theme. Please activate another theme first.' },
        { status: 400 }
      )
    }

    await prisma.theme.delete({
      where: { slug }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting theme:', error)
    return NextResponse.json(
      { error: 'Failed to delete theme' },
      { status: 500 }
    )
  }
}
