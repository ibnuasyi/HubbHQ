export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

const TOKEN_EXPIRY = 60 * 60 * 1000 // 1 hour

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, newPassword, confirmPassword } = body

    // Validate required fields
    if (!token || !newPassword) {
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

    // Decode and validate token
    let tokenData
    try {
      tokenData = JSON.parse(Buffer.from(token, 'base64url').toString())
    } catch {
      return NextResponse.json(
        { error: 'Token tidak valid' },
        { status: 400 }
      )
    }

    // Check token type
    if (tokenData.type !== 'password_reset') {
      return NextResponse.json(
        { error: 'Token tidak valid' },
        { status: 400 }
      )
    }

    // Check token expiry
    if (Date.now() > tokenData.exp) {
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
        { error: 'User tidak ditemukan' },
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
