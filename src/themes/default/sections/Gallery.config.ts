// Gallery Section Configuration
export const galleryConfig = {
  variants: {
    default: {
      name: 'Default Gallery',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true, placeholder: 'Galeri Foto' },
        { key: 'subtitle', type: 'text', label: 'Subtitle' },
        { key: 'albums', type: 'array', label: 'Album', fields: [
          { key: 'name', type: 'text', label: 'Nama Album' },
          { key: 'cover', type: 'image', label: 'Cover Image' }
        ]},
        { key: 'showFilter', type: 'boolean', label: 'Tampilkan Filter Album', default: true },
        { key: 'columns', type: 'select', label: 'Jumlah Kolom', options: ['2', '3', '4'], default: '3' },
        { key: 'lightbox', type: 'boolean', label: 'Aktifkan Lightbox', default: true }
      ]
    },
    masonry: {
      name: 'Masonry Gallery',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'columns', type: 'select', label: 'Jumlah Kolom', options: ['2', '3', '4'], default: '3' }
      ]
    }
  },
  defaultVariant: 'default'
}

export type GalleryConfig = typeof galleryConfig
