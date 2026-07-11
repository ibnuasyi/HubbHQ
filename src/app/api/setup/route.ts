export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

/**
 * First Time Setup API
 * Creates initial admin user, roles, permissions, and website config
 * Only works when database is empty
 */
export async function POST(request: NextRequest) {
  try {
    // Check if setup already completed
    const userCount = await prisma.user.count()

    if (userCount > 0) {
      return NextResponse.json(
        { error: 'Setup sudah pernah dilakukan. Hapus semua data untuk reset.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      organizationName,
      organizationDescription,
      adminName,
      adminEmail,
      adminPassword,
      primaryColor,
      logoUrl
    } = body

    // Validate required fields
    if (!organizationName || !adminName || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(adminEmail)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      )
    }

    // Validate password strength (min 8 chars)
    if (adminPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password minimal 8 karakter' },
        { status: 400 }
      )
    }

    // Create all initial data in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create permissions
      const permissions = [
        { name: 'dashboard.view', label: 'Lihat Dashboard', group: 'Dashboard' },
        { name: 'members.view', label: 'Lihat Anggota', group: 'Members' },
        { name: 'members.create', label: 'Tambah Anggota', group: 'Members' },
        { name: 'members.edit', label: 'Edit Anggota', group: 'Members' },
        { name: 'members.delete', label: 'Hapus Anggota', group: 'Members' },
        { name: 'divisi.view', label: 'Lihat Divisi', group: 'Divisi' },
        { name: 'divisi.create', label: 'Tambah Divisi', group: 'Divisi' },
        { name: 'divisi.edit', label: 'Edit Divisi', group: 'Divisi' },
        { name: 'divisi.delete', label: 'Hapus Divisi', group: 'Divisi' },
        { name: 'proker.view', label: 'Lihat Program Kerja', group: 'Proker' },
        { name: 'proker.create', label: 'Tambah Program Kerja', group: 'Proker' },
        { name: 'proker.edit', label: 'Edit Program Kerja', group: 'Proker' },
        { name: 'proker.delete', label: 'Hapus Program Kerja', group: 'Proker' },
        { name: 'keuangan.view', label: 'Lihat Keuangan', group: 'Keuangan' },
        { name: 'keuangan.create', label: 'Tambah Transaksi', group: 'Keuangan' },
        { name: 'keuangan.edit', label: 'Edit Transaksi', group: 'Keuangan' },
        { name: 'keuangan.approve', label: 'Approve Transaksi', group: 'Keuangan' },
        { name: 'surat.view', label: 'Lihat Surat', group: 'Surat' },
        { name: 'surat.create', label: 'Buat Surat', group: 'Surat' },
        { name: 'surat.approve', label: 'Approve Surat', group: 'Surat' },
        { name: 'library.view', label: 'Lihat Library', group: 'Library' },
        { name: 'library.upload', label: 'Upload Buku', group: 'Library' },
        { name: 'settings.view', label: 'Lihat Pengaturan', group: 'Settings' },
        { name: 'settings.edit', label: 'Edit Pengaturan', group: 'Settings' },
        { name: 'settings.website', label: 'Edit Website', group: 'Settings' },
        { name: 'website.view', label: 'Lihat Website', group: 'Website' },
        { name: 'website.edit', label: 'Edit Website', group: 'Website' },
      ]

      for (const perm of permissions) {
        await tx.permission.upsert({
          where: { name: perm.name },
          update: perm,
          create: perm,
        })
      }

      // 2. Create roles
      const adminRole = await tx.role.create({
        data: {
          name: 'admin',
          displayName: 'Administrator',
          description: 'Akses penuh ke semua fitur',
          color: '#ef4444',
        },
      })

      const anggotaRole = await tx.role.create({
        data: {
          name: 'anggota',
          displayName: 'Anggota',
          description: 'Akses dasar sebagai anggota',
          color: '#6366f1',
        },
      })

      // 3. Assign all permissions to admin role
      const allPermissions = await tx.permission.findMany()
      await tx.role.update({
        where: { id: adminRole.id },
        data: {
          permissions: {
            connect: allPermissions.map(p => ({ id: p.id })),
          },
        },
      })

      // 4. Create admin user
      const hashedPassword = await bcrypt.hash(adminPassword, 12)
      const adminUser = await tx.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          roleId: adminRole.id,
        },
      })

      // 5. Create website config
      await tx.websiteConfig.createMany({
        data: [
          { key: 'appName', value: organizationName, category: 'general', description: 'Nama aplikasi', isPublic: true },
          { key: 'appDescription', value: organizationDescription || '', category: 'general', description: 'Deskripsi aplikasi', isPublic: true },
          { key: 'logoUrl', value: logoUrl || '', category: 'general', description: 'URL Logo', isPublic: true },
          { key: 'faviconUrl', value: '', category: 'general', description: 'URL Favicon', isPublic: true },
          { key: 'primaryColor', value: primaryColor || '#16a34a', category: 'appearance', description: 'Warna utama', isPublic: false },
          { key: 'defaultTheme', value: 'light', category: 'appearance', description: 'Tema default', isPublic: false },
          { key: 'websiteEnabled', value: true, category: 'general', description: 'Website enabled', isPublic: true },
        ],
        skipDuplicates: true,
      })

      // 6. Create default theme
      await tx.theme.createMany({
        data: [
          {
            name: 'Organ2 Style',
            slug: 'organ2-style',
            version: '1.0.0',
            description: 'Tema formal untuk organisasi pergerakan',
            author: 'HubbHQ',
            isActive: true,
            config: {
              primaryColor: primaryColor || '#16a34a',
              secondaryColor: '#15803d',
              accentColor: '#f59e0b',
              backgroundColor: '#ffffff',
              fontFamily: 'Plus Jakarta Sans',
              borderRadius: '0.75rem'
            }
          },
          {
            name: 'Default Theme',
            slug: 'default',
            version: '1.0.0',
            description: 'Tema default modern dan fleksibel',
            author: 'HubbHQ',
            isActive: false,
            config: {
              primaryColor: '#6366f1',
              secondaryColor: '#4f46e5',
              accentColor: '#f59e0b',
              backgroundColor: '#ffffff',
              fontFamily: 'Inter',
              borderRadius: '0.5rem'
            }
          }
        ],
        skipDuplicates: true,
      })

      return { adminUser, adminRole }
    })

    return NextResponse.json({
      success: true,
      message: 'Setup berhasil! Silakan login dengan kredensial Anda.',
      data: {
        admin: {
          name: result.adminUser.name,
          email: result.adminUser.email,
        },
        organization: organizationName,
      }
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat setup. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}

// GET - Check if setup is needed
export async function GET() {
  try {
    const userCount = await prisma.user.count()
    return NextResponse.json({
      needsSetup: userCount === 0,
      userCount
    })
  } catch (error) {
    console.error('Error checking setup status:', error)
    return NextResponse.json({
      needsSetup: true,
      userCount: -1,
      error: 'Could not connect to database'
    })
  }
}
