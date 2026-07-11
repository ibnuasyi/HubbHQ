export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { safeParseFormSchema, getDefaultFormSchema } from '@/lib/form-schema'

// GET /api/jenis-surat/[id]/form - Get form schema for a jenis surat
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jenisSurat = await prisma.jenisSurat.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
        formSchema: true,
        autoNumber: true,
        numberPrefix: true,
        numberFormat: true,
        templateUrl: true,
      },
    })

    if (!jenisSurat) {
      return NextResponse.json(
        { error: 'Jenis surat tidak ditemukan' },
        { status: 404 }
      )
    }

    // Safely parse and validate form schema
    // This prevents JSON Schema Poisoning attacks
    let formSchema
    if (jenisSurat.formSchema) {
      formSchema = safeParseFormSchema(jenisSurat.formSchema)
    } else {
      formSchema = getDefaultFormSchema()
    }

    return NextResponse.json({
      success: true,
      data: {
        jenisSurat: {
          id: jenisSurat.id,
          name: jenisSurat.name,
          code: jenisSurat.code,
          autoNumber: jenisSurat.autoNumber,
          numberPrefix: jenisSurat.numberPrefix,
          numberFormat: jenisSurat.numberFormat,
          templateUrl: jenisSurat.templateUrl,
        },
        formSchema,
      },
    })
  } catch (error) {
    console.error('Error fetching form schema:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
