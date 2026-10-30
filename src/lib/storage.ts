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
  HeadBucketCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { prisma } from '@/lib/db'

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
// Configuration & Types
// =====================================================

export type StorageProviderType = 'local' | 's3' | 'r2' | 'webdav'

export interface StorageSettings {
  provider: StorageProviderType
  local: {
    baseDir: string
    publicFolders: string[]
    protectedFolders: string[]
  }
  s3: {
    endpoint?: string
    region: string
    bucket: string
    accessKeyId: string
    secretAccessKey: string
    forcePathStyle: boolean
    publicUrl?: string
    publicPrefixes: string[]
  }
  r2: {
    accountId: string
    bucket: string
    accessKeyId: string
    secretAccessKey: string
    publicUrl?: string
    publicPrefixes: string[]
  }
  webdav: {
    url: string
    username: string
    password: string
    basePath?: string
    publicUrl?: string
  }
}

export const DEFAULT_STORAGE_SETTINGS: StorageSettings = {
  provider: (process.env.STORAGE_PROVIDER || 'local').toLowerCase() as StorageProviderType,
  local: {
    baseDir: process.env.STORAGE_LOCAL_DIR || './uploads',
    publicFolders: (process.env.STORAGE_PUBLIC_FOLDERS || 'images,documents,gallery,banners,post-images,library,sertifikat').split(',').map((s) => s.trim()),
    protectedFolders: (process.env.STORAGE_PROTECTED_FOLDERS || 'avatars,signatures,attachments,private,user-files,lpj,proposals').split(',').map((s) => s.trim()),
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT || '',
    region: process.env.S3_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET || 'hubbhq',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true' || Boolean(process.env.S3_ENDPOINT),
    publicUrl: process.env.S3_PUBLIC_URL || '',
    publicPrefixes: (process.env.S3_PUBLIC_PREFIXES || 'images,documents,gallery,banners,post-images,library,sertifikat').split(',').map((s) => s.trim()),
  },
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || '',
    bucket: process.env.R2_BUCKET || 'hubbhq',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    publicUrl: process.env.R2_PUBLIC_URL || '',
    publicPrefixes: (process.env.R2_PUBLIC_PREFIXES || 'images,documents,gallery,banners,post-images,library,sertifikat').split(',').map((s) => s.trim()),
  },
  webdav: {
    url: (process.env.WEBDAV_URL || '').replace(/\/$/, ''),
    username: process.env.WEBDAV_USERNAME || '',
    password: process.env.WEBDAV_PASSWORD || '',
    basePath: (process.env.WEBDAV_BASE_PATH || '').replace(/^\/|\/$/g, ''),
    publicUrl: (process.env.WEBDAV_PUBLIC_URL || '').replace(/\/$/, ''),
  },
}

export const STORAGE_CONFIG = {
  ...DEFAULT_STORAGE_SETTINGS,
  maxFileSize: {
    image: 10 * 1024 * 1024,      // 10MB
    document: 25 * 1024 * 1024,   // 25MB
    video: 100 * 1024 * 1024,     // 100MB
    default: 10 * 1024 * 1024,    // 10MB
  },
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

/**
 * Validasi keamanan URL untuk mencegah SSRF (Server-Side Request Forgery)
 */
export function isSafeStorageUrl(urlString?: string): { safe: boolean; error?: string } {
  if (!urlString || urlString.trim() === '') return { safe: true }

  let parsed: URL
  try {
    parsed = new URL(urlString)
  } catch {
    return { safe: false, error: 'Format URL tidak valid.' }
  }

  // Wajib protokol HTTP atau HTTPS
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { safe: false, error: 'Protokol URL harus HTTP atau HTTPS.' }
  }

  const hostname = parsed.hostname.toLowerCase()

  // Blokir Cloud Provider Metadata Services
  const blockedHostnames = [
    '169.254.169.254',
    '169.254.169.253',
    '169.254.170.2',
    '100.100.100.200',
    'metadata.google.internal',
    'instance-data',
    'metadata',
    'fd00:ec2::254',
  ]

  if (blockedHostnames.includes(hostname) || hostname.startsWith('169.254.')) {
    return { safe: false, error: 'Akses ke alamat IP atau metadata cloud dilarang untuk alasan keamanan.' }
  }

  return { safe: true }
}

/**
 * Validasi path direktori lokal untuk mencegah Directory Traversal
 */
