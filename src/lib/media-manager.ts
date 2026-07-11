/**
 * Media Management System
 * Centralized media handling with storage abstraction
 * Supports Local, S3, and R2 storage providers
 */

import { prisma } from '@/lib/db'
import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'

// =====================================================
// Types
// =====================================================

export interface MediaFile {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  folder?: string
  isPublic: boolean  // Can be accessed without auth
  uploadedById?: string
  metadata?: Record<string, any>
}

export interface UploadOptions {
  folder?: string
  maxSize?: number
  allowedTypes?: string[]
  isPublic?: boolean  // If true, accessible without authentication
  replaceExisting?: boolean
}

export interface StorageProvider {
  name: string
  upload(file: Buffer, filename: string, mimeType: string): Promise<string>
  delete(url: string): Promise<void>
  getUrl(filename: string): string
  isPublic(url: string): boolean
}

// =====================================================
// Configuration
// =====================================================

export const MEDIA_CONFIG = {
  // Default upload directory (local)
  UPLOAD_DIR: './public/uploads',

  // Public folders (accessible without auth)
  PUBLIC_FOLDERS: ['images', 'documents', 'gallery', 'banners'],

  // Protected folders (require auth)
  PROTECTED_FOLDERS: ['avatars', 'signatures', 'attachments', 'private'],

  // Storage provider: 'local' | 's3' | 'r2'
  PROVIDER: process.env.MEDIA_PROVIDER || 'local',

  // S3 Configuration
  S3: {
    region: process.env.S3_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET || '',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    endpoint: process.env.S3_ENDPOINT,  // Optional: for S3-compatible services
    publicUrl: process.env.S3_PUBLIC_URL,  // Custom domain or CDN
  },

  // R2 Configuration (Cloudflare)
  R2: {
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucket: process.env.R2_BUCKET || '',
    publicUrl: process.env.R2_PUBLIC_URL,
  },

  // Max file sizes (bytes)
  MAX_FILE_SIZE: {
    image: 5 * 1024 * 1024,      // 5MB
    document: 10 * 1024 * 1024,   // 10MB
    video: 50 * 1024 * 1024,     // 50MB
    default: 5 * 1024 * 1024,     // 5MB
  },

  // Allowed MIME types
  ALLOWED_TYPES: {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    document: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    video: ['video/mp4', 'video/webm', 'video/quicktime'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
    default: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
}

// =====================================================
// Local Storage Provider
// =====================================================

export class LocalStorageProvider implements StorageProvider {
  name = 'local'
  private baseDir: string

  constructor(baseDir: string = MEDIA_CONFIG.UPLOAD_DIR) {
    this.baseDir = baseDir
  }

  async upload(file: Buffer, filename: string, mimeType: string): Promise<string> {
    const now = new Date()
    const year = now.getFullYear().toString()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const folder = path.join(this.baseDir, year, month)

    await fs.mkdir(folder, { recursive: true })

    const ext = path.extname(filename)
    const baseName = path.basename(filename, ext)
    const uniqueName = `${baseName}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`
    const filePath = path.join(folder, uniqueName)

    await fs.writeFile(filePath, file)

    return `/uploads/${year}/${month}/${uniqueName}`
  }

  async delete(url: string): Promise<void> {
    const filePath = path.join(process.cwd(), 'public', url.replace(/^\//, ''))
    try {
      await fs.unlink(filePath)
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error
    }
  }

  getUrl(filename: string): string {
    return `/uploads/${filename}`
  }

  isPublic(url: string): boolean {
    // Check if URL matches public folders
    const urlPath = url.replace(/^\//, '')
    return MEDIA_CONFIG.PUBLIC_FOLDERS.some(folder =>
      urlPath.startsWith(`uploads/${folder}/`) ||
      urlPath.startsWith(`${folder}/`)
    )
  }

  getFolderType(folder: string): 'public' | 'protected' {
    if (MEDIA_CONFIG.PUBLIC_FOLDERS.includes(folder)) {
      return 'public'
    }
    if (MEDIA_CONFIG.PROTECTED_FOLDERS.includes(folder)) {
      return 'protected'
    }
    return 'protected'  // Default to protected
  }
}

// =====================================================
// S3 Storage Provider
// =====================================================

export class S3StorageProvider implements StorageProvider {
  name = 's3'
  private s3Client: any
  private bucket: string
  private publicUrl?: string

  constructor(config: {
    region: string
    bucket: string
    accessKeyId: string
    secretAccessKey: string
    endpoint?: string
    publicUrl?: string
  }) {
    this.bucket = config.bucket
    this.publicUrl = config.publicUrl

    // Initialize S3 client (lazy import to avoid errors when not using S3)
    const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3')

    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      ...(config.endpoint && { endpoint: config.endpoint }),  // For MinIO or other S3-compatible
    })
  }

  async upload(file: Buffer, filename: string, mimeType: string): Promise<string> {
    const { PutObjectCommand } = require('@aws-sdk/client-s3')

    const ext = path.extname(filename)
    const baseName = path.basename(filename, ext)
    const uniqueName = `${baseName}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`

    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: uniqueName,
      Body: file,
      ContentType: mimeType,
    }))

    return uniqueName
  }

  async delete(key: string): Promise<void> {
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3')
    await this.s3Client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }))
  }

  getUrl(key: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`
    }
    return `https://${this.bucket}.s3.amazonaws.com/${key}`
  }

  isPublic(): boolean {
    // S3 objects can be configured with bucket policies
    // For now, assume all S3 uploads are not public by default
    return false
  }
}

