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
  const secret = process.env.NEXTAUTH_SECRET || 'hubbhq-evoting-secret-key'
  const payload = `${eventId}:${kandidatId || 'ABSTAIN'}:${timestamp.getTime()}:${crypto.randomBytes(16).toString('hex')}`
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

