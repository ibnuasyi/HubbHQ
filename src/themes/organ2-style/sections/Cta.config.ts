// CTA Section Configuration for Organ2 Style
export const ctaConfig = {
  variants: {
    default: {
      name: 'CTA - Default',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true, placeholder: 'Bergabung dengan Kami' },
        { key: 'subtitle', type: 'text', label: 'Subtitle', placeholder: 'Jadilah bagian dari kami' },
        { key: 'description', type: 'textarea', label: 'Deskripsi' },
        { key: 'primaryCtaText', type: 'text', label: 'Teks Tombol Utama', placeholder: 'Daftar Sekarang' },
        { key: 'primaryCtaLink', type: 'url', label: 'Link Tombol Utama' },
        { key: 'secondaryCtaText', type: 'text', label: 'Teks Tombol Secondary', placeholder: 'Hubungi Kami' },
        { key: 'secondaryCtaLink', type: 'url', label: 'Link Tombol Secondary' },
        { key: 'backgroundColor', type: 'text', label: 'Warna Background', default: '#16a34a' },
        { key: 'showPattern', type: 'boolean', label: 'Tampilkan Pattern', default: true },
        { key: 'showTrustBadge', type: 'boolean', label: 'Tampilkan Badge Kepercayaan', default: true }
      ]
    },
    centered: {
      name: 'CTA - Centered',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'subtitle', type: 'text', label: 'Subtitle' },
        { key: 'description', type: 'textarea', label: 'Deskripsi' },
        { key: 'ctaText', type: 'text', label: 'Teks Tombol' },
        { key: 'ctaLink', type: 'url', label: 'Link Tombol' }
      ]
    },
    split: {
      name: 'CTA - Split',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'description', type: 'textarea', label: 'Deskripsi' },
        { key: 'image', type: 'image', label: 'Gambar' },
        { key: 'primaryCtaText', type: 'text', label: 'Teks Tombol Utama' },
        { key: 'primaryCtaLink', type: 'url', label: 'Link Tombol Utama' }
      ]
    },
    banner: {
      name: 'CTA - Banner',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'subtitle', type: 'text', label: 'Subtitle' },
        { key: 'ctaText', type: 'text', label: 'Teks Tombol' },
        { key: 'ctaLink', type: 'url', label: 'Link Tombol' },
        { key: 'backgroundImage', type: 'image', label: 'Gambar Background' }
      ]
    }
  },
  defaultVariant: 'default'
}

export type CtaConfig = typeof ctaConfig
