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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: suratId } = await context.params
    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const canViewAll =
      ['admin', 'ketua', 'sekretaris'].includes(roleName) ||
      (await hasPermission(session.user.id, 'surat.view'))

    const where: any = { suratId }
    if (!canViewAll) {
      // Regular members can only view disposisi where they are the recipient
      where.tujuanUserId = session.user.id
    }

    const disposisiList = await prisma.disposisiSurat.findMany({
      where,
      include: {
        tujuanDivisi: { select: { id: true, name: true, color: true } },
        tujuanUser: { select: { id: true, name: true, email: true, phone: true } },
        pemberi: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: disposisiList,
    })
  } catch (error) {
    console.error('Error fetching disposisi:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data lembar disposisi' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roleName = (session.user as any)?.role?.name?.toLowerCase() || ''
    const canDisposisi =
      ['admin', 'ketua', 'sekretaris'].includes(roleName) ||
      (await hasPermission(session.user.id, 'surat.approve'))

    if (!canDisposisi) {
      return NextResponse.json(
        { error: 'Forbidden: Hanya pimpinan organisasi (Ketua, Sekretaris, Admin) yang dapat menerbitkan lembar disposisi surat.' },
        { status: 403 }
      )
    }

    const { id: suratId } = await context.params
    const body = await request.json()
    const {
      nomorAgenda,
      sifat = 'BIASA',
      tujuanDivisiId,
      tujuanUserId,
      tujuanCustom,
      instruksi, // array string e.g. ["TINDAKLANJUTI", "HADIRI_WAKILI"]
      catatanPimpinan,
      batasWaktu,
      pemberiNama,
      pemberiJabatan = 'Ketua Umum',
    } = body

    const surat = await prisma.surat.findUnique({
      where: { id: suratId },
    })

    if (!surat) {
      return NextResponse.json(
        { error: 'Surat masuk tidak ditemukan' },
        { status: 404 }
      )
    }

    const instruksiJson = Array.isArray(instruksi)
      ? JSON.stringify(instruksi)
      : typeof instruksi === 'string'
      ? instruksi
      : JSON.stringify([])

    const disposisi = await prisma.disposisiSurat.create({
      data: {
        suratId,
        nomorAgenda: nomorAgenda?.trim() || null,
        sifat: sifat || 'BIASA',
        tujuanDivisiId: tujuanDivisiId || null,
        tujuanUserId: tujuanUserId || null,
        tujuanCustom: tujuanCustom?.trim() || null,
        instruksi: instruksiJson,
        catatanPimpinan: catatanPimpinan?.trim() || null,
        batasWaktu: batasWaktu ? new Date(batasWaktu) : null,
        pemberiId: session.user?.id || null,
        pemberiNama: pemberiNama?.trim() || session.user?.name || 'Pimpinan Organisasi',
        pemberiJabatan: pemberiJabatan?.trim() || 'Ketua Umum',
        status: 'BELUM_DIPROSES',
      },
      include: {
        tujuanDivisi: true,
        tujuanUser: true,
      },
    })

    // Kirim notifikasi ke penerima disposisi
    if (tujuanUserId) {
      try {
        await prisma.notification.create({
          data: {
            userId: tujuanUserId,
            title: `Disposisi Surat Masuk: ${sifat}`,
            message: `Anda menerima instruksi disposisi surat "${surat.subject}" dari ${pemberiJabatan}.`,
            type: 'INFO',
            link: '/dashboard/surat',
          },
        })
      } catch (notifErr) {
        console.error('Failed to notify disposisi user:', notifErr)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Lembar disposisi surat masuk berhasil dibuat',
      data: disposisi,
    })
  } catch (error) {
    console.error('Error creating disposisi:', error)
    return NextResponse.json(
      { error: 'Gagal membuat lembar disposisi surat' },
      { status: 500 }
    )
  }
}
