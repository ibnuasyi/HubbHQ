/**
 * Kalender-Proker Synchronization Utilities
 * Automatically syncs calendar events with program kerja checkpoints
 */

import { prisma } from '@/lib/db'

// =====================================================
// Types
// =====================================================

export interface SyncOptions {
  createEvents?: boolean  // Create calendar events from proker checkpoints
  updateEvents?: boolean // Update calendar events when proker changes
  deleteEvents?: boolean // Delete calendar events when proker is deleted
}

// =====================================================
// Sync Proker to Calendar Events
// =====================================================

/**
 * Create calendar events from program kerja checkpoints
 */
export async function syncProkerToCalendar(prokerId: string): Promise<{
  success: boolean
  eventsCreated: number
  error?: string
}> {
  try {
    const proker = await prisma.programKerja.findUnique({
      where: { id: prokerId },
      include: {
        checkpoints: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!proker) {
      return { success: false, eventsCreated: 0, error: 'Proker not found' }
    }

    let eventsCreated = 0

    for (const checkpoint of proker.checkpoints) {
      // Check if event already exists for this checkpoint
      const existingEvent = await prisma.calendarEvent.findFirst({
        where: {
          programKerjaId: prokerId,
          title: { contains: checkpoint.title },
        },
      })

      if (!existingEvent && checkpoint.isCompleted) {
        // Create calendar event from completed checkpoint
        await prisma.calendarEvent.create({
          data: {
            title: `[PROKER] ${checkpoint.title}`,
            description: checkpoint.description || `Checkpoint dari program kerja: ${proker.title}`,
            startDate: checkpoint.completedAt || proker.endDate || new Date(),
            endDate: checkpoint.completedAt || proker.endDate || new Date(),
            allDay: true,
            color: '#10b981', // Green for completed
            isPublic: false,
            programKerjaId: prokerId,
            creatorId: checkpoint.completedById || proker.creatorId,
          },
        })
        eventsCreated++
      }
    }

    return { success: true, eventsCreated }
  } catch (error) {
    console.error('[KALENDER SYNC ERROR]', error)
    return {
      success: false,
      eventsCreated: 0,
      error: 'Failed to sync proker to calendar',
    }
  }
}

/**
 * Update calendar events when proker status changes
 */
export async function syncProkerStatusToCalendar(
  prokerId: string,
  oldStatus: string,
  newStatus: string
): Promise<{
  success: boolean
  eventsUpdated: number
}> {
  try {
    const proker = await prisma.programKerja.findUnique({
      where: { id: prokerId },
    })

    if (!proker) {
      return { success: false, eventsUpdated: 0 }
    }

    let eventsUpdated = 0
    let newColor = '#6366f1' // Default

    // Determine color based on status
    if (newStatus === 'COMPLETED') {
      newColor = '#10b981' // Green
    } else if (newStatus === 'ON_PROGRESS') {
      newColor = '#3b82f6' // Blue
    } else if (newStatus === 'CANCELLED') {
      newColor = '#ef4444' // Red
    } else {
      newColor = '#6b7280' // Gray for draft
    }

    // Update all calendar events for this proker
    const events = await prisma.calendarEvent.findMany({
      where: { programKerjaId: prokerId },
    })

    for (const event of events) {
      await prisma.calendarEvent.update({
        where: { id: event.id },
        data: {
          color: newColor,
          title: `[${newStatus}] ${proker.title}`,
          description: `Program kerja status: ${newStatus}`,
        },
      })
      eventsUpdated++
    }

    return { success: true, eventsUpdated }
  } catch (error) {
    console.error('[KALENDER STATUS SYNC ERROR]', error)
    return { success: false, eventsUpdated: 0 }
  }
}

/**
 * Delete all calendar events for a proker
 */
export async function deleteProkerCalendarEvents(prokerId: string): Promise<{
  success: boolean
  eventsDeleted: number
}> {
  try {
    const result = await prisma.calendarEvent.deleteMany({
      where: { programKerjaId: prokerId },
    })

    return { success: true, eventsDeleted: result.count }
  } catch (error) {
    console.error('[KALENDER DELETE ERROR]', error)
    return { success: false, eventsDeleted: 0 }
  }
}

/**
 * Create calendar event from checkpoint completion
 */
export async function createEventFromCheckpoint(
  checkpointId: string,
  completedById: string
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const checkpoint = await prisma.checkpoint.findUnique({
      where: { id: checkpointId },
      include: {
        programKerja: true,
      },
    })

    if (!checkpoint) {
      return { success: false, error: 'Checkpoint not found' }
    }

    // Check if auto-sync is enabled
    // You could add a setting for this

    // Create event
    const event = await prisma.calendarEvent.create({
      data: {
        title: `✓ ${checkpoint.title} (Selesai)`,
        description: checkpoint.description || `Checkpoint selesai dari program kerja: ${checkpoint.programKerja.title}`,
        startDate: checkpoint.completedAt || new Date(),
        endDate: checkpoint.completedAt || new Date(),
        allDay: true,
        color: '#10b981',
        isPublic: false,
        programKerjaId: checkpoint.programKerjaId,
        creatorId: completedById,
      },
    })

    return { success: true, eventId: event.id }
  } catch (error) {
    console.error('[CREATE EVENT FROM CHECKPOINT ERROR]', error)
    return { success: false, error: 'Failed to create event' }
  }
}

/**
 * Sync all proker deadlines to calendar
 */
export async function syncAllProkerDeadlines(): Promise<{
  success: boolean
  eventsCreated: number
  eventsUpdated: number
}> {
  try {
    const prokers = await prisma.programKerja.findMany({
      where: {
        endDate: { not: null },
        status: { in: ['DRAFT', 'ON_PROGRESS'] },
      },
      include: {
        checkpoints: { orderBy: { order: 'asc' } },
      },
    })

    let eventsCreated = 0
    let eventsUpdated = 0

    for (const proker of prokers) {
      // Check if deadline event already exists
      const existingDeadline = await prisma.calendarEvent.findFirst({
        where: {
          programKerjaId: proker.id,
          title: { contains: '[DEADLINE]' },
        },
      })

      if (existingDeadline && proker.endDate) {
        // Update existing deadline
        await prisma.calendarEvent.update({
          where: { id: existingDeadline.id },
          data: {
            startDate: proker.endDate,
            endDate: proker.endDate,
          },
        })
        eventsUpdated++
      } else if (!existingDeadline && proker.endDate) {
        // Create deadline event
        await prisma.calendarEvent.create({
          data: {
            title: `[DEADLINE] ${proker.title}`,
            description: `Batas akhir program kerja: ${proker.title}`,
            startDate: proker.endDate,
            endDate: proker.endDate,
            allDay: true,
            color: proker.status === 'ON_PROGRESS' ? '#f59e0b' : '#6b7280',
            isPublic: false,
            programKerjaId: proker.id,
            creatorId: proker.creatorId,
          },
        })
        eventsCreated++
      }
    }

    return { success: true, eventsCreated, eventsUpdated }
  } catch (error) {
    console.error('[SYNC ALL DEADLINES ERROR]', error)
    return { success: false, eventsCreated: 0, eventsUpdated: 0 }
  }
}

// =====================================================
// API Route Helper
// =====================================================

/**
 * Sync handler for proker routes
 */
export async function handleProkerCalendarSync(
  prokerId: string,
  action: 'create' | 'update' | 'delete',
  data?: { oldStatus?: string; newStatus?: string }
): Promise<void> {
  if (action === 'create') {
    await syncProkerToCalendar(prokerId)
  } else if (action === 'update' && data?.oldStatus && data?.newStatus) {
    await syncProkerStatusToCalendar(prokerId, data.oldStatus, data.newStatus)
  } else if (action === 'delete') {
    await deleteProkerCalendarEvents(prokerId)
  }
}
