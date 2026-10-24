import { prisma } from '@/lib/db'
import crypto from 'crypto'

export interface QrisConfig {
  mode: 'GATEWAY' | 'MANDIRI' | 'DISABLED'

  // Opsi A: Payment Gateway Otomatis
  gateway: {
    provider: 'midtrans' | 'tripay' | 'xendit' | 'simulation'
    apiKey: string // Server Key
    clientKey: string
    merchantCode: string // Tripay Merchant Code
    isProduction: boolean
    webhookSecret: string
  }

  // Opsi B: QRIS Mandiri Organisasi & Rekening Bank
  mandiri: {
    staticQrisString: string // Raw payload EMVCo MPM e.g. 000201010211...
    qrisImageUrl: string // Gambar stiker QRIS resmi rekening bank organisasi
    merchantName: string // e.g. "BEM UNIVERSITAS" / "YAYASAN"
    bankName: string // e.g. "Bank Syariah Indonesia (BSI)", "BCA"
    accountNumber: string // No. Rekening
    accountHolder: string // Atas Nama
    useUniqueCode: boolean // Tambahkan 3 digit acak e.g. Rp 25.142
    instructions: string // Petunjuk pembayaran untuk anggota
  }
}

export const DEFAULT_QRIS_CONFIG: QrisConfig = {
  mode: 'MANDIRI',
  gateway: {
    provider: 'simulation',
    apiKey: '',
    clientKey: '',
    merchantCode: '',
    isProduction: false,
    webhookSecret: 'hubbhq-webhook-secret-key',
  },
  mandiri: {
    staticQrisString: '',
    qrisImageUrl: '',
    merchantName: 'BENDAHARA UMUM ORGANISASI',
    bankName: 'Bank Syariah Indonesia (BSI)',
    accountNumber: '7182930412',
    accountHolder: 'KAS BESAR PENGURUS',
    useUniqueCode: true,
    instructions:
      'Pindai QRIS di atas menggunakan aplikasi m-Banking (BSI, BCA, Mandiri, BRI) atau E-Wallet (GoPay, OVO, ShopeePay, Dana). Pastikan nominal transfer sesuai dengan total yang tercantum (termasuk kode unik) agar verifikasi berjalan cepat.',
  },
}

/**
 * Mengambil konfigurasi QRIS dari database WebsiteConfig
 */
export async function getQrisConfig(): Promise<QrisConfig> {
  try {
    const config = await prisma.websiteConfig.findUnique({
      where: { key: 'qris_payment_config' },
    })

    if (config?.value && typeof config.value === 'object') {
      const val = config.value as any
      return {
        mode: val.mode || DEFAULT_QRIS_CONFIG.mode,
        gateway: { ...DEFAULT_QRIS_CONFIG.gateway, ...(val.gateway || {}) },
        mandiri: { ...DEFAULT_QRIS_CONFIG.mandiri, ...(val.mandiri || {}) },
      }
    }
  } catch (err) {
    console.error('Error loading QRIS config:', err)
  }

  return DEFAULT_QRIS_CONFIG
}

/**
 * Menyimpan konfigurasi QRIS ke database WebsiteConfig
 */
export async function saveQrisConfig(
  config: Partial<QrisConfig>
): Promise<QrisConfig> {
  const current = await getQrisConfig()
  const updated: QrisConfig = {
    ...current,
    ...config,
    gateway: { ...current.gateway, ...(config.gateway || {}) },
    mandiri: { ...current.mandiri, ...(config.mandiri || {}) },
  }

  await prisma.websiteConfig.upsert({
    where: { key: 'qris_payment_config' },
    update: { value: updated as any },
    create: {
      key: 'qris_payment_config',
      value: updated as any,
    },
  })

  return updated
}

/**
 * CRC16-CCITT (0x1021) Checksum untuk format EMVCo QRIS Standar Bank Indonesia
 */
