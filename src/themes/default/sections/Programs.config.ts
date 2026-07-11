// Programs Section Configuration
export const programsConfig = {
  variants: {
    default: {
      name: 'Default Programs',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true, placeholder: 'Program Kerja' },
        { key: 'subtitle', type: 'text', label: 'Subtitle', placeholder: 'Program kerja kami' },
        { key: 'programs', type: 'array', label: 'Program', fields: [
          { key: 'title', type: 'text', label: 'Judul Program', required: true },
          { key: 'description', type: 'textarea', label: 'Deskripsi' },
          { key: 'icon', type: 'text', label: 'Icon (Lucide)' },
          { key: 'color', type: 'text', label: 'Warna Accent' }
        ]},
        { key: 'columns', type: 'select', label: 'Jumlah Kolom', options: ['2', '3', '4'], default: '3' }
      ]
    },
    cards: {
      name: 'Programs Cards',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'programs', type: 'array', label: 'Program', fields: [
          { key: 'title', type: 'text', label: 'Judul' },
          { key: 'description', type: 'textarea', label: 'Deskripsi' },
          { key: 'image', type: 'image', label: 'Gambar' },
          { key: 'link', type: 'url', label: 'Link' }
        ]}
      ]
    },
    tabs: {
      name: 'Programs Tabs',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'categories', type: 'array', label: 'Kategori', fields: [
          { key: 'name', type: 'text', label: 'Nama Kategori' },
          { key: 'programs', type: 'array', label: 'Program', fields: [
            { key: 'title', type: 'text', label: 'Judul' },
            { key: 'description', type: 'textarea', label: 'Deskripsi' }
          ]}
        ]}
      ]
    }
  },
  defaultVariant: 'default'
}

export type ProgramsConfig = typeof programsConfig