export function isSafeLocalDir(baseDir: string): { safe: boolean; error?: string } {
  if (!baseDir || typeof baseDir !== 'string') {
    return { safe: false, error: 'Direktori penyimpanan lokal tidak boleh kosong.' }
  }
  if (baseDir.includes('..') || baseDir.includes('\0')) {
    return { safe: false, error: 'Nama direktori tidak boleh mengandung karakter traversal (..) atau null byte.' }
  }
  return { safe: true }
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

export function isPublicFolder(folder: string, customList?: string[]): boolean {
  const normalizedFolder = folder.toLowerCase().trim()
  const list = customList || STORAGE_CONFIG.local.publicFolders
  return list.some(
    f => normalizedFolder === f.toLowerCase() || normalizedFolder.startsWith(f.toLowerCase() + '/')
  )
}

// =====================================================
// Local Storage Provider
// =====================================================

export class LocalStorage implements IStorageProvider {
  name = 'local'
  private baseDir: string
  private relativeBaseDir: string
  private publicFolders: string[]

  constructor(customConfig?: StorageSettings['local']) {
    const rawDir = customConfig?.baseDir || STORAGE_CONFIG.local.baseDir
    this.relativeBaseDir = rawDir.replace(/^\.\//, '')
    this.baseDir = path.resolve(process.cwd(), rawDir)
    this.publicFolders = customConfig?.publicFolders || STORAGE_CONFIG.local.publicFolders
  }

  private getFilePath(folder: string, filename: string): string {
    const safeFolder = sanitizeFolder(folder)
    return path.join(this.baseDir, safeFolder, filename)
  }

  async upload(
    buffer: Buffer,
    folder: string,
    originalName: string,
    mimeType: string
  ): Promise<{ url: string; filename: string; path: string }> {
    const safeFolder = sanitizeFolder(folder)
    const folderPath = path.join(this.baseDir, safeFolder)

    if (!existsSync(folderPath)) {
      await mkdir(folderPath, { recursive: true })
    }

    const dangerousExtensions = [
      '.html', '.htm', '.svg', '.shtml', '.php', '.phtml', '.cgi',
      '.pl', '.jsp', '.asp', '.aspx', '.exe', '.bat', '.cmd', '.sh',
      '.vbs', '.js', '.mjs', '.phar'
    ]
    let ext = path.extname(originalName).toLowerCase() || ''
    if (dangerousExtensions.includes(ext) || !ext) {
      ext = mimeType === 'application/pdf' ? '.pdf' :
            mimeType === 'image/jpeg' ? '.jpg' :
            mimeType === 'image/webp' ? '.webp' :
            mimeType === 'image/png' ? '.png' : '.bin'
    }

    const baseName = path.basename(originalName, path.extname(originalName))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 40) || 'file'
    const uniqueSuffix = crypto.randomBytes(4).toString('hex')
    const filename = `${baseName}-${Date.now()}-${uniqueSuffix}${ext}`
    const filePath = this.getFilePath(safeFolder, filename)

    await writeFile(filePath, buffer)

    const url = isPublicFolder(safeFolder, this.publicFolders)
      ? `/${this.relativeBaseDir}/${safeFolder}/${filename}`
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
  private endpoint?: string
  private region: string
  private publicPrefixes: string[]

  constructor(isR2 = false, customConfig?: StorageSettings['s3'] | StorageSettings['r2']) {
    if (isR2) {
      this.name = 'r2'
      const config = (customConfig as StorageSettings['r2']) || STORAGE_CONFIG.r2
      this.bucket = config.bucket
      this.publicUrl = config.publicUrl || ''
      this.region = 'auto'
      this.publicPrefixes = config.publicPrefixes || STORAGE_CONFIG.r2.publicPrefixes
      const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`
      this.endpoint = endpoint
      this.client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      })
    } else {
      this.name = 's3'
      const config = (customConfig as StorageSettings['s3']) || STORAGE_CONFIG.s3
      this.bucket = config.bucket
      this.publicUrl = config.publicUrl || ''
      this.region = config.region || 'us-east-1'
      this.endpoint = config.endpoint || undefined
      this.publicPrefixes = config.publicPrefixes || STORAGE_CONFIG.s3.publicPrefixes
      this.client = new S3Client({
        region: this.region,
        endpoint: this.endpoint,
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
    const dangerousExtensions = [
      '.html', '.htm', '.svg', '.shtml', '.php', '.phtml', '.cgi',
      '.pl', '.jsp', '.asp', '.aspx', '.exe', '.bat', '.cmd', '.sh',
      '.vbs', '.js', '.mjs', '.phar'
    ]
    let ext = path.extname(originalName).toLowerCase() || ''
    if (dangerousExtensions.includes(ext) || !ext) {
      ext = mimeType === 'application/pdf' ? '.pdf' :
            mimeType === 'image/jpeg' ? '.jpg' :
            mimeType === 'image/webp' ? '.webp' :
            mimeType === 'image/png' ? '.png' : '.bin'
    }

    const baseName = path.basename(originalName, path.extname(originalName))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 40) || 'file'
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
    } else if (isPublicFolder(safeFolder, this.publicPrefixes)) {
      if (this.endpoint) {
        url = `${this.endpoint.replace(/\/$/, '')}/${this.bucket}/${key}`
      } else {
        url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`
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

  constructor(customConfig?: StorageSettings['webdav']) {
    const config = customConfig || STORAGE_CONFIG.webdav
    let base = config.url
    if (config.basePath) {
      base += `/${config.basePath.replace(/^\/|\/$/g, '')}`
    }
    this.baseUrl = base
    this.publicUrl = config.publicUrl || ''

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
      // Abaikan jika folder sudah ada
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

    const dangerousExtensions = [
      '.html', '.htm', '.svg', '.shtml', '.php', '.phtml', '.cgi',
      '.pl', '.jsp', '.asp', '.aspx', '.exe', '.bat', '.cmd', '.sh',
      '.vbs', '.js', '.mjs', '.phar'
    ]
    let ext = path.extname(originalName).toLowerCase() || ''
    if (dangerousExtensions.includes(ext) || !ext) {
      ext = mimeType === 'application/pdf' ? '.pdf' :
            mimeType === 'image/jpeg' ? '.jpg' :
            mimeType === 'image/webp' ? '.webp' :
            mimeType === 'image/png' ? '.png' : '.bin'
    }

    const baseName = path.basename(originalName, path.extname(originalName))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 40) || 'file'
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
      throw new Error(`WebDAV upload gagal: ${res.status} ${res.statusText}`)
    }

    let url: string
    if (this.publicUrl) {
      url = `${this.publicUrl.replace(/\/$/, '')}/${safeFolder}/${filename}`
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

export function createStorageFromConfig(config: StorageSettings): IStorageProvider {
  switch (config.provider) {
    case 's3':
      return new S3Storage(false, config.s3)
    case 'r2':
      return new S3Storage(true, config.r2)
    case 'webdav':
      return new WebDAVStorage(config.webdav)
    case 'local':
    default:
      return new LocalStorage(config.local)
  }
}

export function createStorage(): IStorageProvider {
  return createStorageFromConfig(DEFAULT_STORAGE_SETTINGS)
}

/**
 * Mengambil konfigurasi penyimpanan dari database WebsiteConfig atau fallback env
 */
export async function getStorageSettings(): Promise<StorageSettings> {
  try {
    const config = await prisma.websiteConfig.findUnique({
      where: { key: 'storage_settings' },
    })

    if (config?.value && typeof config.value === 'object') {
      const val = config.value as any
      return {
        provider: val.provider || DEFAULT_STORAGE_SETTINGS.provider,
        local: { ...DEFAULT_STORAGE_SETTINGS.local, ...(val.local || {}) },
        s3: { ...DEFAULT_STORAGE_SETTINGS.s3, ...(val.s3 || {}) },
        r2: { ...DEFAULT_STORAGE_SETTINGS.r2, ...(val.r2 || {}) },
        webdav: { ...DEFAULT_STORAGE_SETTINGS.webdav, ...(val.webdav || {}) },
      }
    }
  } catch (err) {
    console.error('Error loading storage settings from DB:', err)
  }

  return DEFAULT_STORAGE_SETTINGS
}

/**
 * Menyimpan konfigurasi penyimpanan ke database WebsiteConfig dan me-reload provider aktif
 */
export async function saveStorageSettings(
  settings: Partial<StorageSettings>
): Promise<StorageSettings> {
  const current = await getStorageSettings()

  // Secret preservation: cegah penimpaan kredensial rahasia dengan mask (********)
  let s3Secret = settings.s3?.secretAccessKey
  if (!s3Secret || s3Secret === '********' || s3Secret.includes('***')) {
    s3Secret = current.s3.secretAccessKey
  }

  let r2Secret = settings.r2?.secretAccessKey
  if (!r2Secret || r2Secret === '********' || r2Secret.includes('***')) {
    r2Secret = current.r2.secretAccessKey
  }

  let webdavPassword = settings.webdav?.password
  if (!webdavPassword || webdavPassword === '********' || webdavPassword.includes('***')) {
    webdavPassword = current.webdav.password
  }

  // SSRF Protection
  if (settings.s3?.endpoint) {
    const check = isSafeStorageUrl(settings.s3.endpoint)
    if (!check.safe) throw new Error(`S3 Endpoint tidak aman: ${check.error}`)
  }
  if (settings.webdav?.url) {
    const check = isSafeStorageUrl(settings.webdav.url)
    if (!check.safe) throw new Error(`WebDAV URL tidak aman: ${check.error}`)
  }

  // Path Traversal Protection
  if (settings.local?.baseDir) {
    const check = isSafeLocalDir(settings.local.baseDir)
    if (!check.safe) throw new Error(`Direktori lokal tidak aman: ${check.error}`)
  }

  const updated: StorageSettings = {
    ...current,
    ...settings,
    local: { ...current.local, ...(settings.local || {}) },
    s3: {
      ...current.s3,
      ...(settings.s3 || {}),
      secretAccessKey: s3Secret,
    },
    r2: {
      ...current.r2,
      ...(settings.r2 || {}),
      secretAccessKey: r2Secret,
    },
    webdav: {
      ...current.webdav,
      ...(settings.webdav || {}),
      password: webdavPassword,
    },
  }

  await prisma.websiteConfig.upsert({
    where: { key: 'storage_settings' },
    update: {
      value: updated as any,
      isPublic: false,
      category: 'storage',
    },
    create: {
      key: 'storage_settings',
      value: updated as any,
      isPublic: false,
      category: 'storage',
      description: 'Konfigurasi backend penyimpanan berkas (Local, S3, Cloudflare R2, WebDAV)',
    },
  })

  // Perbarui instance penyimpanan aktif secara langsung di memori
  const newProvider = createStorageFromConfig(updated)
  storageService.setProvider(newProvider)

  return updated
}

/**
 * Uji konektivitas ke provider penyimpanan berkas
 */
export async function testStorageConnection(
  config: StorageSettings
): Promise<{ success: boolean; message: string }> {
  try {
    switch (config.provider) {
      case 'local': {
        const check = isSafeLocalDir(config.local.baseDir)
        if (!check.safe) {
          return { success: false, message: check.error || 'Direktori tidak aman' }
        }
        const targetDir = path.resolve(process.cwd(), config.local.baseDir)
        if (!existsSync(targetDir)) {
          await mkdir(targetDir, { recursive: true })
        }
        const testFile = path.join(targetDir, `.healthcheck_${Date.now()}.tmp`)
        await writeFile(testFile, 'hubbhq-storage-healthcheck')
        if (existsSync(testFile)) {
          await unlink(testFile)
        }
        return {
          success: true,
          message: `Penyimpanan lokal siap digunakan di: ${targetDir}`,
        }
      }

      case 's3': {
        if (!config.s3.bucket) {
          return { success: false, message: 'Nama bucket S3 wajib diisi.' }
        }
        if (config.s3.endpoint) {
          const check = isSafeStorageUrl(config.s3.endpoint)
          if (!check.safe) return { success: false, message: check.error || 'Endpoint tidak aman' }
        }

        const client = new S3Client({
          region: config.s3.region || 'us-east-1',
          endpoint: config.s3.endpoint || undefined,
          forcePathStyle: config.s3.forcePathStyle,
          credentials: {
            accessKeyId: config.s3.accessKeyId,
            secretAccessKey: config.s3.secretAccessKey,
          },
        })

        const abortController = new AbortController()
        const timeoutId = setTimeout(() => abortController.abort(), 5000)

        try {
          await client.send(
            new HeadBucketCommand({ Bucket: config.s3.bucket }),
            { abortSignal: abortController.signal }
          )
          clearTimeout(timeoutId)
          return {
            success: true,
            message: `Koneksi S3 ke bucket "${config.s3.bucket}" berhasil diverifikasi.`,
          }
        } catch (err: any) {
          clearTimeout(timeoutId)
          if (err.name === 'AbortError' || err.name === 'TimeoutError') {
            return { success: false, message: 'Batas waktu koneksi habis (Timeout 5 detik).' }
          }
          return {
            success: false,
            message: `Gagal mengakses bucket S3: ${err.message || 'Periksa bucket dan kredensial Anda.'}`,
          }
        }
      }

      case 'r2': {
        if (!config.r2.accountId || !config.r2.bucket) {
          return { success: false, message: 'Account ID dan Nama Bucket Cloudflare R2 wajib diisi.' }
        }
        const endpoint = `https://${config.r2.accountId}.r2.cloudflarestorage.com`
        const check = isSafeStorageUrl(endpoint)
        if (!check.safe) return { success: false, message: check.error || 'Endpoint tidak aman' }

        const client = new S3Client({
          region: 'auto',
          endpoint,
          credentials: {
            accessKeyId: config.r2.accessKeyId,
            secretAccessKey: config.r2.secretAccessKey,
          },
        })

        const abortController = new AbortController()
        const timeoutId = setTimeout(() => abortController.abort(), 5000)

        try {
          await client.send(
            new HeadBucketCommand({ Bucket: config.r2.bucket }),
            { abortSignal: abortController.signal }
          )
          clearTimeout(timeoutId)
          return {
            success: true,
            message: `Koneksi Cloudflare R2 ke bucket "${config.r2.bucket}" berhasil terhubung.`,
          }
        } catch (err: any) {
          clearTimeout(timeoutId)
          if (err.name === 'AbortError' || err.name === 'TimeoutError') {
            return { success: false, message: 'Batas waktu koneksi Cloudflare R2 habis (Timeout 5 detik).' }
          }
          return {
            success: false,
            message: `Gagal terhubung ke Cloudflare R2: ${err.message || 'Periksa Account ID dan API Token R2.'}`,
          }
        }
      }

      case 'webdav': {
        if (!config.webdav.url) {
          return { success: false, message: 'URL WebDAV wajib diisi.' }
        }
        const check = isSafeStorageUrl(config.webdav.url)
        if (!check.safe) return { success: false, message: check.error || 'URL WebDAV tidak aman' }

        const credentials = `${config.webdav.username}:${config.webdav.password}`
        const authHeader = `Basic ${Buffer.from(credentials).toString('base64')}`

        let targetUrl = config.webdav.url
        if (config.webdav.basePath) {
          targetUrl = `${targetUrl.replace(/\/$/, '')}/${config.webdav.basePath.replace(/^\/|\/$/g, '')}`
        }

        try {
          const res = await fetch(targetUrl, {
            method: 'PROPFIND',
            headers: {
              Authorization: authHeader,
              Depth: '0',
            },
            signal: AbortSignal.timeout(5000),
          }).catch(async () => {
            return await fetch(targetUrl, {
              method: 'HEAD',
              headers: { Authorization: authHeader },
              signal: AbortSignal.timeout(5000),
            })
          })

          if (res.ok || res.status === 207) {
            return {
              success: true,
              message: `Koneksi WebDAV berhasil terhubung (Status: ${res.status} ${res.statusText}).`,
            }
          } else if (res.status === 401 || res.status === 403) {
            return {
              success: false,
              message: `Otentikasi WebDAV gagal (Status: ${res.status}). Periksa username dan password.`,
            }
          } else {
            return {
              success: false,
              message: `Server WebDAV merespons dengan status: ${res.status} ${res.statusText}`,
            }
          }
        } catch (err: any) {
          if (err.name === 'AbortError' || err.name === 'TimeoutError') {
            return { success: false, message: 'Batas waktu koneksi WebDAV habis (Timeout 5 detik).' }
          }
          return {
            success: false,
            message: `Gagal menghubungi server WebDAV: ${err.message || 'Periksa URL dan jaringan.'}`,
          }
        }
      }

      default:
        return { success: false, message: 'Provider tidak dikenali.' }
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Uji koneksi gagal: ${err.message || 'Terjadi kesalahan sistem'}`,
    }
  }
}

export class StorageService {
  private storage: IStorageProvider
  private initialized = false
  private initPromise: Promise<void> | null = null

  constructor() {
    this.storage = createStorage()
  }

  async ensureInitialized(): Promise<void> {
    if (this.initialized) return
    if (!this.initPromise) {
      this.initPromise = (async () => {
        try {
          const config = await getStorageSettings()
          this.storage = createStorageFromConfig(config)
        } catch (err) {
          console.error('StorageService init error:', err)
        } finally {
          this.initialized = true
        }
      })()
    }
    return this.initPromise
  }

  setProvider(provider: IStorageProvider) {
    this.storage = provider
    this.initialized = true
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
    await this.ensureInitialized()

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
    await this.ensureInitialized()
    const parts = url.split('/')
    if (parts.length >= 2) {
      const filename = parts[parts.length - 1]
      const folder = parts[parts.length - 2]
      return this.storage.delete(folder, filename)
    }
    return false
  }

  async read(folder: string, filename: string): Promise<Buffer | null> {
    await this.ensureInitialized()
    return this.storage.read(folder, filename)
  }

  async exists(folder: string, filename: string): Promise<boolean> {
    await this.ensureInitialized()
    return this.storage.exists(folder, filename)
  }

  async getSignedUrl(folder: string, filename: string, expiresInSeconds = 3600): Promise<string | null> {
    await this.ensureInitialized()
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
