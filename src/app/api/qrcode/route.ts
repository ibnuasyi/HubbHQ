export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import QRCode from 'qrcode'
import { checkRateLimitByIP, getClientIP } from '@/lib/rate-limit'

// GET /api/qrcode?text=hello&size=200&format=png|svg
export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIP(request)
    const rateCheck = checkRateLimitByIP(clientIp, 'qrcode_generate', { maxRequests: 60, windowMs: 60 * 1000 })
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan pembuatan QR code' }, { status: 429 })
    }

    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rawText = searchParams.get('text')
    const rawSize = parseInt(searchParams.get('size') || '200')
    const format = searchParams.get('format') || 'png'

    if (!rawText) {
      return NextResponse.json(
        { error: 'Parameter text diperlukan' },
        { status: 400 }
      )
    }

    if (rawText.length > 2048) {
      return NextResponse.json(
        { error: 'Teks QR code terlalu panjang (maksimal 2048 karakter)' },
        { status: 400 }
      )
    }

    // Bound size to prevent memory exhaustion (min 50px, max 1000px)
    const size = Math.min(Math.max(isNaN(rawSize) ? 200 : rawSize, 50), 1000)
    const text = rawText.trim()

    const options: QRCode.QRCodeToBufferOptions = {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    }

    if (format === 'svg') {
      const svg = await QRCode.toString(text, { ...options, type: 'svg' })
      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=31536000',
        },
      })
    }

    // Default to PNG
    const buffer = await QRCode.toBuffer(text, options)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
