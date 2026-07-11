export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '@/lib/api-auth'

const prisma = new PrismaClient()

// GET /api/events - List calendar events (public for public events)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const publicOnly = searchParams.get('public')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const where: Record<string, unknown> = {}
    if (publicOnly === 'true') where.isPublic = true
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
    // Require authentication
    const { authorized, response } = await requireAuth(request)
    if (!authorized) return response!

    const body = await request.json()
    const { title, description, startDate, endDate, allDay, location, programKerjaId, creatorId, color, isPublic } = body

    // Validate required fields
    if (!title || !startDate) {
      return NextResponse.json(
        { error: 'Title and startDate are required' },
        { status: 400 }
      )
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        allDay: allDay !== false,
        location,
        programKerjaId,
        creatorId,
        color: color || '#6366f1',
        isPublic: isPublic !== false
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
