import crypto from 'crypto'

/**
 * Generate token acak unik untuk bilik suara pemilih (DPT)
 * Format: 8 karakter alfanumerik huruf kapital + angka tanpa karakter rancu (misal 0/O, 1/I)
 */
export function generateVotingToken(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  let token = ''
  const randomBytes = crypto.randomBytes(8)
  for (let i = 0; i < 8; i++) {
    token += chars[randomBytes[i] % chars.length]
  }
  return token
}

/**
 * Generate cryptographic hash SHA-256 untuk bukti integritas kotak suara anonim
 */
export function generateBallotVerificationHash(
  eventId: string,
  kandidatId: string | null,
  timestamp: Date
): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('NEXTAUTH_SECRET or AUTH_SECRET must be configured for E-Voting integrity')
  }
  const effectiveSecret = secret || 'dev-only-evoting-fallback-secret'
  const payload = `${eventId}:${kandidatId || 'ABSTAIN'}:${timestamp.getTime()}:${crypto.randomBytes(16).toString('hex')}`
  return crypto.createHmac('sha256', effectiveSecret).update(payload).digest('hex')
}

