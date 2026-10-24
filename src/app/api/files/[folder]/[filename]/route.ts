export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { storageService, isPublicFolder, sanitizeFolder } from '@/lib/storage'
import path from 'path'

/**
 * Protected File Access Endpoint
 * Melayani file yang berada di folder terlindungi setelah verifikasi autentikasi.
 * Bekerja secara universal di local disk, S3 (AWS/R2/MinIO/AList), maupun WebDAV.
 *
 * URL Pattern: /api/files/[folder]/[filename]
 */

const MIME_TYPES: Record<string, string> = {
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

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ folder: string; filename: string }> }
) {
  try {
    const { folder, filename } = await context.params

    // Security: Check if folder is public
    if (isPublicFolder(folder)) {
      return NextResponse.json(
        { error: 'Berkas ini dapat diakses secara publik secara langsung.' },
        { status: 403 }
      )
    }

    // Security: Prevent path traversal on folder and filename
    if (
      folder.includes('..') ||
      folder.includes('/') ||
      folder.includes('\\') ||
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\')
    ) {
      return NextResponse.json(
        { error: 'Nama folder atau berkas tidak valid.' },
        { status: 400 }
      )
    }

    const safeFolder = sanitizeFolder(folder)

    // Auth check
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: 'Akses ditolak: Autentikasi diperlukan.' },
        { status: 401 }
      )
    }

    // Jika menggunakan S3/R2 dan mendukung signed URL, alihkan ke signed URL
    const provider = storageService.getProvider()
    if (provider === 's3' || provider === 'r2') {
      const signedUrl = await storageService.getSignedUrl(safeFolder, filename, 3600)
      if (signedUrl) {
        return NextResponse.redirect(signedUrl)
      }
    }

    // Fallback baca berkas langsung (Local, WebDAV, atau S3 proxy)
    const fileBuffer = await storageService.read(safeFolder, filename)
    if (!fileBuffer) {
      return NextResponse.json(
        { error: 'Berkas tidak ditemukan.' },
        { status: 404 }
      )
    }

    const ext = path.extname(filename).toLowerCase()
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream'

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileBuffer.length.toString(),
        'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
    })
  } catch (error) {
    console.error('[STORAGE] Error serving protected file:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server saat memproses berkas.' },
      { status: 500 }
    )
  }
}
