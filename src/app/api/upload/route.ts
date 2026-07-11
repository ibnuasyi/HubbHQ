export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'
import sharp from 'sharp'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB

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

    // Create upload directory if not exists
    const uploadPath = path.join(process.cwd(), UPLOAD_DIR, type)
    if (!existsSync(uploadPath)) {
      await mkdir(uploadPath, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}-${Math.random().toString(36).substring(2, 15)}${detectedType.ext}`
    const filepath = path.join(uploadPath, filename)

    // Process images - strip EXIF metadata
    if (config.processImage && detectedType.mime.startsWith('image/')) {
      try {
        const image = sharp(buffer)
        const metadata = await image.metadata()

        if (metadata.exif) {
          await image
            .rotate()
            .withMetadata({ exif: undefined })
            .toFile(filepath)
          console.log(`[SECURITY] EXIF stripped from: ${filename}`)
        } else {
          await writeFile(filepath, buffer)
        }
      } catch (sharpError) {
        console.error('Sharp error:', sharpError)
        await writeFile(filepath, buffer)
      }
    } else {
      await writeFile(filepath, buffer)
    }

    const fileUrl = `/${UPLOAD_DIR}/${type}/${filename}`

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename,
        url: fileUrl,
        type: detectedType.mime,
        size: file.size,
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
