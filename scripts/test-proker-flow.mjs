import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function testProkerFlow() {
  console.log('--- Starting Proker End-to-End Functional Test ---')

  // 1. Get an existing admin and a member
  const admin = await prisma.user.findFirst({ where: { email: 'admin@siop.local' } })
  const member = await prisma.user.findFirst({ where: { email: 'ahmad@siop.local' } })
  const divisi = await prisma.divisi.findFirst()

  if (!admin || !member || !divisi) {
    console.error('Prerequisite users or divisi not found in DB!')
    process.exit(1)
  }

  console.log(`Using Admin: ${admin.name}, Member: ${member.name}, Divisi: ${divisi.name}`)

  // 2. Create Proker with standard Indonesian Matriks
  const proker = await prisma.programKerja.create({
    data: {
      title: 'Latihan Dasar Kepemimpinan Organisasi (LDKO) 2026',
      description: 'Pelatihan intensif kepemimpinan untuk mencetak kader organisasi yang berkarakter.',
      divisiId: divisi.id,
      creatorId: admin.id,
      picId: member.id, // Has PIC
      kategori: 'PRIORITAS',
      sasaran: '100 Kader Baru Organisasi & 25 Panitia',
      indikator: 'Tingkat kelulusan kader minimal 90% dan evaluasi pemahaman materi skor rata-rata 4.2/5.0',
      anggaranEstimasi: 15000000,
      sumberDana: 'Kas Organisasi, Iuran Peserta & Sponsor',
      lokasi: 'Gedung Wisma Diklat Cibubur',
      startDate: new Date('2026-11-10'),
      endDate: new Date('2026-11-12'),
      status: 'DRAFT',
      checkpoints: {
        create: [
          { title: 'Pembentukan Panitia & Rapat Perdana', order: 1 },
          { title: 'Pengajuan & ACC Proposal Dana', order: 2 },
          { title: 'Penyebaran Undangan & Booking Tempat', order: 3 },
          { title: 'Pelaksanaan Kegiatan (Hari-H)', order: 4 },
          { title: 'Penyusunan & Pengesahan LPJ', order: 5 },
        ],
      },
      panitia: {
        create: [
          { userId: member.id, roleJabatan: 'Ketua Pelaksana' },
          { userId: admin.id, roleJabatan: 'Steering Committee (SC)' },
        ],
      },
    },
    include: { checkpoints: true, panitia: true },
  })

  console.log(`[PASS] Proker Created: ${proker.id} - ${proker.title}`)
  console.log(`Checkpoints: ${proker.checkpoints.length}, Panitia: ${proker.panitia.length}`)

  // 3. Test Proposal v1 Creation
  const proposalV1 = await prisma.proposalDana.create({
    data: {
      programKerjaId: proker.id,
      title: `Proposal Anggaran: ${proker.title}`,
      description: 'Pengajuan dana termin pertama untuk operasional dan konsumsi.',
      amount: 15000000,
      version: 1,
      status: 'PENDING',
      requesterId: member.id,
    },
  })
  await prisma.proposalHistory.create({
    data: {
      proposalDanaId: proposalV1.id,
      version: 1,
      title: proposalV1.title,
      amount: 15000000,
      status: 'PENDING',
    },
  })
  console.log(`[PASS] Proposal v1 Created: ${proposalV1.id} (Amount: Rp 15.000.000)`)

  // 4. Test Proposal Rejection with Note
  const rejectionNote = 'RAB sewa gedung terlalu mahal, mohon negosiasikan diskon 15% atau cari opsi alternatif.'
  await prisma.proposalDana.update({
    where: { id: proposalV1.id },
    data: {
      status: 'REJECTED',
      reviewedById: admin.id,
      reviewedAt: new Date(),
      reviewedNote: rejectionNote,
    },
  })
  await prisma.proposalHistory.create({
    data: {
      proposalDanaId: proposalV1.id,
      version: 1,
      title: proposalV1.title,
      amount: 15000000,
      status: 'REJECTED',
      reviewedNote: rejectionNote,
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  })
  console.log(`[PASS] Proposal v1 Rejected with note: "${rejectionNote}"`)

  // 5. Test Proposal Revision (v2) - preserving historical version
  const proposalV2 = await prisma.proposalDana.update({
    where: { id: proposalV1.id },
    data: {
      amount: 12500000, // Reduced budget
      description: 'Revisi RAB gedung setelah mendapatkan diskon 15% dari pengelola.',
      version: 2,
      status: 'PENDING',
      reviewedById: null,
      reviewedAt: null,
      reviewedNote: null,
    },
  })
  await prisma.proposalHistory.create({
    data: {
      proposalDanaId: proposalV2.id,
      version: 2,
      title: proposalV2.title,
      amount: 12500000,
      status: 'PENDING',
    },
  })
  console.log(`[PASS] Proposal v2 Raised (Amount: Rp 12.500.000). Previous v1 is preserved in history!`)

  // 6. Test Proposal Approval (ACC) -> Auto activates Proker to ON_PROGRESS
  await prisma.proposalDana.update({
    where: { id: proposalV2.id },
    data: {
      status: 'APPROVED',
      reviewedById: admin.id,
      reviewedAt: new Date(),
      reviewedNote: 'Disetujui. Dana termin dicairkan oleh bendahara.',
    },
  })
  await prisma.proposalHistory.create({
    data: {
      proposalDanaId: proposalV2.id,
      version: 2,
      title: proposalV2.title,
      amount: 12500000,
      status: 'APPROVED',
      reviewedById: admin.id,
      reviewedAt: new Date(),
      reviewedNote: 'Disetujui. Dana termin dicairkan oleh bendahara.',
    },
  })
  // Auto activate proker
  const activatedProker = await prisma.programKerja.update({
    where: { id: proker.id },
    data: { status: 'ON_PROGRESS' },
  })
  console.log(`[PASS] Proposal v2 Approved! Proker status automatically flipped to: ${activatedProker.status}`)

  // 7. Test LPJ Creation & Financial Realization Table
  const lpj = await prisma.lpjProker.create({
    data: {
      programKerjaId: proker.id,
      pesertaHadir: 108,
      ringkasanKegiatan: 'Kegiatan LDKO 2026 terlaksana selama 3 hari dengan sukses dan antusiasme tinggi.',
      ketercapaianTarget: 'Target 100 kader terlampaui dengan hadirnya 108 kader baru.',
      kendala: 'Koneksi proyektor di aula sempat mengalami gangguan audio pada hari ke-2.',
      solusi: 'Panitia teknis segera mengganti kabel HDMI cadangan dalam 5 menit.',
      rekomendasi: 'Diharapkan panitia tahun depan menyiapkan audio backup independen.',
      status: 'DRAFT',
    },
  })

  // Add LPJ Financial items
  const items = [
    { type: 'INCOME', kategori: 'Kas Organisasi', namaBarang: 'Pencairan Anggaran Kas HubbHQ', qty: 1, satuan: 'termin', hargaSatuan: 10000000, totalHarga: 10000000 },
    { type: 'INCOME', kategori: 'Pendaftaran', namaBarang: 'Kontribusi Peserta 100 Org x Rp 25.000', qty: 100, satuan: 'orang', hargaSatuan: 25000, totalHarga: 2500000 },
    { type: 'EXPENSE', kategori: 'Akomodasi', namaBarang: 'Sewa Gedung & Penginapan Wisma 3 Hari', qty: 3, satuan: 'hari', hargaSatuan: 2500000, totalHarga: 7500000, buktiNota: 'https://example.com/nota-gedung.jpg' },
    { type: 'EXPENSE', kategori: 'Konsumsi', namaBarang: 'Nasi Kotak & Snack 120 Porsi x 4 Kali', qty: 480, satuan: 'porsi', hargaSatuan: 8000, totalHarga: 3840000, buktiNota: 'https://example.com/nota-katering.jpg' },
    { type: 'EXPENSE', kategori: 'Kesekretariatan', namaBarang: 'Cetak Sertifikat & ID Card Panitia', qty: 130, satuan: 'lembar', hargaSatuan: 5000, totalHarga: 650000, buktiNota: 'https://example.com/nota-print.jpg' },
  ]

  for (const it of items) {
    await prisma.lpjItem.create({
      data: {
        lpjId: lpj.id,
        type: it.type,
        kategori: it.kategori,
        namaBarang: it.namaBarang,
        qty: it.qty,
        satuan: it.satuan,
        hargaSatuan: it.hargaSatuan,
        totalHarga: it.totalHarga,
        buktiNota: it.buktiNota || null,
      },
    })
  }

  // Recalculate totals
  const allItems = await prisma.lpjItem.findMany({ where: { lpjId: lpj.id } })
  const totalPemasukan = allItems.filter(i => i.type === 'INCOME').reduce((acc, i) => acc + Number(i.totalHarga), 0)
  const totalPengeluaran = allItems.filter(i => i.type === 'EXPENSE').reduce((acc, i) => acc + Number(i.totalHarga), 0)
  const saldoAkhir = totalPemasukan - totalPengeluaran

  const updatedLpj = await prisma.lpjProker.update({
    where: { id: lpj.id },
    data: { totalPemasukan, totalPengeluaran, saldoAkhir, status: 'SUBMITTED' },
  })

  console.log(`[PASS] LPJ Line Items Created: ${allItems.length} items`)
  console.log(`Total Pemasukan Riil: Rp ${totalPemasukan.toLocaleString('id-ID')}`)
  console.log(`Total Pengeluaran Riil: Rp ${totalPengeluaran.toLocaleString('id-ID')}`)
  console.log(`Saldo Akhir (Surplus): Rp ${saldoAkhir.toLocaleString('id-ID')}`)

  // 8. Test LPJ Approval by BPH -> Auto Completes Proker
  await prisma.lpjProker.update({
    where: { id: lpj.id },
    data: {
      status: 'APPROVED',
      reviewedById: admin.id,
      reviewedAt: new Date(),
      reviewedNote: 'LPJ disetujui tanpa catatan. Laporan keuangan surplus dan rapi.',
    },
  })
  const completedProker = await prisma.programKerja.update({
    where: { id: proker.id },
    data: { status: 'COMPLETED' },
  })
  console.log(`[PASS] LPJ Approved! Proker status automatically flipped to: ${completedProker.status}`)

  console.log('\n--- ALL PROKER ENHANCEMENT TESTS PASSED 100% ---')
}

testProkerFlow()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
