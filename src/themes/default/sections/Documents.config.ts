// Documents Section Configuration
export const documentsConfig = {
  variants: {
    default: {
      name: 'Default Documents',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true, placeholder: 'Dokumen Resmi' },
        { key: 'subtitle', type: 'text', label: 'Subtitle' },
        { key: 'categories', type: 'array', label: 'Kategori', fields: [
          { key: 'name', type: 'text', label: 'Nama Kategori', required: true },
          { key: 'documents', type: 'array', label: 'Dokumen', fields: [
            { key: 'title', type: 'text', label: 'Judul', required: true },
            { key: 'description', type: 'textarea', label: 'Deskripsi' },
            { key: 'fileUrl', type: 'url', label: 'URL File' },
            { key: 'fileType', type: 'select', label: 'Tipe File', options: ['pdf', 'doc', 'xls', 'ppt', 'zip'] }
          ]}
        ]},
        { key: 'showDownloadCount', type: 'boolean', label: 'Tampilkan Jumlah Download', default: true }
      ]
    },
    list: {
      name: 'Documents List',
      fields: [
        { key: 'title', type: 'text', label: 'Judul', required: true },
        { key: 'documents', type: 'array', label: 'Dokumen', fields: [
          { key: 'title', type: 'text', label: 'Judul' },
          { key: 'description', type: 'textarea', label: 'Deskripsi' },
          { key: 'fileUrl', type: 'url', label: 'URL File' }
        ]}
      ]
    }
  },
  defaultVariant: 'default'
}

export type DocumentsConfig = typeof documentsConfig
