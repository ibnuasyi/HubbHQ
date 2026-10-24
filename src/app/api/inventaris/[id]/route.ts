export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth, hasPermission } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const item = await prisma.inventarisBarang.findUnique({
      where: { id },
      include: {
        divisi: true,
        peminjaman: {
          orderBy: { tanggalPinjam: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true, avatar: true },
            },
            programKerja: {
              select: { id: true, title: true },
            },
            petugasPinjam: {
              select: { id: true, name: true },
            },
            petugasKembali: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Barang inventaris tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: item })
  } catch (error) {
    console.error('Error fetching inventaris detail:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil detail inventaris' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const canManage =
      ['admin', 'ketua', 'sekretaris'].includes(roleName) ||
      (await hasPermission(session.user.id, 'settings.edit'))

    if (!canManage) {
      return NextResponse.json(
        { error: 'Forbidden: Anda tidak memiliki akses untuk mengubah data inventaris' },
        { status: 403 }
      )
    }

    const { id } = await context.params
    const body = await request.json()
    const {
      namaBarang,
      kategori,
      merkModel,
      serialNumber,
      jumlahTotal,
      satuan,
      kondisi,
      lokasiPenyimpanan,
      asalPengadaan,
      tanggalPengadaan,
      hargaBeli,
      fotoBarang,
      catatan,
      divisiId,
    } = body

    const existing = await prisma.inventarisBarang.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Barang inventaris tidak ditemukan' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (namaBarang) updateData.namaBarang = namaBarang.trim()
    if (kategori) updateData.kategori = kategori
    if (merkModel !== undefined) updateData.merkModel = merkModel ? merkModel.trim() : null
    if (serialNumber !== undefined) updateData.serialNumber = serialNumber ? serialNumber.trim() : null
    if (satuan) updateData.satuan = satuan
    if (kondisi) updateData.kondisi = kondisi
    if (lokasiPenyimpanan) updateData.lokasiPenyimpanan = lokasiPenyimpanan.trim()
    if (asalPengadaan !== undefined) updateData.asalPengadaan = asalPengadaan ? asalPengadaan.trim() : null
    if (tanggalPengadaan) updateData.tanggalPengadaan = new Date(tanggalPengadaan)
    if (hargaBeli !== undefined) updateData.hargaBeli = hargaBeli ? Number(hargaBeli) : null
    if (fotoBarang !== undefined) updateData.fotoBarang = fotoBarang ? fotoBarang.trim() : null
    if (catatan !== undefined) updateData.catatan = catatan ? catatan.trim() : null
    if (divisiId !== undefined) updateData.divisiId = divisiId || null

    if (jumlahTotal !== undefined) {
      const newTotal = Math.max(1, parseInt(jumlahTotal) || 1)
      const diff = newTotal - existing.jumlahTotal
      updateData.jumlahTotal = newTotal
      updateData.jumlahTersedia = Math.max(0, existing.jumlahTersedia + diff)
    }

    const updated = await prisma.inventarisBarang.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'Data inventaris berhasil diperbarui',
      data: updated,
    })
  } catch (error) {
    console.error('Error updating inventaris:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui inventaris' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const canManage =
      ['admin', 'ketua', 'sekretaris'].includes(roleName) ||
      (await hasPermission(session.user.id, 'settings.edit'))

    if (!canManage) {
      return NextResponse.json(
        { error: 'Forbidden: Anda tidak memiliki akses untuk menghapus data inventaris' },
        { status: 403 }
      )
    }

    const { id } = await context.params

    const existing = await prisma.inventarisBarang.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Barang tidak ditemukan' },
        { status: 404 }
      )
    }

    if (existing.jumlahDipinjam > 0) {
      return NextResponse.json(
        {
          error: `Barang ini tidak dapat dihapus karena masih ada ${existing.jumlahDipinjam} unit yang sedang dalam status dipinjam.`,
        },
        { status: 400 }
      )
    }

    await prisma.inventarisBarang.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Barang inventaris berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting inventaris:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus barang inventaris' },
      { status: 500 }
    )
  }
}

