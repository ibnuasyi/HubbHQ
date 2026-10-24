export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { checkPublicRateLimit, checkRateLimitByIP, getClientIP } from '@/lib/rate-limit'

// POST /api/newsletter - Subscribe to newsletter
export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIP(request)
    const rate = checkPublicRateLimit(clientIp, 'newsletter')
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan langganan. Silakan coba lagi nanti.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email, website, _hp } = body

    // Honeypot anti-bot
    if (website || _hp) {
      return NextResponse.json({
        success: true,
        message: 'Successfully subscribed to newsletter!'
      })
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if already subscribed
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existing && existing.isActive) {
      return NextResponse.json(
        { error: 'Email already subscribed' },
        { status: 400 }
      )
    }

    // If previously unsubscribed, reactivate
    if (existing && !existing.isActive) {
      await prisma.newsletterSubscriber.update({
        where: { email: email.toLowerCase() },
        data: {
          isActive: true,
          unsubscribedAt: null,
          subscribedAt: new Date()
        }
      })
    } else {
      await prisma.newsletterSubscriber.create({
        data: {
          email: email.toLowerCase(),
          ipAddress: clientIp
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter!'
    })
  } catch (error) {
    console.error('Error processing newsletter subscription:', error)
    return NextResponse.json(
      { error: 'Failed to process subscription' },
      { status: 500 }
    )
  }
}

// GET /api/newsletter - Get subscribers (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const roleName = (session?.user as any)?.role?.name?.toLowerCase() || ''
    if (!session?.user?.id || roleName !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      )
    }

    const count = await prisma.newsletterSubscriber.count({
      where: { isActive: true }
    })

    return NextResponse.json({
      count,
      message: 'Number of active subscribers'
    })
  } catch (error) {
    console.error('Error fetching newsletter subscribers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscribers' },
      { status: 500 }
    )
  }
}

// DELETE /api/newsletter - Unsubscribe
export async function DELETE(request: NextRequest) {
  try {
    const clientIp = getClientIP(request)
    const rate = checkRateLimitByIP(clientIp, 'newsletter_unsub', { windowMs: 60 * 1000, maxRequests: 5 })
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan berhenti langganan.' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!subscriber) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      )
    }

    await prisma.newsletterSubscriber.update({
      where: { email: email.toLowerCase() },
      data: {
        isActive: false,
        unsubscribedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    })
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error)
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    )
  }
}
