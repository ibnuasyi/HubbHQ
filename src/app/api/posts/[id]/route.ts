export const dynamic = 'force-dynamic';

/**
 * CMS Post Detail & Workflow API
 *
 * Handles:
 * - GET: View post details
 * - PATCH: Update post content
 * - DELETE: Delete post
 * - POST: Workflow actions (submit_review, approve, reject, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth, isSuperAdminRole } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit-log'
import { sanitize } from '@/lib/sanitize'

// =====================================================
// Validation Schemas
// =====================================================

const updatePostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().max(500).optional().nullable(),
  featuredImage: z.string().url().optional().nullable(),
  featuredAlt: z.string().max(200).optional().nullable(),
  category: z.string().max(50).optional().nullable(),
  tags: z.string().max(200).optional().nullable(),
  seoTitle: z.string().max(70).optional().nullable(),
  seoDesc: z.string().max(160).optional().nullable(),
  isFeatured: z.boolean().optional(),
  isSticky: z.boolean().optional(),
  featuredImageId: z.string().optional().nullable(),
})

const workflowActionSchema = z.object({
  action: z.enum(['submit_review', 'approve', 'reject', 'request_revision', 'publish', 'archive', 'unarchive']),
  note: z.string().max(1000).optional(),
})

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
// Workflow State Machine
// =====================================================

type PostStatus = 'DRAFT' | 'REVIEW' | 'REVISION' | 'PUBLISHED' | 'ARCHIVED'

const VALID_TRANSITIONS: Record<PostStatus, { action: string; to: PostStatus }[]> = {
  DRAFT: [
    { action: 'submit_review', to: 'REVIEW' },
    { action: 'publish', to: 'PUBLISHED' }, // Direct publish for admins
  ],
  REVIEW: [
    { action: 'approve', to: 'PUBLISHED' },
    { action: 'reject', to: 'REVISION' },
    { action: 'request_revision', to: 'REVISION' },
    { action: 'archive', to: 'ARCHIVED' },
  ],
  REVISION: [
    { action: 'submit_review', to: 'REVIEW' },
    { action: 'publish', to: 'PUBLISHED' }, // Force publish
  ],
  PUBLISHED: [
    { action: 'archive', to: 'ARCHIVED' },
    { action: 'unarchive', to: 'PUBLISHED' },
  ],
  ARCHIVED: [
    { action: 'unarchive', to: 'PUBLISHED' },
  ],
}

function canTransition(currentStatus: PostStatus, action: string): PostStatus | null {
  const transitions = VALID_TRANSITIONS[currentStatus] || []
  const transition = transitions.find(t => t.action === action)
  return transition?.to || null
}

// =====================================================
// GET /api/posts/[id]
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const includeUnpublished = searchParams.get('includeUnpublished') === 'true'

    const post = await prisma.post.findUnique({
      where: { id },
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if user can view unpublished
    const session = await auth()
    if (post.status !== 'PUBLISHED' && post.status !== 'ARCHIVED') {
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        )
      }

      const canView = await checkPermission(session.user.id, 'read')
      if (!canView) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('[CMS] Error fetching post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =====================================================
// PATCH /api/posts/[id] - Update post
// =====================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validation = updatePostSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    // Get current post
    const currentPost = await prisma.post.findUnique({
      where: { id },
    })

    if (!currentPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check permission
    const canUpdate = await checkPermission(session.user.id, 'update')

    // Only author can update their own drafts
    const isAuthor = currentPost.authorId === session.user.id
    if (!canUpdate && !isAuthor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Non-admins can't update published posts
    if (currentPost.status === 'PUBLISHED') {
      const canPublish = await checkPermission(session.user.id, 'publish')
      if (!canPublish) {
        return NextResponse.json(
          { error: 'Cannot edit published posts. Request unpublish first.' },
          { status: 403 }
        )
      }
    }

    const data = validation.data

    // Sanitize slug if provided
    if (data.slug) {
      const sanitizedSlug = data.slug.toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')

      // Check uniqueness
      const existing = await prisma.post.findFirst({
        where: { slug: sanitizedSlug, NOT: { id } },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Slug already in use' },
          { status: 400 }
        )
      }

      data.slug = sanitizedSlug
    }

    // Sanitize content
    if (data.content) {
      data.content = sanitize(data.content)
    }
    if (data.excerpt) {
      data.excerpt = sanitize(data.excerpt)
    }

    // Update post
    const post = await prisma.post.update({
      where: { id },
      data,
    })

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'UPDATE',
      entity: 'POST',
      entityId: post.id,
      details: {
        title: post.title,
        changes: Object.keys(data),
      },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('[CMS] Error updating post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =====================================================
// DELETE /api/posts/[id]
// =====================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check permission
    const canDelete = await checkPermission(session.user.id, 'delete')
    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const post = await prisma.post.delete({
      where: { id },
    })

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'DELETE',
      entity: 'POST',
      entityId: id,
      details: { title: post.title },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[CMS] Error deleting post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
