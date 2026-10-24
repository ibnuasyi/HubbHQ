/**
 * Unified Storage System - HubbHQ
 * Mendukung penyimpanan lokal, universal S3-compatible (AWS S3, Cloudflare R2, MinIO, Wasabi, AList S3 Gateway),
 * serta WebDAV (AList WebDAV, Nextcloud, OwnCloud, Synology).
 */

import { writeFile, mkdir, readFile, unlink, stat } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import crypto from 'crypto'
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// =====================================================
// Storage Interface
// =====================================================

export interface IStorageProvider {
  name: string
  upload(
    buffer: Buffer,
    folder: string,
    originalName: string,
    mimeType: string
  ): Promise<{ url: string; filename: string; path?: string }>
  delete(folder: string, filename: string): Promise<boolean>
  read(folder: string, filename: string): Promise<Buffer | null>
  exists(folder: string, filename: string): Promise<boolean>
  getStats?(folder: string, filename: string): Promise<{ size: number; modified: Date } | null>
  getSignedUrl?(folder: string, filename: string, expiresInSeconds?: number): Promise<string>
}

// =====================================================
// Configuration
// =====================================================

export const STORAGE_CONFIG = {
  // Provider: 'local' | 's3' | 'r2' | 'webdav'
  provider: (process.env.STORAGE_PROVIDER || 'local').toLowerCase(),

  // Local storage
  local: {
    baseDir: process.env.STORAGE_LOCAL_DIR || './uploads',
    publicFolders: (process.env.STORAGE_PUBLIC_FOLDERS || 'images,documents,gallery,banners,post-images,library,sertifikat').split(','),
    protectedFolders: (process.env.STORAGE_PROTECTED_FOLDERS || 'avatars,signatures,attachments,private,user-files,lpj,proposals').split(','),
  },

  // S3 / S3-compatible (MinIO, R2, Wasabi, AList S3)
  s3: {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET || 'hubbhq',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true' || Boolean(process.env.S3_ENDPOINT),
    publicUrl: process.env.S3_PUBLIC_URL || '',
    publicPrefixes: (process.env.S3_PUBLIC_PREFIXES || 'images,documents,gallery,banners,post-images,library,sertifikat').split(','),
  },

  // Cloudflare R2
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || '',
    bucket: process.env.R2_BUCKET || 'hubbhq',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    publicUrl: process.env.R2_PUBLIC_URL || '',
    publicPrefixes: (process.env.R2_PUBLIC_PREFIXES || 'images,documents,gallery,banners,post-images,library,sertifikat').split(','),
  },

  // WebDAV (AList WebDAV, Nextcloud, OwnCloud)
  webdav: {
    url: (process.env.WEBDAV_URL || '').replace(/\/$/, ''),
    username: process.env.WEBDAV_USERNAME || '',
    password: process.env.WEBDAV_PASSWORD || '',
    basePath: (process.env.WEBDAV_BASE_PATH || '').replace(/^\/|\/$/g, ''),
    publicUrl: (process.env.WEBDAV_PUBLIC_URL || '').replace(/\/$/, ''),
  },

  // Max file sizes (bytes)
  maxFileSize: {
    image: 10 * 1024 * 1024,      // 10MB
    document: 25 * 1024 * 1024,   // 25MB
    video: 100 * 1024 * 1024,     // 100MB
    default: 10 * 1024 * 1024,    // 10MB
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
    default: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
  },
}

// =====================================================
// File Validation
// =====================================================

const FILE_SIGNATURES: Record<string, string[]> = {
  'image/jpeg': ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2', 'ffd8ffe3', 'ffd8ffdb', 'ffd8ffee'],
  'image/png': ['89504e47'],
  'image/gif': ['47494638'],
  'image/webp': ['52494646'],
  'application/pdf': ['25504446'],
}

export function detectFileType(buffer: Buffer): string | null {
  const signature = buffer.subarray(0, 4).toString('hex').toLowerCase()

  if (signature === '52494646') {
    if (buffer.length >= 12) {
      const webpMarker = buffer.subarray(8, 12).toString('hex').toLowerCase()
      if (webpMarker === '57454250') {
        return 'image/webp'
      }
    }
    return null
  }

  for (const [mime, signatures] of Object.entries(FILE_SIGNATURES)) {
    if (signatures.some(sig => signature.startsWith(sig))) {
      return mime
    }
  }

  return null
}

