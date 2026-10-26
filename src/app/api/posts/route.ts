export const dynamic = 'force-dynamic';

/**
 * CMS Content Workflow API
 *
 * Workflow: DRAFT -> REVIEW -> PUBLISHED
 * atau: DRAFT -> REVIEW -> REVISION -> REVIEW -> PUBLISHED
 * atau: PUBLISHED -> ARCHIVED
 *
 * Roles:
 * - PENULIS (author): Can create drafts, submit for review
 * - EDITOR: Can review and publish/reject content
 * - ADMIN: Full access
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth, isSuperAdminRole } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit-log'
import { sanitize } from '@/lib/sanitize'
import { handleError, ErrorCodes } from '@/lib/api-error'

// =====================================================
// Validation Schemas
// =====================================================

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional(),
  featuredImage: z.string().url().optional().nullable(),
  featuredAlt: z.string().max(200).optional().nullable(),
  category: z.string().max(50).optional().nullable(),
  tags: z.string().max(200).optional().nullable(),
  seoTitle: z.string().max(70).optional().nullable(),
  seoDesc: z.string().max(160).optional().nullable(),
  isFeatured: z.boolean().optional(),
  isSticky: z.boolean().optional(),
})

const updatePostSchema = createPostSchema.partial()

// =====================================================
// Permission Check
// =====================================================

async function checkPermission(
  userId: string,
  action: 'create' | 'read' | 'update' | 'delete' | 'submit_review' | 'review' | 'publish'
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: { include: { permissions: true } } },
  })

  if (!user) return false

  // Admin and Super Admin have all permissions
  if (isSuperAdminRole(user.role)) return true

  const permissionMap: Record<string, string[]> = {
    create: ['posts.create', 'posts.manage'],
    read: ['posts.read', 'posts.manage'],
    update: ['posts.edit', 'posts.manage'],
    delete: ['posts.delete', 'posts.manage'],
    submit_review: ['posts.create', 'posts.manage'],
    review: ['posts.review', 'posts.manage', 'posts.publish'],
    publish: ['posts.publish', 'posts.manage'],
  }

  const requiredPermissions = permissionMap[action] || []
  const userPermissions = user.role?.permissions.map(p => p.name) || []

  return requiredPermissions.some(p => userPermissions.includes(p))
}

// =====================================================
// GET /api/posts
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const includeUnpublished = searchParams.get('includeUnpublished') === 'true'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (status) {
      where.status = status.toUpperCase()
    }

    if (category) {
      // Check if it's a category slug and get the category name
      const categoryRecord = await prisma.category.findUnique({
        where: { slug: category },
      })
      // Filter by category name (since posts store category as string, not relation)
      where.category = categoryRecord ? categoryRecord.name : category
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Only show published posts to public
    const session = await auth()
    if (!session || !includeUnpublished) {
      where.status = 'PUBLISHED'
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: [
          { isSticky: 'desc' },
          { publishedAt: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          featuredImage: true,
          featuredAlt: true,
          category: true,
          tags: true,
          status: true,
          isFeatured: true,
          isSticky: true,
          publishedAt: true,
          authorName: true,
          seoTitle: true,
          seoDesc: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.post.count({ where }),
    ])

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleError(error, 'POSTS_GET')
  }
}

// =====================================================
// POST /api/posts - Create new post
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', code: ErrorCodes.UNAUTHORIZED },
        { status: 401 }
      )
    }

    // Check permission
    const canCreate = await checkPermission(session.user.id, 'create')
    if (!canCreate) {
      return NextResponse.json(
        { error: 'Forbidden', code: ErrorCodes.FORBIDDEN },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = createPostSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: ErrorCodes.VALIDATION_ERROR },
        { status: 400 }
      )
    }

    const data = validation.data

    // Generate slug if not provided
    let slug = data.slug || data.title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100)

    // Check slug uniqueness
    const existingSlug = await prisma.post.findUnique({
      where: { slug },
    })

    if (existingSlug) {
      slug = `${slug}-${Date.now()}`
    }

    // Sanitize content
    const sanitizedContent = sanitize(data.content)
    const sanitizedExcerpt = data.excerpt ? sanitize(data.excerpt) : null

    const post = await prisma.post.create({
      data: {
        title: data.title,
        slug,
        content: sanitizedContent,
        excerpt: sanitizedExcerpt,
        featuredImage: data.featuredImage,
        featuredAlt: data.featuredAlt,
        category: data.category,
        tags: data.tags,
        seoTitle: data.seoTitle,
        seoDesc: data.seoDesc,
        isFeatured: data.isFeatured || false,
        isSticky: data.isSticky || false,
        status: 'DRAFT',
        authorId: session.user.id,
        authorName: session.user.name || null,
      },
    })

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'CREATE',
      entity: 'POST',
      entityId: post.id,
      details: { title: post.title, status: post.status },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    return handleError(error, 'POSTS_CREATE')
  }
}
