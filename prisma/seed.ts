import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create Permissions
  const permissions = [
    // Dashboard
    { name: 'dashboard.view', label: 'Lihat Dashboard', group: 'Dashboard' },
    // Members
    { name: 'members.view', label: 'Lihat Anggota', group: 'Members' },
    { name: 'members.create', label: 'Tambah Anggota', group: 'Members' },
    { name: 'members.edit', label: 'Edit Anggota', group: 'Members' },
    { name: 'members.delete', label: 'Hapus Anggota', group: 'Members' },
    // Divisi
    { name: 'divisi.view', label: 'Lihat Divisi', group: 'Divisi' },
    { name: 'divisi.create', label: 'Tambah Divisi', group: 'Divisi' },
    { name: 'divisi.edit', label: 'Edit Divisi', group: 'Divisi' },
    { name: 'divisi.delete', label: 'Hapus Divisi', group: 'Divisi' },
    // Program Kerja
    { name: 'proker.view', label: 'Lihat Program Kerja', group: 'Proker' },
    { name: 'proker.create', label: 'Tambah Program Kerja', group: 'Proker' },
    { name: 'proker.edit', label: 'Edit Program Kerja', group: 'Proker' },
    { name: 'proker.delete', label: 'Hapus Program Kerja', group: 'Proker' },
    // Keuangan
    { name: 'keuangan.view', label: 'Lihat Keuangan', group: 'Keuangan' },
    { name: 'keuangan.create', label: 'Tambah Transaksi', group: 'Keuangan' },
    { name: 'keuangan.edit', label: 'Edit Transaksi', group: 'Keuangan' },
    { name: 'keuangan.approve', label: 'Approve Transaksi', group: 'Keuangan' },
    // Surat
    { name: 'surat.view', label: 'Lihat Surat', group: 'Surat' },
    { name: 'surat.create', label: 'Buat Surat', group: 'Surat' },
    { name: 'surat.approve', label: 'Approve Surat', group: 'Surat' },
    { name: 'surat.template', label: 'Kelola Template Surat', group: 'Surat' },
    // Library
    { name: 'library.view', label: 'Lihat Library', group: 'Library' },
    { name: 'library.upload', label: 'Upload Buku', group: 'Library' },
    // Settings
    { name: 'settings.view', label: 'Lihat Pengaturan', group: 'Settings' },
    { name: 'settings.edit', label: 'Edit Pengaturan', group: 'Settings' },
    { name: 'settings.website', label: 'Edit Website', group: 'Settings' },
    // Website
    { name: 'website.view', label: 'Lihat Website', group: 'Website' },
    { name: 'website.edit', label: 'Edit Website', group: 'Website' },
  ]

  console.log('Creating permissions...')
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: perm,
      create: perm,
    })
  }

  // Get all permissions
  const allPermissions = await prisma.permission.findMany()
  const permissionIds = allPermissions.map((p) => p.id)

  // Create Roles
  const roles = [
    {
      name: 'admin',
      displayName: 'Administrator',
      description: 'Akses penuh ke semua fitur',
      color: '#ef4444',
      permissionIds: permissionIds, // All permissions
    },
    {
      name: 'ketua',
      displayName: 'Ketua',
      description: 'Kepengurusan organisasi',
      color: '#f59e0b',
      permissionIds: permissionIds.filter((_, i) =>
        ['dashboard.view', 'members.view', 'divisi.view', 'proker.view', 'proker.create', 'proker.edit',
         'keuangan.view', 'surat.view', 'surat.approve', 'library.view', 'website.view'].includes(allPermissions[i]?.name)
      ),
    },
    {
      name: 'sekretaris',
      displayName: 'Sekretaris',
      description: 'Mengelola surat dan dokumen',
      color: '#10b981',
      permissionIds: permissionIds.filter((_, i) =>
        ['dashboard.view', 'members.view', 'surat.view', 'surat.create', 'surat.approve', 'surat.template',
         'library.view', 'library.upload'].includes(allPermissions[i]?.name)
      ),
    },
    {
      name: 'bendahara',
      displayName: 'Bendahara',
      description: 'Mengelola keuangan',
      color: '#8b5cf6',
      permissionIds: permissionIds.filter((_, i) =>
        ['dashboard.view', 'keuangan.view', 'keuangan.create', 'keuangan.edit', 'keuangan.approve',
         'members.view'].includes(allPermissions[i]?.name)
      ),
    },
    {
      name: 'anggota',
      displayName: 'Anggota',
      description: 'Anggota biasa',
      color: '#6366f1',
      permissionIds: permissionIds.filter((_, i) =>
        ['dashboard.view', 'proker.view', 'library.view', 'surat.view'].includes(allPermissions[i]?.name)
      ),
    },
  ]

  console.log('Creating roles...')
  for (const role of roles) {
    const { permissionIds, ...roleData } = role
    await prisma.role.upsert({
      where: { name: role.name },
      update: roleData,
      create: {
        ...roleData,
        permissions: {
          connect: permissionIds.map((id) => ({ id })),
        },
      },
    })
  }

  // Get role IDs
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } })
  const anggotaRole = await prisma.role.findUnique({ where: { name: 'anggota' } })

  // Create Wilayah (Wilayah)
  console.log('Creating wilayah...')
  const pusatWilayah = await prisma.wilayah.upsert({
    where: { id: 'pusat' },
    update: {},
    create: {
      id: 'pusat',
      name: 'Pusat',
      shortName: 'PB',
      level: 0,
    },
  })

  // Create Jabatan
  console.log('Creating jabatan...')
  const jabatanList = [
    { name: 'Ketua Umum', shortName: 'Ketum', level: 1 },
    { name: 'Wakil Ketua Umum', shortName: 'Waketum', level: 2 },
    { name: 'Sekretaris Jenderal', shortName: 'Sekjen', level: 3 },
    { name: 'Bendahara Umum', shortName: 'Bendum', level: 3 },
  ]

  for (const jab of jabatanList) {
    await prisma.jabatan.upsert({
      where: { name: jab.name },
      update: jab,
      create: jab,
    })
  }

  // Create sample Divisi
  console.log('Creating divisi...')
  const divisiList = [
    { name: 'Divisi Internal', shortName: 'Inti', color: '#3b82f6' },
    { name: 'Divisi Eksternal', shortName: 'Ekst', color: '#10b981' },
    { name: 'Divisi Kerohanian', shortName: 'Roh', color: '#f59e0b' },
    { name: 'Divisi Kesekretariatan', shortName: 'Seskab', color: '#8b5cf6' },
  ]

  for (const div of divisiList) {
    await prisma.divisi.upsert({
      where: { name: div.name },
      update: div,
      create: div,
    })
  }

  // Create sample Jenis Surat
  console.log('Creating jenis surat...')
  const jenisSuratList = [
    { name: 'Surat Keterangan', code: 'SK', numberPrefix: 'SK', autoNumber: true },
    { name: 'Surat Undangan', code: 'SU', numberPrefix: 'UND', autoNumber: true },
    { name: 'Surat Keputusan', code: 'SKP', numberPrefix: 'KEP', autoNumber: true },
    { name: 'Surat Perintah', code: 'SP', numberPrefix: 'SP', autoNumber: true },
    { name: 'Surat Edaran', code: 'SE', numberPrefix: 'SE', autoNumber: true },
  ]

  for (const js of jenisSuratList) {
    await prisma.jenisSurat.upsert({
      where: { code: js.code },
      update: js,
      create: js,
    })
  }

  // Create Admin User
  console.log('Creating admin user...')
  const hashedPassword = await bcrypt.hash('admin123', 12)

  await prisma.user.upsert({
    where: { email: 'admin@siop.local' },
    update: {},
    create: {
      name: 'Administrator',
      email: 'admin@siop.local',
      password: hashedPassword,
      roleId: adminRole?.id,
      wilayahId: pusatWilayah.id,
    },
  })

  // Create sample Anggota
  console.log('Creating sample anggota...')
  const sampleUsers = [
    { name: 'Ahmad Fauzi', email: 'ahmad@siop.local', nickname: 'Ahmad' },
    { name: 'Budi Santoso', email: 'budi@siop.local', nickname: 'Budi' },
    { name: 'Citra Dewi', email: 'citra@siop.local', nickname: 'Citra' },
  ]

  for (const user of sampleUsers) {
    const userPassword = await bcrypt.hash('password123', 12)
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        name: user.name,
        nickname: user.nickname,
        email: user.email,
        password: userPassword,
        roleId: anggotaRole?.id,
      },
    })
  }

  console.log('✅ Seed completed successfully!')
  console.log('')
  console.log('📧 Default login credentials:')
  console.log('   Admin: admin@siop.local / admin123')
  console.log('   User: ahmad@siop.local / password123')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
