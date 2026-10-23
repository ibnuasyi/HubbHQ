export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/auth'

// PATCH /api/proker/[id]/lpj/review - Approve or Reject LPJ
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: prokerId } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const canReview =
      (await hasPermission(session.user.id, 'proker.edit')) ||
      session.user.role?.name === 'ADMIN' ||
      (session.user as any).role === 'ADMIN'

    if (!canReview) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki hak akses untuk meninjau LPJ ini.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      action,
      note,
      surplusAction,
      surplusNote,
      checklistNotaFisik,
      checklistPresensi,
      checklistDokumentasi,
      checklistBeritaAcara,
    } = body // action: 'APPROVED' | 'REJECTED'

    if (!action || !['APPROVED', 'REJECTED'].includes(action)) {
      return NextResponse.json(
        { error: 'Aksi review tidak valid. Gunakan APPROVED atau REJECTED.' },
        { status: 400 }
      )
    }

    if (action === 'REJECTED' && (!note || !note.trim())) {
      return NextResponse.json(
        { error: 'Catatan alasan penolakan/revisi LPJ wajib diisi.' },
        { status: 400 }
      )
    }

    const lpj = await prisma.lpjProker.findUnique({
      where: { programKerjaId: prokerId },
      include: {
        programKerja: {
          select: { id: true, title: true, divisiId: true },
        },
      },
    })

    if (!lpj) {
      return NextResponse.json({ error: 'LPJ belum dibuat untuk program kerja ini.' }, { status: 404 })
    }

    const now = new Date()
    const saldoAkhirNum = Number(lpj.saldoAkhir)

    // Handle surplus action if approved and saldo > 0
    let finalSaldo: any = lpj.saldoAkhir
    let finalPengeluaran: any = lpj.totalPengeluaran

    if (action === 'APPROVED' && saldoAkhirNum > 0 && surplusAction) {
      if (surplusAction === 'KEMBALIKAN_KAS_UMUM') {
        // Automatically journal deposit back to organization general treasury
        await prisma.transaction.create({
          data: {
            type: 'INCOME',
            category: 'kas_organisasi',
            amount: saldoAkhirNum,
            description: `Pengembalian Sisa Anggaran (Silpa) LPJ: ${lpj.programKerja.title}`,
            date: now,
          },
        })
      } else if (surplusAction === 'SYUKURAN_PANITIA') {
        // Officially journal closing expense for committee appreciation/feast
        await prisma.lpjItem.create({
          data: {
            lpjId: lpj.id,
            type: 'EXPENSE',
            kategori: 'Apresiasi & Pembubaran Panitia',
            namaBarang: 'Alokasi Dana Apresiasi & Syukuran Pembubaran Panitia',
            qty: 1,
            satuan: 'paket',
            hargaSatuan: saldoAkhirNum,
            totalHarga: saldoAkhirNum,
            sumberDana: 'KAS_PROKER',
            keterangan: 'Alokasi resmi sisa surplus hasil kesepakatan panitia yang disahkan BPH',
          },
        })
        finalPengeluaran = Number(lpj.totalPengeluaran) + saldoAkhirNum
        finalSaldo = 0
      }
    }

    const updatedLpj = await prisma.lpjProker.update({
      where: { id: lpj.id },
      data: {
        status: action,
        reviewedById: session.user.id,
        reviewedAt: now,
        reviewedNote: note || (action === 'APPROVED' ? 'LPJ telah disetujui dan disahkan.' : null),
        surplusAction: surplusAction || null,
        surplusNote: surplusNote || null,
        surplusAmount: String(saldoAkhirNum > 0 ? saldoAkhirNum : 0),
        isSurplusSettled: action === 'APPROVED' && saldoAkhirNum > 0,
        totalPengeluaran: String(finalPengeluaran),
        saldoAkhir: String(finalSaldo),
        checklistNotaFisik: checklistNotaFisik !== undefined ? Boolean(checklistNotaFisik) : lpj.checklistNotaFisik,
        checklistPresensi: checklistPresensi !== undefined ? Boolean(checklistPresensi) : lpj.checklistPresensi,
        checklistDokumentasi: checklistDokumentasi !== undefined ? Boolean(checklistDokumentasi) : lpj.checklistDokumentasi,
        checklistBeritaAcara: checklistBeritaAcara !== undefined ? Boolean(checklistBeritaAcara) : lpj.checklistBeritaAcara,
        checklistVerifiedById: session.user.id,
        checklistVerifiedAt: now,
      },
      include: {
        reviewedBy: { select: { id: true, name: true } },
      },
    })

    // If APPROVED, auto complete the program kerja!
    if (action === 'APPROVED') {
      await prisma.programKerja.update({
        where: { id: prokerId },
        data: { status: 'COMPLETED' },
      })
    }

    return NextResponse.json({
      success: true,
      message:
        action === 'APPROVED'
          ? 'LPJ berhasil disetujui dan disahkan. Program kerja resmi selesai (COMPLETED).'
          : 'LPJ dikembalikan untuk revisi beserta catatan perbaikan.',
      data: updatedLpj,
    })
  } catch (error) {
    console.error('Error reviewing LPJ:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
