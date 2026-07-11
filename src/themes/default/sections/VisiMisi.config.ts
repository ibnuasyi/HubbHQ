// VisiMisi Section Configuration
export const visimisiConfig = {
  variants: {
    default: {
      name: 'Default Visi Misi',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true, placeholder: 'Visi & Misi' },
        { key: 'vision', type: 'textarea', label: 'Visi', required: true, placeholder: 'Visi organisasi...' },
        { key: 'missionTitle', type: 'text', label: 'Judul Misi', placeholder: 'Misi Kami' },
        { key: 'missions', type: 'array', label: 'Misi', fields: [
          { key: 'number', type: 'text', label: 'Nomor' },
          { key: 'text', type: 'textarea', label: 'Teks Misi' }
        ]},
        { key: 'showIcon', type: 'boolean', label: 'Tampilkan Icon', default: true }
      ]
    },
    timeline: {
      name: 'Timeline Visi Misi',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'vision', type: 'textarea', label: 'Visi' },
        { key: 'missions', type: 'array', label: 'Misi', fields: [
          { key: 'icon', type: 'text', label: 'Icon' },
          { key: 'text', type: 'textarea', label: 'Teks Misi' }
        ]}
      ]
    }
  },
  defaultVariant: 'default'
}

export type VisiMisiConfig = typeof visimisiConfig
