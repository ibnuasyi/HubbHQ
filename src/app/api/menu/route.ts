export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/menu - Get all menu items (for public use)
export async function GET(request: NextRequest) {
  try {
    const items = await prisma.menuItem.findMany({
      where: { isActive: true },
      orderBy: [{ parentId: 'asc' }, { order: 'asc' }],
      include: {
        children: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        }
      }
    })

    // Filter to get only top-level items (no parent)
    const menu = items.filter(item => !item.parentId)

    return NextResponse.json(menu)
  } catch (error) {
    console.error('Error fetching menu:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menu' },
      { status: 500 }
    )
  }
}

// POST /api/menu - Create new menu item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { label, href, icon, order, parentId, isExternal } = body

    if (!label || !href) {
      return NextResponse.json(
        { error: 'Label and href are required' },
        { status: 400 }
      )
    }

    // Validate parent exists if provided
    if (parentId) {
      const parent = await prisma.menuItem.findUnique({ where: { id: parentId } })
      if (!parent) {
        return NextResponse.json(
          { error: 'Parent menu item not found' },
          { status: 400 }
        )
      }
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        label,
        href,
        icon,
        order: order ?? 0,
        parentId,
        isExternal: isExternal ?? false
      }
    })

    return NextResponse.json(menuItem, { status: 201 })
  } catch (error) {
    console.error('Error creating menu item:', error)
    return NextResponse.json(
      { error: 'Failed to create menu item' },
      { status: 500 }
    )
  }
}

// PATCH /api/menu - Update menu item or reorder
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()

    // Bulk update for reordering
    if (body.items && Array.isArray(body.items)) {
      await Promise.all(
        body.items.map(async (item: { id: string; order?: number; parentId?: string | null }) => {
          return prisma.menuItem.update({
            where: { id: item.id },
            data: {
              order: item.order,
              parentId: item.parentId
            }
          })
        })
      )
      return NextResponse.json({ success: true })
    }

    // Single update
    const { id, ...data } = body
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data
    })

    return NextResponse.json(menuItem)
  } catch (error) {
    console.error('Error updating menu item:', error)
    return NextResponse.json(
      { error: 'Failed to update menu item' },
      { status: 500 }
    )
  }
}

// DELETE /api/menu - Delete menu item
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }

    await prisma.menuItem.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting menu item:', error)
    return NextResponse.json(
      { error: 'Failed to delete menu item' },
      { status: 500 }
    )
  }
}
