import { revalidatePath, revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

/**
 * Secure Cache Revalidation Utilities
 * Prevents Cache Poisoning attacks via revalidatePath manipulation
 */

/**
 * Safely revalidate a path with validation
 * Only allows whitelisted paths to be revalidated
 */
const ALLOWED_REVALIDATE_PATHS = [
  '/',
  '/tentang',
  '/berita',
  '/berita/',
  '/galeri',
  '/kontak',
]

/**
 * Validate if a path can be revalidated
 * Prevents cache poisoning via path manipulation
 */
export function isPathAllowed(path: string): boolean {
  // Normalize path
  const normalizedPath = '/' + path.replace(/^\/+|\/+$/g, '').toLowerCase()

  // Check exact match
  if (ALLOWED_REVALIDATE_PATHS.includes(normalizedPath)) {
    return true
  }

  // Check prefix match for dynamic routes
  for (const allowedPath of ALLOWED_REVALIDATE_PATHS) {
    if (normalizedPath.startsWith(allowedPath)) {
      return true
    }
  }

  return false
}

/**
 * Safely revalidate a public page
 * Only revalidates whitelisted paths
 */
export function safeRevalidatePath(path: string, type: 'layout' | 'page' = 'page'): boolean {
  if (!isPathAllowed(path)) {
    console.warn(`[CACHE SECURITY] Blocked revalidation attempt for path: ${path}`)
    return false
  }

  try {
    revalidatePath(path, type)
    console.log(`[CACHE] Revalidated: ${path}`)
    return true
  } catch (error) {
    console.error(`[CACHE ERROR] Failed to revalidate ${path}:`, error)
    return false
  }
}

/**
 * Safely revalidate by tag
 * More secure than path-based revalidation
 */
export function safeRevalidateTag(tag: string): boolean {
  // Validate tag format - only alphanumeric and hyphens
  const validTagPattern = /^[a-zA-Z0-9-_]+$/

  if (!validTagPattern.test(tag)) {
    console.warn(`[CACHE SECURITY] Blocked invalid tag: ${tag}`)
    return false
  }

  try {
    revalidateTag(tag, 'max')
    console.log(`[CACHE] Revalidated tag: ${tag}`)
    return true
  } catch (error) {
    console.error(`[CACHE ERROR] Failed to revalidate tag ${tag}:`, error)
    return false
  }
}

/**
 * API Route helper for secure revalidation
 * Use this in your API routes for CMS operations
 */
export function createRevalidateHandler() {
  return async (request: Request) => {
    try {
      const url = new URL(request.url)
      const path = url.searchParams.get('path')
      const tag = url.searchParams.get('tag')

      // Require authentication for revalidation
      // Add your auth check here
      // const session = await auth()
      // if (!session) {
      //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      // }

      if (path) {
        if (!safeRevalidatePath(path)) {
          return NextResponse.json(
            { error: 'Path not allowed for revalidation' },
            { status: 400 }
          )
        }
        return NextResponse.json({ revalidated: true, path })
      }

      if (tag) {
        if (!safeRevalidateTag(tag)) {
          return NextResponse.json(
            { error: 'Invalid tag format' },
            { status: 400 }
          )
        }
        return NextResponse.json({ revalidated: true, tag })
      }

      return NextResponse.json(
        { error: 'path or tag parameter required' },
        { status: 400 }
      )
    } catch (error) {
      console.error('[REVALIDATE ERROR]', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Safe revalidation after CMS operations
 * Call these after creating/updating/deleting content
 */
export const CMSRevalidation = {
  // Homepage
  home: () => safeRevalidatePath('/'),

  // Pages
  page: (slug: string) => {
    if (!slug || typeof slug !== 'string') return false
    // Validate slug format
    const validSlug = /^[a-z0-9-]+$/.test(slug.toLowerCase())
    if (!validSlug) {
      console.warn(`[CACHE] Invalid slug format: ${slug}`)
      return false
    }
    return safeRevalidatePath(`/page/${slug}`)
  },

  // Blog posts
  post: (slug: string) => {
    if (!slug || typeof slug !== 'string') return false
    const validSlug = /^[a-z0-9-]+$/.test(slug.toLowerCase())
    if (!validSlug) return false
    safeRevalidatePath('/berita')
    return safeRevalidatePath(`/berita/${slug}`)
  },

  // FAQ
  faq: () => safeRevalidateTag('faq'),

  // Gallery
  gallery: () => safeRevalidateTag('gallery'),

  // Posts list
  posts: () => safeRevalidateTag('posts'),

  // Custom tag
  tag: (tag: string) => safeRevalidateTag(tag),

  // Multiple paths at once
  multiple: (paths: string[]) => {
    return paths.map(p => safeRevalidatePath(p)).every(Boolean)
  }
}
