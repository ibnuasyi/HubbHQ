// Hero Section Configuration for Organ2 Style
export const heroConfig = {
  variants: {
    default: {
      name: 'Hero - Full Width',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true, placeholder: 'Selamat Datang di HubbHQ' },
        { key: 'subtitle', type: 'text', label: 'Subtitle', placeholder: 'Konfederasi Pergerakan' },
        { key: 'description', type: 'textarea', label: 'Deskripsi', placeholder: 'Deskripsi tentang organisasi...' },
        { key: 'backgroundImage', type: 'image', label: 'Gambar Background' },
        { key: 'backgroundOverlay', type: 'text', label: 'Overlay Opacity', placeholder: '0.5' },
        { key: 'ctaText', type: 'text', label: 'Teks Tombol CTA', placeholder: 'Pelajari Lebih Lanjut' },
        { key: 'ctaLink', type: 'url', label: 'Link Tombol CTA' },
        { key: 'ctaSecondaryText', type: 'text', label: 'Teks Tombol Secondary', placeholder: 'Hubungi Kami' },
        { key: 'ctaSecondaryLink', type: 'url', label: 'Link Tombol Secondary' },
        { key: 'showScrollIndicator', type: 'boolean', label: 'Tampilkan Scroll Indicator', default: true },
        { key: 'showTrustIndicators', type: 'boolean', label: 'Tampilkan Indikator Kepercayaan', default: true }
      ]
    },
    split: {
      name: 'Hero - Split (Gambar & Teks)',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true, placeholder: 'Selamat Datang di HubbHQ' },
        { key: 'subtitle', type: 'text', label: 'Subtitle', placeholder: 'Konfederasi Pergerakan' },
        { key: 'description', type: 'textarea', label: 'Deskripsi', placeholder: 'Deskripsi tentang organisasi...' },
        { key: 'image', type: 'image', label: 'Gambar' },
        { key: 'imagePosition', type: 'select', label: 'Posisi Gambar', options: ['left', 'right'], default: 'right' },
        { key: 'ctaText', type: 'text', label: 'Teks Tombol CTA', placeholder: 'Pelajari Lebih Lanjut' },
        { key: 'ctaLink', type: 'url', label: 'Link Tombol CTA' },
        { key: 'ctaSecondaryText', type: 'text', label: 'Teks Tombol Secondary', placeholder: 'Hubungi Kami' },
        { key: 'ctaSecondaryLink', type: 'url', label: 'Link Tombol Secondary' },
        { key: 'showTrustIndicators', type: 'boolean', label: 'Tampilkan Indikator Kepercayaan', default: true }
      ]
    },
    centered: {
      name: 'Hero - Centered',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true, placeholder: 'Selamat Datang di HubbHQ' },
        { key: 'subtitle', type: 'text', label: 'Subtitle', placeholder: 'Konfederasi Pergerakan' },
        { key: 'description', type: 'textarea', label: 'Deskripsi', placeholder: 'Deskripsi tentang organisasi...' },
        { key: 'backgroundImage', type: 'image', label: 'Gambar Background' },
        { key: 'ctaText', type: 'text', label: 'Teks Tombol CTA', placeholder: 'Pelajari Lebih Lanjut' },
        { key: 'ctaLink', type: 'url', label: 'Link Tombol CTA' },
        { key: 'ctaSecondaryText', type: 'text', label: 'Teks Tombol Secondary', placeholder: 'Hubungi Kami' },
        { key: 'ctaSecondaryLink', type: 'url', label: 'Link Tombol Secondary' },
        { key: 'showScrollIndicator', type: 'boolean', label: 'Tampilkan Scroll Indicator', default: true }
      ]
    }
  },
  defaultVariant: 'split'
}

export type HeroConfig = typeof heroConfig
