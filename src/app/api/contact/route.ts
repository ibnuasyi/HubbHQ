export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST /api/contact - Submit contact form
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, subject, message } = body

    // Here you could store the contact message in database
    // For now, we'll just log it and return success
    console.log('Contact form submission:', { name, email, phone, subject, message })

    // You could also send email notification here

    return NextResponse.json({
      success: true,
      message: 'Pesan Anda telah terkirim. Kami akan segera menghubungi Anda.'
    })
  } catch (error) {
    console.error('Error processing contact form:', error)
    return NextResponse.json(
      { error: 'Failed to process contact form' },
      { status: 500 }
    )
  }
}
