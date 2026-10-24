export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import sharp from 'sharp'
import { storageService, sanitizeFolder } from '@/lib/storage'
import { checkRateLimitByIP, getClientIP } from '@/lib/rate-limit'

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '15728640') // 15MB

// Magic bytes for file type validation
const FILE_SIGNATURES: Record<string, { mime: string; ext: string }> = {
  '89504e47': { mime: 'image/png', ext: '.png' },
  'ffd8ffe0': { mime: 'image/jpeg', ext: '.jpg' },
  'ffd8ffe1': { mime: 'image/jpeg', ext: '.jpg' },
  'ffd8ffe2': { mime: 'image/jpeg', ext: '.jpg' },
  'ffd8ffe3': { mime: 'image/jpeg', ext: '.jpg' },
  'ffd8ffdb': { mime: 'image/jpeg', ext: '.jpg' },
  'ffd8ffee': { mime: 'image/jpeg', ext: '.jpg' },
  '25504446': { mime: 'application/pdf', ext: '.pdf' },
}

/**
 * Validate file magic bytes (signature)
 * @param buffer - File buffer
 * @returns Detected file type or null
 */
function detectFileType(buffer: Buffer): { mime: string; ext: string } | null {
  // Get first 4 bytes for signature check
  const signature = buffer.subarray(0, 4).toString('hex').toLowerCase()

  // Check for WebP (RIFF header)
  if (signature === '52494646') {
    if (buffer.length >= 12 && buffer.subarray(8, 12).toString('hex').toLowerCase() === '57454250') {
      return { mime: 'image/webp', ext: '.webp' }
    }
    return null
  }

  // Check against known signatures
  for (const [sig, info] of Object.entries(FILE_SIGNATURES)) {
    if (signature.startsWith(sig)) {
      return info
    }
  }

  return null
}

/**
 * Sanitize and validate upload path
 * @param type - Upload type/category
 * @returns Sanitized path component
 */
function sanitizePathComponent(type: string): string {
  return type.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50)
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIP(request)
    const rateCheck = checkRateLimitByIP(clientIp, 'upload_file', { maxRequests: 30, windowMs: 60 * 1000 })
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan upload berkas. Silakan coba beberapa saat lagi.' },
        { status: 429 }
      )
    }

    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = sanitizePathComponent(formData.get('type') as string || 'general')

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Read file into buffer for validation
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Validate magic bytes (file signature)
    const detectedType = detectFileType(buffer)
    if (!detectedType) {
      return NextResponse.json(
        { error: 'Invalid file content. File signature does not match any known type.' },
        { status: 400 }
      )
    }

    // Define allowed types per category
    const allowedTypes: Record<string, { mime: string[]; processImage?: boolean }> = {
      signature: {
        mime: ['image/png', 'image/jpeg'],
        processImage: true,
      },
      avatar: {
        mime: ['image/png', 'image/jpeg', 'image/webp'],
        processImage: true,
      },
      umum: {
        mime: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'],
        processImage: true,
      },
      document: {
        mime: ['application/pdf'],
        processImage: false,
      },
    }

    const config = allowedTypes[type] || allowedTypes.umum

    // Check if detected type is allowed
    if (!config.mime.includes(detectedType.mime)) {
      return NextResponse.json(
        { error: `File type not allowed. Allowed: ${config.mime.join(', ')}` },
        { status: 400 }
      )
    }

    // Process images - strip EXIF metadata
    let finalBuffer = buffer
    if (config.processImage && detectedType.mime.startsWith('image/')) {
      try {
        const image = sharp(buffer)
        const metadata = await image.metadata()

        if (metadata.exif) {
          finalBuffer = await image
            .rotate()
            .withMetadata({ exif: undefined })
            .toBuffer()
        }
      } catch (sharpError) {
        console.warn('Sharp EXIF strip warning:', sharpError)
      }
    }

    // Upload using unified storage provider (local, s3, r2, webdav, alist)
    const uploadResult = await storageService.upload(
      finalBuffer,
      type,
      file.name || `file${detectedType.ext}`,
      detectedType.mime
    )

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename: uploadResult.filename,
        url: uploadResult.url,
        type: detectedType.mime,
        size: finalBuffer.length,
        provider: storageService.getProvider(),
      },
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
