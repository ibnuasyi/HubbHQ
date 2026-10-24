export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth, hasPermission } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Helper generate kode peminjaman unik
async function generateNextKodePeminjaman(): Promise<string> {
  const currentYear = new Date().getFullYear().toString()
  const total = await prisma.peminjamanBarang.count()
  const nextNum = (total + 1).toString().padStart(4, '0')
  return `PINJAM-${currentYear}-${nextNum}`
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'ALL' | 'DIPINJAM' | 'DIKEMBALIKAN' | 'TERLAMBAT'
    const barangId = searchParams.get('barangId')
    const search = searchParams.get('search') || ''

    // Sinkronkan status keterlambatan otomatis untuk peminjaman aktif yang telah melewati batas rencana kembali
    const now = new Date()
    await prisma.peminjamanBarang.updateMany({
      where: {
        status: 'DIPINJAM',
        rencanaKembali: { lt: now },
      },
      data: {
        status: 'TERLAMBAT',
      },
    })

    const where: any = {}

    if (barangId) {
      where.barangId = barangId
    }

    if (status && status !== 'ALL') {
      where.status = status
    }

    if (search) {
      where.OR = [
        { kodePeminjaman: { contains: search } },
        { namaPeminjam: { contains: search } },
        { instansiPeminjam: { contains: search } },
        { keperluan: { contains: search } },
        { barang: { namaBarang: { contains: search } } },
        { barang: { kodeBarang: { contains: search } } },
      ]
    }

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const isOfficer =
      ['admin', 'ketua', 'sekretaris'].includes(roleName) ||
      (await hasPermission(session.user.id, 'settings.edit'))

    const rawPeminjamanList = await prisma.peminjamanBarang.findMany({
      where,
      include: {
        barang: {
          select: {
            id: true,
            kodeBarang: true,
            namaBarang: true,
            kategori: true,
            merkModel: true,
            satuan: true,
            kondisi: true,
            lokasiPenyimpanan: true,
            fotoBarang: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            nra: true,
          },
        },
        petugasPinjam: {
          select: { id: true, name: true },
        },
        petugasKembali: {
          select: { id: true, name: true },
        },
        programKerja: {
          select: { id: true, title: true },
        },
      },
      orderBy: { tanggalPinjam: 'desc' },
    })

    // Mask sensitive contact details for non-officers
    const peminjamanList = rawPeminjamanList.map((p) => {
      const isSelf = p.userId === session.user.id
      if (isOfficer || isSelf) return p
      return {
        ...p,
        kontakPeminjam: p.kontakPeminjam ? p.kontakPeminjam.slice(0, 4) + '****' : null,
        nomorIdentitas: null,
        user: p.user ? { ...p.user, phone: null, email: null } : null,
      }
    })

    // Hitung ringkasan statistik peminjaman
    const allRecords = await prisma.peminjamanBarang.findMany({
      select: { status: true, jumlah: true },
    })

    const stats = allRecords.reduce(
      (acc, curr) => {
        acc.total += 1
        if (curr.status === 'DIPINJAM') acc.dipinjam += 1
        else if (curr.status === 'TERLAMBAT') acc.terlambat += 1
        else if (curr.status === 'DIKEMBALIKAN') acc.dikembalikan += 1
        else if (curr.status === 'HILANG_RUSAK') acc.hilangRusak += 1
        return acc
      },
      { total: 0, dipinjam: 0, terlambat: 0, dikembalikan: 0, hilangRusak: 0 }
    )

    return NextResponse.json({
      success: true,
      data: peminjamanList,
      stats,
    })
  } catch (error) {
    console.error('Error fetching peminjaman:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data peminjaman' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      barangId,
      jumlah = 1,
      peminjamType = 'ANGGOTA',
      userId,
      namaPeminjam,
      kontakPeminjam,
      instansiPeminjam,
      nomorIdentitas,
      keperluan,
      programKerjaId,
      tanggalPinjam,
      rencanaKembali,
      kondisiPinjam = 'BAIK',
      buktiFotoPinjam,
      suratPeminjaman,
    } = body

    if (!barangId) {
      return NextResponse.json(
        { error: 'Barang yang dipinjam wajib dipilih' },
        { status: 400 }
      )
    }

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const isOfficer =
      ['admin', 'ketua', 'sekretaris'].includes(roleName) ||
      (await hasPermission(session.user.id, 'settings.edit'))

    const finalUserId = isOfficer && userId ? userId : session.user.id
    const finalNama = isOfficer ? (namaPeminjam?.trim() || session.user.name || 'Anggota') : (session.user.name || namaPeminjam?.trim() || 'Anggota')

    if (!kontakPeminjam || !kontakPeminjam.trim()) {
      return NextResponse.json(
        { error: 'Kontak peminjam (WhatsApp / Telepon) wajib diisi' },
        { status: 400 }
      )
    }

    if (!rencanaKembali) {
      return NextResponse.json(
        { error: 'Batas tanggal pengembalian barang wajib ditentukan' },
        { status: 400 }
      )
    }

    if (!keperluan || !keperluan.trim()) {
      return NextResponse.json(
        { error: 'Keperluan atau agenda peminjaman wajib dicantumkan' },
        { status: 400 }
      )
    }

    if (buktiFotoPinjam && String(buktiFotoPinjam).trim().toLowerCase().startsWith('javascript:')) {
      return NextResponse.json({ error: 'Tautan bukti foto tidak valid' }, { status: 400 })
    }

    if (suratPeminjaman && String(suratPeminjaman).trim().toLowerCase().startsWith('javascript:')) {
      return NextResponse.json({ error: 'Tautan surat peminjaman tidak valid' }, { status: 400 })
    }

    const qtyToBorrow = Math.max(1, parseInt(jumlah) || 1)

    // Cek ketersediaan barang di gudang inventaris
    const barang = await prisma.inventarisBarang.findUnique({
      where: { id: barangId },
    })

    if (!barang) {
      return NextResponse.json(
        { error: 'Barang inventaris tidak ditemukan' },
        { status: 404 }
      )
    }

    if (barang.jumlahTersedia < qtyToBorrow) {
      return NextResponse.json(
        {
          error: `Stok tidak mencukupi. Tersedia: ${barang.jumlahTersedia} ${barang.satuan}, diminta: ${qtyToBorrow} ${barang.satuan}`,
        },
        { status: 400 }
      )
    }

    const kodePeminjaman = await generateNextKodePeminjaman()
    const tglPinjam = tanggalPinjam ? new Date(tanggalPinjam) : new Date()
    const tglKembali = new Date(rencanaKembali)

    // Transaksi database: Simpan peminjaman & update kuantitas stok barang secara atomik
    const result = await prisma.$transaction(async (tx) => {
      // Atomic conditional update to prevent stock race condition
      const updateResult = await tx.inventarisBarang.updateMany({
        where: { id: barangId, jumlahTersedia: { gte: qtyToBorrow } },
        data: {
          jumlahTersedia: { decrement: qtyToBorrow },
          jumlahDipinjam: { increment: qtyToBorrow },
        },
      })

      if (updateResult.count === 0) {
        throw new Error('STOK_TIDAK_MENCUKUPI')
      }

      const peminjaman = await tx.peminjamanBarang.create({
        data: {
          kodePeminjaman,
          barangId,
          jumlah: qtyToBorrow,
          peminjamType,
          userId: finalUserId || null,
          namaPeminjam: finalNama,
          kontakPeminjam: kontakPeminjam.trim(),
          instansiPeminjam: instansiPeminjam?.trim() || null,
          nomorIdentitas: nomorIdentitas?.trim() || null,
          keperluan: keperluan.trim(),
          programKerjaId: programKerjaId || null,
          tanggalPinjam: tglPinjam,
          rencanaKembali: tglKembali,
          status: 'DIPINJAM',
          kondisiPinjam: kondisiPinjam || barang.kondisi || 'BAIK',
          petugasPinjamId: session.user?.id || null,
          buktiFotoPinjam: buktiFotoPinjam?.trim() || null,
          suratPeminjaman: suratPeminjaman?.trim() || null,
        },
      })

      return peminjaman
    })

    return NextResponse.json({
      success: true,
      message: 'Transaksi peminjaman berhasil dicatat',
      data: result,
    })
  } catch (error: any) {
    console.error('Error creating peminjaman:', error)
    if (error?.message === 'STOK_TIDAK_MENCUKUPI') {
      return NextResponse.json(
        { error: 'Stok barang tidak mencukupi atau telah dipinjam oleh pengguna lain.' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Gagal mencatat peminjaman barang' },
      { status: 500 }
    )
  }
}

