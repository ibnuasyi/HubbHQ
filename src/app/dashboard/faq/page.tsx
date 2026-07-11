'use client'

import { useState, useEffect } from 'react'

interface FaqItem {
  id: string
  question: string
  answer: string
  category?: string
  order: number
  isPublished: boolean
}

export default function FaqPage() {
  const [items, setItems] = useState<FaqItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<FaqItem | null>(null)
  const [newItem, setNewItem] = useState({ question: '', answer: '', category: '' })

  useEffect(() => {
    fetchFaqs()
  }, [])

  const fetchFaqs = async () => {
    try {
      const res = await fetch('/api/faq')
      if (res.ok) {
        const data = await res.json()
        setItems(data)
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error)
    } finally {
      setLoading(false)
    }
  }

  const addItem = async () => {
    try {
      const res = await fetch('/api/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newItem, isPublished: true })
      })
      if (res.ok) {
        await fetchFaqs()
        setShowAddModal(false)
        setNewItem({ question: '', answer: '', category: '' })
      }
    } catch (error) {
      console.error('Error adding FAQ:', error)
    }
  }

  const updateItem = async () => {
    if (!editingItem) return
    try {
      const res = await fetch(`/api/faq/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem)
      })
      if (res.ok) {
        await fetchFaqs()
        setEditingItem(null)
      }
    } catch (error) {
      console.error('Error updating FAQ:', error)
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return
    try {
      const res = await fetch(`/api/faq/${id}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchFaqs()
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FAQ</h1>
          <p className="text-gray-600">Kelola Frequently Asked Questions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <span>+</span> Add FAQ
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <span className="text-6xl mb-4 block">❓</span>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Belum ada FAQ</h2>
          <p className="text-gray-600">Tambahkan pertanyaan yang sering ditanyakan</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Add First FAQ
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded">
                      #{index + 1}
                    </span>
                    {item.category && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.question}</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{item.answer}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="px-3 py-1 text-sm border border-red-200 text-red-600 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Add FAQ</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                <input
                  type="text"
                  value={newItem.question}
                  onChange={(e) => setNewItem({ ...newItem, question: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="What is...?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                <textarea
                  value={newItem.answer}
                  onChange={(e) => setNewItem({ ...newItem, answer: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={5}
                  placeholder="The answer is..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="General, Pendaftaran, dll (optional)"
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
                disabled={!newItem.question || !newItem.answer}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Add FAQ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Edit FAQ</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                <input
                  type="text"
                  value={editingItem.question}
                  onChange={(e) => setEditingItem({ ...editingItem, question: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                <textarea
                  value={editingItem.answer}
                  onChange={(e) => setEditingItem({ ...editingItem, answer: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={5}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={editingItem.category || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={updateItem}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