// =====================================================
// R2 Storage Provider (Cloudflare)
// =====================================================

export class R2StorageProvider implements StorageProvider {
  name = 'r2'
  private r2Client: any
  private bucket: string
  private accountId: string
  private publicUrl?: string

  constructor(config: {
    accountId: string
    bucket: string
    accessKeyId: string
    secretAccessKey: string
    publicUrl?: string
  }) {
    this.bucket = config.bucket
    this.accountId = config.accountId
    this.publicUrl = config.publicUrl

    const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3')

    this.r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
  }

  async upload(file: Buffer, filename: string, mimeType: string): Promise<string> {
    const { PutObjectCommand } = require('@aws-sdk/client-s3')

    const ext = path.extname(filename)
    const baseName = path.basename(filename, ext)
    const uniqueName = `${baseName}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`

    await this.r2Client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: uniqueName,
      Body: file,
      ContentType: mimeType,
    }))

    return uniqueName
  }

  async delete(key: string): Promise<void> {
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3')
    await this.r2Client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }))
  }

  getUrl(key: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`
    }
    return `https://${this.bucket}.r2.dev/${key}`
  }

  isPublic(): boolean {
    return false
  }
}

// =====================================================
// Storage Provider Factory
// =====================================================

export function createStorageProvider(): StorageProvider {
  const provider = MEDIA_CONFIG.PROVIDER

  if (provider === 's3') {
    return new S3StorageProvider({
      region: MEDIA_CONFIG.S3.region,
      bucket: MEDIA_CONFIG.S3.bucket,
      accessKeyId: MEDIA_CONFIG.S3.accessKeyId,
      secretAccessKey: MEDIA_CONFIG.S3.secretAccessKey,
      endpoint: MEDIA_CONFIG.S3.endpoint,
      publicUrl: MEDIA_CONFIG.S3.publicUrl,
    })
  }

  if (provider === 'r2') {
    return new R2StorageProvider({
      accountId: MEDIA_CONFIG.R2.accountId,
      bucket: MEDIA_CONFIG.R2.bucket,
      accessKeyId: MEDIA_CONFIG.R2.accessKeyId,
      secretAccessKey: MEDIA_CONFIG.R2.secretAccessKey,
      publicUrl: MEDIA_CONFIG.R2.publicUrl,
    })
  }

  // Default to local
  return new LocalStorageProvider(MEDIA_CONFIG.UPLOAD_DIR)
}