function calculateCrc16(data: string): string {
  let crc = 0xffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff
      } else {
        crc = (crc << 1) & 0xffff
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/**
 * Injeksi nominal tagihan ke dalam payload QRIS Statis EMVCo
 * Menghasilkan string QRIS Dinamis yang otomatis mengunci nominal saat dipindai
 */
export function injectQrisAmount(
  staticQris: string,
  amount: number
): string | null {
  try {
    const cleanQris = staticQris.trim()
    if (!cleanQris.startsWith('000201') || cleanQris.length < 30) {
      return null
    }

    // Buang tag CRC 63 lama di akhir
    const tag63Index = cleanQris.lastIndexOf('6304')
    const basePayload =
      tag63Index !== -1 ? cleanQris.substring(0, tag63Index) : cleanQris

    // 1. Ubah tag 01 (Point of Initiation Method) dari 11 (Static) menjadi 12 (Dynamic)
    let modified = basePayload.replace('010211', '010212')

    // 2. Siapkan tag 54 (Transaction Amount)
    const amountStr = Math.round(amount).toString()
    const amountTag = `54${amountStr.length.toString().padStart(2, '0')}${amountStr}`

    // Jika tag 54 sudah ada, ganti; jika belum, sisipkan sebelum tag 58 (Country Code)
    const tag58Index = modified.indexOf('5802ID')
    if (tag58Index !== -1) {
      modified =
        modified.substring(0, tag58Index) +
        amountTag +
        modified.substring(tag58Index)
    } else {
      modified += amountTag
    }

    // 3. Tambahkan tag 6304 dan hitung CRC16 baru
    const payloadForCrc = modified + '6304'
    const newChecksum = calculateCrc16(payloadForCrc)

    return payloadForCrc + newChecksum
  } catch (err) {
    console.error('Failed to inject QRIS dynamic amount:', err)
    return null
  }
}

/**
 * Penyelesaian / Rekonsiliasi Otomatis Pembayaran Kas
 * Mengubah status KasPayment menjadi APPROVED dan otomatis mencatat buku kas (Transaction)
 */
export async function settleKasPayment(
  paymentIdOrRef: string,
  actualAmount: number,
  notes?: string
) {
  const payment = await prisma.kasPayment.findFirst({
    where: {
      OR: [{ id: paymentIdOrRef }, { paymentRef: paymentIdOrRef }],
    },
    include: {
      user: true,
      transaction: true,
    },
  })

  if (!payment) {
    throw new Error('Data tagihan kas tidak ditemukan')
  }

  if (payment.status === 'APPROVED') {
    return { success: true, message: 'Tagihan sudah lunas sebelumnya', payment }
  }

  const requiredAmount = Number(payment.amount) || 0
  if (actualAmount < requiredAmount) {
    throw new Error(
      `Nominal pembayaran (${actualAmount}) kurang dari tagihan wajib (${requiredAmount})`
    )
  }

  const now = new Date()

  // Jalankan transaksi atomik
  const result = await prisma.$transaction(async (tx) => {
    // 1. Update status KasPayment menjadi APPROVED
    const updatedPayment = await tx.kasPayment.update({
      where: { id: payment.id },
      data: {
        status: 'APPROVED',
        paidAmount: actualAmount,
        paidAt: now,
        notes: notes || payment.notes,
      },
    })

    // 2. Buat entri Transaksi Pemasukan Buku Kas Organisasi jika belum ada
    let trx = payment.transaction
    if (!trx) {
      const monthNames = [
        'Januari',
        'Februari',
        'Maret',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Agustus',
        'September',
        'Oktober',
        'November',
        'Desember',
      ]
      const monthLabel = monthNames[payment.month - 1] || payment.month.toString()
      const userName = payment.user.fullName || payment.user.name || 'Anggota'

      trx = await tx.transaction.create({
        data: {
          type: 'INCOME',
          category: 'kas_anggota',
          amount: actualAmount,
          description: `Iuran Kas ${monthLabel} ${payment.year} - ${userName} (${payment.paymentMethod || 'QRIS'})`,
          date: now,
          kasPaymentId: payment.id,
        },
      })
    }

    return { updatedPayment, trx }
  })

  return {
    success: true,
    message: 'Pembayaran iuran kas berhasil diverifikasi dan masuk ke kas umum',
    data: result,
  }
}

