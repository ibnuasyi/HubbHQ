export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

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

      // Generate reset token (simple token for demo - use proper crypto in production)
      const resetToken = Buffer.from(
        JSON.stringify({
          userId: user.id,
          email: user.email,
          exp: Date.now() + 60 * 60 * 1000, // 1 hour
          type: 'password_reset'
        })
      ).toString('base64url')

      // In production, send email here
      // For now, we'll return the token directly (remove in production!)
      console.log(`[PASSWORD RESET] Token for ${email}: ${resetToken}`)

      // TODO: Send actual email with reset link
      // await sendEmail({
      //   to: email,
      //   subject: 'Reset Password SIOP',
      //   html: `<a href="${BASE_URL}/reset-password?token=${resetToken}">Reset Password</a>`
      // })

      return NextResponse.json({
        message: 'Jika email tersebut terdaftar, link reset password telah dikirim',
        // Remove this in production - only for development
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
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