export function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('spreadsheet') || mimeType.includes('presentation')) {
    return 'document'
  }
  return 'default'
}

export function isAllowedFileType(mimeType: string, category?: string): boolean {
  if (category && category in STORAGE_CONFIG.allowedTypes) {
    return (STORAGE_CONFIG.allowedTypes as Record<string, string[]>)[category].includes(mimeType)
  }
  return Object.values(STORAGE_CONFIG.allowedTypes).flat().includes(mimeType)
}

export function getMaxFileSize(category?: string): number {
  if (category && category in STORAGE_CONFIG.maxFileSize) {
    return (STORAGE_CONFIG.maxFileSize as Record<string, number>)[category]
  }
  return STORAGE_CONFIG.maxFileSize.default
}

export function sanitizeFolder(folder: string): string {
  return folder.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50)
}

export function isPathSecure(filePath: string, baseDir: string): boolean {
  const resolved = path.resolve(baseDir, filePath)
  const resolvedBase = path.resolve(baseDir)
  return resolved.startsWith(resolvedBase)
}

export function isPublicFolder(folder: string): boolean {
  const normalizedFolder = folder.toLowerCase().trim()
  return STORAGE_CONFIG.local.publicFolders.some(
    f => normalizedFolder === f.toLowerCase() || normalizedFolder.startsWith(f.toLowerCase() + '/')
  )
}

// =====================================================
// Local Storage Provider
// =====================================================

export class LocalStorage implements IStorageProvider {
  name = 'local'
  private baseDir: string

  constructor() {
    this.baseDir = path.resolve(process.cwd(), STORAGE_CONFIG.local.baseDir)
  }

  private getFilePath(folder: string, filename: string): string {
    const safeFolder = sanitizeFolder(folder)
    return path.join(this.baseDir, safeFolder, filename)
  }

  async upload(
    buffer: Buffer,
    folder: string,
    originalName: string,
    _mimeType: string
  ): Promise<{ url: string; filename: string; path: string }> {
    const safeFolder = sanitizeFolder(folder)
    const folderPath = path.join(this.baseDir, safeFolder)

    if (!existsSync(folderPath)) {
      await mkdir(folderPath, { recursive: true })
    }

    const ext = path.extname(originalName) || ''
    const baseName = path.basename(originalName, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 40)
    const uniqueSuffix = crypto.randomBytes(4).toString('hex')
    const filename = `${baseName}-${Date.now()}-${uniqueSuffix}${ext}`
    const filePath = this.getFilePath(safeFolder, filename)

    await writeFile(filePath, buffer)

    const url = isPublicFolder(safeFolder)
      ? `/${STORAGE_CONFIG.local.baseDir.replace(/^\.\//, '')}/${safeFolder}/${filename}`
      : `/api/files/${safeFolder}/${filename}`

    return {
      url,
      filename,
      path: filePath,
    }
  }

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

  async read(folder: string, filename: string): Promise<Buffer | null> {
    const filePath = this.getFilePath(folder, filename)
    if (!isPathSecure(filePath, this.baseDir) || !existsSync(filePath)) {
      return null
    }
    return readFile(filePath)
  }

  async exists(folder: string, filename: string): Promise<boolean> {
    const filePath = this.getFilePath(folder, filename)
    return existsSync(filePath)
  }

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
// Universal S3 Storage Provider (AWS, R2, MinIO, Wasabi, AList S3)
// =====================================================

export class S3Storage implements IStorageProvider {
  name = 's3'
  private client: S3Client
  private bucket: string
  private publicUrl: string

