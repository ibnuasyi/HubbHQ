export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// GET /api/library - List all books
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    const where: any = { isActive: true }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category) {
      where.category = category
    }

    const [books, total] = await Promise.all([
      prisma.libraryBook.findMany({
        where,
        skip,
        take: limit,
        orderBy: { uploadedAt: 'desc' },
      }),
      prisma.libraryBook.count({ where }),
    ])

    return NextResponse.json({
      data: books,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching library:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/library - Upload new book
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await hasPermission(session.user.id, 'library.upload')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string
    const author = formData.get('author') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string

    if (!title) {
      return NextResponse.json(
        { error: 'Judul buku diperlukan' },
        { status: 400 }
      )
    }

    let fileUrl = ''
    let fileType = ''
    let fileSize = 0

    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Ukuran berkas buku melebihi batas maksimum 50 MB' },
          { status: 400 }
        )
      }

      const rawExt = file.name.split('.').pop()?.toLowerCase() || ''
      const allowedExts = ['pdf', 'epub', 'doc', 'docx']
      if (!allowedExts.includes(rawExt)) {
        return NextResponse.json(
          { error: 'Ekstensi berkas tidak diizinkan. Hanya berkas PDF, EPUB, DOC, dan DOCX yang diperbolehkan.' },
          { status: 400 }
        )
      }

      // Ensure upload directory exists
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'library')
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
      }

      // Generate unique filename
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${rawExt}`
      const filepath = join(uploadDir, filename)

      // Save file
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filepath, buffer)

      fileUrl = `/uploads/library/${filename}`
      fileType = file.type || `application/${rawExt}`
      fileSize = buffer.length
    }

    const book = await prisma.libraryBook.create({
      data: {
        title,
        author,
        description,
        category,
        fileUrl,
        fileType,
        fileSize,
        uploadedById: session.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Buku berhasil diupload',
      data: book,
    })
  } catch (error) {
    console.error('Error uploading book:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
