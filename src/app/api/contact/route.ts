export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkPublicRateLimit, getClientIP } from '@/lib/rate-limit'

// POST /api/contact - Submit contact form
export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIP(request)
    const rate = checkPublicRateLimit(clientIp, 'contact')
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Terlalu banyak pengiriman pesan. Silakan coba beberapa saat lagi.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { name, email, phone, subject, message, website, _hp } = body

    // Honeypot anti-bot
    if (website || _hp) {
      return NextResponse.json({
        success: true,
        message: 'Pesan Anda telah terkirim. Kami akan segera menghubungi Anda.',
      })
    }

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Nama, email, dan pesan wajib diisi' },
        { status: 400 }
      )
    }

    if (typeof name !== 'string' || name.length > 100 || typeof email !== 'string' || email.length > 150) {
      return NextResponse.json({ error: 'Input tidak valid' }, { status: 400 })
    }

    console.log('Contact form submission:', {
      name: name.slice(0, 100),
      email: email.slice(0, 150),
      phone: phone ? String(phone).slice(0, 30) : null,
      subject: subject ? String(subject).slice(0, 200) : null,
      message: String(message).slice(0, 3000),
    })

    return NextResponse.json({
      success: true,
      message: 'Pesan Anda telah terkirim. Kami akan segera menghubungi Anda.',
    })
  } catch (error) {
    console.error('Error processing contact form:', error)
    return NextResponse.json(
      { error: 'Failed to process contact form' },
      { status: 500 }
    )
  }
}