  constructor(isR2 = false) {
    if (isR2) {
      const config = STORAGE_CONFIG.r2
      this.bucket = config.bucket
      this.publicUrl = config.publicUrl
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      })
    } else {
      const config = STORAGE_CONFIG.s3
      this.bucket = config.bucket
      this.publicUrl = config.publicUrl
      this.client = new S3Client({
        region: config.region,
        endpoint: config.endpoint || undefined,
        forcePathStyle: config.forcePathStyle,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      })
    }
  }

  private getKey(folder: string, filename: string): string {
    const safeFolder = sanitizeFolder(folder)
    return `${safeFolder}/${filename}`
  }

  async upload(
    buffer: Buffer,
    folder: string,
    originalName: string,
    mimeType: string
  ): Promise<{ url: string; filename: string; path?: string }> {
    const safeFolder = sanitizeFolder(folder)
    const ext = path.extname(originalName) || ''
    const baseName = path.basename(originalName, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 40)
    const uniqueSuffix = crypto.randomBytes(4).toString('hex')
    const filename = `${baseName}-${Date.now()}-${uniqueSuffix}${ext}`
    const key = this.getKey(safeFolder, filename)

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    )

    let url: string
    if (this.publicUrl) {
      url = `${this.publicUrl.replace(/\/$/, '')}/${key}`
    } else if (isPublicFolder(safeFolder)) {
      const endpoint = STORAGE_CONFIG.s3.endpoint
      if (endpoint) {
        url = `${endpoint.replace(/\/$/, '')}/${this.bucket}/${key}`
      } else {
        url = `https://${this.bucket}.s3.${STORAGE_CONFIG.s3.region}.amazonaws.com/${key}`
      }
    } else {
      url = `/api/files/${safeFolder}/${filename}`
    }

    return {
      url,
      filename,
      path: key,
    }
  }

  async delete(folder: string, filename: string): Promise<boolean> {
    const key = this.getKey(folder, filename)
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      )
      return true
    } catch {
      return false
    }
  }

  async read(folder: string, filename: string): Promise<Buffer | null> {
    const key = this.getKey(folder, filename)
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      )
      if (!response.Body) return null
      const bytes = await response.Body.transformToByteArray()
      return Buffer.from(bytes)
    } catch {
      return null
    }
  }

  async exists(folder: string, filename: string): Promise<boolean> {
    const key = this.getKey(folder, filename)
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      )
      return true
    } catch {
      return false
    }
  }

  async getSignedUrl(folder: string, filename: string, expiresInSeconds = 3600): Promise<string> {
    const key = this.getKey(folder, filename)
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
      { expiresIn: expiresInSeconds }
    )
  }
}

// =====================================================
// Universal WebDAV Storage Provider (AList WebDAV, Nextcloud, OwnCloud)
// =====================================================

export class WebDAVStorage implements IStorageProvider {
  name = 'webdav'
  private baseUrl: string
  private authHeader: string
  private publicUrl: string

  constructor() {
    const config = STORAGE_CONFIG.webdav
    let base = config.url
    if (config.basePath) {
      base += `/${config.basePath}`
    }
    this.baseUrl = base
    this.publicUrl = config.publicUrl

    const credentials = `${config.username}:${config.password}`
    this.authHeader = `Basic ${Buffer.from(credentials).toString('base64')}`
  }

  private getFullUrl(folder: string, filename?: string): string {
    const safeFolder = sanitizeFolder(folder)
    if (filename) {
      return `${this.baseUrl}/${safeFolder}/${filename}`
    }
    return `${this.baseUrl}/${safeFolder}`
  }

  private async ensureFolder(folder: string): Promise<void> {
    const folderUrl = this.getFullUrl(folder)
    try {
      await fetch(folderUrl, {
        method: 'MKCOL',
        headers: { Authorization: this.authHeader },
      })
    } catch {
      // Ignore if folder exists
    }
  }

  async upload(
    buffer: Buffer,
    folder: string,
    originalName: string,
    mimeType: string
  ): Promise<{ url: string; filename: string; path?: string }> {
    const safeFolder = sanitizeFolder(folder)
    await this.ensureFolder(safeFolder)

    const ext = path.extname(originalName) || ''
    const baseName = path.basename(originalName, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 40)
    const uniqueSuffix = crypto.randomBytes(4).toString('hex')
    const filename = `${baseName}-${Date.now()}-${uniqueSuffix}${ext}`
    const fileUrl = this.getFullUrl(safeFolder, filename)

    const res = await fetch(fileUrl, {
      method: 'PUT',
      headers: {
        Authorization: this.authHeader,
        'Content-Type': mimeType,
      },
      body: new Uint8Array(buffer),
    })

    if (!res.ok && res.status !== 201 && res.status !== 204) {
      throw new Error(`WebDAV upload failed: ${res.status} ${res.statusText}`)
    }

    let url: string
    if (this.publicUrl) {
      url = `${this.publicUrl}/${safeFolder}/${filename}`
    } else if (isPublicFolder(safeFolder)) {
      url = fileUrl
    } else {
      url = `/api/files/${safeFolder}/${filename}`
    }

    return {
      url,
      filename,
      path: fileUrl,
    }
  }

