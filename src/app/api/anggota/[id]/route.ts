export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'

// GET /api/anggota/[id] - Get single member
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

    const member = await prisma.user.findUnique({
      where: { id },
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
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    return NextResponse.json({ data: member })
  } catch (error) {
    console.error('Error fetching member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/anggota/[id] - Update member
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission (own profile or has edit permission)
    const canEdit =
      session.user.id === id ||
      (await hasPermission(session.user.id, 'members.edit'))

    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      nickname,
      fullName,
      birthPlace,
      birthDate,
      address,
      phone,
      roleId,
      wilayahId,
      jabatanId,
      isActive,
      signature,
      avatar,
      nra,
      bloodType,
      emergencyContact,
      ktaIssuedAt,
      ktaValidUntil,
    } = body

    // Build update data
    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (nickname !== undefined) updateData.nickname = nickname
    if (fullName !== undefined) updateData.fullName = fullName
    if (birthPlace !== undefined) updateData.birthPlace = birthPlace
    if (birthDate !== undefined)
      updateData.birthDate = birthDate ? new Date(birthDate) : null
    if (address !== undefined) updateData.address = address
    if (phone !== undefined) updateData.phone = phone
    if (signature !== undefined) updateData.signature = signature
    if (avatar !== undefined) updateData.avatar = avatar
    if (bloodType !== undefined) updateData.bloodType = bloodType?.trim() || null
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact?.trim() || null

    // Only admin can change role, wilayah, active status, and manual NRA
    if (await hasPermission(session.user.id, 'members.edit')) {
      if (roleId !== undefined) updateData.roleId = roleId
      if (wilayahId !== undefined) updateData.wilayahId = wilayahId
      if (jabatanId !== undefined) updateData.jabatanId = jabatanId
      if (isActive !== undefined) updateData.isActive = isActive
      if (nra !== undefined) updateData.nra = nra?.trim() || null
      if (ktaIssuedAt !== undefined)
        updateData.ktaIssuedAt = ktaIssuedAt ? new Date(ktaIssuedAt) : null
      if (ktaValidUntil !== undefined)
        updateData.ktaValidUntil = ktaValidUntil ? new Date(ktaValidUntil) : null
    }

    const member = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        role: true,
        wilayah: true,
        divisiMembers: {
          include: { divisi: true },
        },
      },
    })

    delete (member as any).password

    return NextResponse.json({
      success: true,
      message: 'Member updated successfully',
      data: member,
    })
  } catch (error) {
    console.error('Error updating member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/anggota/[id] - Delete member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await hasPermission(session.user.id, 'members.delete')
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Can't delete own account
    if (session.user.id === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Member deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
