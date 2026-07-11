// Team Section Configuration
export const teamConfig = {
  variants: {
    default: {
      name: 'Default Team',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true, placeholder: 'Tim Kami' },
        { key: 'subtitle', type: 'text', label: 'Subtitle' },
        { key: 'members', type: 'array', label: 'Anggota Tim', fields: [
          { key: 'name', type: 'text', label: 'Nama', required: true },
          { key: 'position', type: 'text', label: 'Jabatan' },
          { key: 'photo', type: 'image', label: 'Foto' },
          { key: 'bio', type: 'textarea', label: 'Bio' },
          { key: 'linkedin', type: 'url', label: 'LinkedIn' },
          { key: 'twitter', type: 'url', label: 'Twitter' },
          { key: 'instagram', type: 'url', label: 'Instagram' }
        ]},
        { key: 'showSocial', type: 'boolean', label: 'Tampilkan Social Links', default: true },
        { key: 'layout', type: 'select', label: 'Layout', options: ['grid', 'list'], default: 'grid' }
      ]
    },
    carousel: {
      name: 'Team Carousel',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'members', type: 'array', label: 'Anggota Tim', fields: [
          { key: 'name', type: 'text', label: 'Nama' },
          { key: 'position', type: 'text', label: 'Jabatan' },
          { key: 'photo', type: 'image', label: 'Foto' }
        ]}
      ]
    },
    compact: {
      name: 'Compact Team',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'members', type: 'array', label: 'Anggota Tim', fields: [
          { key: 'name', type: 'text', label: 'Nama' },
          { key: 'position', type: 'text', label: 'Jabatan' },
          { key: 'photo', type: 'image', label: 'Foto' }
        ]}
      ]
    }
  },
  defaultVariant: 'default'
}

export type TeamConfig = typeof teamConfig
