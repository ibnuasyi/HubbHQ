export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { checkRateLimit } from '@/lib/api-security'

/**
 * POST /api/auth/reset-password
 * Reset password with HMAC-signed token
 */
export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous'
    const rate = checkRateLimit(`reset-password:${clientIp}`, { windowMs: 60000, maxRequests: 5 })
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan. Silakan tunggu 1 menit.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { token, newPassword, confirmPassword } = body

    // Validate required fields
    if (!token || typeof token !== 'string' || !newPassword) {
      return NextResponse.json(
        { error: 'Token dan password baru diperlukan' },
        { status: 400 }
      )
    }

    // Validate password match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Password tidak cocok' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password minimal 8 karakter' },
        { status: 400 }
      )
    }

    // Pisahkan payload dan signature HMAC
    const parts = token.split('.')
    if (parts.length !== 2) {
      return NextResponse.json(
        { error: 'Format token keamanan tidak valid' },
        { status: 400 }
      )
    }
    const [payloadB64, providedSig] = parts

    // Decode and validate token payload
    let tokenData: any
    try {
      tokenData = JSON.parse(Buffer.from(payloadB64, 'base64url').toString())
    } catch {
      return NextResponse.json(
        { error: 'Token tidak valid' },
        { status: 400 }
      )
    }

    // Check token type
    if (tokenData.type !== 'password_reset' || !tokenData.userId) {
      return NextResponse.json(
        { error: 'Token tidak valid' },
        { status: 400 }
      )
    }

    // Check token expiry
    if (typeof tokenData.exp !== 'number' || Date.now() > tokenData.exp) {
      return NextResponse.json(
        { error: 'Token sudah kadaluarsa. Silakan minta reset password lagi.' },
        { status: 400 }
      )
    }

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Token tidak valid' },
        { status: 400 }
      )
    }

    // Verifikasi tanda tangan kriptografis HMAC-SHA256
    const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
    if (!secret) {
      return NextResponse.json(
        { error: 'Konfigurasi keamanan server belum lengkap' },
        { status: 500 }
      )
    }

    const hmacKey = `${secret}:${user.password || ''}`
    const expectedSig = crypto
      .createHmac('sha256', hmacKey)
      .update(payloadB64)
      .digest('base64url')

    const sigBuffer = Buffer.from(providedSig)
    const expectedBuffer = Buffer.from(expectedSig)
    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return NextResponse.json(
        { error: 'Tanda tangan token tidak sah atau token sudah pernah digunakan' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    })

    // Log the password reset
    console.log(`[AUDIT] Password reset for user: ${user.email}`)

    return NextResponse.json({
      message: 'Password berhasil direset. Silakan login dengan password baru.'
    })
  } catch (error) {
    console.error('[RESET PASSWORD ERROR]', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
