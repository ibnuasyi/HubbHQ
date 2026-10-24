export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// GET /api/website-config - Get all config or single key
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const roleName = (session?.user as any)?.role?.name?.toLowerCase() || ''
    const isAdmin = roleName === 'admin'
    const isTreasurer = ['admin', 'bendahara', 'ketua'].includes(roleName)

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    const category = searchParams.get('category')

    // If specific key requested
    if (key) {
      const config = await prisma.websiteConfig.findUnique({
        where: { key },
      })

      if (!config) {
        return NextResponse.json({ error: 'Config not found' }, { status: 404 })
      }

      // Security: If config is not public, require admin authentication
      if (!config.isPublic && !isAdmin) {
        return NextResponse.json({ error: 'Forbidden: Konfigurasi bersifat rahasia' }, { status: 403 })
      }

      // Mask sensitive credentials if accessing payment configs without treasurer/admin privileges
      let safeValue = config.value
      if (key === 'qris_payment_config' && !isTreasurer && safeValue && typeof safeValue === 'object') {
        const val = safeValue as any
        safeValue = {
          ...val,
          gateway: {
            ...(val.gateway || {}),
            apiKey: val.gateway?.apiKey ? '********' : '',
            webhookSecret: '********',
          },
        }
      }

      return NextResponse.json({ data: { ...config, value: safeValue } })
    }

    // Get all configs
    const where: any = {}

    // Security: Only admins can list private system configs
    if (!isAdmin) {
      where.isPublic = true
    }

    // Filter by category
    if (category) {
      where.category = category
    }

    const configs = await prisma.websiteConfig.findMany({
      where,
      orderBy: { key: 'asc' },
    })

    // Transform to key-value object with sensitive credential masking
    const configData: Record<string, any> = {}
    const safeConfigs = configs.map((config) => {
      let safeValue = config.value
      if (config.key === 'qris_payment_config' && !isTreasurer && safeValue && typeof safeValue === 'object') {
        const val = safeValue as any
        safeValue = {
          ...val,
          gateway: {
            ...(val.gateway || {}),
            apiKey: val.gateway?.apiKey ? '********' : '',
            webhookSecret: '********',
          },
        }
      }
      configData[config.key] = safeValue
      return { ...config, value: safeValue }
    })

    return NextResponse.json({
      data: configData,
      configs: safeConfigs,
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
