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
    webhookSecret: (typeof process !== 'undefined' && process.env?.QRIS_WEBHOOK_SECRET) || '',
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

