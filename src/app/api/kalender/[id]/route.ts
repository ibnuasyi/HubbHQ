export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth, hasPermission, isSuperAdminRole } from '@/lib/auth'
import { isValidId, sanitizeInput } from '@/lib/api-security'

// GET /api/kalender/[id] - Get single event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate ID format
    if (!isValidId(id)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const event = await prisma.calendarEvent.findUnique({
      where: { id },
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

    if (!event) {
      return NextResponse.json(
        { error: 'Acara tidak ditemukan' },
        { status: 404 }
      )
    }

    // IDOR Protection: Check if user can view this event
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    })

    const isAdmin = isSuperAdminRole(user?.role)
    const canViewAll = await hasPermission(session.user.id, 'kalender.view_all')

    // Allow if: admin, has view_all permission, event is public, or user is creator
    if (!isAdmin && !canViewAll && !event.isPublic && event.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses ke acara ini' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      data: event,
    })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/kalender/[id] - Update event
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate ID format
    if (!isValidId(id)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    // IDOR Protection: Check ownership
    const event = await prisma.calendarEvent.findUnique({
      where: { id },
      select: { creatorId: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Acara tidak ditemukan' }, { status: 404 })
    }

    // Check if user is creator or has permission
    const canEdit =
      event.creatorId === session.user.id ||
      (await hasPermission(session.user.id, 'kalender.edit'))

    if (!canEdit) {
      // Check if admin
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { role: true },
      })
      if (!isSuperAdminRole(user?.role)) {
        return NextResponse.json(
          { error: 'Anda tidak memiliki akses untuk mengedit acara ini' },
          { status: 403 }
        )
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
    } = body

    const updateData: any = {}

    if (title !== undefined) updateData.title = sanitizeInput(title, 200)
    if (description !== undefined) updateData.description = description ? sanitizeInput(description, 5000) : null
    if (startDate !== undefined) {
      const parsedDate = new Date(startDate)
      if (!isNaN(parsedDate.getTime())) {
        updateData.startDate = parsedDate
      }
    }
    if (endDate !== undefined) {
      if (endDate === null) {
        updateData.endDate = null
      } else {
        const parsedDate = new Date(endDate)
        if (!isNaN(parsedDate.getTime())) {
          updateData.endDate = parsedDate
        }
      }
    }
    if (allDay !== undefined) updateData.allDay = Boolean(allDay)
    if (location !== undefined) updateData.location = location ? sanitizeInput(location, 200) : null
    if (color !== undefined) {
      // Validate color format
      const colorRegex = /^#[0-9a-fA-F]{3,8}$/
      if (colorRegex.test(color)) {
        updateData.color = color
      }
    }
    if (isPublic !== undefined) updateData.isPublic = Boolean(isPublic)

    const updatedEvent = await prisma.calendarEvent.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Acara berhasil diupdate',
      data: updatedEvent,
    })
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/kalender/[id] - Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate ID format
    if (!isValidId(id)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    // IDOR Protection: Check ownership
    const event = await prisma.calendarEvent.findUnique({
      where: { id },
      select: { creatorId: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Acara tidak ditemukan' }, { status: 404 })
    }

    // Check if user is creator or has permission
    const canDelete =
      event.creatorId === session.user.id ||
      (await hasPermission(session.user.id, 'kalender.delete'))

    if (!canDelete) {
      // Check if admin
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { role: true },
      })
      if (!isSuperAdminRole(user?.role)) {
        return NextResponse.json(
          { error: 'Anda tidak memiliki akses untuk menghapus acara ini' },
          { status: 403 }
        )
      }
    }

    await prisma.calendarEvent.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Acara berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
