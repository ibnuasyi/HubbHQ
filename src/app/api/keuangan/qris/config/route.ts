export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth, hasPermission, isSuperAdminRole } from '@/lib/auth'
import { getQrisConfig, saveQrisConfig } from '@/lib/qris'

async function canManageQrisConfig(session: any): Promise<boolean> {
  if (!session?.user?.id) return false
  const role = session.user?.role
  const roleName = (typeof role === 'string' ? role : role?.name || '').toLowerCase()
  if (isSuperAdminRole(role || roleName)) return true
  if (['admin', 'bendahara', 'ketua'].includes(roleName)) return true
  if (await hasPermission(session.user.id, 'keuangan.edit')) return true
  if (await hasPermission(session.user.id, 'settings.edit')) return true
  return false
}

export async function GET(_request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = await getQrisConfig()
    const isManager = await canManageQrisConfig(session)

    // Sembunyikan kredensial rahasia gateway bagi anggota biasa
    const safeData = isManager
      ? config
      : {
          ...config,
          gateway: {
            ...config.gateway,
            apiKey: config.gateway.apiKey ? '********' : '',
            webhookSecret: '********',
          },
        }

    return NextResponse.json({
      success: true,
      data: safeData,
    })
  } catch (error) {
    console.error('Error fetching QRIS config:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil konfigurasi QRIS' },
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

    const isManager = await canManageQrisConfig(session)
    if (!isManager) {
      return NextResponse.json(
        { error: 'Forbidden - Hanya Bendahara atau Admin yang dapat mengubah konfigurasi QRIS' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { mode, gateway, mandiri } = body

    if (mode && !['GATEWAY', 'MANDIRI', 'DISABLED'].includes(mode)) {
      return NextResponse.json(
        { error: 'Mode QRIS tidak valid. Pilih GATEWAY, MANDIRI, atau DISABLED.' },
        { status: 400 }
      )
    }

    const saved = await saveQrisConfig({
      mode,
      gateway,
      mandiri,
    })

    return NextResponse.json({
      success: true,
      message: 'Konfigurasi pembayaran QRIS organisasi berhasil disimpan',
      data: saved,
    })
  } catch (error) {
    console.error('Error saving QRIS config:', error)
    return NextResponse.json(
      { error: 'Gagal menyimpan konfigurasi QRIS' },
      { status: 500 }
    )
  }
}

