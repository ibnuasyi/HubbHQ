import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting comprehensive seed for testing...')
  console.log('')

  // ========================================
  // 1. WEBSITE CONFIG
  // ========================================
  console.log('📦 Creating website configuration...')

  const websiteConfigs = [
    { key: 'appName', value: 'KPRI - Konfederasi Pergerakan', category: 'general', description: 'Nama aplikasi', isPublic: true },
    { key: 'appDescription', value: 'Konfederasi Pergerakan Rakyat Indonesia - Membangun Gerakan yang Kuat untuk Rakyat', category: 'general', description: 'Deskripsi aplikasi', isPublic: true },
    { key: 'logoUrl', value: '', category: 'general', description: 'URL Logo', isPublic: true },
    { key: 'faviconUrl', value: '', category: 'general', description: 'URL Favicon', isPublic: true },
    { key: 'primaryColor', value: '#16a34a', category: 'appearance', description: 'Warna utama - Hijau KPRI', isPublic: false },
    { key: 'defaultTheme', value: 'light', category: 'appearance', description: 'Tema default - Light', isPublic: false },
    { key: 'sidebarCollapsed', value: false, category: 'appearance', description: 'Sidebar collapsed', isPublic: false },
    { key: 'contactEmail', value: 'info@konfederasipergerakan.org', category: 'contact', description: 'Email kontak', isPublic: true },
    { key: 'contactPhone', value: '+62 21 1234 5678', category: 'contact', description: 'Telepon kontak', isPublic: true },
    { key: 'contactAddress', value: 'Jl. Merdeka No. 123, Jakarta Pusat 10110', category: 'contact', description: 'Alamat kontak', isPublic: true },
    { key: 'websiteUrl', value: 'https://konfederasipergerakan.org', category: 'social', description: 'Website URL', isPublic: true },
    { key: 'instagramUrl', value: 'https://instagram.com/kpri_id', category: 'social', description: 'Instagram URL', isPublic: true },
    { key: 'facebookUrl', value: 'https://facebook.com/kpriindonesia', category: 'social', description: 'Facebook URL', isPublic: true },
    { key: 'twitterUrl', value: 'https://twitter.com/kpri_id', category: 'social', description: 'Twitter URL', isPublic: true },
    { key: 'youtubeUrl', value: 'https://youtube.com/@kpri', category: 'social', description: 'YouTube URL', isPublic: true },
  ]

  for (const config of websiteConfigs) {
    await prisma.websiteConfig.upsert({
      where: { key: config.key },
      update: { value: config.value, category: config.category, description: config.description, isPublic: config.isPublic },
      create: config,
    })
  }

  // ========================================
  // 2. PERMISSIONS & ROLES
  // ========================================
  console.log('🔐 Creating permissions and roles...')

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
    { name: 'surat.template', label: 'Kelola Template Surat', group: 'Surat' },
    { name: 'library.view', label: 'Lihat Library', group: 'Library' },
    { name: 'library.upload', label: 'Upload Buku', group: 'Library' },
    { name: 'settings.view', label: 'Lihat Pengaturan', group: 'Settings' },
    { name: 'settings.edit', label: 'Edit Pengaturan', group: 'Settings' },
    { name: 'settings.website', label: 'Edit Website', group: 'Settings' },
    { name: 'website.view', label: 'Lihat Website', group: 'Website' },
    { name: 'website.edit', label: 'Edit Website', group: 'Website' },
  ]

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: perm,
      create: perm,
    })
  }

  const allPermissions = await prisma.permission.findMany()
  const permissionIds = allPermissions.map((p) => p.id)

  const roles = [
    {
      name: 'admin',
      displayName: 'Administrator',
      description: 'Akses penuh ke semua fitur',
      color: '#ef4444',
      permissionIds: permissionIds,
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

  // ========================================
  // 3. WILAYAH
  // ========================================
  console.log('🗺️ Creating wilayah...')

  const wilayahList = [
    { id: 'pusat', name: 'Dewan Pusat', shortName: 'PB', level: 0 },
    { id: 'dki-jakarta', name: 'DKI Jakarta', shortName: 'JKT', level: 1 },
    { id: 'jawa-barat', name: 'Jawa Barat', shortName: 'JBR', level: 1 },
    { id: 'jawa-timur', name: 'Jawa Timur', shortName: 'JTM', level: 1 },
    { id: 'jawa-tengah', name: 'Jawa Tengah', shortName: 'JTG', level: 1 },
  ]

  for (const wil of wilayahList) {
    await prisma.wilayah.upsert({
      where: { id: wil.id },
      update: wil,
      create: wil,
    })
  }

  // ========================================
  // 4. JABATAN
  // ========================================
  console.log('👔 Creating jabatan...')

  const jabatanList = [
    { name: 'Ketua Umum', shortName: 'Ketum', level: 1 },
    { name: 'Wakil Ketua Umum', shortName: 'Waketum', level: 2 },
    { name: 'Sekretaris Jenderal', shortName: 'Sekjen', level: 3 },
    { name: 'Bendahara Umum', shortName: 'Bendum', level: 3 },
    { name: 'Ketua Divisi', shortName: 'Kadiv', level: 4 },
    { name: 'Sekretaris Divisi', shortName: 'Sekdiv', level: 5 },
    { name: 'Anggota', shortName: 'Agt', level: 6 },
  ]

  for (const jab of jabatanList) {
    await prisma.jabatan.upsert({
      where: { name: jab.name },
      update: jab,
      create: jab,
    })
  }

  const jabKetum = await prisma.jabatan.findUnique({ where: { name: 'Ketua Umum' } })
  const jabWaketum = await prisma.jabatan.findUnique({ where: { name: 'Wakil Ketua Umum' } })
  const jabSekjen = await prisma.jabatan.findUnique({ where: { name: 'Sekretaris Jenderal' } })
  const jabBendum = await prisma.jabatan.findUnique({ where: { name: 'Bendahara Umum' } })
  const jabKadiv = await prisma.jabatan.findUnique({ where: { name: 'Ketua Divisi' } })
  const jabAnggota = await prisma.jabatan.findUnique({ where: { name: 'Anggota' } })

  // ========================================
  // 5. DIVISI
  // ========================================
  console.log('📂 Creating divisi...')

  const divisiList = [
    { name: 'Divisi Internal', shortName: 'Inti', color: '#3b82f6', description: 'Mengelola urusan internal organisasi' },
    { name: 'Divisi Eksternal', shortName: 'Ekst', color: '#10b981', description: 'Mengelola hubungan luar organisasi' },
    { name: 'Divisi Kerohanian', shortName: 'Roh', color: '#f59e0b', description: 'Mengelola kegiatan rohani dan ibadah' },
    { name: 'Divisi Kesekretariatan', shortName: 'Seskab', color: '#8b5cf6', description: 'Mengelola administrasi dan dokumentasi' },
    { name: 'Divisi Penelitian & Pengembangan', shortName: 'Litbang', color: '#ec4899', description: 'Mengelola riset dan pengembangan' },
    { name: 'Divisi Kreatif & Media', shortName: 'Kreatif', color: '#06b6d4', description: 'Mengelola konten dan media sosial' },
  ]

  for (const div of divisiList) {
    await prisma.divisi.upsert({
      where: { name: div.name },
      update: div,
      create: div,
    })
  }

  // ========================================
  // 6. USERS / ANGGOTA
  // ========================================
  console.log('👥 Creating users/anggota...')

  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } })
  const ketuaRole = await prisma.role.findUnique({ where: { name: 'ketua' } })
  const sekretarisRole = await prisma.role.findUnique({ where: { name: 'sekretaris' } })
  const bendaharaRole = await prisma.role.findUnique({ where: { name: 'bendahara' } })
  const anggotaRole = await prisma.role.findUnique({ where: { name: 'anggota' } })

  const hashedPassword = await bcrypt.hash('admin123', 12)
  await prisma.user.upsert({
    where: { email: 'admin@hubb.local' },
    update: {},
    create: {
      name: 'Rizky Ramadhan',
      nickname: 'Rizky',
      email: 'admin@hubb.local',
      password: hashedPassword,
      roleId: adminRole?.id,
      wilayahId: 'pusat',
      jabatanId: jabKetum?.id,
      phone: '+62 812 3456 7890',
      birthPlace: 'Jakarta',
      birthDate: new Date('1995-05-15'),
      address: 'Jl. Sudirman No. 123, Jakarta Selatan',
    },
  })

  const users = [
    { name: 'Ahmad Fauzi Rahman', email: 'ahmad@hubb.local', nickname: 'Ahmad', role: 'ketua', jabatan: jabKetum, phone: '+62 813 2345 6789', birthPlace: 'Bandung', birthDate: '1994-03-20' },
    { name: 'Budi Santoso', email: 'budi@hubb.local', nickname: 'Budi', role: 'sekretaris', jabatan: jabWaketum, phone: '+62 814 3456 7890', birthPlace: 'Surabaya', birthDate: '1995-07-10' },
    { name: 'Citra Dewi Lestari', email: 'citra@hubb.local', nickname: 'Citra', role: 'bendahara', jabatan: jabSekjen, phone: '+62 815 4567 8901', birthPlace: 'Yogyakarta', birthDate: '1996-11-25' },
    { name: 'Dian Pratama', email: 'dian@hubb.local', nickname: 'Dian', role: 'anggota', jabatan: jabBendum, phone: '+62 816 5678 9012', birthPlace: 'Semarang', birthDate: '1997-02-14' },
    { name: 'Eko Wijaya', email: 'eko@hubb.local', nickname: 'Eko', role: 'anggota', jabatan: jabKadiv, phone: '+62 817 6789 0123', birthPlace: 'Medan', birthDate: '1998-08-30' },
    { name: 'Fitri Handayani', email: 'fitri@hubb.local', nickname: 'Fitri', role: 'anggota', jabatan: jabKadiv, phone: '+62 818 7890 1234', birthPlace: 'Makassar', birthDate: '1999-01-05' },
    { name: 'Gita Safitri', email: 'gita@hubb.local', nickname: 'Gita', role: 'anggota', jabatan: jabAnggota, phone: '+62 819 8901 2345', birthPlace: 'Palembang', birthDate: '2000-04-18' },
    { name: 'Hendra Kusuma', email: 'hendra@hubb.local', nickname: 'Hendra', role: 'anggota', jabatan: jabAnggota, phone: '+62 820 9012 3456', birthPlace: 'Denpasar', birthDate: '2001-06-22' },
    { name: 'Ika Putriani', email: 'ika@hubb.local', nickname: 'Ika', role: 'anggota', jabatan: jabAnggota, phone: '+62 821 0123 4567', birthPlace: 'Bandung', birthDate: '2002-09-12' },
    { name: 'Joko Widodo', email: 'joko@hubb.local', nickname: 'Joko', role: 'anggota', jabatan: jabAnggota, phone: '+62 822 1234 5678', birthPlace: 'Solo', birthDate: '2003-12-03' },
  ]

  for (const user of users) {
    const userPassword = await bcrypt.hash('password123', 12)
    const role = await prisma.role.findUnique({ where: { name: user.role } })
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        name: user.name,
        nickname: user.nickname,
        email: user.email,
        password: userPassword,
        roleId: role?.id,
        wilayahId: 'pusat',
        jabatanId: user.jabatan?.id,
        phone: user.phone,
        birthPlace: user.birthPlace,
        birthDate: new Date(user.birthDate),
      },
    })
  }

  // ========================================
  // 7. POSTS (categories stored as string)
  // ========================================
  console.log('📝 Creating sample posts...')

  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@hubb.local' } })
  const pengumumanCat = await prisma.category.findUnique({ where: { slug: 'pengumuman' } })
  const beritaCat = await prisma.category.findUnique({ where: { slug: 'berita' } })
  const agendaCat = await prisma.category.findUnique({ where: { slug: 'agenda' } })

  const posts = [
    {
      title: 'Selamat Datang di Website Resmi Kami',
      slug: 'selamat-datang',
      content: '<p>Kami ucapkan selamat datang di website resmi <strong>Hubb Organization</strong>. Website ini menyediakan berbagai informasi mengenai kegiatan, program kerja, dan berita terkini dari organisasi kami.</p><p>Silakan jelajahi website ini untuk mengetahui lebih lanjut tentang kami.</p>',
      excerpt: 'Website resmi Hubb Organization kini hadir untuk memberikan informasi terkini.',
      status: 'PUBLISHED',
      category: 'pengumuman',
      authorId: adminUser?.id,
    },
    {
      title: 'Pendaftaran Anggota Baru Tahun 2026',
      slug: 'pendaftaran-anggota-baru-2026',
      content: '<p>Pendaftaran anggota baru untuk tahun 2026 telah dibuka! Bagi Anda yang ingin bergabung dengan komunitas kami, silakan daftar melalui formulir yang tersedia.</p><h3>Persyaratan:</h3><ul><li>Usia minimal 17 tahun</li><li>Menyelesaikan formulir pendaftaran</li><li>Mengikuti proses orientasi</li></ul>',
      excerpt: 'Pendaftaran anggota baru telah dibuka. Segera daftarkan diri Anda!',
      status: 'PUBLISHED',
      category: 'pengumuman',
      authorId: adminUser?.id,
    },
    {
      title: 'Workshop Pengembangan Diri',
      slug: 'workshop-pengembangan-diri',
      content: '<p>Workshop Pengembangan Diri akan diadakan pada tanggal 25 Juli 2026. Workshop ini akan membahas berbagai topik penting untuk pengembangan diri dan karier.</p><p><strong>Pemateri:</strong> Narasumber dari berbagai bidang profesional</p><p><strong>Tempat:</strong> Aula Pusat, Jakarta Selatan</p>',
      excerpt: 'Ikuti workshop pengembangan diri untuk meningkatkan kemampuan Anda.',
      status: 'PUBLISHED',
      category: 'agenda',
      authorId: adminUser?.id,
    },
    {
      title: 'Kegiatan Bakti Sosial 2026',
      slug: 'kegiatan-bakti-sosial-2026',
      content: '<p>Organisasi kami akan mengadakan kegiatan bakti sosial pada bulan Agustus 2026. Kegiatan ini meliputi donor darah, pengobatan gratis, dan pembagian paket bantuan.</p><p>Mari kita bersama-sama membantu sesama!</p>',
      excerpt: 'Bergabunglah dalam kegiatan bakti sosial untuk membantu sesama.',
      status: 'PUBLISHED',
      category: 'berita',
      authorId: adminUser?.id,
    },
    {
      title: 'Pelantikan Pengurus Baru',
      slug: 'pelantikan-pengurus-baru',
      content: '<p>Pelantikan pengurus baru periode 2026-2028 akan dilaksanakan pada tanggal 1 Agustus 2026. Acara ini akan diadakan secara resmi dan terbuka untuk seluruh anggota.</p>',
      excerpt: 'Pelantikan pengurus baru segera dilaksanakan.',
      status: 'DRAFT',
      category: 'berita',
      authorId: adminUser?.id,
    },
  ]

  for (const post of posts) {
    const existingPost = await prisma.post.findUnique({ where: { slug: post.slug } })
    if (!existingPost) {
      await prisma.post.create({ data: post as any })
    }
  }

  // ========================================
  // 9. WEBSITE PAGES
  // ========================================
  console.log('📄 Creating website pages...')

  const pages = [
    { title: 'Tentang Kami', slug: 'tentang-kami', description: 'Tentang organisasi kami', isPublished: true },
    { title: 'Visi Misi', slug: 'visi-misi', description: 'Visi dan misi organisasi', isPublished: true },
    { title: 'Struktur Organisasi', slug: 'struktur-organisasi', description: 'Struktur organisasi', isPublished: true },
    { title: 'Kontak', slug: 'kontak', description: 'Informasi kontak', isPublished: true },
  ]

  for (const page of pages) {
    const existingPage = await prisma.page.findUnique({ where: { slug: page.slug } })
    if (!existingPage) {
      const newPage = await prisma.page.create({ data: page })
      // Create a default section for each page
      await prisma.pageSection.create({
        data: {
          pageId: newPage.id,
          sectionKey: 'content',
          title: page.title,
          content: `<h2>${page.title}</h2><p>Konten untuk halaman ${page.title} akan segera ditambahkan.</p>`,
          config: {},
          order: 0,
        },
      })
    }
  }

  // ========================================
  // 10. KALENDER
  // ========================================
  console.log('📅 Creating calendar events...')

  const events = [
    { title: 'Rapat Bulanan', description: 'Rapat rutin bulanan seluruh anggota', startDate: new Date('2026-07-15 19:00'), endDate: new Date('2026-07-15 21:00'), color: '#3b82f6', location: 'Aula Pusat', allDay: false },
    { title: 'Workshop Leadership', description: 'Workshop pengembangan kepemimpinan', startDate: new Date('2026-07-20 08:00'), endDate: new Date('2026-07-20 17:00'), color: '#10b981', location: 'Gedung Serba Guna', allDay: false },
    { title: 'Bakti Sosial', description: 'Kegiatan bakti sosial di panti asuhan', startDate: new Date('2026-08-01 07:00'), endDate: new Date('2026-08-01 12:00'), color: '#f59e0b', location: 'Panti Asuhan Al-Hidayah', allDay: false },
    { title: 'Pelantikan Pengurus', description: 'Pelantikan pengurus baru periode 2026-2028', startDate: new Date('2026-08-15 09:00'), endDate: new Date('2026-08-15 12:00'), color: '#ef4444', location: 'Aula Utama', allDay: false },
    { title: 'Halal Bihalal', description: 'Kegiatan halal bihalal anggota', startDate: new Date('2026-08-20 10:00'), endDate: new Date('2026-08-20 14:00'), color: '#8b5cf6', location: 'Taman Kota', allDay: false },
    { title: 'Pelatihan Kader', description: 'Pelatihan dasar kader organisasi', startDate: new Date('2026-09-05 08:00'), endDate: new Date('2026-09-07 17:00'), color: '#ec4899', location: 'Camp Organization', allDay: false },
  ]

  for (const event of events) {
    await prisma.calendarEvent.create({
      data: {
        ...event,
        creatorId: adminUser?.id || '',
      },
    })
  }

  // ========================================
  // 11. PROGRAM KERJA
  // ========================================
  console.log('📋 Creating program kerja...')

  // Get first divisi
  const firstDivisi = await prisma.divisi.findFirst()
  const intDivisi = await prisma.divisi.findUnique({ where: { name: 'Divisi Internal' } })
  const ekstDivisi = await prisma.divisi.findUnique({ where: { name: 'Divisi Eksternal' } })

  const proker1 = await prisma.programKerja.create({
    data: {
      title: 'Pelatihan Kader Muda',
      description: 'Program pelatihan kader muda untuk regenerasi organisasi',
      divisiId: intDivisi?.id || firstDivisi?.id || '',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-12-31'),
      status: 'ON_PROGRESS',
      picId: adminUser?.id,
      creatorId: adminUser?.id || '',
    },
  })

  const ahmadUser = await prisma.user.findUnique({ where: { email: 'ahmad@hubb.local' } })
  const citraUser = await prisma.user.findUnique({ where: { email: 'citra@hubb.local' } })

  // Create checkpoints for proker
  await prisma.checkpoint.create({
    data: {
      title: 'Persiapan materi',
      description: 'Menyiapkan materi pelatihan',
      order: 1,
      programKerjaId: proker1.id,
    },
  })
  await prisma.checkpoint.create({
    data: {
      title: 'Rekrutmen peserta',
      description: 'Merekrut peserta pelatihan',
      order: 2,
      programKerjaId: proker1.id,
    },
  })
  await prisma.checkpoint.create({
    data: {
      title: 'Pelaksanaan pelatihan',
      description: 'Melaksanakan pelatihan',
      order: 3,
      programKerjaId: proker1.id,
      isCompleted: true,
      completedById: ahmadUser?.id,
    },
  })
  await prisma.checkpoint.create({
    data: {
      title: 'Evaluasi',
      description: 'Evaluasi dan laporan',
      order: 4,
      programKerjaId: proker1.id,
    },
  })

  await prisma.programKerja.create({
    data: {
      title: 'Bakti Sosial Annual',
      description: 'Kegiatan bakti sosial tahunan untuk masyarakat',
      divisiId: ekstDivisi?.id || firstDivisi?.id || '',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-31'),
      status: 'DRAFT',
      picId: ahmadUser?.id,
      creatorId: adminUser?.id || '',
    },
  })

  // ========================================
  // 12. KEUANGAN (Transactions only)
  // ========================================
  console.log('💰 Creating keuangan data...')

  // Create sample transactions
  await prisma.transaction.create({
    data: {
      type: 'INCOME',
      category: 'iuran',
      amount: 5000000,
      description: 'Iuran anggota bulan Juli',
      status: 'APPROVED',
      createdById: adminUser?.id,
    },
  })

  await prisma.transaction.create({
    data: {
      type: 'INCOME',
      category: 'donasi',
      amount: 10000000,
      description: 'Donasi dari sponsor',
      status: 'APPROVED',
      createdById: adminUser?.id,
    },
  })

  await prisma.transaction.create({
    data: {
      type: 'EXPENSE',
      category: 'operasional',
      amount: 500000,
      description: 'Pembelian ATK',
      status: 'APPROVED',
      createdById: adminUser?.id,
    },
  })

  // ========================================
  // 13. JENIS SURAT
  // ========================================
  console.log('📃 Creating jenis surat...')

  const jenisSuratList = [
    { name: 'Surat Keterangan', code: 'SK', numberPrefix: 'SK', autoNumber: true },
    { name: 'Surat Undangan', code: 'SU', numberPrefix: 'UND', autoNumber: true },
    { name: 'Surat Keputusan', code: 'SKP', numberPrefix: 'KEP', autoNumber: true },
    { name: 'Surat Perintah', code: 'SP', numberPrefix: 'SP', autoNumber: true },
    { name: 'Surat Edaran', code: 'SE', numberPrefix: 'SE', autoNumber: true },
    { name: 'Surat Permohonan', code: 'SPR', numberPrefix: 'SPR', autoNumber: true },
  ]

  for (const js of jenisSuratList) {
    await prisma.jenisSurat.upsert({
      where: { code: js.code },
      update: js,
      create: js,
    })
  }

  // ========================================
  // 14. NOTIFICATIONS
  // ========================================
  console.log('🔔 Creating notifications...')

  const notifications = [
    { title: 'Selamat Datang!', message: 'Selamat datang di Hubb Organization', type: 'INFO', userId: adminUser?.id || '' },
    { title: 'Rapat Baru', message: 'Rapat bulanan akan diadakan pada 15 Juli 2026', type: 'INFO', userId: adminUser?.id || '' },
    { title: 'Iuran Bulan Ini', message: 'Iuran bulan Juli telah dicatat', type: 'SUCCESS', userId: adminUser?.id || '' },
  ]

  for (const notif of notifications) {
    await prisma.notification.create({ data: notif as any })
  }

  // ========================================
  // 15. MEMORY / DOKUMENTASI
  // ========================================
  console.log('📚 Creating library items...')

  await prisma.mediaFile.createMany({
    data: [
      { filename: 'panduan.pdf', originalName: 'Buku Panduan Organisasi.pdf', mimeType: 'application/pdf', size: 2048000, url: '/uploads/books/panduan.pdf', folder: 'books', uploadedById: adminUser?.id },
      { filename: 'logo.png', originalName: 'Logo Organisasi.png', mimeType: 'image/png', size: 512000, url: '/uploads/images/logo.png', folder: 'images', isPublic: true, uploadedById: adminUser?.id },
      { filename: 'kegiatan-2025.jpg', originalName: 'Foto Kegiatan 2025.jpg', mimeType: 'image/jpeg', size: 1024000, url: '/uploads/images/kegiatan-2025.jpg', folder: 'images', uploadedById: adminUser?.id },
      { filename: 'annual-report.pdf', originalName: 'Presentasi Annual Report.pdf', mimeType: 'application/pdf', size: 4096000, url: '/uploads/documents/annual-report.pdf', folder: 'documents', uploadedById: adminUser?.id },
    ],
    skipDuplicates: true,
  })

  // ========================================
  // 16. WEBSITE SETTINGS - ACTIVATE WEBSITE
  // ========================================
  console.log('🌐 Activating website...')

  await prisma.websiteConfig.upsert({
    where: { key: 'websiteEnabled' },
    update: { value: true },
    create: { key: 'websiteEnabled', value: true, category: 'general', description: 'Website enabled', isPublic: true },
  })

  // ========================================
  // 17. THEMES - Install themes including kpri-style
  // ========================================
  console.log('🎨 Installing themes...')

  const themes = [
    {
      name: 'Default Theme',
      slug: 'default',
      version: '1.0.0',
      description: 'Tema default dengan desain modern dan fleksibel',
      author: 'Ibnu Batuthah',
      isActive: false,
      config: {
        primaryColor: '#6366f1',
        secondaryColor: '#4f46e5',
        accentColor: '#f59e0b',
        backgroundColor: '#ffffff',
        textColor: '#1e293b',
        fontFamily: 'Inter',
        borderRadius: '0.5rem'
      }
    },
    {
      name: 'KPRI Style',
      slug: 'kpri-style',
      version: '1.0.0',
      description: 'Tema bergaya KPRI - Desain formal untuk organisasi pergerakan dengan layout yang bersih dan profesional',
      author: 'Ibnu Batuthah',
      isActive: true, // Set as default active theme
      config: {
        primaryColor: '#16a34a',
        secondaryColor: '#15803d',
        accentColor: '#f59e0b',
        backgroundColor: '#ffffff',
        backgroundSecondary: '#f8fafc',
        textColor: '#1e293b',
        textMuted: '#64748b',
        borderColor: '#e2e8f0',
        fontFamily: 'Plus Jakarta Sans',
        borderRadius: '0.75rem'
      }
    }
  ]

  for (const theme of themes) {
    await prisma.theme.upsert({
      where: { slug: theme.slug },
      update: {
        name: theme.name,
        description: theme.description,
        author: theme.author,
        isActive: theme.isActive,
        config: theme.config,
      },
      create: theme,
    })
  }

  // Ensure only one theme is active
  const activeTheme = await prisma.theme.findFirst({
    where: { isActive: true }
  })
  if (activeTheme) {
    await prisma.theme.updateMany({
      where: { id: { not: activeTheme.id }, isActive: true },
      data: { isActive: false }
    })
  }

  console.log('   ✓ Themes installed')

  // ========================================
  // SUMMARY
  // ========================================
  console.log('')
  console.log('═══════════════════════════════════════')
  console.log('✅ Comprehensive seed completed!')
  console.log('═══════════════════════════════════════')
  console.log('')
  console.log('📧 Login Credentials:')
  console.log('   Admin: admin@hubb.local / admin123')
  console.log('   User: ahmad@hubb.local / password123')
  console.log('')
  console.log('🌐 Website Settings:')
  console.log('   App Name: KPRI - Konfederasi Pergerakan')
  console.log('   Primary Color: #16a34a (Hijau KPRI)')
  console.log('   Website: ACTIVE')
  console.log('   Active Theme: kpri-style (KPRI Style)')
  console.log('')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
