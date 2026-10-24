export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth, hasPermission } from '@/lib/auth'
import { isValidId, sanitizeInput } from '@/lib/api-security'

// GET /api/events - List calendar events (public for public events)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const publicOnly = searchParams.get('public')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const session = await auth()
    const where: Record<string, unknown> = {}

    // Force publicOnly if requester is not authenticated
    if (!session?.user?.id || publicOnly === 'true') {
      where.isPublic = true
    }

    if (startDate) where.startDate = { gte: new Date(startDate) }
    if (endDate) where.endDate = { lte: new Date(endDate) }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        programKerja: {
          select: { id: true, title: true }
        },
        creator: {
          select: { name: true }
        }
      },
      orderBy: { startDate: 'asc' },
      take: limit
    })

    return NextResponse.json({ events, count: events.length })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

// POST /api/events - Create a new event (authenticated users)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const canCreateEvent =
      ['admin', 'ketua'].includes(roleName) ||
      (await hasPermission(session.user.id, 'kalender.create'))

    if (!canCreateEvent) {
      return NextResponse.json(
        { error: 'Forbidden: Anda tidak memiliki akses untuk membuat agenda kegiatan' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, description, startDate, endDate, allDay, location, programKerjaId, color, isPublic } = body

    // Validate required fields
    if (!title || !startDate) {
      return NextResponse.json(
        { error: 'Title and startDate are required' },
        { status: 400 }
      )
    }

    const sanitizedTitle = sanitizeInput(title, 200)
    const sanitizedDescription = description ? sanitizeInput(description, 5000) : null
    const sanitizedLocation = location ? sanitizeInput(location, 200) : null

    // Validate date range
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : null

    if (isNaN(start.getTime())) {
      return NextResponse.json(
        { error: 'Format tanggal mulai tidak valid' },
        { status: 400 }
      )
    }

    const colorRegex = /^#[0-9a-fA-F]{3,8}$/
    const sanitizedColor = color && colorRegex.test(color) ? color : '#6366f1'

    const event = await prisma.calendarEvent.create({
      data: {
        title: sanitizedTitle,
        description: sanitizedDescription,
        startDate: start,
        endDate: end,
        allDay: allDay !== false,
        location: sanitizedLocation,
        programKerjaId: programKerjaId && isValidId(programKerjaId) ? programKerjaId : null,
        creatorId: session.user.id,
        color: sanitizedColor,
        isPublic: Boolean(isPublic)
      }
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}