// =====================================================
// Media Service
// =====================================================

class MediaService {
  private storage: StorageProvider

  constructor() {
    this.storage = createStorageProvider()
  }

  getStorageProvider(): string {
    return this.storage.name
  }

  validateFileType(mimeType: string, category?: string): boolean {
    const allowedTypes = category
      ? MEDIA_CONFIG.ALLOWED_TYPES[category as keyof typeof MEDIA_CONFIG.ALLOWED_TYPES]
      : MEDIA_CONFIG.ALLOWED_TYPES.default

    return allowedTypes?.includes(mimeType) || false
  }

  getMaxFileSize(category?: string): number {
    return MEDIA_CONFIG.MAX_FILE_SIZE[category as keyof typeof MEDIA_CONFIG.MAX_FILE_SIZE] ||
      MEDIA_CONFIG.MAX_FILE_SIZE.default
  }

  /**
   * Determine if folder is public or protected
   */
  isFolderPublic(folder: string): boolean {
    if (this.storage instanceof LocalStorageProvider) {
      return this.storage.getFolderType(folder) === 'public'
    }
    return false
  }

  async uploadFile(
    file: Buffer,
    originalName: string,
    mimeType: string,
    size: number,
    uploadedById?: string,
    options: UploadOptions = {}
  ): Promise<MediaFile> {
    const category = this.getCategoryFromMimeType(mimeType)

    // Validate file type
    if (!this.validateFileType(mimeType, category)) {
      throw new Error(`File type ${mimeType} is not allowed`)
    }

    // Validate file size
    const maxSize = options.maxSize || this.getMaxFileSize(category)
    if (size > maxSize) {
      throw new Error(`File size exceeds maximum allowed (${maxSize / 1024 / 1024}MB)`)
    }

    // Determine if public
    let isPublic = options.isPublic || false
    if (options.folder) {
      isPublic = isPublic || this.isFolderPublic(options.folder)
    }

    // Upload to storage
    const url = await this.storage.upload(file, originalName, mimeType)
    const filename = path.basename(url)

    // Create media record
    const media = await prisma.mediaFile.create({
      data: {
        filename,
        originalName,
        mimeType,
        size,
        url: this.storage.getUrl(filename),
        folder: options.folder,
        isPublic,
        uploadedById,
        metadata: options.replaceExisting ? { replaced: true } : undefined,
      },
    })

    return {
      id: media.id,
      filename: media.filename,
      originalName: media.originalName,
      mimeType: media.mimeType,
      size: media.size,
      url: media.url,
      folder: media.folder || undefined,
      isPublic: media.isPublic,
      uploadedById: media.uploadedById || undefined,
      metadata: media.metadata as Record<string, any> || undefined,
    }
  }

  async deleteFile(mediaId: string): Promise<boolean> {
    const media = await prisma.mediaFile.findUnique({
      where: { id: mediaId },
    })

    if (!media) return false

    await this.storage.delete(media.filename)
    await prisma.mediaFile.delete({ where: { id: mediaId } })

    return true
  }

