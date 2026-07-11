// About Section Configuration for KPRI Style
export const aboutConfig = {
  variants: {
    default: {
      name: 'KPRI About - Default',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true, placeholder: 'Tentang Kami' },
        { key: 'subtitle', type: 'text', label: 'Subtitle', placeholder: 'Siapa Kami' },
        { key: 'content', type: 'richtext', label: 'Konten' },
        { key: 'image', type: 'image', label: 'Gambar' },
        { key: 'imagePosition', type: 'select', label: 'Posisi Gambar', options: ['left', 'right'], default: 'left' },
        { key: 'showStats', type: 'boolean', label: 'Tampilkan Statistik', default: false },
        { key: 'stats', type: 'array', label: 'Statistik', fields: [
          { key: 'value', type: 'text', label: 'Nilai' },
          { key: 'label', type: 'text', label: 'Label' }
        ]}
      ]
    },
    centered: {
      name: 'KPRI About - Centered',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true, placeholder: 'Tentang Kami' },
        { key: 'subtitle', type: 'text', label: 'Subtitle', placeholder: 'Siapa Kami' },
        { key: 'content', type: 'richtext', label: 'Konten' },
        { key: 'image', type: 'image', label: 'Gambar' }
      ]
    },
    cards: {
      name: 'KPRI About - Cards Grid',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true, placeholder: 'Tentang Kami' },
        { key: 'subtitle', type: 'text', label: 'Subtitle', placeholder: 'Siapa Kami' },
        { key: 'description', type: 'textarea', label: 'Deskripsi', placeholder: 'Deskripsi singkat...' },
        { key: 'features', type: 'array', label: 'Fitur/Keunggulan', fields: [
          { key: 'icon', type: 'text', label: 'Icon (Emoji)' },
          { key: 'title', type: 'text', label: 'Judul' },
          { key: 'description', type: 'textarea', label: 'Deskripsi' },
          { key: 'link', type: 'url', label: 'Link (opsional)' }
        ]},
        { key: 'ctaText', type: 'text', label: 'Teks Tombol CTA', placeholder: 'Selengkapnya' },
        { key: 'ctaLink', type: 'url', label: 'Link CTA' }
      ]
    },
    split: {
      name: 'KPRI About - Split',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true, placeholder: 'Tentang Kami' },
        { key: 'subtitle', type: 'text', label: 'Subtitle', placeholder: 'Siapa Kami' },
        { key: 'content', type: 'richtext', label: 'Konten' },
        { key: 'image', type: 'image', label: 'Gambar' },
        { key: 'imagePosition', type: 'select', label: 'Posisi Gambar', options: ['left', 'right'], default: 'right' },
        { key: 'showStats', type: 'boolean', label: 'Tampilkan Statistik', default: true },
        { key: 'stats', type: 'array', label: 'Statistik', fields: [
          { key: 'value', type: 'text', label: 'Nilai' },
          { key: 'label', type: 'text', label: 'Label' }
        ]},
        { key: 'ctaText', type: 'text', label: 'Teks Tombol CTA', placeholder: 'Selengkapnya' },
        { key: 'ctaLink', type: 'url', label: 'Link CTA' }
      ]
    }
  },
  defaultVariant: 'cards'
}

export type AboutConfig = typeof aboutConfig
