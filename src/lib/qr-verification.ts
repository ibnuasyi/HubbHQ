import crypto from 'crypto'

/**
 * QR Code Spoofing Prevention
 * Uses HMAC-signed URLs with expiry to prevent fake QR codes
 */

const SECRET_KEY = process.env.QR_SECRET_KEY || 'default-key-change-in-production'

/**
 * Generate a signed verification URL
 * @param suratId - The surat ID
 * @param expiryMinutes - Token expiry in minutes (default: 30 days)
 * @returns { token: string, expiresAt: Date, verifyUrl: string }
 */
export function generateSignedVerificationUrl(
  suratId: string,
  expiryMinutes: number = 60 * 24 * 30 // 30 days default
): { token: string; expiresAt: Date; verifyUrl: string } {
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000)
  const payload = {
    id: suratId,
    exp: expiresAt.getTime(),
    iat: Date.now(),
  }

  // Create signature
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(data)
    .digest('base64url')

  // Token format: payload.signature
  const token = `${data}.${signature}`

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
  const verifyUrl = `${baseUrl}/verify/surat/${token}`

  return {
    token,
    expiresAt,
    verifyUrl,
  }
}

/**
 * Verify a signed token
 * @param token - The signed token from URL
 * @returns { valid: boolean; suratId?: string; error?: string }
 */
export function verifySignedToken(token: string): {
  valid: boolean
  suratId?: string
  error?: string
} {
  try {
    // Check token format
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Token tidak valid' }
    }

    const parts = token.split('.')
    if (parts.length !== 2) {
      return { valid: false, error: 'Format token tidak valid' }
    }

    const [data, signature] = parts

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(data)
      .digest('base64url')

    if (signature !== expectedSignature) {
      console.warn('[QR SECURITY] Invalid signature detected')
      return { valid: false, error: 'Token signature tidak valid' }
    }

    // Decode payload
    let payload: { id: string; exp: number; iat: number }
    try {
      payload = JSON.parse(Buffer.from(data, 'base64url').toString())
    } catch {
      return { valid: false, error: 'Payload tidak valid' }
    }

    // Check expiry
    if (Date.now() > payload.exp) {
      return { valid: false, error: 'Token sudah kadaluarsa' }
    }

    // Validate ID format (prevent injection)
    if (!payload.id || typeof payload.id !== 'string' || payload.id.length > 100) {
      return { valid: false, error: 'ID tidak valid' }
    }

    return { valid: true, suratId: payload.id }
  } catch (error) {
    console.error('[QR VERIFY ERROR]', error)
    return { valid: false, error: 'Gagal memverifikasi token' }
  }
}

/**
 * Extract surat ID from signed URL path
 * @param path - The URL path containing the signed token
 * @returns { valid: boolean; suratId?: string; error?: string }
 */
export function extractFromPath(path: string): {
  valid: boolean
  suratId?: string
  error?: string
} {
  // Path format: /verify/surat/{token}
  const match = path.match(/^\/verify\/surat\/(.+)$/i)
  if (!match) {
    return { valid: false, error: 'Path tidak valid' }
  }

  return verifySignedToken(match[1])
}

/**
 * Generate a QR code verification URL (legacy support - no signature)
 * DEPRECATED: Use generateSignedVerificationUrl instead
 * @deprecated Use generateSignedVerificationUrl for new QR codes
 */
export function generateLegacyVerificationUrl(suratId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
  return `${baseUrl}/verify/surat/${suratId}`
}

/**
 * Verify if a token is signed or legacy
 * @param token - The token or ID
 * @returns 'signed' | 'legacy' | 'invalid'
 */
export function getTokenType(token: string): 'signed' | 'legacy' | 'invalid' {
  if (!token) return 'invalid'

  // Signed tokens have format: base64url.base64url
  if (token.includes('.') && token.split('.').length === 2) {
    return 'signed'
  }

  // Legacy tokens are just CUIDs
  if (/^c[a-z0-9]{24}$/.test(token)) {
    return 'legacy'
  }

  return 'invalid'
}
