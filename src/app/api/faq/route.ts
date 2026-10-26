export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/api-auth'
import { auth, isSuperAdminRole } from '@/lib/auth'

// GET /api/faq - List all FAQ items (public for published FAQs)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const published = searchParams.get('published')

    const session = await auth()
    const roleName = (session?.user as any)?.role?.name?.toLowerCase() || ''
    const isAdmin = isSuperAdminRole(roleName) || roleName === 'admin' || roleName === 'ketua'

    const where: Record<string, unknown> = {}
    if (category) where.category = category

    // If not admin, only show published FAQs
    if (!isAdmin) {
      where.isPublished = true
    } else if (published !== null) {
      where.isPublished = published === 'true'
    }

    const items = await prisma.faq.findMany({
      where,
      orderBy: [{ category: 'asc' }, { order: 'asc' }]
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching FAQ:', error)
    return NextResponse.json(
      { error: 'Failed to fetch FAQ' },
      { status: 500 }
    )
  }
}

// POST /api/faq - Add a new FAQ item (admin only)
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const { authorized, response } = await requireAdmin(request)
    if (!authorized) return response!

    const body = await request.json()
    const { question, answer, category, order, isPublished } = body

    // Validate required fields
    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
        { status: 400 }
      )
    }

    // Get max order if not specified
    let orderToUse = order
    if (orderToUse === undefined) {
      const maxOrder = await prisma.faq.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true }
      })
      orderToUse = (maxOrder?.order ?? -1) + 1
    }

    const item = await prisma.faq.create({
      data: {
        question,
        answer,
        category,
        order: orderToUse,
        isPublished: isPublished !== false
      }
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error creating FAQ:', error)
    return NextResponse.json(
      { error: 'Failed to create FAQ' },
      { status: 500 }
    )
  }
}
