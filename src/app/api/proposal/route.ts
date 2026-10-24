export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { storageService, detectFileType } from '@/lib/storage'
import path from 'path'

// GET /api/proposal - List all proposals
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const skip = (page - 1) * limit

    const where: any = {}
    if (status) {
      where.status = status
    }

    const [proposals, total] = await Promise.all([
      prisma.proposalDana.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          requester: {
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
      }),
      prisma.proposalDana.count({ where }),
    ])

    return NextResponse.json({
      data: proposals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching proposals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/proposal - Create proposal
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const amount = formData.get('amount') as string
    const programKerjaId = formData.get('programKerjaId') as string
    const proposalFile = formData.get('proposalFile') as File | null

    if (!title || !amount) {
      return NextResponse.json(
        { error: 'Judul dan jumlah diperlukan' },
        { status: 400 }
      )
    }

    let fileUrl = ''
    if (proposalFile && proposalFile.size > 0) {
      // 1. Max size check (15MB)
      if (proposalFile.size > 15 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Ukuran berkas proposal terlalu besar. Maksimal 15MB.' },
          { status: 400 }
        )
      }

      // 2. Extension check
      const ext = path.extname(proposalFile.name || '').toLowerCase()
      const allowedExts = ['.pdf', '.doc', '.docx']
      if (!allowedExts.includes(ext)) {
        return NextResponse.json(
          { error: 'Format berkas tidak diizinkan. Hanya menerima dokumen PDF atau Word (.doc, .docx).' },
          { status: 400 }
        )
      }

      // 3. Read buffer & check magic bytes
      const bytes = await proposalFile.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const headerHex = buffer.subarray(0, 4).toString('hex').toLowerCase()
      const isPdf = headerHex === '25504446'
      const isDocx = headerHex === '504b0304' // ZIP archive (DOCX)
      const isDoc = headerHex.startsWith('d0cf11e0') // Compound Binary File (DOC)

      if (!isPdf && !isDocx && !isDoc) {
        return NextResponse.json(
          { error: 'Validasi konten berkas gagal. Format berkas tidak sesuai dengan tipe dokumen yang diizinkan.' },
          { status: 400 }
        )
      }

      const mimeType = isPdf
        ? 'application/pdf'
        : isDocx
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/msword'

      const uploadResult = await storageService.upload(
        buffer,
        'proposals',
        proposalFile.name || `proposal${ext}`,
        mimeType
      )
      fileUrl = uploadResult.url
    }

    const proposal = await prisma.proposalDana.create({
      data: {
        title,
        description,
        amount: parseFloat(amount),
        programKerjaId: programKerjaId || null,
        requesterId: session.user.id,
        proposalFile: fileUrl,
        status: 'PENDING',
      },
      include: {
        requester: {
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
      message: 'Proposal berhasil diajukan',
      data: proposal,
    })
  } catch (error) {
    console.error('Error creating proposal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
