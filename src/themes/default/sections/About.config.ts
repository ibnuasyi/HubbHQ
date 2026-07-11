// About Section Configuration
export const aboutConfig = {
  variants: {
    default: {
      name: 'Default About',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true, placeholder: 'Tentang Kami' },
        { key: 'subtitle', type: 'text', label: 'Subtitle', placeholder: 'Subtitle section' },
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
      name: 'Centered About',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'subtitle', type: 'text', label: 'Subtitle' },
        { key: 'content', type: 'richtext', label: 'Konten' },
        { key: 'image', type: 'image', label: 'Gambar' }
      ]
    },
    cards: {
      name: 'About Cards',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'subtitle', type: 'text', label: 'Subtitle' },
        { key: 'features', type: 'array', label: 'Fitur', fields: [
          { key: 'icon', type: 'text', label: 'Icon (Lucide)' },
          { key: 'title', type: 'text', label: 'Judul' },
          { key: 'description', type: 'textarea', label: 'Deskripsi' }
        ]}
      ]
    }
  },
  defaultVariant: 'default'
}

export type AboutConfig = typeof aboutConfig
