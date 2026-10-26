export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth, isSuperAdminRole, hasPermission } from '@/lib/auth'
import { getStorageSettings, saveStorageSettings, StorageSettings } from '@/lib/storage'

async function canManageStorageSettings(session: any): Promise<boolean> {
  if (!session?.user?.id) return false
  const role = session.user?.role
  const roleName = (typeof role === 'string' ? role : role?.name || '').toLowerCase()
  if (isSuperAdminRole(role || roleName)) return true
  if (roleName === 'admin') return true
  if (await hasPermission(session.user.id, 'settings.edit')) return true
  return false
}

export async function GET(_request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const canManage = await canManageStorageSettings(session)
    if (!canManage) {
      return NextResponse.json(
        { error: 'Forbidden: Hanya Admin atau Super Admin yang dapat mengakses pengaturan penyimpanan.' },
        { status: 403 }
      )
    }

    const config = await getStorageSettings()

    // Sensor kredensial rahasia saat dikirim ke frontend
    const maskedData: StorageSettings = {
      ...config,
      s3: {
        ...config.s3,
        secretAccessKey: config.s3.secretAccessKey ? '********' : '',
      },
      r2: {
        ...config.r2,
        secretAccessKey: config.r2.secretAccessKey ? '********' : '',
      },
      webdav: {
        ...config.webdav,
        password: config.webdav.password ? '********' : '',
      },
    }

    return NextResponse.json({
      success: true,
      data: maskedData,
      configuredSecrets: {
        s3: Boolean(config.s3.secretAccessKey),
        r2: Boolean(config.r2.secretAccessKey),
        webdav: Boolean(config.webdav.password),
      },
    })
  } catch (error) {
    console.error('Error fetching storage settings:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil pengaturan penyimpanan' },
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

    const canManage = await canManageStorageSettings(session)
    if (!canManage) {
      return NextResponse.json(
        { error: 'Forbidden: Hanya Admin atau Super Admin yang dapat mengubah pengaturan penyimpanan.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { provider, local, s3, r2, webdav } = body

    if (provider && !['local', 's3', 'r2', 'webdav'].includes(provider)) {
      return NextResponse.json(
        { error: 'Provider penyimpanan tidak valid. Pilih local, s3, r2, atau webdav.' },
        { status: 400 }
      )
    }

    const saved = await saveStorageSettings({
      provider,
      local,
      s3,
      r2,
      webdav,
    })

    return NextResponse.json({
      success: true,
      message: 'Pengaturan penyimpanan berkas berhasil disimpan dan diterapkan.',
      data: {
        provider: saved.provider,
      },
    })
  } catch (error: any) {
    console.error('Error saving storage settings:', error)
    return NextResponse.json(
      { error: error.message || 'Gagal menyimpan pengaturan penyimpanan' },
      { status: 500 }
    )
  }
}

