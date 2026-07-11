/**
 * Unified Storage System
 * Local storage dengan proteksi tambahan + S3/R2 support
 *
 * Fitur:
 * - Local storage sebagai default (aman)
 * - S3/R2 support (butuh install @aws-sdk packages)
 *
 * Untuk enable S3/R2, install packages dan uncomment class nya:
 * npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
 */

import { writeFile, mkdir, readFile, unlink, stat } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import crypto from 'crypto'

// =====================================================
// Configuration
// =====================================================

export const STORAGE_CONFIG = {
  // Provider: 'local' | 's3' | 'r2'
  provider: process.env.STORAGE_PROVIDER || 'local',

  // Local storage base directory (relative to project root)
  local: {
    baseDir: process.env.STORAGE_LOCAL_DIR || './uploads',
    // Folder yang bisa diakses publik TANPA auth
    publicFolders: (process.env.STORAGE_PUBLIC_FOLDERS || 'images,documents,gallery,banners,post-images').split(','),
    // Folder yang dilindungi (butuh auth)
    protectedFolders: (process.env.STORAGE_PROTECTED_FOLDERS || 'avatars,signatures,attachments,private,user-files').split(','),
  },

  // Max file sizes (bytes)
  maxFileSize: {
    image: 5 * 1024 * 1024,      // 5MB
    document: 10 * 1024 * 1024,    // 10MB
    video: 100 * 1024 * 1024,     // 100MB
    default: 5 * 1024 * 1024,     // 5MB
  },

  // Allowed MIME types
  allowedTypes: {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    document: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    video: ['video/mp4', 'video/webm', 'video/quicktime'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'],
    default: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
}

// =====================================================
// File Validation
// =====================================================

// Magic bytes signatures for validation
const FILE_SIGNATURES: Record<string, string[]> = {
  'image/jpeg': ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2', 'ffd8ffe3', 'ffd8ffdb', 'ffd8ffee'],
  'image/png': ['89504e47'],
  'image/gif': ['47494638'],
  'image/webp': ['52494646'],
  'application/pdf': ['25504446'],
}

/**
 * Detect file type from magic bytes
 */
export function detectFileType(buffer: Buffer): string | null {
  const signature = buffer.subarray(0, 4).toString('hex').toLowerCase()

  // Check for WebP (RIFF container with WEBP chunk)
  if (signature === '52494646') {
    if (buffer.length >= 12) {
      const webpMarker = buffer.subarray(8, 12).toString('hex').toLowerCase()
      if (webpMarker === '57454250') {
        return 'image/webp'
      }
    }
    return null
  }

  // Check standard signatures
  for (const [mime, signatures] of Object.entries(FILE_SIGNATURES)) {
    if (signatures.some(sig => signature.startsWith(sig))) {
      return mime
    }
  }

  return null
}

/**
 * Get file category from MIME type
 */
export function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('spreadsheet') || mimeType.includes('presentation')) {
    return 'document'
  }
  return 'default'
}

/**
 * Validate MIME type against allowed types
 */
export function isAllowedFileType(mimeType: string, category?: string): boolean {
  if (category && category in STORAGE_CONFIG.allowedTypes) {
    return (STORAGE_CONFIG.allowedTypes as Record<string, string[]>)[category].includes(mimeType)
  }
  return Object.values(STORAGE_CONFIG.allowedTypes).flat().includes(mimeType)
}

/**
 * Get max file size for category
 */
export function getMaxFileSize(category?: string): number {
  if (category && category in STORAGE_CONFIG.maxFileSize) {
    return (STORAGE_CONFIG.maxFileSize as Record<string, number>)[category]
  }
  return STORAGE_CONFIG.maxFileSize.default
}

/**
 * Sanitize folder path component
 */
export function sanitizeFolder(folder: string): string {
  return folder.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50)
}

// =====================================================
// Path Security
// =====================================================

/**
 * Check if a path is within allowed directory (prevent path traversal)
 */
export function isPathSecure(filePath: string, baseDir: string): boolean {
  const resolved = path.resolve(baseDir, filePath)
  const resolvedBase = path.resolve(baseDir)
  return resolved.startsWith(resolvedBase)
}

/**
 * Check if folder is publicly accessible
 */
export function isPublicFolder(folder: string): boolean {
  const normalizedFolder = folder.toLowerCase().trim()
  return STORAGE_CONFIG.local.publicFolders.some(
    f => normalizedFolder === f.toLowerCase() || normalizedFolder.startsWith(f.toLowerCase() + '/')
  )
}

// =====================================================
// Local Storage Operations
// =====================================================

export class LocalStorage {
  private baseDir: string

  constructor() {
    this.baseDir = path.resolve(process.cwd(), STORAGE_CONFIG.local.baseDir)
  }

