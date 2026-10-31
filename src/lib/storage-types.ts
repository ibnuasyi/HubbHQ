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
  provider: (typeof process !== 'undefined' && process.env?.STORAGE_PROVIDER
    ? process.env.STORAGE_PROVIDER
    : 'local').toLowerCase() as StorageProviderType,
  local: {
    baseDir: (typeof process !== 'undefined' && process.env?.STORAGE_LOCAL_DIR) || './uploads',
    publicFolders: ((typeof process !== 'undefined' && process.env?.STORAGE_PUBLIC_FOLDERS) ||
      'images,documents,gallery,banners,post-images,library,sertifikat')
      .split(',')
      .map((s) => s.trim()),
    protectedFolders: ((typeof process !== 'undefined' && process.env?.STORAGE_PROTECTED_FOLDERS) ||
      'avatars,signatures,attachments,private,user-files,lpj,proposals')
      .split(',')
      .map((s) => s.trim()),
  },
  s3: {
    endpoint: (typeof process !== 'undefined' && process.env?.S3_ENDPOINT) || '',
    region: (typeof process !== 'undefined' && process.env?.S3_REGION) || 'us-east-1',
    bucket: (typeof process !== 'undefined' && process.env?.S3_BUCKET) || 'hubbhq',
    accessKeyId: (typeof process !== 'undefined' && process.env?.S3_ACCESS_KEY_ID) || '',
    secretAccessKey: (typeof process !== 'undefined' && process.env?.S3_SECRET_ACCESS_KEY) || '',
    forcePathStyle:
      (typeof process !== 'undefined' && process.env?.S3_FORCE_PATH_STYLE === 'true') ||
      Boolean(typeof process !== 'undefined' && process.env?.S3_ENDPOINT),
    publicUrl: (typeof process !== 'undefined' && process.env?.S3_PUBLIC_URL) || '',
    publicPrefixes: ((typeof process !== 'undefined' && process.env?.S3_PUBLIC_PREFIXES) ||
      'images,documents,gallery,banners,post-images,library,sertifikat')
      .split(',')
      .map((s) => s.trim()),
  },
  r2: {
    accountId: (typeof process !== 'undefined' && process.env?.R2_ACCOUNT_ID) || '',
    bucket: (typeof process !== 'undefined' && process.env?.R2_BUCKET) || 'hubbhq',
    accessKeyId: (typeof process !== 'undefined' && process.env?.R2_ACCESS_KEY_ID) || '',
    secretAccessKey: (typeof process !== 'undefined' && process.env?.R2_SECRET_ACCESS_KEY) || '',
    publicUrl: (typeof process !== 'undefined' && process.env?.R2_PUBLIC_URL) || '',
    publicPrefixes: ((typeof process !== 'undefined' && process.env?.R2_PUBLIC_PREFIXES) ||
      'images,documents,gallery,banners,post-images,library,sertifikat')
      .split(',')
      .map((s) => s.trim()),
  },
  webdav: {
    url: ((typeof process !== 'undefined' && process.env?.WEBDAV_URL) || '').replace(/\/$/, ''),
    username: (typeof process !== 'undefined' && process.env?.WEBDAV_USERNAME) || '',
    password: (typeof process !== 'undefined' && process.env?.WEBDAV_PASSWORD) || '',
    basePath: ((typeof process !== 'undefined' && process.env?.WEBDAV_BASE_PATH) || '').replace(/^\/|\/$/g, ''),
    publicUrl: ((typeof process !== 'undefined' && process.env?.WEBDAV_PUBLIC_URL) || '').replace(/\/$/, ''),
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

