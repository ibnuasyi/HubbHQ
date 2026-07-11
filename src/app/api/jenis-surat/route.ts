export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'
import { safeParseFormSchema, getDefaultFormSchema } from '@/lib/form-schema'

// GET /api/jenis-surat - Get all jenis surat
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jenisSurat = await prisma.jenisSurat.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { surat: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: jenisSurat,
    })
  } catch (error) {
    console.error('Error fetching jenis surat:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/jenis-surat - Create jenis surat
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await hasPermission(session.user.id, 'surat.create')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      code,
      templateUrl,
      formSchema,
      autoNumber,
      numberPrefix,
      numberFormat,
    } = body

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Nama dan kode jenis surat diperlukan' },
        { status: 400 }
      )
    }

    // Validate code format (alphanumeric, uppercase)
    if (!/^[A-Z0-9]{2,10}$/.test(code)) {
      return NextResponse.json(
        { error: 'Kode jenis surat harus 2-10 karakter alphanumeric uppercase' },
        { status: 400 }
      )
    }

    // Validate and sanitize form schema to prevent JSON Schema Poisoning
    let validatedFormSchema = null
    if (formSchema) {
      try {
        validatedFormSchema = safeParseFormSchema(formSchema)
      } catch (error) {
        return NextResponse.json(
          { error: 'Form schema tidak valid: ' + (error as Error).message },
          { status: 400 }
        )
      }
    } else {
      validatedFormSchema = getDefaultFormSchema()
    }

    // Check if code already exists
    const existing = await prisma.jenisSurat.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Kode jenis surat sudah ada' },
        { status: 400 }
      )
    }

    const jenisSurat = await prisma.jenisSurat.create({
      data: {
        name,
        code: code.toUpperCase(),
        templateUrl,
        formSchema: validatedFormSchema,
        autoNumber: autoNumber ?? true,
        numberPrefix,
        numberFormat,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Jenis surat berhasil dibuat',
      data: jenisSurat,
    })
  } catch (error) {
    console.error('Error creating jenis surat:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
