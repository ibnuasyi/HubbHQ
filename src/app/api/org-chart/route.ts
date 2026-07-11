export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// GET /api/org-chart - Get organizational chart data
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all users with their role, jabatan, and divisi
    const users = await prisma.user.findMany({
      where: { isActive: true },
      include: {
        role: true,
        jabatan: true,
        divisiMembers: {
          where: { isActive: true },
          include: {
            divisi: true,
          },
        },
      },
      orderBy: [
        { jabatan: { level: 'asc' } },
        { name: 'asc' },
      ],
    })

    // Group by level/jabatan
    const levels: Record<number, any[]> = {}

    users.forEach((user) => {
      const level = user.jabatan?.level ?? 999 // Users without jabatan at bottom
      if (!levels[level]) levels[level] = []
      levels[level].push({
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        jabatan: user.jabatan,
        divisi: user.divisiMembers.map((dm) => dm.divisi),
      })
    })

    // Convert to array sorted by level
    const chartData = Object.entries(levels)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([level, members]) => ({
        level: parseInt(level),
        members,
      }))

    return NextResponse.json({
      success: true,
      data: chartData,
    })
  } catch (error) {
    console.error('Error fetching org chart:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
