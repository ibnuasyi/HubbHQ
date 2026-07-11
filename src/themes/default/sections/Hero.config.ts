// Hero Section Configuration
export const heroConfig = {
  variants: {
    default: {
      name: 'Default Hero',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true, placeholder: 'Selamat Datang di Organisasi Kami' },
        { key: 'subtitle', type: 'textarea', label: 'Subtitle', placeholder: 'Deskripsi singkat tentang organisasi...' },
        { key: 'backgroundImage', type: 'image', label: 'Gambar Background' },
        { key: 'backgroundOverlay', type: 'text', label: 'Overlay Opacity', placeholder: '0.5' },
        { key: 'ctaText', type: 'text', label: 'Teks Tombol CTA', placeholder: 'Pelajari Lebih Lanjut' },
        { key: 'ctaLink', type: 'url', label: 'Link Tombol CTA' },
        { key: 'ctaSecondaryText', type: 'text', label: 'Teks Tombol Secondary', placeholder: 'Hubungi Kami' },
        { key: 'ctaSecondaryLink', type: 'url', label: 'Link Tombol Secondary' },
        { key: 'showScrollIndicator', type: 'boolean', label: 'Tampilkan Scroll Indicator', default: true },
        { key: 'textAlign', type: 'select', label: 'Align Text', options: ['left', 'center', 'right'], default: 'center' }
      ]
    },
    centered: {
      name: 'Centered Hero',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'subtitle', type: 'textarea', label: 'Subtitle' },
        { key: 'backgroundImage', type: 'image', label: 'Gambar Background' },
        { key: 'ctaText', type: 'text', label: 'Teks Tombol CTA' },
        { key: 'ctaLink', type: 'url', label: 'Link Tombol CTA' }
      ]
    },
    split: {
      name: 'Split Hero',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'subtitle', type: 'textarea', label: 'Subtitle' },
        { key: 'content', type: 'richtext', label: 'Konten' },
        { key: 'image', type: 'image', label: 'Gambar' },
        { key: 'imagePosition', type: 'select', label: 'Posisi Gambar', options: ['left', 'right'], default: 'right' },
        { key: 'ctaText', type: 'text', label: 'Teks Tombol CTA' },
        { key: 'ctaLink', type: 'url', label: 'Link Tombol CTA' }
      ]
    },
    video: {
      name: 'Video Hero',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'subtitle', type: 'textarea', label: 'Subtitle' },
        { key: 'videoUrl', type: 'url', label: 'Video URL (MP4)', required: true },
        { key: 'posterImage', type: 'image', label: 'Poster Image' },
        { key: 'ctaText', type: 'text', label: 'Teks Tombol CTA' },
        { key: 'ctaLink', type: 'url', label: 'Link Tombol CTA' }
      ]
    },
    particle: {
      name: 'Particle Hero',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'subtitle', type: 'textarea', label: 'Subtitle' },
        { key: 'particleColor', type: 'text', label: 'Warna Particle', default: '#6366f1' },
        { key: 'ctaText', type: 'text', label: 'Teks Tombol CTA' },
        { key: 'ctaLink', type: 'url', label: 'Link Tombol CTA' }
      ]
    }
  },
  defaultVariant: 'default'
}

export type HeroConfig = typeof heroConfig
