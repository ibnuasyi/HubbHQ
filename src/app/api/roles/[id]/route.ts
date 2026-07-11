export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// PATCH /api/roles/[id] - Update role
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    })

    if (user?.role?.name !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const body = await request.json()
    const { displayName, description, color, permissionIds } = body

    // Get existing role
    const existingRole = await prisma.role.findUnique({
      where: { id },
    })

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Prevent editing admin role name
    if (existingRole.name === 'admin' && body.name) {
      return NextResponse.json(
        { error: 'Cannot change admin role name' },
        { status: 400 }
      )
    }

    // Update role
    const role = await prisma.role.update({
      where: { id },
      data: {
        displayName: displayName ?? existingRole.displayName,
        description: description ?? existingRole.description,
        color: color ?? existingRole.color,
        permissions: permissionIds
          ? { set: permissionIds.map((id: string) => ({ id })) }
          : undefined,
      },
      include: {
        permissions: true,
        _count: { select: { users: true } },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Role berhasil diupdate',
      data: role,
    })
  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/roles/[id] - Delete role
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    })

    if (user?.role?.name !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Get existing role
    const existingRole = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    })

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Prevent deleting admin role
    if (existingRole.name === 'admin') {
      return NextResponse.json(
        { error: 'Cannot delete admin role' },
        { status: 400 }
      )
    }

    // Check if role has users
    if (existingRole._count.users > 0) {
      return NextResponse.json(
        { error: `Role has ${existingRole._count.users} users. Please reassign them first.` },
        { status: 400 }
      )
    }

    await prisma.role.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Role berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
