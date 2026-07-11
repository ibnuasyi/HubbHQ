// Faq Section Configuration
export const faqConfig = {
  variants: {
    default: {
      name: 'Default FAQ',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true, placeholder: 'Pertanyaan Umum' },
        { key: 'subtitle', type: 'text', label: 'Subtitle' },
        { key: 'showCategories', type: 'boolean', label: 'Tampilkan Kategori', default: false },
        { key: 'allowMultipleOpen', type: 'boolean', label: 'Izinkan Buka Banyak', default: false }
      ]
    },
    accordion: {
      name: 'FAQ Accordion',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'allowMultipleOpen', type: 'boolean', label: 'Izinkan Buka Banyak', default: false }
      ]
    }
  },
  defaultVariant: 'default'
}

export type FaqConfig = typeof faqConfig
