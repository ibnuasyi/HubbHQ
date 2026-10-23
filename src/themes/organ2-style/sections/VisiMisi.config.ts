// Visi Misi Section Configuration for Organ2 Style
export const visimisiConfig = {
  variants: {
    default: {
      name: 'Visi Misi - Default',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true, placeholder: 'Visi & Misi' },
        { key: 'vision', type: 'textarea', label: 'Visi', required: true, placeholder: 'Visi organisasi...' },
        { key: 'visionIcon', type: 'text', label: 'Icon Visi', placeholder: 'target' },
        { key: 'missionTitle', type: 'text', label: 'Judul Misi', placeholder: 'Misi Kami' },
        { key: 'missions', type: 'array', label: 'Misi', fields: [
          { key: 'number', type: 'text', label: 'Nomor' },
          { key: 'icon', type: 'text', label: 'Icon (Nama Icon)' },
          { key: 'text', type: 'textarea', label: 'Teks Misi' }
        ]},
        { key: 'showIcon', type: 'boolean', label: 'Tampilkan Icon', default: true }
      ]
    },
    cards: {
      name: 'Visi Misi - Cards',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'vision', type: 'textarea', label: 'Visi' },
        { key: 'visionIcon', type: 'text', label: 'Icon Visi', placeholder: 'target' },
        { key: 'missionTitle', type: 'text', label: 'Judul Misi', placeholder: 'Misi Kami' },
        { key: 'missions', type: 'array', label: 'Misi', fields: [
          { key: 'number', type: 'text', label: 'Nomor' },
          { key: 'icon', type: 'text', label: 'Icon (Nama Icon)' },
          { key: 'text', type: 'textarea', label: 'Teks Misi' }
        ]}
      ]
    },
    timeline: {
      name: 'Visi Misi - Timeline',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'vision', type: 'textarea', label: 'Visi' },
        { key: 'missionTitle', type: 'text', label: 'Judul Misi' },
        { key: 'missions', type: 'array', label: 'Misi', fields: [
          { key: 'number', type: 'text', label: 'Nomor' },
          { key: 'icon', type: 'text', label: 'Icon' },
          { key: 'text', type: 'textarea', label: 'Teks Misi' }
        ]}
      ]
    },
    centered: {
      name: 'Visi Misi - Centered',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'vision', type: 'textarea', label: 'Visi', required: true },
        { key: 'missionTitle', type: 'text', label: 'Judul Misi' },
        { key: 'missions', type: 'array', label: 'Misi', fields: [
          { key: 'text', type: 'textarea', label: 'Teks Misi' }
        ]}
      ]
    }
  },
  defaultVariant: 'default'
}

export type VisiMisiConfig = typeof visimisiConfig
