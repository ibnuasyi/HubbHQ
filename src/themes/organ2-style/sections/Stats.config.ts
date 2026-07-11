// Stats Section Configuration for KPRI Style
export const statsConfig = {
  variants: {
    default: {
      name: 'KPRI Stats - Gradient',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', placeholder: 'Kami Terus Berkembang' },
        { key: 'stats', type: 'array', label: 'Statistik', required: true, fields: [
          { key: 'value', type: 'text', label: 'Nilai (e.g. 1000+)', required: true },
          { key: 'label', type: 'text', label: 'Label', required: true },
          { key: 'icon', type: 'text', label: 'Icon (emoji)' },
          { key: 'color', type: 'text', label: 'Warna Accent' }
        ]},
        { key: 'columns', type: 'select', label: 'Jumlah Kolom', options: ['2', '3', '4', '6'], default: '4' },
        { key: 'animate', type: 'boolean', label: 'Animasi Counter', default: true }
      ]
    },
    cards: {
      name: 'KPRI Stats - Cards',
      fields: [
        { key: 'title', type: 'text', label: 'Judul' },
        { key: 'stats', type: 'array', label: 'Statistik', fields: [
          { key: 'value', type: 'text', label: 'Nilai' },
          { key: 'label', type: 'text', label: 'Label' },
          { key: 'description', type: 'textarea', label: 'Deskripsi' }
        ]},
        { key: 'columns', type: 'select', label: 'Jumlah Kolom', options: ['2', '3', '4'], default: '4' }
      ]
    },
    compact: {
      name: 'KPRI Stats - Compact',
      fields: [
        { key: 'stats', type: 'array', label: 'Statistik', required: true, fields: [
          { key: 'value', type: 'text', label: 'Nilai' },
          { key: 'label', type: 'text', label: 'Label' },
          { key: 'icon', type: 'text', label: 'Icon (emoji)' }
        ]},
        { key: 'columns', type: 'select', label: 'Jumlah Kolom', options: ['3', '4', '6'], default: '4' }
      ]
    }
  },
  defaultVariant: 'default'
}

export type StatsConfig = typeof statsConfig
