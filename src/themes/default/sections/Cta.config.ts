// Cta Section Configuration
export const ctaConfig = {
  variants: {
    default: {
      name: 'Default CTA',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true, placeholder: 'Bergabung dengan Kami' },
        { key: 'subtitle', type: 'textarea', label: 'Subtitle' },
        { key: 'description', type: 'textarea', label: 'Deskripsi' },
        { key: 'primaryCtaText', type: 'text', label: 'Teks Tombol Utama' },
        { key: 'primaryCtaLink', type: 'url', label: 'Link Tombol Utama' },
        { key: 'secondaryCtaText', type: 'text', label: 'Teks Tombol Secondary' },
        { key: 'secondaryCtaLink', type: 'url', label: 'Link Tombol Secondary' },
        { key: 'backgroundColor', type: 'text', label: 'Warna Background', default: '#6366f1' },
        { key: 'showPattern', type: 'boolean', label: 'Tampilkan Pattern', default: true }
      ]
    },
    centered: {
      name: 'Centered CTA',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'subtitle', type: 'text', label: 'Subtitle' },
        { key: 'ctaText', type: 'text', label: 'Teks Tombol' },
        { key: 'ctaLink', type: 'url', label: 'Link Tombol' }
      ]
    }
  },
  defaultVariant: 'default'
}

export type CtaConfig = typeof ctaConfig
