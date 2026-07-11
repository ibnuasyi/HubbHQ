// Team Section Configuration for KPRI Style
export const teamConfig = {
  variants: {
    default: {
      name: 'KPRI Team - Grid',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true, placeholder: 'Struktur Organisasi' },
        { key: 'subtitle', type: 'text', label: 'Subtitle', placeholder: 'Pengurus kami' },
        { key: 'description', type: 'textarea', label: 'Deskripsi' },
        { key: 'members', type: 'array', label: 'Anggota Tim', fields: [
          { key: 'name', type: 'text', label: 'Nama', required: true },
          { key: 'position', type: 'text', label: 'Jabatan' },
          { key: 'photo', type: 'image', label: 'Foto' },
          { key: 'bio', type: 'textarea', label: 'Bio' },
          { key: 'phone', type: 'text', label: 'Telepon' },
          { key: 'email', type: 'email', label: 'Email' }
        ]},
        { key: 'showSocial', type: 'boolean', label: 'Tampilkan Social Links', default: false },
        { key: 'layout', type: 'select', label: 'Layout', options: ['grid', 'list'], default: 'grid' },
        { key: 'columns', type: 'select', label: 'Jumlah Kolom', options: ['2', '3', '4'], default: '4' }
      ]
    },
    cards: {
      name: 'KPRI Team - Cards',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'subtitle', type: 'text', label: 'Subtitle' },
        { key: 'members', type: 'array', label: 'Anggota Tim', fields: [
          { key: 'name', type: 'text', label: 'Nama', required: true },
          { key: 'position', type: 'text', label: 'Jabatan' },
          { key: 'photo', type: 'image', label: 'Foto' },
          { key: 'bio', type: 'textarea', label: 'Bio' }
        ]}
      ]
    },
    carousel: {
      name: 'KPRI Team - Carousel',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'subtitle', type: 'text', label: 'Subtitle' },
        { key: 'members', type: 'array', label: 'Anggota Tim', fields: [
          { key: 'name', type: 'text', label: 'Nama' },
          { key: 'position', type: 'text', label: 'Jabatan' },
          { key: 'photo', type: 'image', label: 'Foto' }
        ]}
      ]
    },
    compact: {
      name: 'KPRI Team - Compact',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'members', type: 'array', label: 'Anggota Tim', fields: [
          { key: 'name', type: 'text', label: 'Nama' },
          { key: 'position', type: 'text', label: 'Jabatan' },
          { key: 'photo', type: 'image', label: 'Foto' }
        ]}
      ]
    },
    featured: {
      name: 'KPRI Team - Featured (Ketua)',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'featuredMember', type: 'array', label: 'Ketua/Direktur', fields: [
          { key: 'name', type: 'text', label: 'Nama', required: true },
          { key: 'position', type: 'text', label: 'Jabatan' },
          { key: 'photo', type: 'image', label: 'Foto' },
          { key: 'quote', type: 'textarea', label: 'Kutipan' }
        ]},
        { key: 'otherMembers', type: 'array', label: 'Anggota Lainnya', fields: [
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