  /**
   * Get full path for a file
   */
  private getFilePath(folder: string, filename: string): string {
    const safeFolder = sanitizeFolder(folder)
    return path.join(this.baseDir, safeFolder, filename)
  }

  /**
   * Upload file to local storage
   */
  async upload(
    buffer: Buffer,
    folder: string,
    originalName: string,
    mimeType: string
  ): Promise<{ url: string; filename: string; path: string }> {
    const safeFolder = sanitizeFolder(folder)
    const folderPath = path.join(this.baseDir, safeFolder)

    // Create folder if not exists
    if (!existsSync(folderPath)) {
      await mkdir(folderPath, { recursive: true })
    }

    // Generate unique filename
    const ext = path.extname(originalName)
    const baseName = path.basename(originalName, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50)
    const uniqueSuffix = crypto.randomBytes(4).toString('hex')
    const filename = `${baseName}-${Date.now()}-${uniqueSuffix}${ext}`

    const filePath = this.getFilePath(safeFolder, filename)

    // Write file
    await writeFile(filePath, buffer)

    // Return relative URL (for public access)
    const url = `/${STORAGE_CONFIG.local.baseDir}/${safeFolder}/${filename}`

    return {
      url,
      filename,
      path: filePath,
    }
  }

  /**
   * Delete file from local storage
   */
  async delete(folder: string, filename: string): Promise<boolean> {
    const filePath = this.getFilePath(folder, filename)

    if (!isPathSecure(filePath, this.baseDir)) {
      throw new Error('Invalid file path')
    }

    if (existsSync(filePath)) {
      await unlink(filePath)
      return true
    }
    return false
  }

  /**
   * Read file from local storage
   */
  async read(folder: string, filename: string): Promise<Buffer | null> {
    const filePath = this.getFilePath(folder, filename)

    if (!isPathSecure(filePath, this.baseDir)) {
      return null
    }

    if (!existsSync(filePath)) {
      return null
    }

    return readFile(filePath)
  }

  /**
   * Check if file exists
   */
  async exists(folder: string, filename: string): Promise<boolean> {
    const filePath = this.getFilePath(folder, filename)
    return existsSync(filePath)
  }

  /**
   * Get file stats
   */
  async getStats(folder: string, filename: string): Promise<{ size: number; modified: Date } | null> {
    const filePath = this.getFilePath(folder, filename)

    if (!existsSync(filePath)) {
      return null
    }

    const stats = await stat(filePath)
    return {
      size: stats.size,
      modified: stats.mtime,
    }
  }
}

// =====================================================
// S3/R2 Support (Optional)
// To enable, install packages and uncomment:
// npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
// =====================================================

export type StorageProvider = 'local'

export function createStorage(): LocalStorage {
  // Only local storage is available by default
  // S3/R2 requires installing AWS SDK packages
  return new LocalStorage()
}

// =====================================================
// Unified Storage Service
// =====================================================

export class StorageService {
  private storage: LocalStorage

  constructor() {
    this.storage = createStorage()
  }

  getProvider(): string {
    return 'local'
  }

  /**
   * Upload file with validation
   */
  async upload(
    buffer: Buffer,
    folder: string,
    originalName: string,
    mimeType: string
  ): Promise<{ url: string; filename: string }> {
    // Validate file type
    const detectedType = detectFileType(buffer)
    if (!detectedType) {
      throw new Error('Invalid file content')
    }

    // Verify detected type matches claimed MIME type
    if (!mimeType.startsWith(detectedType.split('/')[0])) {
      throw new Error('File content does not match claimed MIME type')
    }

    // Check if type is allowed
    if (!isAllowedFileType(mimeType)) {
      throw new Error(`File type ${mimeType} is not allowed`)
    }

    // Check file size
    const category = getFileCategory(mimeType)
    const maxSize = getMaxFileSize(category)
    if (buffer.length > maxSize) {
      throw new Error(`File size exceeds maximum allowed (${maxSize / 1024 / 1024}MB)`)
    }

    // Upload
    const result = await this.storage.upload(buffer, folder, originalName, mimeType)
    return {
      url: result.url,
      filename: result.filename,
    }
  }

  /**
   * Delete file
   */
  async delete(url: string): Promise<boolean> {
    // Extract folder and filename from URL
    const parts = url.split('/')
    if (parts.length >= 3) {
      const folder = parts[parts.length - 2]
      const filename = parts[parts.length - 1]
      return this.storage.delete(folder, filename)
    }
    return false
  }

  /**
   * Check if URL is public
   */
  isPublicUrl(url: string): boolean {
    const parts = url.split('/')
    if (parts.length >= 2) {
      return isPublicFolder(parts[1])
    }
    return false
  }

  /**
   * Check if auth is required for file access
   */
  requiresAuth(folder: string): boolean {
    return !isPublicFolder(folder)
  }
}

// Export singleton instance
export const storageService = new StorageService()
