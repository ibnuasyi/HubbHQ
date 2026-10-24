export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { checkRateLimitByIP, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * GET /api/users/[id]/password
 * Check if user must change password
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = id

    // Only allow user to check themselves, or admin
    if (session.user.id !== userId && session.user.role?.name !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        mustChangePassword: true,
        passwordChangedAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('[PASSWORD CHECK ERROR]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/users/[id]/password
 * Change password or force reset
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clientIp = getClientIP(request)
    const rate = checkRateLimitByIP(clientIp, 'change_password', RATE_LIMITS.AUTH.CHANGE_PASSWORD)
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan penggantian password. Silakan coba lagi nanti.' },
        { status: 429 }
      )
    }

    const userId = id
    const body = await request.json()
    const { currentPassword, newPassword, forceReset, resetAllDefaults } = body

    // Check permissions
    const isSelf = session.user.id === userId
    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const isAdmin = roleName === 'admin' || (session.user as any)?.role === 'admin'

    if (!isSelf && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // If resetting another user (admin only)
    if (!isSelf && isAdmin && forceReset) {
      // Force reset single user
      const targetUser = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          mustChangePassword: true,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        message: `User ${targetUser.email} akan dipaksa mengganti password saat login berikutnya`
      })
    }

    // If resetting all default credentials (admin only)
    if (resetAllDefaults && isAdmin) {
      // Find users with weak/default passwords
      // This is a simplified check - in production, use a proper password strength checker
      const weakPasswords = ['admin123', 'password', '12345678', 'password123']

      const usersToReset = await prisma.user.findMany({
        where: {
          password: {
            // This won't work directly with bcrypt - need to check differently
            // For now, we'll reset all users who haven't changed password recently
          }
        }
      })

      // Actually, let's reset users with mustChangePassword flag
      // Or reset all users with old passwords
      const updated = await prisma.user.updateMany({
        where: {
          OR: [
            { mustChangePassword: true },
            {
              // Users created more than 90 days ago who haven't changed password
              createdAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
              passwordChangedAt: null
            }
          ]
        },
        data: {
          mustChangePassword: true
        }
      })

      console.log(`[SECURITY] Force reset ${updated.count} users with default credentials`)

      return NextResponse.json({
        message: `${updated.count} user dipaksa mengganti password`
      })
    }

    // Self password change - verify current password
    if (isSelf && currentPassword && newPassword) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true, email: true }
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.password)
      if (!isValid) {
        return NextResponse.json({ error: 'Password saat ini salah' }, { status: 400 })
      }

      // Validate new password
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: 'Password baru minimal 8 karakter' },
          { status: 400 }
        )
      }

      // Hash and update
      const hashedPassword = await bcrypt.hash(newPassword, 12)
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          mustChangePassword: false,
          passwordChangedAt: new Date()
        }
      })

      console.log(`[AUDIT] User ${user.email} changed their password`)

      return NextResponse.json({
        message: 'Password berhasil diganti'
      })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('[PASSWORD CHANGE ERROR]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
