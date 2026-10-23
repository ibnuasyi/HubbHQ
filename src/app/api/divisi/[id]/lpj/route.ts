export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

// GET /api/divisi/[id]/lpj - Ambil seluruh LPJ & Bank Evaluasi proker divisi tertentu
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: divisiId } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const divisi = await prisma.divisi.findUnique({
      where: { id: divisiId },
      include: {
        programKerja: {
          where: {
            lpj: { isNot: null },
          },
          include: {
            pic: { select: { id: true, name: true, avatar: true } },
            lpj: {
              include: {
                reviewedBy: { select: { id: true, name: true } },
                items: {
                  select: {
                    id: true,
                    type: true,
                    kategori: true,
                    namaBarang: true,
                    totalHarga: true,
                    sumberDana: true,
                  },
                },
              },
            },
          },
          orderBy: { startDate: 'desc' },
        },
      },
    })

    if (!divisi) {
      return NextResponse.json({ error: 'Divisi tidak ditemukan' }, { status: 404 })
    }

    // Hitung ringkasan akumulasi divisi
    let totalPemasukanDivisi = 0
    let totalPengeluaranDivisi = 0
    let totalSisaSurplusDivisi = 0
    let totalLpjSelesai = 0

    // Bank Evaluasi & Rekomendasi
    const bankEvaluasi: Array<{
      prokerId: string
      prokerTitle: string
      kendala: string
      solusi: string
      rekomendasi: string
      reviewedAt: Date | null
    }> = []

    for (const p of divisi.programKerja) {
      if (p.lpj) {
        totalPemasukanDivisi += Number(p.lpj.totalPemasukan || 0)
        totalPengeluaranDivisi += Number(p.lpj.totalPengeluaran || 0)
        totalSisaSurplusDivisi += Number(p.lpj.saldoAkhir || 0)

        if (p.lpj.status === 'APPROVED') {
          totalLpjSelesai++
        }

        if (p.lpj.kendala || p.lpj.solusi || p.lpj.rekomendasi) {
          bankEvaluasi.push({
            prokerId: p.id,
            prokerTitle: p.title,
            kendala: p.lpj.kendala || '-',
            solusi: p.lpj.solusi || '-',
            rekomendasi: p.lpj.rekomendasi || '-',
            reviewedAt: p.lpj.reviewedAt,
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        divisi: {
          id: divisi.id,
          name: divisi.name,
          shortName: divisi.shortName,
          color: divisi.color,
        },
        stats: {
          totalProkerLpj: divisi.programKerja.length,
          totalLpjSelesai,
          totalPemasukanDivisi,
          totalPengeluaranDivisi,
          totalSisaSurplusDivisi,
        },
        prokerList: divisi.programKerja,
        bankEvaluasi,
      },
    })
  } catch (error) {
    console.error('Error fetching divisi LPJ collection:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

