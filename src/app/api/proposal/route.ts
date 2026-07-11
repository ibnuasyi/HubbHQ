export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

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
      // Ensure upload directory exists
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'proposals')
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
      }

      // Generate unique filename
      const ext = proposalFile.name.split('.').pop()
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
      const filepath = join(uploadDir, filename)

      // Save file
      const bytes = await proposalFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filepath, buffer)

      fileUrl = `/uploads/proposals/${filename}`
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