  async getFiles(params: {
    folder?: string
    mimeType?: string
    uploadedById?: string
    search?: string
    page?: number
    limit?: number
    includePrivate?: boolean  // If true, include non-public files
  } = {}) {
    const { folder, mimeType, uploadedById, search, page = 1, limit = 20, includePrivate = true } = params
    const skip = (page - 1) * limit

    const where: any = {}

    if (!includePrivate) {
      where.isPublic = true
    }
    if (folder) where.folder = folder
    if (mimeType) where.mimeType = { startsWith: mimeType }
    if (uploadedById) where.uploadedById = uploadedById
    if (search) {
      where.OR = [
        { originalName: { contains: search, mode: 'insensitive' } },
        { filename: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [files, total] = await Promise.all([
      prisma.mediaFile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          uploadedBy: { select: { id: true, name: true } },
        },
      }),
      prisma.mediaFile.count({ where }),
    ])

    return { files, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getStorageStats() {
    const files = await prisma.mediaFile.findMany({
      select: { mimeType: true, size: true },
    })

    const byType: Record<string, { count: number; size: number }> = {}
    let totalSize = 0

    for (const file of files) {
      totalSize += file.size
      const type = file.mimeType.split('/')[0] || 'other'
      if (!byType[type]) byType[type] = { count: 0, size: 0 }
      byType[type].count++
      byType[type].size += file.size
    }

    return { totalFiles: files.length, totalSize, byType }
  }

  private getCategoryFromMimeType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('spreadsheet')) {
      return 'document'
    }
    return 'default'
  }
}

export const mediaService = new MediaService()

// =====================================================
// Cleanup Functions
// =====================================================

/**
 * Find orphaned media files - optimized to avoid N+1
 */
export async function findOrphanedMedia(): Promise<string[]> {
  // Get all media files
  const allMedia = await prisma.mediaFile.findMany({
    select: { id: true, url: true },
  })

  if (allMedia.length === 0) return []

  // Get all referenced URLs in one query per table
  const [users, divisi, libraryBooks, posts, galleries, documents] = await Promise.all([
    prisma.user.findMany({
      where: { avatar: { not: null } },
      select: { avatar: true },
    }),
    prisma.divisi.findMany({
      where: { logo: { not: null } },
      select: { logo: true },
    }),
    prisma.libraryBook.findMany({
      where: {
        OR: [
          { coverUrl: { not: undefined } },
          { fileUrl: { not: undefined } },
        ],
      },
      select: { coverUrl: true, fileUrl: true },
    }),
    prisma.post.findMany({
      where: { featuredImage: { not: undefined } },
      select: { featuredImage: true },
    }),
    prisma.gallery.findMany({
      where: { imageUrl: { not: undefined } },
      select: { imageUrl: true },
    }),
    prisma.document.findMany({
      where: { fileUrl: { not: undefined } },
      select: { fileUrl: true },
    }),
  ])

  // Build set of all referenced URLs
  const referencedUrls = new Set<string>()
  users.forEach(u => u.avatar && referencedUrls.add(u.avatar))
  divisi.forEach(d => d.logo && referencedUrls.add(d.logo))
  libraryBooks.forEach(b => {
    b.coverUrl && referencedUrls.add(b.coverUrl)
    b.fileUrl && referencedUrls.add(b.fileUrl)
  })
  posts.forEach(p => p.featuredImage && referencedUrls.add(p.featuredImage))
  galleries.forEach(g => g.imageUrl && referencedUrls.add(g.imageUrl))
  documents.forEach(d => d.fileUrl && referencedUrls.add(d.fileUrl))

  // Find orphaned files (not in any reference)
  return allMedia
    .filter(media => !referencedUrls.has(media.url))
    .map(media => media.id)
}

/**
 * Cleanup orphaned media files - optimized batch delete
 */
export async function cleanupOrphanedMedia(): Promise<{ deleted: number; freedSpace: number }> {
  const orphanedIds = await findOrphanedMedia()

  if (orphanedIds.length === 0) {
    return { deleted: 0, freedSpace: 0 }
  }

  // Get total size before deletion
  const orphanedMedia = await prisma.mediaFile.findMany({
    where: { id: { in: orphanedIds } },
    select: { size: true, url: true },
  })

  const freedSpace = orphanedMedia.reduce((sum, m) => sum + m.size, 0)

  // Batch delete from database (storage deletion happens via Prisma cascade or trigger)
  await prisma.mediaFile.deleteMany({
    where: { id: { in: orphanedIds } },
  })

  return { deleted: orphanedIds.length, freedSpace }
}
