export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

// Rate limiting for password reset requests
const RESET_WINDOW = 60 * 60 * 1000 // 1 hour
const MAX_RESET_REQUESTS = 3

const resetAttempts = new Map<string, { count: number; firstAttempt: number }>()

function checkResetLimit(email: string): boolean {
  const attempt = resetAttempts.get(email)
  if (!attempt) return true

  // Reset if window expired
  if (Date.now() - attempt.firstAttempt > RESET_WINDOW) {
    resetAttempts.delete(email)
    return true
  }

  return attempt.count < MAX_RESET_REQUESTS
}

function recordResetAttempt(email: string): void {
  const attempt = resetAttempts.get(email)
  if (!attempt) {
    resetAttempts.set(email, { count: 1, firstAttempt: Date.now() })
  } else {
    attempt.count++
  }
}

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email diperlukan' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      )
    }

    // Check rate limit
    if (!checkResetLimit(email)) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan. Coba lagi dalam 1 jam.' },
        { status: 429 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Always return success to prevent email enumeration
    // But only actually process if user exists
    if (user) {
      recordResetAttempt(email)

      // Buat payload token reset password yang ditandatangani secara kriptografis (HMAC-SHA256)
      // Mengikat tanda tangan dengan hash password saat ini agar token otomatis hangus setelah dipakai sekali
      const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
      if (!secret) {
        throw new Error('Server auth secret belum dikonfigurasi')
      }

      const payloadBytes = Buffer.from(
        JSON.stringify({
          userId: user.id,
          email: user.email,
          exp: Date.now() + 60 * 60 * 1000, // 1 jam
          type: 'password_reset',
        })
      ).toString('base64url')

      const hmacKey = `${secret}:${user.password || ''}`
      const signature = crypto
        .createHmac('sha256', hmacKey)
        .update(payloadBytes)
        .digest('base64url')

      const resetToken = `${payloadBytes}.${signature}`

      // Catat di log server internal (tidak pernah dikirim di body respons HTTP)
      console.log(`[PASSWORD RESET] Link requested for ${email}`)

      return NextResponse.json({
        message: 'Jika email tersebut terdaftar, link reset password telah dikirim',
      })
    }

    // User not found - still return success to prevent enumeration
    return NextResponse.json({
      message: 'Jika email tersebut terdaftar, link reset password telah dikirim'
    })
  } catch (error) {
    console.error('[FORGOT PASSWORD ERROR]', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
