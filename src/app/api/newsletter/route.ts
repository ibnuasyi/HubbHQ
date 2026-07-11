export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST /api/newsletter - Subscribe to newsletter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

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
      // Create new subscription
      // Get IP address from request headers
      const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                       request.headers.get('x-real-ip') ||
                       'unknown'

      await prisma.newsletterSubscriber.create({
        data: {
          email: email.toLowerCase(),
          ipAddress
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
    // Simple auth check - in production, use proper authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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
