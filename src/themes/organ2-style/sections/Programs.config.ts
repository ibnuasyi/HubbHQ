// Programs Section Configuration for Organ2 Style
export const programsConfig = {
  variants: {
    default: {
      name: 'Programs - Grid',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true, placeholder: 'Program Kerja' },
        { key: 'subtitle', type: 'text', label: 'Subtitle', placeholder: 'Program kerja kami' },
        { key: 'description', type: 'textarea', label: 'Deskripsi' },
        { key: 'programs', type: 'array', label: 'Program', fields: [
          { key: 'title', type: 'text', label: 'Judul Program', required: true },
          { key: 'description', type: 'textarea', label: 'Deskripsi' },
          { key: 'icon', type: 'text', label: 'Icon (Emoji)' },
          { key: 'color', type: 'text', label: 'Warna Accent' },
          { key: 'link', type: 'url', label: 'Link Detail' }
        ]},
        { key: 'columns', type: 'select', label: 'Jumlah Kolom', options: ['2', '3', '4'], default: '3' }
      ]
    },
    cards: {
      name: 'Programs - Cards',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'subtitle', type: 'text', label: 'Subtitle' },
        { key: 'programs', type: 'array', label: 'Program', fields: [
          { key: 'title', type: 'text', label: 'Judul' },
          { key: 'description', type: 'textarea', label: 'Deskripsi' },
          { key: 'image', type: 'image', label: 'Gambar' },
          { key: 'link', type: 'url', label: 'Link' }
        ]}
      ]
    },
    tabs: {
      name: 'Programs - Tabs',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'categories', type: 'array', label: 'Kategori', fields: [
          { key: 'name', type: 'text', label: 'Nama Kategori' },
          { key: 'icon', type: 'text', label: 'Icon (Emoji)' },
          { key: 'programs', type: 'array', label: 'Program', fields: [
            { key: 'title', type: 'text', label: 'Judul' },
            { key: 'description', type: 'textarea', label: 'Deskripsi' }
          ]}
        ]}
      ]
    },
    timeline: {
      name: 'Programs - Timeline',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'programs', type: 'array', label: 'Program', fields: [
          { key: 'title', type: 'text', label: 'Judul' },
          { key: 'description', type: 'textarea', label: 'Deskripsi' },
          { key: 'date', type: 'text', label: 'Tanggal/Jadwal' },
          { key: 'status', type: 'select', label: 'Status', options: ['upcoming', 'ongoing', 'completed'], default: 'ongoing' }
        ]}
      ]
    }
  },
  defaultVariant: 'default'
}

export type ProgramsConfig = typeof programsConfig
