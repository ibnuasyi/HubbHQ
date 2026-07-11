'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AppearancePage() {
  const [colors, setColors] = useState({
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#ec4899',
    background: '#ffffff',
    text: '#1f2937'
  })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Appearance</h1>
        <p className="text-gray-600">Kustomisasi tampilan website Anda</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Color Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Color Scheme</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={colors.primary}
                  onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <input
                  type="text"
                  value={colors.primary}
                  onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={colors.secondary}
                  onChange={(e) => setColors({ ...colors, secondary: e.target.value })}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <input
                  type="text"
                  value={colors.secondary}
                  onChange={(e) => setColors({ ...colors, secondary: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={colors.accent}
                  onChange={(e) => setColors({ ...colors, accent: e.target.value })}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <input
                  type="text"
                  value={colors.accent}
                  onChange={(e) => setColors({ ...colors, accent: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Preview</h2>
          <div className="p-6 bg-gray-50 rounded-xl">
            <div className="flex gap-2 mb-4">
              <div className="w-8 h-8 rounded" style={{ backgroundColor: colors.primary }} />
              <div className="w-8 h-8 rounded" style={{ backgroundColor: colors.secondary }} />
              <div className="w-8 h-8 rounded" style={{ backgroundColor: colors.accent }} />
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-bold mb-2" style={{ color: colors.text }}>Sample Heading</h3>
              <p className="text-sm mb-4" style={{ color: colors.text }}>Sample paragraph text</p>
              <button
                className="px-4 py-2 text-white rounded-lg"
                style={{ backgroundColor: colors.primary }}
              >
                Primary Button
              </button>
            </div>
          </div>
        </div>

        {/* Logo Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Logo</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website Logo URL</label>
              <input
                type="text"
                placeholder="https://..."
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Favicon URL</label>
              <input
                type="text"
                placeholder="https://.../favicon.ico"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* SEO Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">SEO Defaults</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default SEO Title</label>
              <input
                type="text"
                placeholder="Website Name"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default SEO Description</label>
              <textarea
                rows={3}
                placeholder="Website description..."
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Social Share Image</label>
              <input
                type="text"
                placeholder="https://.../og-image.jpg"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          Save Changes
        </button>
      </div>
    </div>
  )
}
