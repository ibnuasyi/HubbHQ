export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAdmin } from '@/lib/api-auth'

const prisma = new PrismaClient()

// GET /api/documents - List all documents (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const isPublic = searchParams.get('public')

    const where: Record<string, unknown> = {}
    if (category) where.category = category
    if (isPublic === 'true') where.isPublic = true

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
    // Require admin authentication
    const { authorized, response } = await requireAdmin(request)
    if (!authorized) return response!

    const body = await request.json()
    const { title, category, description, fileUrl, fileType, fileSize, uploadedById, isPublic } = body

    // Validate required fields
    if (!title || !fileUrl) {
      return NextResponse.json(
        { error: 'Title and fileUrl are required' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(fileUrl)
    } catch {
      return NextResponse.json(
        { error: 'Invalid file URL format' },
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
        uploadedById,
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
