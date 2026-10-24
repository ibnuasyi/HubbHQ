export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth, hasPermission } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Helper generate kode barang otomatis jika kosong
async function generateNextKodeBarang(kategori: string): Promise<string> {
  const currentYear = new Date().getFullYear().toString()
  let prefix = 'INV'
  const kat = kategori.toLowerCase()
  if (kat.includes('elektronik') || kat.includes('multimedia')) prefix = 'INV-ELC'
  else if (kat.includes('lapangan') || kat.includes('logistik')) prefix = 'INV-LOG'
  else if (kat.includes('atk') || kat.includes('sekretariat')) prefix = 'INV-ATK'
  else if (kat.includes('dokumentasi') || kat.includes('kamera')) prefix = 'INV-DOK'
  else prefix = 'INV-AST'

  const total = await prisma.inventarisBarang.count()
  const nextNum = (total + 1).toString().padStart(4, '0')
  return `${prefix}-${currentYear}-${nextNum}`
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const kategori = searchParams.get('kategori')
    const kondisi = searchParams.get('kondisi')
    const status = searchParams.get('status') // 'TERSEDIA' | 'DIPINJAM' | 'RUSAK'

    const where: any = {}

    if (search) {
      where.OR = [
        { namaBarang: { contains: search } },
        { kodeBarang: { contains: search } },
        { merkModel: { contains: search } },
        { lokasiPenyimpanan: { contains: search } },
      ]
    }

    if (kategori && kategori !== 'ALL') {
      where.kategori = kategori
    }

    if (kondisi && kondisi !== 'ALL') {
      where.kondisi = kondisi
    }

    if (status === 'TERSEDIA') {
      where.jumlahTersedia = { gt: 0 }
    } else if (status === 'DIPINJAM') {
      where.jumlahDipinjam = { gt: 0 }
    } else if (status === 'RUSAK') {
      where.jumlahRusak = { gt: 0 }
    }

    const items = await prisma.inventarisBarang.findMany({
      where,
      include: {
        divisi: { select: { id: true, name: true, color: true } },
        peminjaman: {
          where: { status: { in: ['DIPINJAM', 'TERLAMBAT'] } },
          select: {
            id: true,
            kodePeminjaman: true,
            namaPeminjam: true,
            jumlah: true,
            rencanaKembali: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Hitung statistik ringkasan
    const allItems = await prisma.inventarisBarang.findMany()
    const stats = allItems.reduce(
      (acc, item) => {
        acc.totalJenisBarang += 1
        acc.totalUnit += item.jumlahTotal
        acc.totalTersedia += item.jumlahTersedia
        acc.totalDipinjam += item.jumlahDipinjam
        acc.totalRusak += item.jumlahRusak
        if (item.hargaBeli) {
          acc.totalNilaiAset += Number(item.hargaBeli) * item.jumlahTotal
        }
        return acc
      },
      {
        totalJenisBarang: 0,
        totalUnit: 0,
        totalTersedia: 0,
        totalDipinjam: 0,
        totalRusak: 0,
        totalNilaiAset: 0,
      }
    )

    return NextResponse.json({
      success: true,
      data: items,
      stats,
    })
  } catch (error) {
    console.error('Error fetching inventaris:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data inventaris' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
        { error: 'Forbidden: Hanya admin atau pengurus aset yang dapat menambahkan inventaris baru' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      namaBarang,
      kodeBarang,
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

    if (!namaBarang || !namaBarang.trim()) {
      return NextResponse.json(
        { error: 'Nama barang inventaris wajib diisi' },
        { status: 400 }
      )
    }

    if (!lokasiPenyimpanan || !lokasiPenyimpanan.trim()) {
      return NextResponse.json(
        { error: 'Lokasi penyimpanan barang di sekretariat wajib diisi' },
        { status: 400 }
      )
    }

    const totalQty = Math.max(1, parseInt(jumlahTotal) || 1)
    const finalKode = kodeBarang?.trim()
      ? kodeBarang.trim().toUpperCase()
      : await generateNextKodeBarang(kategori || 'Aset')

    // Periksa apakah kode barang sudah ada
    const existing = await prisma.inventarisBarang.findUnique({
      where: { kodeBarang: finalKode },
    })
    if (existing) {
      return NextResponse.json(
        { error: `Kode barang ${finalKode} sudah digunakan oleh aset lain.` },
        { status: 400 }
      )
    }

    const item = await prisma.inventarisBarang.create({
      data: {
        kodeBarang: finalKode,
        namaBarang: namaBarang.trim(),
        kategori: kategori || 'Perlengkapan Lapangan',
        merkModel: merkModel?.trim() || null,
        serialNumber: serialNumber?.trim() || null,
        jumlahTotal: totalQty,
        jumlahTersedia: totalQty,
        jumlahDipinjam: 0,
        jumlahRusak: 0,
        satuan: satuan || 'Unit',
        kondisi: kondisi || 'BAIK',
        lokasiPenyimpanan: lokasiPenyimpanan.trim(),
        asalPengadaan: asalPengadaan?.trim() || null,
        tanggalPengadaan: tanggalPengadaan ? new Date(tanggalPengadaan) : new Date(),
        hargaBeli: hargaBeli ? Number(hargaBeli) : null,
        fotoBarang: fotoBarang?.trim() || null,
        catatan: catatan?.trim() || null,
        divisiId: divisiId || null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Barang inventaris berhasil didaftarkan',
      data: item,
    })
  } catch (error) {
    console.error('Error creating inventaris item:', error)
    return NextResponse.json(
      { error: 'Gagal menambahkan barang inventaris baru' },
      { status: 500 }
    )
  }
}

