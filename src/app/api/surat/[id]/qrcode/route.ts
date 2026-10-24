export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'
import QRCode from 'qrcode'
import path from 'path'
import fs from 'fs/promises'
import { generateSignedVerificationUrl } from '@/lib/qr-verification'

// POST /api/surat/[id]/qrcode - Generate secure QR code for a surat
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await hasPermission(session.user.id, 'surat.edit')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify surat exists
    const surat = await prisma.surat.findUnique({
      where: { id },
    })

    if (!surat) {
      return NextResponse.json({ error: 'Surat tidak ditemukan' }, { status: 404 })
    }

    if (surat.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'QR Code tanda tangan verifikasi resmi hanya dapat diterbitkan untuk surat yang telah berstatus Disetujui (APPROVED).' },
        { status: 400 }
      )
    }

    // Generate signed verification URL (prevents spoofing)
    const { token, expiresAt, verifyUrl } = generateSignedVerificationUrl(
      id,
      60 * 24 * 365 // 1 year validity
    )

    // Generate QR code as data URL (base64)
    const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })

    // Also generate as buffer for file storage
    const qrCodeBuffer = await QRCode.toBuffer(verifyUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })

    // Save QR code to public folder
    const uploadDir = path.join(process.cwd(), 'public', 'qr-codes', 'surat')
    await fs.mkdir(uploadDir, { recursive: true })

    const fileName = `surat-${id}-${Date.now()}.png`
    const filePath = path.join(uploadDir, fileName)
    await fs.writeFile(filePath, qrCodeBuffer)

    const qrCodeUrl = `/qr-codes/surat/${fileName}`

    // Store the signed token in database for verification
    // In a real app, you might store this in a separate table
    await prisma.surat.update({
      where: { id },
      data: {
        qrCodeUrl,
        // We could add a qrToken field to surat if needed
      },
    })

    // Get full surat data for response
    const updatedSurat = await prisma.surat.findUnique({
      where: { id },
      include: {
        requester: {
          select: { id: true, name: true, email: true },
        },
        approver: {
          select: { id: true, name: true },
        },
        jenisSurat: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'QR code berhasil di-generate dengan secure token',
      data: {
        ...updatedSurat,
        qrCodeDataUrl, // base64 data URL for immediate display
        qrCodeUrl, // file URL
        verifyUrl, // the signed URL encoded in QR
        tokenExpiresAt: expiresAt.toISOString(),
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

// GET /api/surat/[id]/qrcode - Get QR code for a surat
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const surat = await prisma.surat.findUnique({
      where: { id },
      select: {
        id: true,
        qrCodeUrl: true,
      },
    })

    if (!surat) {
      return NextResponse.json(
        { error: 'Surat tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: {
        hasQrCode: !!surat.qrCodeUrl,
        qrCodeUrl: surat.qrCodeUrl,
      },
    })
  } catch (error) {
    console.error('Error fetching QR code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
