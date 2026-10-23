import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Quick database ping
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json(
      {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: 'degraded',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Database error',
        timestamp: new Date().toISOString(),
      },
      { status: 200 } // Return 200 so container stays alive during startup/recovery
    )
  }
}

