export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth, hasPermission, isSuperAdminRole } from '@/lib/auth'
import { isValidId, sanitizeInput } from '@/lib/api-security'

// GET /api/kalender - List all events
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    const where: any = {}

    if (startDate && endDate) {
      where.OR = [
        {
          startDate: {
            gte: new Date(startDate),
            lte: new Date(endDate + 'T23:59:59'),
          },
        },
        {
          endDate: {
            gte: new Date(startDate),
            lte: new Date(endDate + 'T23:59:59'),
          },
        },
        {
          AND: [
            { startDate: { lte: new Date(startDate) } },
            { endDate: { gte: new Date(endDate) } },
          ],
        },
      ]
    }

    if (month && year) {
      const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
      where.OR = [
        {
          startDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        {
          endDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        {
          AND: [
            { startDate: { lte: startOfMonth } },
            { endDate: { gte: endOfMonth } },
          ],
        },
      ]
    }

    // Filter berdasarkan visibility berdasarkan permission
    // Jika bukan admin, hanya lihat event public atau miliknya sendiri
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    })

    const isAdmin = isSuperAdminRole(user?.role)
    const canViewAll = await hasPermission(session.user.id, 'kalender.view_all')

    if (!isAdmin && !canViewAll) {
      where.OR = [
        { isPublic: true },
        { creatorId: session.user.id },
      ]
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        programKerja: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json({
      data: events,
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/kalender - Create event
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const hasAccess = await hasPermission(session.user.id, 'kalender.create')
    if (!hasAccess) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { role: true },
      })
      if (!isSuperAdminRole(user?.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const body = await request.json()
    const {
      title,
      description,
      startDate,
      endDate,
      allDay,
      location,
      color,
      isPublic,
      programKerjaId,
    } = body

    // Validate required fields
    if (!title || !startDate) {
      return NextResponse.json(
        { error: 'Judul dan tanggal mulai diperlukan' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeInput(title, 200)
    const sanitizedDescription = description ? sanitizeInput(description, 5000) : null
    const sanitizedLocation = location ? sanitizeInput(location, 200) : null

    // Validate date range
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : start

    if (isNaN(start.getTime())) {
      return NextResponse.json(
        { error: 'Format tanggal tidak valid' },
        { status: 400 }
      )
    }

    // Validate color format (basic hex validation)
    const colorRegex = /^#[0-9a-fA-F]{3,8}$/
    const sanitizedColor = color && colorRegex.test(color) ? color : '#6366f1'

    const event = await prisma.calendarEvent.create({
      data: {
        title: sanitizedTitle,
        description: sanitizedDescription,
        startDate: start,
        endDate: end,
        allDay: allDay ?? true,
        location: sanitizedLocation,
        color: sanitizedColor,
        isPublic: isPublic ?? true,
        programKerjaId: programKerjaId && isValidId(programKerjaId) ? programKerjaId : null,
        creatorId: session.user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        programKerja: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Acara berhasil dibuat',
      data: event,
    })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
