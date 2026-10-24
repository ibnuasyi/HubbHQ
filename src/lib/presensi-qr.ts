import crypto from 'crypto'

/**
 * Dynamic QR Code Token Generator & Validator
 * Menggunakan algoritma berbasis Time-based HMAC (mirip TOTP)
 * untuk mencegah kecurangan titip absen atau foto QR yang disebarkan di grup.
 */

export interface QrTokenResult {
  token: string
  step: number
  expiresAt: string
  remainingSeconds: number
  ttlSeconds: number
}

/**
 * Hitung HMAC token untuk window step tertentu
 */
function calculateHmacToken(sesiId: string, secret: string, step: number): string {
  const payload = `${sesiId}:${step}`
  return crypto.createHmac('sha256', secret).update(payload).digest('hex').substring(0, 16)
}

/**
 * Generate QR Token aktif saat ini beserta sisa waktu validitas
 */
export function generateDynamicQrToken(
  sesiId: string,
  secret: string,
  ttlSeconds = 20
): QrTokenResult {
  const now = Date.now()
  const stepMs = ttlSeconds * 1000
  const step = Math.floor(now / stepMs)
  const nextStepTime = (step + 1) * stepMs
  const remainingSeconds = Math.max(1, Math.round((nextStepTime - now) / 1000))

  const token = calculateHmacToken(sesiId, secret, step)

  return {
    token,
    step,
    expiresAt: new Date(nextStepTime).toISOString(),
    remainingSeconds,
    ttlSeconds,
  }
}

/**
 * Validasi apakah token QR yang discan peserta valid
 * Mendukung toleransi 1 step sebelum dan sesudah untuk jeda latency jaringan
 */
export function verifyDynamicQrToken(
  sesiId: string,
  secret: string,
  tokenToVerify: string,
  ttlSeconds = 20
): { isValid: boolean; reason?: string } {
  if (!tokenToVerify || typeof tokenToVerify !== 'string') {
    return { isValid: false, reason: 'Token QR tidak ditemukan' }
  }

  const now = Date.now()
  const stepMs = ttlSeconds * 1000
  const currentStep = Math.floor(now / stepMs)

  // Toleransi: window sekarang, 1 step sebelumnya (sedang transisi)
  const validSteps = [currentStep, currentStep - 1, currentStep + 1]

  for (const step of validSteps) {
    const expectedToken = calculateHmacToken(sesiId, secret, step)
    // Timing-safe comparison
    if (crypto.timingSafeEqual(Buffer.from(tokenToVerify), Buffer.from(expectedToken))) {
      return { isValid: true }
    }
  }

  return {
    isValid: false,
    reason: 'QR Code telah kedaluwarsa atau berganti. Silakan scan ulang QR Code terbaru di layar proyektor/panitia.',
  }
}