  async delete(folder: string, filename: string): Promise<boolean> {
    const fileUrl = this.getFullUrl(folder, filename)
    try {
      const res = await fetch(fileUrl, {
        method: 'DELETE',
        headers: { Authorization: this.authHeader },
      })
      return res.ok || res.status === 404
    } catch {
      return false
    }
  }

  async read(folder: string, filename: string): Promise<Buffer | null> {
    const fileUrl = this.getFullUrl(folder, filename)
    try {
      const res = await fetch(fileUrl, {
        method: 'GET',
        headers: { Authorization: this.authHeader },
      })
      if (!res.ok) return null
      const arrayBuffer = await res.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch {
      return null
    }
  }

  async exists(folder: string, filename: string): Promise<boolean> {
    const fileUrl = this.getFullUrl(folder, filename)
    try {
      const res = await fetch(fileUrl, {
        method: 'HEAD',
        headers: { Authorization: this.authHeader },
      })
      return res.ok
    } catch {
      return false
    }
  }
}

// =====================================================
// Factory & Service
// =====================================================

export type StorageProviderType = 'local' | 's3' | 'r2' | 'webdav'

export function createStorage(): IStorageProvider {
  const provider = STORAGE_CONFIG.provider
  if (provider === 's3') {
    return new S3Storage(false)
  }
  if (provider === 'r2') {
    return new S3Storage(true)
  }
  if (provider === 'webdav') {
    return new WebDAVStorage()
  }
  return new LocalStorage()
}

export class StorageService {
  private storage: IStorageProvider

  constructor() {
    this.storage = createStorage()
  }

  getProvider(): string {
    return this.storage.name
  }

  getStorageInstance(): IStorageProvider {
    return this.storage
  }

  async upload(
    buffer: Buffer,
    folder: string,
    originalName: string,
    mimeType: string
  ): Promise<{ url: string; filename: string }> {
    const detectedType = detectFileType(buffer)
    if (!detectedType) {
      throw new Error('Format isi berkas tidak valid atau tidak dikenali.')
    }

    if (!mimeType.startsWith(detectedType.split('/')[0])) {
      throw new Error('Format berkas tidak sesuai dengan tipe MIME yang dikirim.')
    }

    if (!isAllowedFileType(mimeType)) {
      throw new Error(`Tipe berkas ${mimeType} tidak diizinkan.`)
    }

    const category = getFileCategory(mimeType)
    const maxSize = getMaxFileSize(category)
    if (buffer.length > maxSize) {
      throw new Error(`Ukuran berkas melebihi batas maksimal (${maxSize / 1024 / 1024}MB).`)
    }

    const result = await this.storage.upload(buffer, folder, originalName, mimeType)
    return {
      url: result.url,
      filename: result.filename,
    }
  }

  async delete(url: string): Promise<boolean> {
    const parts = url.split('/')
    if (parts.length >= 2) {
      const filename = parts[parts.length - 1]
      const folder = parts[parts.length - 2]
      return this.storage.delete(folder, filename)
    }
    return false
  }

  async read(folder: string, filename: string): Promise<Buffer | null> {
    return this.storage.read(folder, filename)
  }

  async exists(folder: string, filename: string): Promise<boolean> {
    return this.storage.exists(folder, filename)
  }

  async getSignedUrl(folder: string, filename: string, expiresInSeconds = 3600): Promise<string | null> {
    if (this.storage.getSignedUrl) {
      return this.storage.getSignedUrl(folder, filename, expiresInSeconds)
    }
    return null
  }

  isPublicUrl(url: string): boolean {
    const parts = url.split('/')
    if (parts.length >= 2) {
      return isPublicFolder(parts[parts.length - 2])
    }
    return false
  }

  requiresAuth(folder: string): boolean {
    return !isPublicFolder(folder)
  }
}

export const storageService = new StorageService()
