export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth, isSuperAdminRole } from '@/lib/auth'
import { canManageProker } from '@/lib/proker-auth'

// Recalculate totals helper
async function recalculateLpjTotals(lpjId: string) {
  const items = await prisma.lpjItem.findMany({
    where: { lpjId },
  })

  let totalPemasukan = 0
  let totalPengeluaran = 0

  for (const item of items) {
    const val = Number(item.totalHarga)
    if (item.type === 'INCOME') {
      totalPemasukan += val
    } else {
      totalPengeluaran += val
    }
  }

  const saldoAkhir = totalPemasukan - totalPengeluaran

  await prisma.lpjProker.update({
    where: { id: lpjId },
    data: {
      totalPemasukan,
      totalPengeluaran,
      saldoAkhir,
    },
  })

  return { totalPemasukan, totalPengeluaran, saldoAkhir }
}

// GET /api/proker/[id]/lpj/items - List all LPJ items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: prokerId } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const lpj = await prisma.lpjProker.findUnique({
      where: { programKerjaId: prokerId },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!lpj) {
      return NextResponse.json({ success: true, data: [] })
    }

    return NextResponse.json({ success: true, data: lpj.items })
  } catch (error) {
    console.error('Error fetching LPJ items:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/proker/[id]/lpj/items - Add LPJ line item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: prokerId } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const hasAccess = await canManageProker(session.user.id, roleName, prokerId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Anda tidak memiliki akses ke LPJ proker ini' }, { status: 403 })
    }

    // Check if LPJ already approved
    const existingLpj = await prisma.lpjProker.findUnique({
      where: { programKerjaId: prokerId },
    })
    if (existingLpj && existingLpj.status === 'APPROVED' && !isSuperAdminRole(roleName) && !['admin', 'ketua'].includes(roleName)) {
      return NextResponse.json(
        { error: 'LPJ sudah disetujui (APPROVED) dan terkunci dari penambahan item baru.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      type, // 'INCOME' | 'EXPENSE'
      kategori,
      namaBarang,
      qty,
      satuan,
      hargaSatuan,
      buktiNota,
      keterangan,
      sumberDana, // 'DANA_AJUAN' | 'KAS_PROKER' | 'DANA_LUAR'
    } = body

    if (!namaBarang || !hargaSatuan) {
      return NextResponse.json(
        { error: 'Nama barang / pos belanja dan harga satuan wajib diisi' },
        { status: 400 }
      )
    }

    const parsedQty = qty ? parseFloat(qty) : 1
    const parsedHarga = parseFloat(hargaSatuan)
    const totalHarga = parsedQty * parsedHarga

    // Ensure LPJ exists for this proker
    const lpj = await prisma.lpjProker.upsert({
      where: { programKerjaId: prokerId },
      create: {
        programKerjaId: prokerId,
        status: 'DRAFT',
      },
      update: {},
    })

    // Create item
    const newItem = await prisma.lpjItem.create({
      data: {
        lpjId: lpj.id,
        type: type === 'INCOME' ? 'INCOME' : 'EXPENSE',
        kategori: kategori || (type === 'INCOME' ? 'Pemasukan' : 'Operasional'),
        namaBarang,
        qty: parsedQty,
        satuan: satuan || 'item',
        hargaSatuan: parsedHarga,
        totalHarga,
        buktiNota: buktiNota || null,
        keterangan: keterangan || null,
        sumberDana: sumberDana || 'DANA_AJUAN',
      },
    })

    // Recalculate totals
    const totals = await recalculateLpjTotals(lpj.id)

    return NextResponse.json({
      success: true,
      message: 'Item realisasi anggaran berhasil ditambahkan',
      data: newItem,
      totals,
    })
  } catch (error) {
    console.error('Error adding LPJ item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/proker/[id]/lpj/items - Delete LPJ line item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: prokerId } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const hasAccess = await canManageProker(session.user.id, roleName, prokerId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Anda tidak memiliki akses ke LPJ proker ini' }, { status: 403 })
    }

    // Check if LPJ already approved
    const existingLpj = await prisma.lpjProker.findUnique({
      where: { programKerjaId: prokerId },
    })
    if (existingLpj && existingLpj.status === 'APPROVED' && !isSuperAdminRole(roleName) && !['admin', 'ketua'].includes(roleName)) {
      return NextResponse.json(
        { error: 'LPJ sudah disetujui (APPROVED) dan terkunci dari penambahan item baru.' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID diperlukan' }, { status: 400 })
    }

    const item = await prisma.lpjItem.findUnique({
      where: { id: itemId },
      include: { lpj: true },
    })

    if (!item || item.lpj.programKerjaId !== prokerId) {
      return NextResponse.json({ error: 'Item realisasi tidak ditemukan pada proker ini' }, { status: 404 })
    }

    const lpjId = item.lpjId

    await prisma.lpjItem.delete({
      where: { id: itemId },
    })

    const totals = await recalculateLpjTotals(lpjId)

    return NextResponse.json({
      success: true,
      message: 'Item realisasi berhasil dihapus',
      totals,
    })
  } catch (error) {
    console.error('Error deleting LPJ item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

