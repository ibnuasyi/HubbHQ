export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import QRCode from 'qrcode'

// GET /api/qrcode?text=hello&size=200&format=png|svg
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const text = searchParams.get('text')
    const size = parseInt(searchParams.get('size') || '200')
    const format = searchParams.get('format') || 'png'

    if (!text) {
      return NextResponse.json(
        { error: 'Parameter text diperlukan' },
        { status: 400 }
      )
    }

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
