export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth, hasPermission } from '@/lib/auth'

// GET /api/documents - List all documents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const isPublic = searchParams.get('public')

    const session = await auth()
    const where: Record<string, unknown> = {}

    // Force isPublic = true for unauthenticated users
    if (!session?.user?.id || isPublic === 'true') {
      where.isPublic = true
    }

    if (category) where.category = category

    const documents = await prisma.document.findMany({
      where,
      orderBy: [{ category: 'asc' }, { uploadedAt: 'desc' }]
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

// POST /api/documents - Create a new document (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const canManageDoc =
      ['admin', 'ketua', 'sekretaris'].includes(roleName) ||
      (await hasPermission(session.user.id, 'settings.edit'))

    if (!canManageDoc) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, category, description, fileUrl, fileType, fileSize, isPublic } = body

    // Validate required fields
    if (!title || !fileUrl) {
      return NextResponse.json(
        { error: 'Title and fileUrl are required' },
        { status: 400 }
      )
    }

    // Validate URL format and prevent javascript:
    if (fileUrl.trim().toLowerCase().startsWith('javascript:')) {
      return NextResponse.json(
        { error: 'Invalid file URL' },
        { status: 400 }
      )
    }

    const document = await prisma.document.create({
      data: {
        title,
        category,
        description,
        fileUrl,
        fileType,
        fileSize,
        uploadedById: session.user.id,
        isPublic: isPublic !== false
      }
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    )
  }
}
