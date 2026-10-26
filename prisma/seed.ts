import {
  PrismaClient,
  TransactionType,
  TransactionStatus,
  KasStatus,
  SuratType,
  SuratStatus,
  ProkerStatus,
  ProposalStatus,
  LpjStatus,
  LpjItemType,
  PresensiStatus,
  KondisiBarang,
  PeminjamanStatus,
  NotificationType,
  PostStatus,
  VotingStatus,
  AspirasiKategori,
  AspirasiStatus,
  AspirasiUrgensi,
  DiklatStatus,
  ScreeningStatus,
  KelulusanStatus,
  AlumniProgramDonasi,
  AlumniDonasiStatus,
  SidangStatus,
  OprecTipe,
  OprecTahap,
  SertifikatKategori,
} from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('[SEED] Memulai inisialisasi basis data dummy HubbHQ...')

  // =========================================================================
  // 1. PERMISSIONS
  // =========================================================================
  console.log('[SEED] 1/20 Menyiapkan Master Permissions...')
  const permissionsData = [
    // Dashboard & Anggota
    { name: 'dashboard.view', label: 'Lihat Dashboard', group: 'Dashboard' },
    { name: 'members.view', label: 'Lihat Anggota', group: 'Members' },
    { name: 'members.create', label: 'Tambah Anggota', group: 'Members' },
    { name: 'members.edit', label: 'Edit Anggota', group: 'Members' },
    { name: 'members.delete', label: 'Hapus Anggota', group: 'Members' },

    // Divisi
    { name: 'divisi.view', label: 'Lihat Divisi', group: 'Divisi' },
    { name: 'divisi.create', label: 'Tambah Divisi', group: 'Divisi' },
    { name: 'divisi.edit', label: 'Edit Divisi', group: 'Divisi' },
    { name: 'divisi.delete', label: 'Hapus Divisi', group: 'Divisi' },

    // Program Kerja & LPJ
    { name: 'proker.view', label: 'Lihat Program Kerja', group: 'Proker' },
    { name: 'proker.create', label: 'Tambah Program Kerja', group: 'Proker' },
    { name: 'proker.edit', label: 'Edit Program Kerja', group: 'Proker' },
    { name: 'proker.delete', label: 'Hapus Program Kerja', group: 'Proker' },

    // Keuangan & Kas
    { name: 'keuangan.view', label: 'Lihat Keuangan', group: 'Keuangan' },
    { name: 'keuangan.create', label: 'Tambah Transaksi', group: 'Keuangan' },
    { name: 'keuangan.edit', label: 'Edit Transaksi', group: 'Keuangan' },
    { name: 'keuangan.approve', label: 'Approve Transaksi', group: 'Keuangan' },

    // Surat & Dokumen
    { name: 'surat.view', label: 'Lihat Surat', group: 'Surat' },
    { name: 'surat.create', label: 'Buat Surat', group: 'Surat' },
    { name: 'surat.approve', label: 'Approve Surat', group: 'Surat' },
    { name: 'surat.template', label: 'Kelola Template Surat', group: 'Surat' },

    // Library & Arsip
    { name: 'library.view', label: 'Lihat Library', group: 'Library' },
    { name: 'library.upload', label: 'Upload Buku/Dokumen', group: 'Library' },

    // Pengaturan & CMS Website
    { name: 'settings.view', label: 'Lihat Pengaturan', group: 'Settings' },
    { name: 'settings.edit', label: 'Edit Pengaturan', group: 'Settings' },
    { name: 'settings.website', label: 'Kelola Tampilan Website', group: 'Settings' },
    { name: 'website.view', label: 'Lihat Konten Web', group: 'Website' },
    { name: 'website.edit', label: 'Edit Konten Web', group: 'Website' },

    // Modul Lanjutan Organisasi
    { name: 'inventaris.view', label: 'Lihat Inventaris', group: 'Inventaris' },
    { name: 'inventaris.manage', label: 'Kelola Logistik & Aset', group: 'Inventaris' },
    { name: 'inventaris.edit', label: 'Edit & Verifikasi Logistik', group: 'Inventaris' },
    { name: 'presensi.manage', label: 'Kelola Presensi & Notula', group: 'Presensi' },
    { name: 'voting.manage', label: 'Kelola E-Voting Mubes', group: 'Voting' },
    { name: 'voting.admin', label: 'Administrasi Penuh Bilik Suara Mubes', group: 'Voting' },
    { name: 'aspirasi.manage', label: 'Kelola Advokasi & Aspirasi', group: 'Aspirasi' },
    { name: 'kaderisasi.manage', label: 'Kelola Diklat & Kaderisasi', group: 'Kaderisasi' },
    { name: 'alumni.manage', label: 'Kelola Alumni & Donasi', group: 'Alumni' },
    { name: 'sidang.manage', label: 'Kelola Risalah & TAP Sidang', group: 'Sidang' },
    { name: 'oprec.manage', label: 'Kelola Open Recruitment', group: 'Oprec' },
    { name: 'sertifikat.manage', label: 'Kelola Studio E-Sertifikat', group: 'Sertifikat' },
    { name: 'surat.delete', label: 'Hapus Berkas Surat', group: 'Surat' },

    // Kalender & Agenda
    { name: 'kalender.view_all', label: 'Lihat Semua Agenda Kalender', group: 'Kalender' },
    { name: 'kalender.create', label: 'Tambah Agenda Kalender', group: 'Kalender' },
    { name: 'kalender.edit', label: 'Edit Agenda Kalender', group: 'Kalender' },
    { name: 'kalender.delete', label: 'Hapus Agenda Kalender', group: 'Kalender' },

    // Proposal & Validasi Keuangan
    { name: 'proposal.review', label: 'Review & Validasi Proposal Keuangan', group: 'Keuangan' },

    // CMS Artikel & Publikasi Berita
    { name: 'posts.create', label: 'Tulis Artikel', group: 'Website' },
    { name: 'posts.read', label: 'Baca Draf Artikel', group: 'Website' },
    { name: 'posts.edit', label: 'Edit Artikel', group: 'Website' },
    { name: 'posts.delete', label: 'Hapus Artikel', group: 'Website' },
    { name: 'posts.review', label: 'Review & Moderasi Artikel', group: 'Website' },
    { name: 'posts.publish', label: 'Publikasikan Artikel', group: 'Website' },
    { name: 'posts.manage', label: 'Kelola Penuh CMS Artikel', group: 'Website' },
  ]

  for (const perm of permissionsData) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: perm,
      create: perm,
    })
  }

  const allPermissions = await prisma.permission.findMany()
  const allPermIds = allPermissions.map((p) => p.id)

  // =========================================================================
  // 2. ROLES
  // =========================================================================
  console.log('[SEED] 2/20 Menyiapkan Master Roles...')
  const rolesData = [
    {
      name: 'admin',
      displayName: 'Super Admin',
      description: 'Akses penuh tanpa batas ke seluruh modul sistem (Super Admin)',
      color: '#ef4444',
      permissionIds: allPermIds,
    },
    {
      name: 'ketua',
      displayName: 'Ketua Umum',
      description: 'Pimpinan tertinggi organisasi dengan otorisasi kebijakan',
      color: '#f59e0b',
      permissionIds: allPermIds,
    },
    {
      name: 'sekretaris',
      displayName: 'Sekretaris Jenderal',
      description: 'Pengelola administrasi, surat, notula, dan persidangan',
      color: '#10b981',
      permissionIds: allPermIds,
    },
    {
      name: 'bendahara',
      displayName: 'Bendahara Umum',
      description: 'Pengelola arus kas, transaksi, donasi, dan audit LPJ',
      color: '#8b5cf6',
      permissionIds: allPermIds,
    },
    {
      name: 'anggota',
      displayName: 'Anggota Aktif',
      description: 'Hak akses dasar anggota untuk presensi, voting, dan aspirasi',
      color: '#6366f1',
      permissionIds: allPermIds.filter((id) => {
        const p = allPermissions.find((x) => x.id === id)
        return ['dashboard.view', 'proker.view', 'library.view', 'website.view'].includes(p?.name || '')
      }),
    },
  ]

  for (const r of rolesData) {
    const { permissionIds, ...rolePayload } = r
    await prisma.role.upsert({
      where: { name: r.name },
      update: rolePayload,
      create: {
        ...rolePayload,
        permissions: {
          connect: permissionIds.map((id) => ({ id })),
        },
      },
    })
  }

  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } })
  const ketuaRole = await prisma.role.findUnique({ where: { name: 'ketua' } })
  const sekretarisRole = await prisma.role.findUnique({ where: { name: 'sekretaris' } })
  const bendaharaRole = await prisma.role.findUnique({ where: { name: 'bendahara' } })
  const anggotaRole = await prisma.role.findUnique({ where: { name: 'anggota' } })

  // =========================================================================
  // 3. WILAYAH & JABATAN
  // =========================================================================
  console.log('[SEED] 3/20 Menyiapkan Wilayah & Jabatan...')
  const pusatWilayah = await prisma.wilayah.upsert({
    where: { id: 'pusat' },
    update: {},
    create: {
      id: 'pusat',
      name: 'Pengurus Besar (Pusat)',
      shortName: 'PB',
      level: 0,
    },
  })

  await prisma.wilayah.upsert({
    where: { id: 'wilayah-jabar' },
    update: {},
    create: {
      id: 'wilayah-jabar',
      name: 'Pengurus Wilayah Jawa Barat',
      shortName: 'PW Jabar',
      level: 1,
      parentId: pusatWilayah.id,
    },
  })

  const jabatans = [
    { name: 'Ketua Umum', shortName: 'Ketum', level: 1 },
    { name: 'Wakil Ketua Umum', shortName: 'Waketum', level: 2 },
    { name: 'Sekretaris Jenderal', shortName: 'Sekjen', level: 3 },
    { name: 'Bendahara Umum', shortName: 'Bendum', level: 3 },
    { name: 'Kepala Divisi', shortName: 'Kadiv', level: 4 },
    { name: 'Staf Divisi', shortName: 'Staf', level: 5 },
  ]

  for (const j of jabatans) {
    await prisma.jabatan.upsert({
      where: { name: j.name },
      update: j,
      create: j,
    })
  }

  const ketumJabatan = await prisma.jabatan.findUnique({ where: { name: 'Ketua Umum' } })
  const sekjenJabatan = await prisma.jabatan.findUnique({ where: { name: 'Sekretaris Jenderal' } })
  const bendumJabatan = await prisma.jabatan.findUnique({ where: { name: 'Bendahara Umum' } })
  const kadivJabatan = await prisma.jabatan.findUnique({ where: { name: 'Kepala Divisi' } })
  const stafJabatan = await prisma.jabatan.findUnique({ where: { name: 'Staf Divisi' } })

  // =========================================================================
  // 4. DIVISI
  // =========================================================================
  console.log('[SEED] 4/20 Menyiapkan Divisi Organisasi...')
  const divisiData = [
    { name: 'Divisi Internal & Organisasi', shortName: 'Inti', color: '#3b82f6', description: 'Penguatan kelembagaan dan soliditas internal anggota' },
    { name: 'Divisi Eksternal & Kerjasama', shortName: 'Ekst', color: '#10b981', description: 'Relasi publik, kemitraan sponsor, dan jejaring instansi' },
    { name: 'Divisi Kaderisasi & PSDM', shortName: 'PSDM', color: '#f59e0b', description: 'Pendidikan kader berjenjang dan pengembangan bakat' },
    { name: 'Divisi Media & Komunikasi', shortName: 'Medkom', color: '#8b5cf6', description: 'Publikasi digital, pengelolaan pers, dan branding organisasi' },
    { name: 'Divisi Logistik & Rumah Tangga', shortName: 'Logistik', color: '#ec4899', description: 'Inventaris aset, peminjaman barang, dan kesekretariatan' },
  ]

  const createdDivisi: Record<string, any> = {}
  for (const d of divisiData) {
    createdDivisi[d.shortName] = await prisma.divisi.upsert({
      where: { name: d.name },
      update: d,
      create: d,
    })
  }

  // =========================================================================
  // 5. PENGGUNA (USERS) DENGAN KTA DIGITAL
  // =========================================================================
  console.log('[SEED] 5/20 Menyiapkan Akun Pengurus & Anggota...')
  const defaultPassword = await bcrypt.hash('password123', 12)
  const adminPassword = await bcrypt.hash('admin123', 12)

  const usersData = [
    {
      name: 'Super Administrator',
      nickname: 'Admin',
      fullName: 'Super Administrator HubbHQ',
      email: 'admin@siop.local',
      password: adminPassword,
      roleId: adminRole?.id,
      wilayahId: pusatWilayah.id,
      jabatanId: ketumJabatan?.id,
      phone: '081200000001',
      nra: 'HQ-2026-0001',
      bloodType: 'O',
      emergencyContact: '081299990001 (Keluarga)',
      ktaIssuedAt: new Date('2026-01-01'),
    },
    {
      name: 'Ahmad Fauzi',
      nickname: 'Fauzi',
      fullName: 'Ahmad Fauzi Pratama, S.T.',
      email: 'ketum@siop.local',
      password: defaultPassword,
      roleId: ketuaRole?.id,
      wilayahId: pusatWilayah.id,
      jabatanId: ketumJabatan?.id,
      phone: '081234567801',
      nra: 'HQ-2026-0002',
      bloodType: 'A',
      emergencyContact: '081234567890 (Ayah)',
      ktaIssuedAt: new Date('2026-01-05'),
    },
    {
      name: 'Siti Nurhaliza',
      nickname: 'Siti',
      fullName: 'Siti Nurhaliza, S.Hum.',
      email: 'sekjen@siop.local',
      password: defaultPassword,
      roleId: sekretarisRole?.id,
      wilayahId: pusatWilayah.id,
      jabatanId: sekjenJabatan?.id,
      phone: '081234567802',
      nra: 'HQ-2026-0003',
      bloodType: 'B',
      emergencyContact: '081234567891 (Ibu)',
      ktaIssuedAt: new Date('2026-01-05'),
    },
    {
      name: 'Rizky Pratama',
      nickname: 'Rizky',
      fullName: 'Rizky Pratama, S.Ak.',
      email: 'bendum@siop.local',
      password: defaultPassword,
      roleId: bendaharaRole?.id,
      wilayahId: pusatWilayah.id,
      jabatanId: bendumJabatan?.id,
      phone: '081234567803',
      nra: 'HQ-2026-0004',
      bloodType: 'AB',
      emergencyContact: '081234567892 (Kakak)',
      ktaIssuedAt: new Date('2026-01-05'),
    },
    {
      name: 'Budi Santoso',
      nickname: 'Budi',
      fullName: 'Budi Santoso, S.Sos.',
      email: 'budi@siop.local',
      password: defaultPassword,
      roleId: anggotaRole?.id,
      wilayahId: pusatWilayah.id,
      jabatanId: kadivJabatan?.id,
      phone: '081234567804',
      nra: 'HQ-2026-0005',
      bloodType: 'O',
      emergencyContact: '081234567893 (Wali)',
      ktaIssuedAt: new Date('2026-01-10'),
    },
    {
      name: 'Citra Dewi',
      nickname: 'Citra',
      fullName: 'Citra Dewi Lestari, S.Psi.',
      email: 'citra@siop.local',
      password: defaultPassword,
      roleId: anggotaRole?.id,
      wilayahId: pusatWilayah.id,
      jabatanId: kadivJabatan?.id,
      phone: '081234567805',
      nra: 'HQ-2026-0006',
      bloodType: 'A',
      emergencyContact: '081234567894 (Ibu)',
      ktaIssuedAt: new Date('2026-01-10'),
    },
    {
      name: 'Dimas Aditya',
      nickname: 'Dimas',
      fullName: 'Dimas Aditya Saputra, S.Kom.',
      email: 'dimas@siop.local',
      password: defaultPassword,
      roleId: anggotaRole?.id,
      wilayahId: pusatWilayah.id,
      jabatanId: kadivJabatan?.id,
      phone: '081234567806',
      nra: 'HQ-2026-0007',
      bloodType: 'B',
      emergencyContact: '081234567895 (Ayah)',
      ktaIssuedAt: new Date('2026-01-10'),
    },
    {
      name: 'Eka Rahmawati',
      nickname: 'Eka',
      fullName: 'Eka Rahmawati, S.M.',
      email: 'eka@siop.local',
      password: defaultPassword,
      roleId: anggotaRole?.id,
      wilayahId: pusatWilayah.id,
      jabatanId: stafJabatan?.id,
      phone: '081234567807',
      nra: 'HQ-2026-0008',
      bloodType: 'O',
      emergencyContact: '081234567896 (Kakak)',
      ktaIssuedAt: new Date('2026-01-15'),
    },
  ]

  const users: Record<string, any> = {}
  for (const u of usersData) {
    users[u.email] = await prisma.user.upsert({
      where: { email: u.email },
      update: u,
      create: u,
    })
  }

  // Masukkan anggota ke Divisi
  await prisma.divisiMember.deleteMany({})
  await prisma.divisiMember.createMany({
    data: [
      { divisiId: createdDivisi['Inti'].id, userId: users['budi@siop.local'].id, position: 'Ketua Divisi' },
      { divisiId: createdDivisi['PSDM'].id, userId: users['citra@siop.local'].id, position: 'Ketua Divisi' },
      { divisiId: createdDivisi['Medkom'].id, userId: users['dimas@siop.local'].id, position: 'Ketua Divisi' },
      { divisiId: createdDivisi['Ekst'].id, userId: users['eka@siop.local'].id, position: 'Staf Divisi' },
    ],
    skipDuplicates: true,
  })

  // =========================================================================
  // 6. PROGRAM KERJA, CHECKPOINT, PROPOSAL & LPJ
  // =========================================================================
  console.log('[SEED] 6/20 Menyiapkan Program Kerja, Checkpoints, & LPJ...')
  const proker1 = await prisma.programKerja.upsert({
    where: { id: 'proker-ldko-2026' },
    update: {},
    create: {
      id: 'proker-ldko-2026',
      title: 'Latihan Dasar Kepemimpinan Organisasi (LDKO) 2026',
      description: 'Pelatihan intensif kepemimpinan, manajemen sidang, dan retorika untuk membentuk kader berkarakter.',
      status: ProkerStatus.ON_PROGRESS,
      kategori: 'Kaderisasi',
      anggaranEstimasi: 15000000,
      sumberDana: 'Kas Organisasi & Sponsor',
      lokasi: 'Villa Agrowisata Mandiri, Lembang',
      startDate: new Date('2026-11-10'),
      endDate: new Date('2026-11-12'),
      divisiId: createdDivisi['PSDM'].id,
      picId: users['citra@siop.local'].id,
      creatorId: users['ketum@siop.local'].id,
      checkpoints: {
        create: [
          { title: 'Pembentukan Panitia & Rapat Perdana', isCompleted: true, completedAt: new Date('2026-10-24'), order: 1 },
          { title: 'Pengajuan & Persetujuan Proposal Dana', isCompleted: true, completedAt: new Date('2026-10-25'), order: 2 },
          { title: 'Penyebaran Undangan & Booking Lokasi', isCompleted: false, order: 3 },
          { title: 'Pelaksanaan Kegiatan Hari H', isCompleted: false, order: 4 },
          { title: 'Penyusunan & Pengesahan LPJ', isCompleted: false, order: 5 },
        ],
      },
      panitia: {
        create: [
          { userId: users['budi@siop.local'].id, roleJabatan: 'Ketua Pelaksana' },
          { userId: users['siti@siop.local']?.id || users['sekjen@siop.local'].id, roleJabatan: 'Sekretaris Panitia' },
          { userId: users['rizky@siop.local']?.id || users['bendum@siop.local'].id, roleJabatan: 'Bendahara Panitia' },
          { userId: users['dimas@siop.local'].id, roleJabatan: 'Divisi Humas & Pubdok' },
        ],
      },
      proposals: {
        create: [
          {
            title: 'Proposal Pendanaan LDKO 2026',
            description: 'Pengajuan alokasi anggaran kegiatan LDKO untuk konsumsi, sewa tempat, dan akomodasi.',
            amount: 15000000,
            status: ProposalStatus.APPROVED,
            requesterId: users['budi@siop.local'].id,
            reviewedById: users['bendum@siop.local'].id,
            reviewedAt: new Date('2026-10-25'),
            reviewedNote: 'Disetujui sesuai pagu anggaran tahunan Divisi PSDM.',
          },
        ],
      },
    },
  })

  const proker2 = await prisma.programKerja.upsert({
    where: { id: 'proker-semnas-2026' },
    update: {},
    create: {
      id: 'proker-semnas-2026',
      title: 'Seminar Nasional Digitalisasi Organisasi & AI',
      description: 'Seminar kolaboratif membahas implementasi kecerdasan buatan dalam tata kelola organisasi modern.',
      status: ProkerStatus.COMPLETED,
      kategori: 'Pendidikan & Publikasi',
      anggaranEstimasi: 20000000,
      sumberDana: 'Tiket Seminar & Sponsorship',
      lokasi: 'Auditorium Graha Widya Tama',
      startDate: new Date('2026-09-15'),
      endDate: new Date('2026-09-15'),
      divisiId: createdDivisi['Medkom'].id,
      picId: users['dimas@siop.local'].id,
      creatorId: users['ketum@siop.local'].id,
      checkpoints: {
        create: [
          { title: 'Penyusunan TOR & Undangan Pembicara', isCompleted: true, completedAt: new Date('2026-08-01'), order: 1 },
          { title: 'Pembukaan Registrasi Tiket Peserta', isCompleted: true, completedAt: new Date('2026-08-15'), order: 2 },
          { title: 'Pelaksanaan Seminar Nasional', isCompleted: true, completedAt: new Date('2026-09-15'), order: 3 },
          { title: 'Penyelesaian Laporan Pertanggungjawaban (LPJ)', isCompleted: true, completedAt: new Date('2026-09-22'), order: 4 },
        ],
      },
    },
  })

  // Buat LPJ untuk Proker 2 (Seminar Nasional)
  await prisma.lpjProker.upsert({
    where: { programKerjaId: proker2.id },
    update: {},
    create: {
      programKerjaId: proker2.id,
      ringkasanKegiatan: 'Seminar Nasional sukses diselenggarakan dengan tingkat kepuasan peserta mencapai 94%.',
      pesertaHadir: 185,
      ketercapaianTarget: 'Target 150 peserta terlampaui dengan kehadiran 185 peserta dari 12 perguruan tinggi.',
      kendala: 'Kapasitas parkir kendaraan roda empat sempat padat di area auditorium.',
      solusi: 'Panitia keamanan mengarahkan sisa kendaraan ke kantong parkir gedung barat.',
      rekomendasi: 'Kerjasama dengan pihak keamanan kampus perlu diperkuat untuk acara skala nasional berikutnya.',
      totalPemasukan: 22000000,
      totalPengeluaran: 19500000,
      saldoAkhir: 2500000,
      status: LpjStatus.APPROVED,
      reviewedById: users['bendum@siop.local'].id,
      reviewedAt: new Date('2026-09-25'),
      reviewedNote: 'LPJ telah diperiksa, bukti kuitansi lengkap dan surplus dialokasikan ke Kas Umum.',
      surplusAction: 'KEMBALIKAN_KAS_UMUM',
      surplusAmount: 2500000,
      isSurplusSettled: true,
      checklistNotaFisik: true,
      checklistPresensi: true,
      checklistDokumentasi: true,
      checklistBeritaAcara: true,
      checklistVerifiedById: users['sekjen@siop.local'].id,
      checklistVerifiedAt: new Date('2026-09-24'),
      items: {
        create: [
          { type: LpjItemType.INCOME, kategori: 'Pendaftaran', namaBarang: 'Tiket Early Bird (100 Peserta)', qty: 100, hargaSatuan: 100000, totalHarga: 10000000 },
          { type: LpjItemType.INCOME, kategori: 'Sponsorship', namaBarang: 'Sponsor Utama Bank Syariah Mandiri', qty: 1, hargaSatuan: 12000000, totalHarga: 12000000 },
          { type: LpjItemType.EXPENSE, kategori: 'Konsumsi', namaBarang: 'Snack Box & Makan Siang Prasmanan', qty: 200, hargaSatuan: 45000, totalHarga: 9000000 },
          { type: LpjItemType.EXPENSE, kategori: 'Perlengkapan', namaBarang: 'Sewa Gedung & Sound System 5000W', qty: 1, hargaSatuan: 6000000, totalHarga: 6000000 },
          { type: LpjItemType.EXPENSE, kategori: 'Kesekretariatan', namaBarang: 'Goodie Bag, ID Card & Seminar Kit', qty: 190, hargaSatuan: 20000, totalHarga: 3800000 },
          { type: LpjItemType.EXPENSE, kategori: 'Transportasi', namaBarang: 'Akomodasi & Transport Narasumber Luar Kota', qty: 1, hargaSatuan: 700000, totalHarga: 700000 },
        ],
      },
    },
  })

  // =========================================================================
  // 7. PRESENSI DIGITAL & NOTULA RAPAT
  // =========================================================================
  console.log('[SEED] 7/20 Menyiapkan Presensi Digital & Notula Rapat...')
  const presensi1 = await prisma.presensiSesi.upsert({
    where: { id: 'presensi-ldko-01' },
    update: {},
    create: {
      id: 'presensi-ldko-01',
      programKerjaId: proker1.id,
      judul: 'Rapat Perdana & Pembagian Jobdesk Panitia LDKO 2026',
      tipe: 'RAPAT',
      lokasi: 'Ruang Rapat Sekretariat Utama',
      tanggal: new Date('2026-10-24T19:30:00Z'),
      qrSecret: 'qr-secret-key-ldko-2026-demo',
      currentQrToken: 'DEMO-TOKEN-LDKO',
      createdById: users['budi@siop.local'].id,
      kehadiran: {
        create: [
          { userId: users['budi@siop.local'].id, namaPeserta: 'Budi Santoso', nomorIdentitas: 'HQ-2026-0005', instansi: 'Divisi Internal', status: PresensiStatus.HADIR },
          { userId: users['citra@siop.local'].id, namaPeserta: 'Citra Dewi', nomorIdentitas: 'HQ-2026-0006', instansi: 'Divisi PSDM', status: PresensiStatus.HADIR },
          { userId: users['dimas@siop.local'].id, namaPeserta: 'Dimas Aditya', nomorIdentitas: 'HQ-2026-0007', instansi: 'Divisi Medkom', status: PresensiStatus.HADIR },
          { userId: users['eka@siop.local'].id, namaPeserta: 'Eka Rahmawati', nomorIdentitas: 'HQ-2026-0008', instansi: 'Divisi Eksternal', status: PresensiStatus.IZIN, keterangan: 'Tugas kuliah malam' },
        ],
      },
    },
  })

  await prisma.notulaRapat.upsert({
    where: { id: 'notula-ldko-01' },
    update: {},
    create: {
      id: 'notula-ldko-01',
      programKerjaId: proker1.id,
      presensiSesiId: presensi1.id,
      judul: 'Notula Rapat Koordinasi Panitia LDKO #1',
      pimpinanRapat: 'Budi Santoso (Ketua Pelaksana)',
      notulisId: users['sekjen@siop.local'].id,
      notulisName: 'Siti Nurhaliza',
      tempat: 'Ruang Rapat Sekretariat Utama',
      agenda: '1. Finalisasi rundown 3 hari\n2. Penentuan batas kuota peserta\n3. Pengajuan proposal sponsor',
      pembahasan: 'Rapat dibuka pukul 19.30 WIB oleh Ketua Pelaksana. Disepakati materi utama mencakup manajemen kepemimpinan, teknik persidangan, dan analisis sosial kemasyarakatan.',
      kesimpulan: 'Target peserta ditetapkan 60 kader. Tiket early bird dibuka mulai 1 November.',
      actionItems: JSON.stringify([
        { task: 'Hubungi pengelola villa Lembang', pic: 'Dimas Aditya', deadline: '2026-10-28' },
        { task: 'Kirim draf proposal ke Bendahara Umum', pic: 'Budi Santoso', deadline: '2026-10-26' },
      ]),
    },
  })

  // =========================================================================
  // 8. LOGISTIK & INVENTARIS BARANG
  // =========================================================================
  console.log('[SEED] 8/20 Menyiapkan Logistik & Inventaris Aset...')
  const inventarisData = [
    {
      kodeBarang: 'INV-ELEC-0001',
      namaBarang: 'Proyektor Epson EB-X400 3300 Lumens',
      kategori: 'Elektronik',
      merkModel: 'Epson EB-X400',
      jumlahTotal: 2,
      jumlahTersedia: 1,
      jumlahDipinjam: 1,
      satuan: 'Unit',
      kondisi: KondisiBarang.BAIK,
      lokasiPenyimpanan: 'Lemari Kaca A Sekretariat',
      asalPengadaan: 'Pengadaan Kas Umum 2024',
      hargaBeli: 5200000,
      divisiId: createdDivisi['Logistik'].id,
    },
    {
      kodeBarang: 'INV-ELEC-0002',
      namaBarang: 'Wireless Portable Sound System Ashley 12 Inch',
      kategori: 'Elektronik',
      merkModel: 'Ashley Voice-12',
      jumlahTotal: 1,
      jumlahTersedia: 0,
      jumlahDipinjam: 1,
      satuan: 'Unit',
      kondisi: KondisiBarang.BAIK,
      lokasiPenyimpanan: 'Gudang Logistik Lt. 1',
      asalPengadaan: 'Hibah Alumni Angkatan 2018',
      hargaBeli: 2800000,
      divisiId: createdDivisi['Logistik'].id,
    },
    {
      kodeBarang: 'INV-DOC-0001',
      namaBarang: 'Kamera Mirrorless Sony Alpha A6400 + Lensa 16-50mm',
      kategori: 'Dokumentasi',
      merkModel: 'Sony A6400 Kit',
      jumlahTotal: 1,
      jumlahTersedia: 1,
      jumlahDipinjam: 0,
      satuan: 'Set',
      kondisi: KondisiBarang.BAIK,
      lokasiPenyimpanan: 'Dry Box Medkom',
      asalPengadaan: 'Sponsorship Produk 2025',
      hargaBeli: 12500000,
      divisiId: createdDivisi['Medkom'].id,
    },
    {
      kodeBarang: 'INV-LOG-0001',
      namaBarang: 'Roll Kabel Tembaga Heavy Duty 50 Meter',
      kategori: 'Perlengkapan',
      merkModel: 'Uticon Industrial Roll',
      jumlahTotal: 3,
      jumlahTersedia: 3,
      jumlahDipinjam: 0,
      satuan: 'Roll',
      kondisi: KondisiBarang.BAIK,
      lokasiPenyimpanan: 'Rak Alat Bawah Gudang',
      asalPengadaan: 'Pengadaan Kas Logistik 2024',
      hargaBeli: 350000,
      divisiId: createdDivisi['Logistik'].id,
    },
  ]

  const createdBarang: Record<string, any> = {}
  for (const b of inventarisData) {
    createdBarang[b.kodeBarang] = await prisma.inventarisBarang.upsert({
      where: { kodeBarang: b.kodeBarang },
      update: b,
      create: b,
    })
  }

  // Peminjaman Barang
  await prisma.peminjamanBarang.upsert({
    where: { kodePeminjaman: 'PINJAM-2026-0001' },
    update: {},
    create: {
      kodePeminjaman: 'PINJAM-2026-0001',
      barangId: createdBarang['INV-ELEC-0002'].id,
      jumlah: 1,
      peminjamType: 'ANGGOTA',
      userId: users['budi@siop.local'].id,
      namaPeminjam: 'Budi Santoso',
      kontakPeminjam: '081234567804',
      instansiPeminjam: 'Panitia LDKO 2026',
      keperluan: 'Peminjaman sound system portable untuk gladi resik dan technical meeting panitia.',
      rencanaKembali: new Date('2026-10-30'),
      status: PeminjamanStatus.DIPINJAM,
      kondisiPinjam: KondisiBarang.BAIK,
      petugasPinjamId: users['admin@siop.local'].id,
    },
  })

  // =========================================================================
  // 9. KEUANGAN & KAS ANGGOTA
  // =========================================================================
  console.log('[SEED] 9/20 Menyiapkan Transaksi Keuangan & Kas Anggota...')
  await prisma.transaction.createMany({
    data: [
      {
        type: TransactionType.INCOME,
        category: 'kas_anggota',
        amount: 3500000,
        description: 'Penerimaan Iuran Kas Anggota Triwulan I (Januari - Maret 2026)',
        date: new Date('2026-03-31'),
        status: TransactionStatus.APPROVED,
        createdById: users['bendum@siop.local'].id,
      },
      {
        type: TransactionType.INCOME,
        category: 'sumbangan',
        amount: 10000000,
        description: 'Penerimaan Hibah Filantropi Alumni untuk Dana Abadi Pendidikan',
        date: new Date('2026-04-10'),
        status: TransactionStatus.APPROVED,
        createdById: users['bendum@siop.local'].id,
      },
      {
        type: TransactionType.EXPENSE,
        category: 'operasional',
        amount: 850000,
        description: 'Pengadaan ATK, Kertas F4 Kop Surat & Tinta Printer Sekretariat',
        date: new Date('2026-04-12'),
        status: TransactionStatus.APPROVED,
        createdById: users['bendum@siop.local'].id,
      },
      {
        type: TransactionType.EXPENSE,
        category: 'operasional',
        amount: 1500000,
        description: 'Biaya Perpanjangan Domain Website & Cloud Server Tahunan',
        date: new Date('2026-05-01'),
        status: TransactionStatus.APPROVED,
        createdById: users['bendum@siop.local'].id,
      },
    ],
    skipDuplicates: true,
  })

  // Kas Anggota Payments
  await prisma.kasPayment.createMany({
    data: [
      { userId: users['budi@siop.local'].id, month: 1, year: 2026, amount: 50000, status: KasStatus.APPROVED, paymentMethod: 'GATEWAY_QRIS' },
      { userId: users['budi@siop.local'].id, month: 2, year: 2026, amount: 50000, status: KasStatus.APPROVED, paymentMethod: 'GATEWAY_QRIS' },
      { userId: users['citra@siop.local'].id, month: 1, year: 2026, amount: 50000, status: KasStatus.APPROVED, paymentMethod: 'MANUAL' },
      { userId: users['dimas@siop.local'].id, month: 1, year: 2026, amount: 50000, status: KasStatus.APPROVED, paymentMethod: 'MANUAL' },
      { userId: users['eka@siop.local'].id, month: 1, year: 2026, amount: 50000, status: KasStatus.PENDING, paymentMethod: 'MANUAL', notes: 'Menunggu cek mutasi bank' },
    ],
    skipDuplicates: true,
  })

  // =========================================================================
  // 10. SURAT MASUK & KELUAR
  // =========================================================================
  console.log('[SEED] 10/20 Menyiapkan Persuratan Digital...')
  const jenisSuratSK = await prisma.jenisSurat.findUnique({ where: { code: 'SK' } })
  const jenisSuratSU = await prisma.jenisSurat.findUnique({ where: { code: 'SU' } })

  await prisma.surat.createMany({
    data: [
      {
        type: SuratType.KELUAR,
        letterNumber: '001/SU/HUBB/X/2026',
        subject: 'Undangan Rapat Koordinasi Pimpinan Pleno Triwulan IV',
        content: 'Dengan hormat, mengundang seluruh jajaran pimpinan divisi untuk hadir dalam rapat pleno...',
        status: SuratStatus.APPROVED,
        requesterId: users['sekjen@siop.local'].id,
        approverId: users['ketum@siop.local'].id,
        approvedAt: new Date('2026-10-20'),
        jenisSuratId: jenisSuratSU?.id,
      },
      {
        type: SuratType.KELUAR,
        letterNumber: '002/SK/HUBB/X/2026',
        subject: 'Surat Keputusan Pengesahan Panitia Pelaksana LDKO 2026',
        content: 'Menimbang perlunya pembentukan panitia pelaksana kegiatan Latihan Dasar Kepemimpinan...',
        status: SuratStatus.APPROVED,
        requesterId: users['sekjen@siop.local'].id,
        approverId: users['ketum@siop.local'].id,
        approvedAt: new Date('2026-10-22'),
        jenisSuratId: jenisSuratSK?.id,
      },
      {
        type: SuratType.MASUK,
        letterNumber: '112/BEM-U/UND/X/2026',
        subject: 'Undangan Delegasi Kongres Mahasiswa Nasional Se-Indonesia',
        sender: 'Badan Eksekutif Mahasiswa Universitas',
        senderContact: 'bem@kampus.ac.id / 081122334455',
        status: SuratStatus.APPROVED,
        receivedDate: new Date('2026-10-24'),
        jenisSuratId: jenisSuratSU?.id,
      },
    ],
    skipDuplicates: true,
  })

  // =========================================================================
  // 11. KALENDER KEGIATAN
  // =========================================================================
  console.log('[SEED] 11/20 Menyiapkan Kalender Kegiatan...')
  await prisma.calendarEvent.createMany({
    data: [
      {
        title: 'Latihan Dasar Kepemimpinan Organisasi (LDKO) 2026',
        startDate: new Date('2026-11-10T08:00:00Z'),
        endDate: new Date('2026-11-12T16:00:00Z'),
        allDay: true,
        location: 'Villa Agrowisata Mandiri, Lembang',
        creatorId: users['admin@siop.local'].id,
        programKerjaId: proker1.id,
        color: '#10b981',
        isPublic: true,
      },
      {
        title: 'Rapat Pleno Evaluasi Kinerja Bulanan Pengurus',
        startDate: new Date('2026-11-01T19:30:00Z'),
        endDate: new Date('2026-11-01T22:00:00Z'),
        allDay: false,
        location: 'Ruang Rapat Sekretariat & Zoom Cloud Meetings',
        creatorId: users['sekjen@siop.local'].id,
        color: '#6366f1',
        isPublic: false,
      },
      {
        title: 'Musyawarah Besar (MUBES) XXIV & Suksesi Kepengurusan',
        startDate: new Date('2026-12-20T08:00:00Z'),
        endDate: new Date('2026-12-22T18:00:00Z'),
        allDay: true,
        location: 'Balai Pertemuan Pemuda Jawa Barat',
        creatorId: users['admin@siop.local'].id,
        color: '#f59e0b',
        isPublic: true,
      },
    ],
    skipDuplicates: true,
  })

  // =========================================================================
  // 12. LIBRARY BUKU & DOKUMEN HUKUM
  // =========================================================================
  console.log('[SEED] 12/20 Menyiapkan Library Buku & Dokumen Hukum...')
  await prisma.libraryBook.upsert({
    where: { id: 'book-pedoman-organisasi' },
    update: {},
    create: {
      id: 'book-pedoman-organisasi',
      title: 'Buku Pedoman Tata Kelola & Administrasi Organisasi Modern',
      author: 'Tim Kajian Hukum & Kebijakan HubbHQ',
      description: 'Panduan lengkap persuratan resmi, tata naskah dinas, dan SOP pengelolaan kas organisasi.',
      fileUrl: '/uploads/documents/pedoman-tata-kelola-2026.pdf',
      fileType: 'application/pdf',
      fileSize: 4250000,
      category: 'Pedoman Resmi',
      viewCount: 154,
      downloadCount: 88,
    },
  })

  await prisma.document.upsert({
    where: { id: 'doc-adart-terbaru' },
    update: {},
    create: {
      id: 'doc-adart-terbaru',
      title: 'Anggaran Dasar & Anggaran Rumah Tangga (AD/ART) Hasil MUBES XXIII',
      category: 'AD/ART',
      description: 'Konstitusi dasar dan pedoman struktural pergerakan organisasi hasil amandemen pleno.',
      fileUrl: '/uploads/documents/ad-art-hubbhq-2025.pdf',
      fileType: 'application/pdf',
      fileSize: 3100000,
      isPublic: true,
    },
  })

  // =========================================================================
  // 13. E-VOTING MUSYAWARAH / MUBES (PEMIRA)
  // =========================================================================
  console.log('[SEED] 13/20 Menyiapkan E-Voting & Suksesi Kepemimpinan...')
  const voting1 = await prisma.votingEvent.upsert({
    where: { slug: 'pemilihan-ketum-mubes-xxiv' },
    update: {},
    create: {
      slug: 'pemilihan-ketum-mubes-xxiv',
      title: 'Pemilihan Ketua Umum & Wakil Ketua Umum Periode 2026-2027',
      description: 'Pemungutan suara digital LUBER-JURDIL pada Sidang Pleno IV Musyawarah Besar (MUBES) XXIV.',
      rules: '1. Pemilih terdaftar wajib memiliki hak suara aktif di DPT.\n2. Setiap pemilih hanya dapat menggunakan 1 token sekali pakai.\n3. Pilihan bersifat anonim dan dienkripsi hash kriptografis.',
      startDate: new Date('2026-10-20T08:00:00Z'),
      endDate: new Date('2026-11-20T17:00:00Z'),
      status: VotingStatus.AKTIF,
      showLiveCount: true,
      allowAbstain: false,
      createdById: users['admin@siop.local'].id,
      kandidat: {
        create: [
          {
            nomorUrut: 1,
            namaKetua: 'Ahmad Fauzi Pratama',
            namaWakil: 'Rizky Pratama',
            visi: 'Mewujudkan HubbHQ sebagai episentrum kader berkarakter digital, inklusif, dan berdaya saing global.',
            misi: '1. Digitalisasi 100% sistem arsip dan pelaporan.\n2. Penguatan kompetensi teknologi dan kepemimpinan kader.\n3. Membangun kemandirian finansial melalui Dana Abadi Organisasi.',
            programUnggulan: 'HubbHQ Digital Academy & Inkubator Sociopreneur',
            suaraSah: 18,
          },
          {
            nomorUrut: 2,
            namaKetua: 'Budi Santoso',
            namaWakil: 'Citra Dewi Lestari',
            visi: 'Transformasi gerakan advokasi berbasis riset dan pengabdian masyarakat yang berdampak nyata.',
            misi: '1. Optimalisasi respon cepat meja advokasi fasilitas.\n2. Perluasan jejaring filantropi dan alumni lintas angkatan.\n3. Regenerasi kepemimpinan berjenjang di setiap cabang.',
            programUnggulan: 'Desa Binaan Kolaboratif & Beasiswa Kader Tangguh',
            suaraSah: 14,
          },
        ],
      },
    },
  })

  // DPT (Daftar Pemilih Tetap)
  await prisma.votingDPT.upsert({
    where: { votingToken: 'TOKEN-VOTE-DEMO-001' },
    update: {},
    create: {
      votingEventId: voting1.id,
      userId: users['dimas@siop.local'].id,
      nama: 'Dimas Aditya Saputra',
      nraOrNim: 'HQ-2026-0007',
      votingToken: 'TOKEN-VOTE-DEMO-001',
      hasVoted: false,
    },
  })

  // =========================================================================
  // 14. PORTAL KOTAK ASPIRASI & MEJA ADVOKASI
  // =========================================================================
  console.log('[SEED] 14/20 Menyiapkan Portal Aspirasi & Advokasi...')
  const asp1 = await prisma.aspirasi.upsert({
    where: { kodeTiket: 'ASP-2026-0001' },
    update: {},
    create: {
      kodeTiket: 'ASP-2026-0001',
      pinPelacak: '827103',
      judul: 'Permohonan Servis & Perbaikan AC di Ruang Rapat Sekretariat',
      kategori: AspirasiKategori.FASILITAS,
      urgensi: AspirasiUrgensi.TINGGI,
      isi: 'Pendingin ruangan (AC) di ruang rapat sekretariat mengeluarkan suara bising dan kurang dingin saat digunakan pleno bersama anggota.',
      isAnonim: false,
      namaPelapor: 'Rizky Pratama',
      kontakPelapor: '081234567803',
      status: AspirasiStatus.DALAM_ADVOKASI,
      tindakLanjut: 'Divisi Logistik telah menghubungi teknisi servis resmi. Pengecekan freon dan filter dijadwalkan hari Rabu.',
      catatanInternal: 'Biaya estimasi perbaikan Rp 350.000 dialokasikan dari anggaran operasional logistik.',
      ditindakLanjutOlehId: users['admin@siop.local'].id,
    },
  })

  await prisma.aspirasiTanggapan.create({
    data: {
      aspirasiId: asp1.id,
      userId: users['admin@siop.local'].id,
      pengirim: 'PENGURUS',
      pesan: 'Laporan Anda telah diverifikasi oleh tim advokasi. Kami telah mengoordinasikannya dengan Divisi Logistik untuk penanganan langsung di lokasi.',
      isInternal: false,
    },
  })

  await prisma.aspirasi.upsert({
    where: { kodeTiket: 'ASP-2026-0002' },
    update: {},
    create: {
      kodeTiket: 'ASP-2026-0002',
      pinPelacak: '491820',
      judul: 'Usulan Pengadaan Rak Buku Arsip dan Pojok Literasi Digital',
      kategori: AspirasiKategori.SARAN_UMUM,
      urgensi: AspirasiUrgensi.SEDANG,
      isi: 'Mengusulkan penambahan rak buku dinding di ruang depan sekretariat agar modul dan buku keorganisasian tersusun rapi.',
      isAnonim: true,
      status: AspirasiStatus.SELESAI,
      tindakLanjut: 'Rak buku arsip telah dibeli dan dipasang. Pojok literasi kini telah dapat dimanfaatkan seluruh anggota.',
      tanggalSelesai: new Date('2026-10-15'),
      ditindakLanjutOlehId: users['budi@siop.local'].id,
    },
  })

  // =========================================================================
  // 15. PENDIDIKAN & JENJANG KADERISASI
  // =========================================================================
  console.log('[SEED] 15/20 Menyiapkan Jenjang Kaderisasi & Diklat...')
  const jenjang1 = await prisma.kaderisasiJenjang.upsert({
    where: { urutan: 1 },
    update: {},
    create: {
      urutan: 1,
      namaJenjang: 'Kader Dasar (LK 1 / Mapaba / LDKM)',
      singkatan: 'LK 1',
      deskripsi: 'Fase orientasi pengenalan visi organisasi, ideologi gerakan, dan dasar kepemimpinan.',
      syaratKelulusan: 'Kehadiran minimal 85%, kelulusan ujian kognitif dan evaluasi afektif forum.',
      minBulanMenujuLanjut: 6,
    },
  })

  const jenjang2 = await prisma.kaderisasiJenjang.upsert({
    where: { urutan: 2 },
    update: {},
    create: {
      urutan: 2,
      namaJenjang: 'Kader Menengah (LK 2 / Intermediate Training)',
      singkatan: 'LK 2',
      deskripsi: 'Fase pendalaman analisis sosial, perumusan gagasan kritis, dan tata kelola kebijakan.',
      syaratKelulusan: 'Telah lulus LK 1 minimal 6 bulan, menyerahkan makalah ilmiah, dan lolos screening.',
      minBulanMenujuLanjut: 12,
    },
  })

  const batch1 = await prisma.diklatBatch.upsert({
    where: { kodeBatch: 'LK1-2026-01' },
    update: {},
    create: {
      jenjangId: jenjang1.id,
      kodeBatch: 'LK1-2026-01',
      namaDiklat: 'Latihan Kader Dasar Angkatan XXIV',
      tanggalMulai: new Date('2026-08-10'),
      tanggalSelesai: new Date('2026-08-13'),
      lokasi: 'Villa Agrowisata Mandiri, Lembang',
      kuota: 40,
      status: DiklatStatus.SELESAI,
      motNama: 'Citra Dewi Lestari (Master of Training)',
      skKepanitiaan: '002/SK/HUBB/VIII/2026',
    },
  })

  await prisma.diklatPeserta.upsert({
    where: { nomorRegistrasiKader: 'KDR-2026-0041' },
    update: {},
    create: {
      batchId: batch1.id,
      userId: users['eka@siop.local'].id,
      namaLengkap: 'Eka Rahmawati',
      nraOrNim: '2105120401',
      instansiAsal: 'Fakultas Ekonomi & Bisnis',
      statusScreening: ScreeningStatus.LOLOS,
      nilaiKognitif: 88,
      nilaiAfektif: 92,
      nilaiPsikomotorik: 90,
      nilaiAkhir: 90,
      statusKelulusan: KelulusanStatus.LULUS_MURNI,
      nomorRegistrasiKader: 'KDR-2026-0041',
      nomorSttpp: 'STTPP/LK1/HUBB/041/2026',
      sttppIssuedAt: new Date('2026-08-14'),
      catatanInstruktur: 'Peserta sangat aktif dan menunjukkan kepemimpinan kelompok yang solid.',
    },
  })

  // =========================================================================
  // 16. JEJARING ALUMNI & DANA ABADI
  // =========================================================================
  console.log('[SEED] 16/20 Menyiapkan Jejaring Alumni & Dana Abadi...')
  const alumni1 = await prisma.alumni.upsert({
    where: { id: 'alumni-hendra' },
    update: {},
    create: {
      id: 'alumni-hendra',
      nama: 'Dr. Hendra Gunawan, S.Kom., M.T.',
      angkatanMasuk: 2012,
      tahunLulus: 2016,
      jabatanTerakhir: 'Ketua Umum Periode 2015-2016',
      profesi: 'VP of Engineering',
      instansiBekerja: 'PT Teknologi Nusantara AI',
      email: 'hendra.gunawan@alumni.org',
      phone: '081122334401',
      domisili: 'Jakarta Selatan',
      linkedin: 'https://linkedin.com/in/hendragunawan',
      bio: 'Alumni penggerak digitalisasi organisasi yang senantiasa mendukung pembinaan kader muda.',
      isKontributorAktif: true,
    },
  })

  const alumni2 = await prisma.alumni.upsert({
    where: { id: 'alumni-maya' },
    update: {},
    create: {
      id: 'alumni-maya',
      nama: 'Maya Anggraini, S.E., M.Ak.',
      angkatanMasuk: 2014,
      tahunLulus: 2018,
      jabatanTerakhir: 'Bendahara Umum Periode 2017-2018',
      profesi: 'Senior Financial Auditor',
      instansiBekerja: 'KAP Global Advisory',
      email: 'maya.anggraini@alumni.org',
      phone: '081122334402',
      domisili: 'Bandung',
      isKontributorAktif: true,
    },
  })

  await prisma.alumniDonasi.createMany({
    data: [
      {
        alumniId: alumni1.id,
        namaDonatur: 'Dr. Hendra Gunawan',
        nominal: 10000000,
        programDonasi: AlumniProgramDonasi.DANA_ABADI,
        metodeBayar: 'TRANSFER_BANK',
        status: AlumniDonasiStatus.TERVERIFIKASI,
        catatan: 'Kontribusi tahunan untuk Dana Abadi Riset & Prestasi Kader',
        pesanAlumni: 'Teruslah berinovasi dan menjaga integritas marwah organisasi.',
        tanggalBayar: new Date('2026-04-10'),
      },
      {
        alumniId: alumni2.id,
        namaDonatur: 'Maya Anggraini, S.E.',
        nominal: 5000000,
        programDonasi: AlumniProgramDonasi.BEASISWA_KADER,
        metodeBayar: 'QRIS',
        status: AlumniDonasiStatus.TERVERIFIKASI,
        catatan: 'Bantuan beasiswa uang kuliah untuk 2 kader berprestasi',
        pesanAlumni: 'Semoga bermanfaat bagi adik-adik kader yang sedang menempuh skripsi.',
        tanggalBayar: new Date('2026-05-15'),
      },
    ],
    skipDuplicates: true,
  })

  // =========================================================================
  // 17. PERSIDANGAN PLENO & RISALAH TAP MUBES
  // =========================================================================
  console.log('[SEED] 17/20 Menyiapkan Persidangan Musyawarah & TAP Pleno...')
  const sidang1 = await prisma.sidangMusyawarah.upsert({
    where: { id: 'sidang-mubes-xxiv' },
    update: {},
    create: {
      id: 'sidang-mubes-xxiv',
      namaMusyawarah: 'Musyawarah Besar (MUBES) XXIV Organisasi 2026',
      tema: 'Rekonstruksi Kepemimpinan Progresif Menuju Kemandirian Organisasi Berkelanjutan',
      tempat: 'Aula Utama Graha Pemuda Jawa Barat',
      tanggalMulai: new Date('2026-10-24'),
      tanggalSelesai: new Date('2026-10-26'),
      presidium1: 'Ahmad Fauzi Pratama',
      presidium2: 'Budi Santoso',
      presidium3: 'Citra Dewi Lestari',
      status: SidangStatus.BERLANGSUNG,
      totalKuorum: 45,
      kuorumTercapai: true,
      risalah: {
        create: [
          {
            agenda: 'Sidang Pleno I: Pembahasan dan Pengesahan Tata Tertib MUBES XXIV',
            waktuMulai: new Date('2026-10-24T09:00:00Z'),
            waktuSelesai: new Date('2026-10-24T12:00:00Z'),
            isiRisalah: 'Palu sidang dibuka oleh Presidium Sementara. Forum membahas pasal demi pasal tata tertib persidangan.',
            interupsiDanDinamika: 'Terdapat interupsi dari delegasi Cabang Bandung mengenai syarat kuorum pengambilan keputusan yang disepakati 50%+1.',
            notulisNama: 'Siti Nurhaliza',
          },
          {
            agenda: 'Sidang Pleno II: Laporan Pertanggungjawaban (LPJ) Pengurus Periode 2025-2026',
            waktuMulai: new Date('2026-10-24T13:30:00Z'),
            waktuSelesai: new Date('2026-10-24T17:00:00Z'),
            isiRisalah: 'Ketua Umum membacakan laporan realisasi proker dan kondisi keuangan. Forum memberikan pandangan umum.',
            interupsiDanDinamika: 'Seluruh peserta menerima laporan pertanggungjawaban dengan status Diterima Tanpa Catatan.',
            notulisNama: 'Siti Nurhaliza',
          },
        ],
      },
      ketetapanSK: {
        create: [
          {
            nomorTap: 'TAP. 01/MUBES-XXIV/2026',
            tentang: 'Tata Tertib Persidangan Musyawarah Besar XXIV',
            konsideranMenimbang: 'Bahwa demi tertib dan kelancaran musyawarah, dipandang perlu menetapkan tata tertib.',
            konsideranMengingat: 'Anggaran Dasar Pasal 12 dan Anggaran Rumah Tangga Pasal 24.',
            konsideranMemperhatikan: 'Usulan, saran, serta hasil permusyawaratan dalam Sidang Pleno I.',
            diktumMemutuskan: 'Menetapkan Tata Tertib Musyawarah Besar XXIV sebagai pedoman resmi persidangan.',
            diktumMenetapkan: 'Ketetapan ini berlaku sejak tanggal ditetapkan hingga selesainya MUBES XXIV.',
            tanggalDitetapkan: new Date('2026-10-24'),
            tempatDitetapkan: 'Bandung',
            isDisahkan: true,
          },
        ],
      },
    },
  })

  // =========================================================================
  // 18. OPEN RECRUITMENT (OPREC) TERPADU
  // =========================================================================
  console.log('[SEED] 18/20 Menyiapkan Open Recruitment (Oprec)...')
  const oprec1 = await prisma.oprecEvent.upsert({
    where: { slug: 'oprec-pengurus-baru-2026' },
    update: {},
    create: {
      slug: 'oprec-pengurus-baru-2026',
      judul: 'Open Recruitment Pengurus Harian Periode 2026-2027',
      deskripsi: 'Peluang bergabung menjadi bagian dari kabinet pengurus baru untuk bersama mengabdi dan bertumbuh.',
      tipeOprec: OprecTipe.PENGURUS_BARU,
      tanggalBuka: new Date('2026-10-01'),
      tanggalTutup: new Date('2026-11-15'),
      isOpen: true,
      kuota: 35,
      persyaratan: '1. Anggota aktif yang telah lulus LDKO/LK 1.\n2. Berkomitmen aktif selama 1 periode kepengurusan.\n3. Mengunggah CV dan visi kontribusi.',
      divisiPilihan: JSON.stringify(['Divisi Internal', 'Divisi Eksternal', 'Divisi Kaderisasi & PSDM', 'Divisi Medkom', 'Divisi Logistik']),
      isPengumumanBuka: false,
      pendaftar: {
        create: [
          {
            nomorRegistrasi: 'REG-2026-0042',
            namaLengkap: 'Farhan Maulana',
            nimOrNra: '220512055',
            email: 'farhan.maulana@student.ac.id',
            phone: '081345678910',
            fakultasProdi: 'Ilmu Komputer',
            angkatan: 2022,
            divisiPilihan1: 'Divisi Medkom',
            divisiPilihan2: 'Divisi Internal',
            alasanMemilih: 'Ingin mengoptimalkan kemampuan desain grafis dan strategi konten media sosial organisasi.',
            statusTahap: OprecTahap.WAWANCARA,
            nilaiWawancara: 88,
            catatanInterviewer: 'Portofolio desain sangat baik dan memahami tren visual masa kini.',
          },
          {
            nomorRegistrasi: 'REG-2026-0043',
            namaLengkap: 'Nadia Safitri',
            nimOrNra: '230512088',
            email: 'nadia.safitri@student.ac.id',
            phone: '081345678911',
            fakultasProdi: 'Hubungan Internasional',
            angkatan: 2023,
            divisiPilihan1: 'Divisi Eksternal',
            divisiPilihan2: 'Divisi Kaderisasi & PSDM',
            alasanMemilih: 'Memperluas jejaring kemitraan dan tertarik dalam pengelolaan kerjasama lembaga.',
            statusTahap: OprecTahap.BERKAS_LOLOS,
          },
        ],
      },
    },
  })

  // =========================================================================
  // 19. STUDIO E-SERTIFIKAT AUTOCRAT & VERIFIKASI QR
  // =========================================================================
  console.log('[SEED] 19/20 Menyiapkan Template & Arsip E-Sertifikat...')
  const sampleCanvasConfig = JSON.stringify({
    nama: { x: 960, y: 520, fontSize: 54, color: '#0f172a', align: 'center', isBold: true },
    sebagai: { x: 960, y: 620, fontSize: 30, color: '#334155', align: 'center', isBold: false },
    nomor: { x: 960, y: 350, fontSize: 20, color: '#64748b', align: 'center', isBold: true },
    tanggal: { x: 1440, y: 880, fontSize: 18, color: '#334155', align: 'center', isBold: false },
    qr: { x: 220, y: 840, size: 120, show: true },
  })

  const templateSertifikat = await prisma.sertifikatTemplate.upsert({
    where: { id: 'template-lk1-2026' },
    update: {},
    create: {
      id: 'template-lk1-2026',
      namaTemplate: 'Sertifikat Kelulusan Latihan Kader 1 (LK1)',
      kategori: SertifikatKategori.PESERTA,
      imageUrl: '/themes/default/preview.jpg',
      lebarCanvas: 1920,
      tinggiCanvas: 1080,
      configJson: sampleCanvasConfig,
      prefixNomor: 'SERT/[NO]/LK1/HUBB/2026',
      sertifikatList: {
        create: [
          {
            nomorSertifikat: 'SERT/001/LK1/HUBB/2026',
            namaPenerima: 'Eka Rahmawati',
            sebagai: 'Peserta Terbaik',
            keterangan: 'Lulus dengan predikat Sangat Memuaskan pada Latihan Kader Dasar XXIV.',
            issuedAt: new Date('2026-08-14'),
          },
          {
            nomorSertifikat: 'SERT/002/LK1/HUBB/2026',
            namaPenerima: 'Farhan Maulana',
            sebagai: 'Peserta',
            keterangan: 'Telah menyelesaikan seluruh modul Latihan Kader Dasar XXIV.',
            issuedAt: new Date('2026-08-14'),
          },
        ],
      },
    },
  })

  // =========================================================================
  // 20. CMS WEBSITE: BERITA, KATEGORI, FAQ & PENGATURAN
  // =========================================================================
  console.log('[SEED] 20/20 Menyiapkan Konten CMS Website & Publikasi...')
  const catKegiatan = await prisma.category.upsert({
    where: { slug: 'kegiatan-organisasi' },
    update: {},
    create: {
      name: 'Kegiatan Organisasi',
      slug: 'kegiatan-organisasi',
      description: 'Liputan program kerja dan dinamika acara internal maupun eksternal.',
      color: '#10b981',
      icon: 'Calendar',
    },
  })

  const catPrestasi = await prisma.category.upsert({
    where: { slug: 'prestasi-kader' },
    update: {},
    create: {
      name: 'Prestasi Kader',
      slug: 'prestasi-kader',
      description: 'Kabar capaian membanggakan kader di tingkat regional maupun internasional.',
      color: '#f59e0b',
      icon: 'Award',
    },
  })

  await prisma.post.upsert({
    where: { slug: 'seminar-nasional-digitalisasi-organisasi-sukses-digelar' },
    update: {},
    create: {
      slug: 'seminar-nasional-digitalisasi-organisasi-sukses-digelar',
      title: 'Seminar Nasional Digitalisasi Organisasi & AI Sukses Digelar Ratusan Mahasiswa',
      excerpt: 'Ratusan peserta dari 12 perguruan tinggi hadir mendiskusikan percepatan transformasi digital organisasi pemuda.',
      content: '<p>Bandung — HubbHQ sukses menyelenggarakan Seminar Nasional bertajuk "Digitalisasi Organisasi & AI" di Auditorium Graha Widya Tama. Acara ini menghadirkan praktisi teknologi dan pakar kepemimpinan muda...</p>',
      category: 'Kegiatan Organisasi',
      tags: 'Seminar, Digitalisasi, AI, Organisasi',
      status: PostStatus.PUBLISHED,
      publishedAt: new Date('2026-09-16'),
      authorId: users['dimas@siop.local'].id,
      authorName: 'Dimas Aditya',
      isFeatured: true,
    },
  })

  await prisma.faq.createMany({
    data: [
      {
        question: 'Bagaimana cara bergabung menjadi anggota HubbHQ?',
        answer: 'Pendaftaran anggota baru dibuka secara berkala melalui menu Open Recruitment (Oprec) di website resmi ini. Calon pengurus dapat mengisi formulir online dan melampirkan berkas yang dipersyaratkan.',
        category: 'Keanggotaan',
        order: 1,
        isPublished: true,
      },
      {
        question: 'Bagaimana cara memverifikasi keaslian surat dan sertifikat digital?',
        answer: 'Setiap surat dinas dan sertifikat yang diterbitkan HubbHQ memiliki QR Code terenkripsi. Anda cukup memindai QR Code tersebut untuk membuka portal verifikasi publik resmi.',
        category: 'Layanan Digital',
        order: 2,
        isPublished: true,
      },
      {
        question: 'Apakah alumni dapat berkontribusi dalam program beasiswa?',
        answer: 'Ya, melalui kanal Jejaring Alumni & Dana Abadi, para alumni dapat berpartisipasi menyalurkan donasi untuk beasiswa kader dan renovasi sarana sekretariat.',
        category: 'Alumni',
        order: 3,
        isPublished: true,
      },
    ],
    skipDuplicates: true,
  })

  // Website Config
  await prisma.websiteConfig.upsert({
    where: { key: 'appName' },
    update: { value: 'HubbHQ' },
    create: { key: 'appName', value: 'HubbHQ', category: 'general', description: 'Nama aplikasi resmi', isPublic: true },
  })

  await prisma.websiteConfig.upsert({
    where: { key: 'appDescription' },
    update: { value: 'Sistem Informasi Organisasi Terpadu & Terintegrasi' },
    create: { key: 'appDescription', value: 'Sistem Informasi Organisasi Terpadu & Terintegrasi', category: 'general', description: 'Deskripsi aplikasi', isPublic: true },
  })

  console.log('')
  console.log('=========================================================================')
  console.log('[SEED] SUKSES! Seluruh data dummy 20 modul HubbHQ berhasil disiapkan:')
  console.log('-------------------------------------------------------------------------')
  console.log('1.  Master Permissions & Roles (Admin, Ketum, Sekjen, Bendum, Anggota)')
  console.log('2.  Wilayah & Hierarki Jabatan Struktural')
  console.log('3.  Divisi Organisasi & Keanggotaan Divisi')
  console.log('4.  Akun Pengurus & Anggota Lengkap dengan Data KTA Digital')
  console.log('5.  Program Kerja, Checkpoint Kemajuan, Proposal Dana, & Buku LPJ')
  console.log('6.  Presensi QR Code Dinamis & Notula Rapat Pleno')
  console.log('7.  Inventaris Aset, Logistik Sekretariat & Form Peminjaman Barang')
  console.log('8.  Keuangan Organisasi, Mutasi Kas & Iuran Kas Anggota (QRIS/Manual)')
  console.log('9.  Surat Keluar, Surat Masuk, & Disposisi Surat')
  console.log('10. Kalender Agenda & Acara Organisasi')
  console.log('11. Perpustakaan Digital (Library) & Berkas Hukum AD/ART')
  console.log('12. E-Voting Musyawarah / MUBES (Kandidat, DPT, & Bilik Suara)')
  console.log('13. Portal Kotak Aspirasi Publik & Meja Advokasi')
  console.log('14. Perkaderan & Jenjang Diklat (LK 1, LK 2, Evaluasi & STTPP)')
  console.log('15. Jejaring Alumni & Filantropi Dana Abadi')
  console.log('16. Persidangan Pleno, Risalah Musyawarah & Konsideran TAP MUBES')
  console.log('17. Open Recruitment (Oprec) Pengurus Baru & Kepanitiaan')
  console.log('18. Studio E-Sertifikat Autocrat & Verifikasi QR Code')
  console.log('19. CMS Berita, Kategori, & Frequently Asked Questions (FAQ)')
  console.log('20. Konfigurasi Website Publik & Tema Aktif')
  console.log('-------------------------------------------------------------------------')
  console.log('Kredensial Login Utama:')
  console.log('   Super Admin : admin@siop.local | Password: admin123')
  console.log('   Ketua Umum  : ketum@siop.local | Password: password123')
  console.log('   Sekjen      : sekjen@siop.local | Password: password123')
  console.log('   Bendum      : bendum@siop.local | Password: password123')
  console.log('   Anggota     : budi@siop.local   | Password: password123')
  console.log('=========================================================================')
}

main()
  .catch((e) => {
    console.error('[SEED] Terjadi kesalahan:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
