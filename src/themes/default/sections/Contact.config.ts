// Contact Section Configuration
export const contactConfig = {
  variants: {
    default: {
      name: 'Default Contact',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true, placeholder: 'Hubungi Kami' },
        { key: 'subtitle', type: 'text', label: 'Subtitle' },
        { key: 'address', type: 'textarea', label: 'Alamat' },
        { key: 'phone', type: 'text', label: 'Telepon' },
        { key: 'email', type: 'text', label: 'Email' },
        { key: 'whatsapp', type: 'text', label: 'WhatsApp' },
        { key: 'mapsEmbed', type: 'textarea', label: 'Google Maps Embed URL' },
        { key: 'showForm', type: 'boolean', label: 'Tampilkan Form Kontak', default: true },
        { key: 'formFields', type: 'array', label: 'Field Form', fields: [
          { key: 'name', type: 'text', label: 'Nama Field' },
          { key: 'type', type: 'select', label: 'Tipe', options: ['text', 'email', 'tel', 'textarea'] },
          { key: 'required', type: 'boolean', label: 'Required' }
        ]},
        { key: 'socialLinks', type: 'array', label: 'Social Links', fields: [
          { key: 'platform', type: 'text', label: 'Platform' },
          { key: 'url', type: 'url', label: 'URL' },
          { key: 'icon', type: 'text', label: 'Icon' }
        ]}
      ]
    },
    split: {
      name: 'Split Contact',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'infoTitle', type: 'text', label: 'Judul Info' },
        { key: 'address', type: 'textarea', label: 'Alamat' },
        { key: 'phone', type: 'text', label: 'Telepon' },
        { key: 'email', type: 'text', label: 'Email' },
        { key: 'mapsEmbed', type: 'textarea', label: 'Google Maps Embed URL' },
        { key: 'showForm', type: 'boolean', label: 'Tampilkan Form', default: true }
      ]
    }
  },
  defaultVariant: 'default'
}

export type ContactConfig = typeof contactConfig
