export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth, hasPermission, isAdmin, isSuperAdminRole } from '@/lib/auth'

// GET /api/anggota - Get all members
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const canViewSensitive =
      (await isAdmin(session.user.id)) ||
      (await hasPermission(session.user.id, 'members.view')) ||
      (await hasPermission(session.user.id, 'members.edit'))

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const divisiId = searchParams.get('divisiId')
    const roleId = searchParams.get('roleId')
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { nickname: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (divisiId) {
      where.divisiMembers = {
        some: {
          divisiId,
          isActive: true,
        },
      }
    }

    if (roleId) {
      where.roleId = roleId
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const [rawMembers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          roleId: true,
          nickname: true,
          fullName: true,
          birthPlace: true,
          birthDate: true,
          address: true,
          phone: true,
          avatar: true,
          signature: true,
          nra: true,
          bloodType: true,
          emergencyContact: true,
          ktaIssuedAt: true,
          ktaValidUntil: true,
          ktaCardUrl: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          role: true,
          wilayah: true,
          jabatan: true,
          divisiMembers: {
            where: { isActive: true },
            include: { divisi: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    const members = rawMembers.map((m) => {
      if (canViewSensitive || m.id === session.user.id) {
        return m
      }
      return {
        ...m,
        signature: null,
        address: null,
        birthDate: null,
        birthPlace: null,
        emergencyContact: null,
      }
    })

    return NextResponse.json({
      data: members,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/anggota - Create new member
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await hasPermission(session.user.id, 'members.create')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      email,
      password,
      roleId,
      nickname,
      fullName,
      birthPlace,
      birthDate,
      address,
      phone,
      wilayahId,
      divisiIds,
      signature,
    } = body

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nama, email, dan password diperlukan' },
        { status: 400 }
      )
    }

    // Prevent vertical privilege escalation: non-admin cannot assign admin / superadmin role
    if (roleId) {
      const targetRole = await prisma.role.findUnique({
        where: { id: roleId },
      })
      if (targetRole && isSuperAdminRole(targetRole)) {
        const callerIsAdmin = await isAdmin(session.user.id)
        if (!callerIsAdmin) {
          return NextResponse.json(
            { error: 'Forbidden: Hanya Administrator / Super Admin yang dapat menetapkan role administrator' },
            { status: 403 }
          )
        }
      }
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 400 }
      )
    }

    // Hash password
    const bcrypt = await import('bcryptjs')
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user with divisions
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        roleId: roleId || undefined,
        nickname,
        fullName,
        birthPlace,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        address,
        phone,
        wilayahId,
        signature,
        divisiMembers: divisiIds?.length
          ? {
              create: divisiIds.map((divId: string) => ({
                divisiId: divId,
              })),
            }
          : undefined,
      },
      include: {
        role: true,
        wilayah: true,
        divisiMembers: {
          include: { divisi: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Anggota berhasil ditambahkan',
      data: user,
    })
  } catch (error) {
    console.error('Error creating member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
