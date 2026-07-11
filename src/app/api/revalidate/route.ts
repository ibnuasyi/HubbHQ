export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { CMSRevalidation } from '@/lib/revalidate'

/**
 * POST /api/revalidate
 * Secure cache revalidation endpoint
 * Only allows whitelisted paths/tags
 */

// Whitelist of allowed paths for revalidation
const ALLOWED_PATHS = [
  '/',
  '/tentang',
  '/berita',
  '/galeri',
  '/kontak',
  '/page/',
]

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { paths, tags, type } = body

    // Validate request
    if (!paths && !tags) {
      return NextResponse.json(
        { error: 'paths or tags array required' },
        { status: 400 }
      )
    }

    const revalidated: string[] = []
    const failed: string[] = []

    // Revalidate paths
    if (paths && Array.isArray(paths)) {
      for (const path of paths) {
        if (typeof path !== 'string') continue

        // Validate path format
        const normalizedPath = '/' + path.replace(/^\/+|\/+$/g, '')

        // Check if path is allowed
        const isAllowed = ALLOWED_PATHS.some(
          allowed => normalizedPath === allowed || normalizedPath.startsWith(allowed + '/')
        )

        if (!isAllowed) {
          console.warn(`[CACHE] Blocked path: ${normalizedPath}`)
          failed.push(path)
          continue
        }

        try {
          if (CMSRevalidation.home()) {
            revalidated.push(path)
          }
        } catch (e) {
          console.error(`[CACHE] Failed to revalidate ${path}:`, e)
          failed.push(path)
        }
      }
    }

    // Revalidate tags
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        if (typeof tag !== 'string') continue

        // Validate tag format (alphanumeric, dash, underscore only)
        if (!/^[a-zA-Z0-9_-]+$/.test(tag)) {
          console.warn(`[CACHE] Invalid tag format: ${tag}`)
          failed.push(`tag:${tag}`)
          continue
        }

        try {
          if (CMSRevalidation.tag(tag)) {
            revalidated.push(`tag:${tag}`)
          }
        } catch (e) {
          console.error(`[CACHE] Failed to revalidate tag ${tag}:`, e)
          failed.push(`tag:${tag}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      revalidated,
      failed: failed.length > 0 ? failed : undefined,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[REVALIDATE API ERROR]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check revalidation status
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/revalidate',
    method: 'POST',
    body: {
      paths: ['/', '/berita'],      // Array of paths to revalidate
      tags: ['posts', 'faq'],       // Array of tags to revalidate
    },
    allowedPaths: ALLOWED_PATHS,
    note: 'Authentication required for production use'
  })
}
