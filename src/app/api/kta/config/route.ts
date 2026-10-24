export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth, hasPermission } from '@/lib/auth'
import { getKtaConfig, saveKtaConfig } from '@/lib/kta-config'

export async function GET() {
  try {
    const config = await getKtaConfig()
    return NextResponse.json({ success: true, data: config })
  } catch (error) {
    console.error('Error fetching KTA config:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil konfigurasi KTA' },
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
    const canEdit =
      ['admin', 'ketua', 'sekretaris'].includes(roleName) ||
      (await hasPermission(session.user.id, 'settings.edit')) ||
      (await hasPermission(session.user.id, 'members.edit'))

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Forbidden - Hanya pengurus berwenang yang dapat mengubah desain KTA' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const updated = await saveKtaConfig(body)

    return NextResponse.json({
      success: true,
      message: 'Konfigurasi desain KTA berhasil disimpan',
      data: updated,
    })
  } catch (error) {
    console.error('Error saving KTA config:', error)
    return NextResponse.json(
      { error: 'Gagal menyimpan konfigurasi KTA' },
      { status: 500 }
    )
  }
}

