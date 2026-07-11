// Stats Section Configuration
export const statsConfig = {
  variants: {
    default: {
      name: 'Default Stats',
      fields: [
        { key: 'title', type: 'text', label: 'Judul' },
        { key: 'stats', type: 'array', label: 'Statistik', required: true, fields: [
          { key: 'value', type: 'text', label: 'Nilai (e.g. 1000+)', required: true },
          { key: 'label', type: 'text', label: 'Label', required: true },
          { key: 'icon', type: 'text', label: 'Icon (emoji atau lucide)' },
          { key: 'color', type: 'text', label: 'Warna Accent' }
        ]},
        { key: 'columns', type: 'select', label: 'Jumlah Kolom', options: ['2', '3', '4', '6'], default: '4' },
        { key: 'animate', type: 'boolean', label: 'Animasi Counter', default: true }
      ]
    },
    cards: {
      name: 'Stats Cards',
      fields: [
        { key: 'title', type: 'text', label: 'Judul' },
        { key: 'stats', type: 'array', label: 'Statistik', fields: [
          { key: 'value', type: 'text', label: 'Nilai' },
          { key: 'label', type: 'text', label: 'Label' },
          { key: 'description', type: 'textarea', label: 'Deskripsi' }
        ]}
      ]
    }
  },
  defaultVariant: 'default'
}

export type StatsConfig = typeof statsConfig
