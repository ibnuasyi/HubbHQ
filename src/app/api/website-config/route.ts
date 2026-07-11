export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// GET /api/website-config - Get all config or single key
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    const category = searchParams.get('category')
    const isPublic = searchParams.get('public')

    // If specific key requested
    if (key) {
      const config = await prisma.websiteConfig.findUnique({
        where: { key },
      })

      if (!config) {
        return NextResponse.json({ error: 'Config not found' }, { status: 404 })
      }

      return NextResponse.json({ data: config })
    }

    // Get all configs (public endpoint - no auth required)
    const where: any = {}

    // Filter by category
    if (category) {
      where.category = category
    }

    const configs = await prisma.websiteConfig.findMany({
      where,
      orderBy: { key: 'asc' },
    })

    // Transform to key-value object
    const configData: Record<string, any> = {}
    configs.forEach((config) => {
      configData[config.key] = config.value
    })

    return NextResponse.json({
      data: configData,
      configs: configs,
    })
  } catch (error) {
    console.error('Error fetching website config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/website-config - Create or update single config
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      include: { role: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Forbidden - User not found' },
        { status: 403 }
      )
    }

    // Check if role exists and is admin
    const roleName = user.role?.name?.toLowerCase()

    if (roleName !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin only' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { key, value, description, category, isPublic } = body

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    // Upsert config
    const config = await prisma.websiteConfig.upsert({
      where: { key },
      update: {
        value,
        description,
        category,
        isPublic,
      },
      create: {
        key,
        value,
        description,
        category: category || 'general',
        isPublic: isPublic || false,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Config saved successfully',
      data: config,
    })
  } catch (error) {
    console.error('Error saving website config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/website-config - Bulk update configs
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      include: { role: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Forbidden - User not found' },
        { status: 403 }
      )
    }

    // Check if role exists and is admin
    const roleName = user.role?.name?.toLowerCase()

    if (roleName !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin only' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { configs } = body

    if (!configs || !Array.isArray(configs)) {
      return NextResponse.json({ error: 'Configs array is required' }, { status: 400 })
    }

    // Update/create all configs
    const results = await Promise.all(
      configs.map(async (item: { key: string; value: any; description?: string; category?: string; isPublic?: boolean }) => {
        return prisma.websiteConfig.upsert({
          where: { key: item.key },
          update: {
            value: item.value,
            description: item.description,
            category: item.category,
            isPublic: item.isPublic,
          },
          create: {
            key: item.key,
            value: item.value,
            description: item.description,
            category: item.category || 'general',
            isPublic: item.isPublic || false,
          },
        })
      })
    )

    return NextResponse.json({
      success: true,
      message: 'Configs saved successfully',
      data: results,
    })
  } catch (error) {
    console.error('Error saving website configs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
