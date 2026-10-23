'use client'

import { useState, useEffect } from 'react'
import { Image as ImageIcon } from 'lucide-react'

interface GalleryItem {
  id: string
  title: string
  album?: string
  imageUrl: string
  caption?: string
  order: number
  createdAt: string
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [albums, setAlbums] = useState<string[]>([])
  const [filter, setFilter] = useState<string | null>(null)
  const [newItem, setNewItem] = useState({ title: '', album: '', imageUrl: '', caption: '' })

  useEffect(() => {
    fetchGallery()
  }, [filter])

  const fetchGallery = async () => {
    setLoading(true)
    try {
      const params = filter ? `?album=${filter}` : ''
      const res = await fetch(`/api/gallery${params}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data)
        const uniqueAlbums = Array.from(new Set(data.map((i: GalleryItem) => i.album).filter((a: string | undefined): a is string => Boolean(a)))) as string[]
        setAlbums(uniqueAlbums)
      }
    } catch (error) {
      console.error('Error fetching gallery:', error)
    } finally {
      setLoading(false)
    }
  }

  const addItem = async () => {
    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      })
      if (res.ok) {
        await fetchGallery()
        setShowAddModal(false)
        setNewItem({ title: '', album: '', imageUrl: '', caption: '' })
      }
    } catch (error) {
      console.error('Error adding item:', error)
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this image?')) return
    try {
      const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchGallery()
      }
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gallery</h1>
          <p className="text-gray-600">Kelola galeri foto</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <span>+</span> Add Image
        </button>
      </div>

      {/* Album Filter */}
      {albums.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${!filter ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            All
          </button>
          {albums.map(album => (
            <button
              key={album}
              onClick={() => setFilter(album)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === album ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {album}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-200/60 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-gray-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Belum ada foto</h2>
          <p className="text-gray-600">Tambahkan foto ke galeri</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Add First Image
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map(item => (
            <div key={item.id} className="group relative aspect-square bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                <button
                  onClick={() => deleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-opacity"
                >
                  Delete
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                <p className="text-white text-sm truncate">{item.title}</p>
                {item.album && (
                  <p className="text-white/70 text-xs">{item.album}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Image</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Image title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Album</label>
                <input
                  type="text"
                  value={newItem.album}
                  onChange={(e) => setNewItem({ ...newItem, album: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Album name (optional)"
                  list="albums"
                />
                <datalist id="albums">
                  {albums.map(album => (
                    <option key={album} value={album} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="text"
                  value={newItem.imageUrl}
                  onChange={(e) => setNewItem({ ...newItem, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://..."
                />
                {newItem.imageUrl && (
                  <img src={newItem.imageUrl} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-lg" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                <input
                  type="text"
                  value={newItem.caption}
                  onChange={(e) => setNewItem({ ...newItem, caption: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Image caption (optional)"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addItem}
                disabled={!newItem.title || !newItem.imageUrl}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Add Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
