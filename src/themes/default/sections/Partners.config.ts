// Partners Section Configuration
export const partnersConfig = {
  variants: {
    default: {
      name: 'Default Partners',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true, placeholder: 'Mitra & Sponsor' },
        { key: 'subtitle', type: 'text', label: 'Subtitle' },
        { key: 'partners', type: 'array', label: 'Mitra', fields: [
          { key: 'name', type: 'text', label: 'Nama', required: true },
          { key: 'logo', type: 'image', label: 'Logo' },
          { key: 'website', type: 'url', label: 'Website' },
          { key: 'tier', type: 'select', label: 'Tier', options: ['platinum', 'gold', 'silver'], default: 'silver' }
        ]},
        { key: 'showTiers', type: 'boolean', label: 'Tampilkan Tier', default: true }
      ]
    },
    carousel: {
      name: 'Partners Carousel',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'partners', type: 'array', label: 'Mitra', fields: [
          { key: 'name', type: 'text', label: 'Nama' },
          { key: 'logo', type: 'image', label: 'Logo' },
          { key: 'website', type: 'url', label: 'Website' }
        ]}
      ]
    }
  },
  defaultVariant: 'default'
}

export type PartnersConfig = typeof partnersConfig
