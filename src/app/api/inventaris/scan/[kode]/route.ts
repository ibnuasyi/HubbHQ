export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { checkRateLimitByIP, getClientIP } from '@/lib/rate-limit'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ kode: string }> }
) {
  try {
    const clientIp = getClientIP(request)
    const rateCheck = checkRateLimitByIP(clientIp, 'scan_inventaris', { maxRequests: 30, windowMs: 60 * 1000 })
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan pemindaian. Silakan coba lagi nanti.' },
        { status: 429 }
      )
    }

    const { kode } = await context.params
    const decodedKode = decodeURIComponent(kode).trim()

    const session = await auth()
    const isAuthenticated = Boolean(session?.user?.id)

    // Cari barang berdasarkan kodeBarang
    const barang = await prisma.inventarisBarang.findFirst({
      where: {
        OR: [
          { kodeBarang: decodedKode },
          { kodeBarang: decodedKode.toUpperCase() },
          { id: decodedKode },
        ],
      },
      include: {
        divisi: {
          select: { id: true, name: true, color: true },
        },
        peminjaman: {
          where: {
            status: { in: ['DIPINJAM', 'TERLAMBAT'] },
          },
          orderBy: { tanggalPinjam: 'desc' },
          select: {
            id: true,
            kodePeminjaman: true,
            namaPeminjam: true,
            instansiPeminjam: true,
            jumlah: true,
            keperluan: true,
            tanggalPinjam: true,
            rencanaKembali: true,
            status: true,
          },
        },
      },
    })

    if (!barang) {
      return NextResponse.json(
        { error: `Barang dengan kode "${decodedKode}" tidak ditemukan dalam sistem inventaris.` },
        { status: 404 }
      )
    }

    // Ambil info organisasi jika ada
    let orgInfo = {
      nama: 'HubbHQ Sekretariat',
      kontak: 'Hubungi pengurus sekretariat untuk peminjaman barang.',
    }

    try {
      const siteConfig = await prisma.websiteConfig.findUnique({
        where: { key: 'site_metadata' },
      })
      if (siteConfig?.value && typeof siteConfig.value === 'object') {
        const val: any = siteConfig.value
        orgInfo.nama = val.organizationName || val.siteName || orgInfo.nama
        orgInfo.kontak = val.contactEmail || val.contactPhone || orgInfo.kontak
      }
    } catch {
      // Default info digunakan jika metadata belum diset
    }

    let statusKetersediaan: 'TERSEDIA' | 'DIPINJAM_SEBAGIAN' | 'HABIS_DIPINJAM' | 'RUSAK' = 'TERSEDIA'
    if (barang.jumlahTersedia === 0 && barang.jumlahDipinjam > 0) {
      statusKetersediaan = 'HABIS_DIPINJAM'
    } else if (barang.jumlahTersedia > 0 && barang.jumlahDipinjam > 0) {
      statusKetersediaan = 'DIPINJAM_SEBAGIAN'
    } else if (barang.jumlahTersedia === 0 && barang.jumlahRusak > 0) {
      statusKetersediaan = 'RUSAK'
    }

    // Privacy masking for anonymous public scanners
    const safeData: any = {
      id: barang.id,
      kodeBarang: barang.kodeBarang,
      namaBarang: barang.namaBarang,
      kategori: barang.kategori,
      merkModel: barang.merkModel,
      jumlahTotal: barang.jumlahTotal,
      jumlahTersedia: barang.jumlahTersedia,
      jumlahDipinjam: barang.jumlahDipinjam,
      satuan: barang.satuan,
      kondisi: barang.kondisi,
      lokasiPenyimpanan: barang.lokasiPenyimpanan,
      fotoBarang: barang.fotoBarang,
      divisi: barang.divisi,
      statusKetersediaan,
      organisasi: orgInfo,
    }

    if (isAuthenticated) {
      safeData.serialNumber = barang.serialNumber
      safeData.hargaBeli = barang.hargaBeli
      safeData.asalPengadaan = barang.asalPengadaan
      safeData.catatan = barang.catatan
      safeData.peminjaman = barang.peminjaman
    } else {
      // Mask borrower personal data for anonymous public
      safeData.peminjaman = barang.peminjaman.map((p) => ({
        id: p.id,
        kodePeminjaman: p.kodePeminjaman,
        jumlah: p.jumlah,
        rencanaKembali: p.rencanaKembali,
        status: p.status,
      }))
    }

    return NextResponse.json({
      success: true,
      data: safeData,
    })
  } catch (error) {
    console.error('Error fetching inventaris scan data:', error)
    return NextResponse.json(
      { error: 'Gagal memproses pencarian barang inventaris' },
      { status: 500 }
    )
  }
}
