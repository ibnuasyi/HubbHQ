export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { storageService, isPublicFolder, STORAGE_CONFIG } from '@/lib/storage'
import path from 'path'
import fs from 'fs'
import { existsSync } from 'fs'

/**
 * Protected File Download Endpoint
 * Only serves files that are NOT in public folders
 *
 * URL Pattern: /api/files/[folder]/[filename]
 * Example: /api/files/avatars/user-123-abc.png
 *
 * This endpoint:
 * - Checks if file is in protected folder
 * - Requires valid session/authentication
 * - Serves the file with proper headers
 */

const LOCAL_BASE_DIR = path.resolve(process.cwd(), STORAGE_CONFIG.local.baseDir)

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ folder: string; filename: string }> }
) {
  try {
    const { folder, filename } = await context.params

    // Security: Check if folder is protected
    if (isPublicFolder(folder)) {
      return NextResponse.json(
        { error: 'This file is publicly accessible. Use direct URL instead.' },
        { status: 403 }
      )
    }

    // Security: Prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      )
    }

    // Auth check
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      )
    }

    // Check if using local storage
    if (storageService.getProvider() !== 'local') {
      // For S3/R2, redirect to signed URL or return error
      return NextResponse.json(
        { error: 'Protected file access for S3/R2 requires signed URLs. Please contact admin.' },
        { status: 501 }
      )
    }

    // Build file path
    const filePath = path.join(LOCAL_BASE_DIR, folder, filename)

    // Security: Ensure path is within base directory
    if (!filePath.startsWith(LOCAL_BASE_DIR)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Get file extension for MIME type
    const ext = path.extname(filename).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
    }

    const mimeType = mimeTypes[ext] || 'application/octet-stream'

    // Read and serve file
    const fileBuffer = fs.readFileSync(filePath)
    const stat = fs.statSync(filePath)

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': stat.size.toString(),
        'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour, but private
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
    })
  } catch (error) {
    console.error('[STORAGE] Error serving protected file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
