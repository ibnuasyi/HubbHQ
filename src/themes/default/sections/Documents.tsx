'use client'

import { useState, useEffect } from 'react'

interface DocumentItem {
  id: string
  title: string
  category?: string
  description?: string
  fileUrl: string
  fileType?: string
}

interface DocumentsProps {
  config: {
    variant?: string
    title?: string
    subtitle?: string
    categories?: Array<{
      name?: string
      documents?: Array<{
        title?: string
        description?: string
        fileUrl?: string
        fileType?: string
      }>
    }>
    showDownloadCount?: boolean
  }
  isPreview?: boolean
}

export default function Documents({ config, isPreview = false }: DocumentsProps) {
  const variant = config.variant || 'default'
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDocuments() {
      try {
        // Using the existing Document model from the main schema
        const res = await fetch('/api/documents?public=true')
        if (res.ok) {
          const data = await res.json()
          setDocuments(data)
        }
      } catch (error) {
        console.error('Error fetching documents:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDocuments()
  }, [])

  const getFileIcon = (fileType?: string) => {
    switch (fileType) {
      case 'pdf':
        return '📄'
      case 'doc':
      case 'docx':
        return '📝'
      case 'xls':
      case 'xlsx':
        return '📊'
      case 'ppt':
      case 'pptx':
        return '📽️'
      case 'zip':
      case 'rar':
        return '📦'
      default:
        return '📄'
    }
  }

  const categories = Array.from(new Set(documents.map(doc => doc.category).filter((c): c is string => Boolean(c))))
  const filteredDocs = activeCategory
    ? documents.filter(doc => doc.category === activeCategory)
    : documents

  // List variant
  if (variant === 'list') {
    return (
      <section className={`py-20 bg-gray-50 ${isPreview ? 'py-12' : ''}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {config.title || 'Dokumen Resmi'}
            </h2>
          </div>

          <div className="max-w-4xl mx-auto space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
              ))
            ) : filteredDocs.length > 0 ? (
              filteredDocs.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <span className="text-3xl">{getFileIcon(doc.fileType)}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                    {doc.description && (
                      <p className="text-sm text-gray-500">{doc.description}</p>
                    )}
                  </div>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                    Download
                  </button>
                </a>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="text-4xl mb-4">📁</p>
                <p>Belum ada dokumen</p>
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  // Default category-based variant
  return (
    <section className={`py-20 bg-white ${isPreview ? 'py-12' : ''}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {config.title || 'Dokumen Resmi'}
          </h2>
          {config.subtitle && (
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {config.subtitle}
            </p>
          )}
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !activeCategory ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semua
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category || null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === category ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Documents Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredDocs.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.map((doc) => (
              <a
                key={doc.id}
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{getFileIcon(doc.fileType)}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {doc.title}
                    </h3>
                    {doc.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {doc.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs text-gray-500 uppercase">{doc.fileType}</span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs text-indigo-600 font-medium">Download →</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-6xl mb-4">📁</p>
            <p className="text-xl">Belum ada dokumen</p>
            <p className="text-sm mt-2">Dokumen resmi akan ditampilkan di sini</p>
          </div>
        )}
      </div>
    </section>
  )
}
