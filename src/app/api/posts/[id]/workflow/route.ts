export const dynamic = 'force-dynamic';

/**
 * CMS Post Workflow Actions API
 *
 * POST /api/posts/[id]/workflow
 * Actions: submit_review, approve, reject, request_revision, publish, archive, unarchive
 *
 * Workflow:
 * DRAFT -> REVIEW -> PUBLISHED
 * DRAFT -> REVIEW -> REVISION -> REVIEW -> PUBLISHED
 * PUBLISHED -> ARCHIVED
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth, isSuperAdminRole } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit-log'

// =====================================================
// Validation
// =====================================================

const workflowActionSchema = z.object({
  action: z.enum(['submit_review', 'approve', 'reject', 'request_revision', 'publish', 'archive', 'unarchive']),
  note: z.string().max(1000).optional().nullable(),
})

// =====================================================
// Permission Check
// =====================================================

async function checkPermission(
  userId: string,
  action: 'submit_review' | 'review' | 'publish' | 'archive'
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: { include: { permissions: true } } },
  })

  if (!user) return false

  // Admin and Super Admin have all permissions
  if (isSuperAdminRole(user.role)) return true

  const permissionMap: Record<string, string[]> = {
    submit_review: ['posts.create', 'posts.manage', 'posts.edit'],
    review: ['posts.review', 'posts.manage', 'posts.publish'],
    publish: ['posts.publish', 'posts.manage'],
    archive: ['posts.publish', 'posts.manage', 'posts.edit'],
  }

  const requiredPermissions = permissionMap[action] || []
  const userPermissions = user.role?.permissions.map(p => p.name) || []

  return requiredPermissions.some(p => userPermissions.includes(p))
}

// =====================================================
// Workflow State Machine
// =====================================================

type PostStatus = 'DRAFT' | 'REVIEW' | 'REVISION' | 'PUBLISHED' | 'ARCHIVED'

interface WorkflowTransition {
  action: string
  to: PostStatus
  requiredPermission: 'submit_review' | 'review' | 'publish' | 'archive'
  allowedForAuthor: boolean
}

const WORKFLOW_TRANSITIONS: Record<PostStatus, WorkflowTransition[]> = {
  DRAFT: [
    { action: 'submit_review', to: 'REVIEW', requiredPermission: 'submit_review', allowedForAuthor: true },
    { action: 'publish', to: 'PUBLISHED', requiredPermission: 'publish', allowedForAuthor: false },
  ],
  REVIEW: [
    { action: 'approve', to: 'PUBLISHED', requiredPermission: 'review', allowedForAuthor: false },
    { action: 'reject', to: 'REVISION', requiredPermission: 'review', allowedForAuthor: false },
    { action: 'request_revision', to: 'REVISION', requiredPermission: 'review', allowedForAuthor: false },
    { action: 'archive', to: 'ARCHIVED', requiredPermission: 'archive', allowedForAuthor: false },
  ],
  REVISION: [
    { action: 'submit_review', to: 'REVIEW', requiredPermission: 'submit_review', allowedForAuthor: true },
    { action: 'publish', to: 'PUBLISHED', requiredPermission: 'publish', allowedForAuthor: false },
  ],
  PUBLISHED: [
    { action: 'archive', to: 'ARCHIVED', requiredPermission: 'archive', allowedForAuthor: false },
  ],
  ARCHIVED: [
    { action: 'unarchive', to: 'PUBLISHED', requiredPermission: 'publish', allowedForAuthor: false },
  ],
}

function getTransition(
  currentStatus: PostStatus,
  action: string
): WorkflowTransition | null {
  const transitions = WORKFLOW_TRANSITIONS[currentStatus] || []
  return transitions.find(t => t.action === action) || null
}

// =====================================================
// POST /api/posts/[id]/workflow
// =====================================================

export async function POST(
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
    const validation = workflowActionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { action, note } = validation.data

    // Get current post
    const post = await prisma.post.findUnique({
      where: { id },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Find valid transition
    const transition = getTransition(post.status as PostStatus, action)

    if (!transition) {
      return NextResponse.json(
        {
          error: `Invalid action '${action}' for post in '${post.status}' status`,
          validActions: WORKFLOW_TRANSITIONS[post.status as PostStatus]?.map(t => t.action) || [],
        },
        { status: 400 }
      )
    }

    // Check permission
    const hasPermission = await checkPermission(session.user.id, transition.requiredPermission)

    // Check if author can perform this action
    const isAuthor = post.authorId === session.user.id
    if (!hasPermission) {
      if (!transition.allowedForAuthor || !isAuthor) {
        return NextResponse.json(
          { error: 'You do not have permission to perform this action' },
          { status: 403 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      status: transition.to,
      reviewNote: note || null,
      reviewedById: ['approve', 'reject', 'request_revision', 'archive', 'unarchive'].includes(action)
        ? session.user.id
        : undefined,
      reviewedAt: ['approve', 'reject', 'request_revision', 'archive', 'unarchive'].includes(action)
        ? new Date()
        : undefined,
    }

    // Set publishedAt when publishing
    if (transition.to === 'PUBLISHED') {
      updateData.publishedAt = new Date()
    }

    // Clear publishedAt when archiving or reverting to draft
    if (transition.to === 'ARCHIVED' || transition.to === 'DRAFT') {
      updateData.publishedAt = null
    }

    // Update post
    const updatedPost = await prisma.post.update({
      where: { id },
      data: updateData,
    })

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'UPDATE',
      entity: 'POST',
      entityId: post.id,
      details: {
        action: `WORKFLOW_${action.toUpperCase()}`,
        postTitle: post.title,
        previousStatus: post.status,
        newStatus: transition.to,
        note,
      },
    })

    // Determine next valid actions
    const nextActions = WORKFLOW_TRANSITIONS[transition.to]?.map(t => t.action) || []

    return NextResponse.json({
      success: true,
      post: {
        id: updatedPost.id,
        title: updatedPost.title,
        status: updatedPost.status,
        publishedAt: updatedPost.publishedAt,
      },
      workflow: {
        previousStatus: post.status,
        currentStatus: transition.to,
        action,
        validNextActions: nextActions,
      },
    })
  } catch (error) {
    console.error('[CMS] Error processing workflow action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =====================================================
// GET /api/posts/[id]/workflow - Get workflow status
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        authorId: true,
        reviewedById: true,
        reviewedAt: true,
        reviewNote: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Get reviewer info if exists
    let reviewer = null
    if (post.reviewedById) {
      const reviewerUser = await prisma.user.findUnique({
        where: { id: post.reviewedById },
        select: { id: true, name: true },
      })
      reviewer = reviewerUser
    }

    // Determine available actions
    const transitions = WORKFLOW_TRANSITIONS[post.status as PostStatus] || []
    const availableActions: string[] = []

    for (const transition of transitions) {
      const hasPermission = await checkPermission(session.user.id, transition.requiredPermission)
      const isAuthor = post.authorId === session.user.id

      if (hasPermission || (transition.allowedForAuthor && isAuthor)) {
        availableActions.push(transition.action)
      }
    }

    return NextResponse.json({
      post: {
        id: post.id,
        title: post.title,
        status: post.status,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      },
      workflow: {
        availableActions,
        validTransitions: transitions.map(t => ({
          action: t.action,
          to: t.to,
          description: getActionDescription(t.action),
        })),
      },
      review: post.reviewNote ? {
        note: post.reviewNote,
        reviewedAt: post.reviewedAt,
        reviewer,
      } : null,
    })
  } catch (error) {
    console.error('[CMS] Error fetching workflow status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// =====================================================
// Helper Functions
// =====================================================

function getActionDescription(action: string): string {
  const descriptions: Record<string, string> = {
    submit_review: 'Kirim untuk direview oleh editor',
    approve: 'Setujui dan terbitkan post',
    reject: 'Tolak post (akan dikembalikan ke author)',
    request_revision: 'Minta revisi dari author',
    publish: 'Terbitkan langsung tanpa review',
    archive: 'Arsipkan post',
    unarchive: 'Kembalikan dari arsip',
  }
  return descriptions[action] || action
}
