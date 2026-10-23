'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ZoomIn, Image as ImageIcon } from 'lucide-react'

interface GalleryImage {
  id: string
  title: string
  album?: string
  imageUrl: string
  caption?: string
}

interface GalleryProps {
  config: {
    variant?: string
    title?: string
    subtitle?: string
    albums?: Array<{ name?: string; cover?: string }>
    showFilter?: boolean
    columns?: '2' | '3' | '4'
    lightbox?: boolean
  }
  isPreview?: boolean
}

export default function Gallery({ config, isPreview = false }: GalleryProps) {
  const variant = config.variant || 'default'
  const columns = config.columns || '3'
  const lightbox = config.lightbox !== false
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [filter, setFilter] = useState<string | null>(null)

  useEffect(() => {
    async function fetchImages() {
      try {
        const res = await fetch('/api/gallery')
        if (res.ok) {
          const data = await res.json()
          setImages(data)
        }
      } catch (error) {
        console.error('Error fetching gallery:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchImages()
  }, [])

  const albums = config.albums || []
  const uniqueAlbums = Array.from(new Set(images.map(img => img.album).filter((a): a is string => Boolean(a))))

  const filteredImages = filter
    ? images.filter(img => img.album === filter)
    : images

  const gridCols = {
    '2': 'md:grid-cols-2',
    '3': 'md:grid-cols-2 lg:grid-cols-3',
    '4': 'md:grid-cols-2 lg:grid-cols-4'
  }[columns]

  const openLightbox = (image: GalleryImage) => {
    setSelectedImage(image)
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setSelectedImage(null)
    document.body.style.overflow = 'auto'
  }

  // Masonry variant
  if (variant === 'masonry') {
    return (
      <section className={`py-20 bg-gray-50 ${isPreview ? 'py-12' : ''}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {config.title || 'Galeri Foto'}
            </h2>
          </div>

          {loading ? (
            <div className={`grid ${gridCols} gap-4`}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
              {filteredImages.map((image) => (
                <div
                  key={image.id}
                  className="break-inside-avoid cursor-pointer group"
                  onClick={() => lightbox && openLightbox(image)}
                >
                  <div className="relative aspect-auto overflow-hidden rounded-xl">
                    <Image
                      src={image.imageUrl}
                      alt={image.title}
                      width={600}
                      height={400}
                      className="object-cover w-full group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lightbox */}
        {lightbox && selectedImage && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <button
              className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300"
              onClick={closeLightbox}
            >
              ×
            </button>
            <Image
              src={selectedImage.imageUrl}
              alt={selectedImage.title}
              width={1200}
              height={800}
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {selectedImage.caption && (
              <div className="absolute bottom-4 left-0 right-0 text-center text-white">
                <p className="text-lg">{selectedImage.caption}</p>
              </div>
            )}
          </div>
        )}
      </section>
    )
  }

  // Default variant
  return (
    <section className={`py-20 bg-white ${isPreview ? 'py-12' : ''}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {config.title || 'Galeri Foto'}
          </h2>
          {config.subtitle && (
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {config.subtitle}
            </p>
          )}
        </div>

        {/* Album Filter */}
        {config.showFilter !== false && uniqueAlbums.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <button
              onClick={() => setFilter(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !filter ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semua
            </button>
            {uniqueAlbums.map(album => (
              <button
                key={album}
                onClick={() => setFilter(album || null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === album ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {album}
              </button>
            ))}
          </div>
        )}

        {/* Gallery Grid */}
        {loading ? (
          <div className={`grid ${gridCols} gap-6`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-video bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredImages.length > 0 ? (
          <div className={`grid ${gridCols} gap-6`}>
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className="group relative aspect-video overflow-hidden rounded-xl cursor-pointer"
                onClick={() => lightbox && openLightbox(image)}
              >
                <Image
                  src={image.imageUrl}
                  alt={image.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-semibold">{image.title}</h3>
                    {image.caption && (
                      <p className="text-white/80 text-sm">{image.caption}</p>
                    )}
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
                    <ZoomIn className="w-6 h-6" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4 text-gray-400">
              <ImageIcon className="w-8 h-8" />
            </div>
            <p className="text-gray-500">Belum ada foto dalam galeri</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-10"
            onClick={closeLightbox}
          >
            ×
          </button>
          <div className="relative w-full max-w-5xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={selectedImage.imageUrl}
              alt={selectedImage.title}
              width={1200}
              height={800}
              className="w-full h-auto max-h-[85vh] object-contain"
            />
            <div className="mt-4 text-center">
              <h3 className="text-white text-xl font-semibold">{selectedImage.title}</h3>
              {selectedImage.caption && (
                <p className="text-white/80 mt-1">{selectedImage.caption}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
