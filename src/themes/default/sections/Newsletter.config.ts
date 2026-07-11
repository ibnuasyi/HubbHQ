// Newsletter Section Configuration
export const newsletterConfig = {
  variants: {
    default: {
      name: 'Default Newsletter',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true, placeholder: 'Berlangganan Newsletter' },
        { key: 'subtitle', type: 'text', label: 'Subtitle', placeholder: 'Dapatkan update terbaru...' },
        { key: 'description', type: 'textarea', label: 'Deskripsi' },
        { key: 'buttonText', type: 'text', label: 'Teks Tombol', default: 'Berlangganan' },
        { key: 'placeholder', type: 'text', label: 'Placeholder Input', default: 'Masukkan email Anda' },
        { key: 'backgroundColor', type: 'text', label: 'Warna Background' }
      ]
    },
    minimal: {
      name: 'Minimal Newsletter',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'buttonText', type: 'text', label: 'Teks Tombol' }
      ]
    }
  },
  defaultVariant: 'default'
}

export type NewsletterConfig = typeof newsletterConfig
