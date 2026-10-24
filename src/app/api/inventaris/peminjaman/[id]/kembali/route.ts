export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth, hasPermission } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const {
      kondisiKembali = 'BAIK',
      catatanKembali,
      buktiFotoKembali,
      tanggalKembali,
    } = body

    const peminjaman = await prisma.peminjamanBarang.findUnique({
      where: { id },
      include: { barang: true },
    })

    if (!peminjaman) {
      return NextResponse.json(
        { error: 'Data peminjaman tidak ditemukan' },
        { status: 404 }
      )
    }

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const canProcess =
      ['admin', 'ketua', 'sekretaris'].includes(roleName) ||
      (await hasPermission(session.user.id, 'inventaris.edit')) ||
      session.user.id === peminjaman.petugasPinjamId

    if (!canProcess) {
      return NextResponse.json(
        { error: 'Forbidden: Hanya petugas inventaris atau admin yang berwenang memproses pengembalian barang' },
        { status: 403 }
      )
    }

    if (peminjaman.status === 'DIKEMBALIKAN' || peminjaman.tanggalKembali) {
      return NextResponse.json(
        { error: 'Peminjaman ini sudah tercatat telah dikembalikan sebelumnya' },
        { status: 400 }
      )
    }

    const tglKembali = tanggalKembali ? new Date(tanggalKembali) : new Date()
    const qty = peminjaman.jumlah

    const finalStatus =
      kondisiKembali === 'HILANG' || kondisiKembali === 'RUSAK_BERAT'
        ? 'HILANG_RUSAK'
        : 'DIKEMBALIKAN'

    // Jalankan transaksi database
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update status peminjaman
      const updatedPeminjaman = await tx.peminjamanBarang.update({
        where: { id },
        data: {
          tanggalKembali: tglKembali,
          kondisiKembali,
          catatanKembali: catatanKembali?.trim() || null,
          buktiFotoKembali: buktiFotoKembali?.trim() || null,
          petugasKembaliId: session.user?.id || null,
          status: finalStatus,
        },
      })

      // 2. Hitung penyesuaian stok inventaris
      const currentBarang = peminjaman.barang
      const newDipinjam = Math.max(0, currentBarang.jumlahDipinjam - qty)
      let newTersedia = currentBarang.jumlahTersedia
      let newRusak = currentBarang.jumlahRusak
      let newTotal = currentBarang.jumlahTotal

      if (kondisiKembali === 'BAIK') {
        newTersedia += qty
      } else if (
        kondisiKembali === 'PERLU_PERBAIKAN' ||
        kondisiKembali === 'RUSAK_BERAT'
      ) {
        newRusak += qty
      } else if (kondisiKembali === 'HILANG') {
        newTotal = Math.max(0, newTotal - qty)
      }

      await tx.inventarisBarang.update({
        where: { id: peminjaman.barangId },
        data: {
          jumlahDipinjam: newDipinjam,
          jumlahTersedia: newTersedia,
          jumlahRusak: newRusak,
          jumlahTotal: newTotal,
        },
      })

      return updatedPeminjaman
    })

    return NextResponse.json({
      success: true,
      message: 'Proses pengembalian barang inventaris berhasil dicatat',
      data: result,
    })
  } catch (error) {
    console.error('Error returning barang:', error)
    return NextResponse.json(
      { error: 'Gagal memproses pengembalian barang' },
      { status: 500 }
    )
  }
}

