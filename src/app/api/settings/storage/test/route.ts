export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { auth, isSuperAdminRole, hasPermission } from '@/lib/auth'
import { getStorageSettings, testStorageConnection, StorageSettings } from '@/lib/storage'

async function canManageStorageSettings(session: any): Promise<boolean> {
  if (!session?.user?.id) return false
  const role = session.user?.role
  const roleName = (typeof role === 'string' ? role : role?.name || '').toLowerCase()
  if (isSuperAdminRole(role || roleName)) return true
  if (roleName === 'admin') return true
  if (await hasPermission(session.user.id, 'settings.edit')) return true
  return false
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
        { error: 'Forbidden: Hanya Admin atau Super Admin yang dapat menguji koneksi penyimpanan.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const current = await getStorageSettings()

    // Kembalikan kredensial asli jika diisi dengan mask (********)
    let s3Secret = body.s3?.secretAccessKey
    if (!s3Secret || s3Secret === '********' || s3Secret.includes('***')) {
      s3Secret = current.s3.secretAccessKey
    }

    let r2Secret = body.r2?.secretAccessKey
    if (!r2Secret || r2Secret === '********' || r2Secret.includes('***')) {
      r2Secret = current.r2.secretAccessKey
    }

    let webdavPassword = body.webdav?.password
    if (!webdavPassword || webdavPassword === '********' || webdavPassword.includes('***')) {
      webdavPassword = current.webdav.password
    }

    const testConfig: StorageSettings = {
      provider: body.provider || current.provider,
      local: { ...current.local, ...(body.local || {}) },
      s3: {
        ...current.s3,
        ...(body.s3 || {}),
        secretAccessKey: s3Secret,
      },
      r2: {
        ...current.r2,
        ...(body.r2 || {}),
        secretAccessKey: r2Secret,
      },
      webdav: {
        ...current.webdav,
        ...(body.webdav || {}),
        password: webdavPassword,
      },
    }

    const result = await testStorageConnection(testConfig)

    return NextResponse.json({
      success: result.success,
      message: result.message,
    })
  } catch (error: any) {
    console.error('Error testing storage connection:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Uji koneksi gagal dijalankan' },
      { status: 500 }
    )
  }
}

