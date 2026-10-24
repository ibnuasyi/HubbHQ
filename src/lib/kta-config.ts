import { prisma } from '@/lib/db'

export interface KtaConfig {
  namaOrganisasi: string
  subNamaOrganisasi: string
  logoUrl: string
  namaKetuaUmum: string
  jabatanPenandatangan: string
  tandaTanganUrl: string | null
  stempelUrl: string | null
  formatNra: string
  tema: 'royal-navy' | 'emerald-prestige' | 'crimson-noble' | 'obsidian-dark'
  masaBerlakuTahun: number
  alamatSekretariat: string
  kontakOrganisasi: string
}

export const DEFAULT_KTA_CONFIG: KtaConfig = {
  namaOrganisasi: 'ORGANISASI INDONESIA',
  subNamaOrganisasi: 'PENGURUS BESAR / CABANG UTAMA',
  logoUrl: '',
  namaKetuaUmum: 'Ketua Umum BPH',
  jabatanPenandatangan: 'Ketua Umum',
  tandaTanganUrl: null,
  stempelUrl: null,
  formatNra: 'NRA-{YYYY}-{NO}',
  tema: 'royal-navy',
  masaBerlakuTahun: 2,
  alamatSekretariat: 'Sekretariat Utama HubbHQ',
  kontakOrganisasi: 'sekretariat@hubbhq.org',
}

/**
 * Mengambil konfigurasi KTA Organisasi dari database WebsiteConfig
 */
export async function getKtaConfig(): Promise<KtaConfig> {
  try {
    const config = await prisma.websiteConfig.findUnique({
      where: { key: 'kta_card_config' },
    })

    if (config?.value && typeof config.value === 'object') {
      return { ...DEFAULT_KTA_CONFIG, ...(config.value as any) }
    }
  } catch (err) {
    console.error('Error reading KTA config:', err)
  }

  return DEFAULT_KTA_CONFIG
}

/**
 * Menyimpan konfigurasi KTA Organisasi ke database WebsiteConfig
 */
export async function saveKtaConfig(config: Partial<KtaConfig>): Promise<KtaConfig> {
  const current = await getKtaConfig()
  const updated: KtaConfig = { ...current, ...config }

  await prisma.websiteConfig.upsert({
    where: { key: 'kta_card_config' },
    create: {
      key: 'kta_card_config',
      value: updated as any,
      description: 'Konfigurasi desain & format Kartu Tanda Anggota (KTA) Digital',
      category: 'appearance',
      isPublic: true,
    },
    update: {
      value: updated as any,
    },
  })

  return updated
}

/**
 * Menghasilkan Nomor Registrasi Anggota (NRA) otomatis berikutnya
 */
export async function generateNextNra(
  customPattern?: string,
  divisiCode?: string
): Promise<string> {
  const currentYear = new Date().getFullYear().toString()
  const config = await getKtaConfig()
  const pattern = customPattern || config.formatNra || 'NRA-{YYYY}-{NO}'

  // Hitung jumlah anggota yang sudah memiliki NRA di tahun ini
  const totalWithNra = await prisma.user.count({
    where: {
      nra: { not: null },
    },
  })

  const nextNumber = (totalWithNra + 1).toString().padStart(4, '0')
  const finalDivisi = (divisiCode || 'GEN').toUpperCase().substring(0, 4)

  return pattern
    .replace('{YYYY}', currentYear)
    .replace('{YEAR}', currentYear)
    .replace('{DIVISI}', finalDivisi)
    .replace('{DIV}', finalDivisi)
    .replace('{NO}', nextNumber)
}

