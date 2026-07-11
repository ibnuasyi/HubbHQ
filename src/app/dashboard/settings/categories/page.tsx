'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Tag,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  color?: string
  icon?: string
  order: number
  isActive: boolean
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formColor, setFormColor] = useState('#6366f1')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  const resetForm = () => {
    setFormName('')
    setFormSlug('')
    setFormDescription('')
    setFormColor('#6366f1')
  }

  const openAdd = () => {
    resetForm()
    setShowAdd(true)
  }

  const openEdit = (category: Category) => {
    setSelectedCategory(category)
    setFormName(category.name)
    setFormSlug(category.slug)
    setFormDescription(category.description || '')
    setFormColor(category.color || '#6366f1')
    setShowEdit(true)
  }

  const handleSubmit = async () => {
    if (!formName) return
    setSaving(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          slug: formSlug || generateSlug(formName),
          description: formDescription,
          color: formColor,
        }),
      })

      if (res.ok) {
        setShowAdd(false)
        resetForm()
        fetchCategories()
      }
    } catch (error) {
      console.error('Error creating category:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedCategory || !formName) return
    setSaving(true)
    try {
      const res = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          slug: formSlug,
          description: formDescription,
          color: formColor,
        }),
      })

      if (res.ok) {
        setShowEdit(false)
        setSelectedCategory(null)
        resetForm()
        fetchCategories()
      }
    } catch (error) {
      console.error('Error updating category:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/categories/${deleteId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setDeleteId(null)
        fetchCategories()
      }
    } catch (error) {
      console.error('Error deleting category:', error)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kategori</h1>
          <p className="text-muted-foreground">
            Kelola kategori untuk posts
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Kategori
        </Button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 bg-muted/50 rounded-xl border-2 border-dashed">
          <div className="w-16 h-16 bg-muted-foreground/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tag className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Belum ada kategori</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Buat kategori untuk mengatur posts Anda
          </p>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Buat Kategori Pertama
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(category => (
            <Card key={category.id} className="relative overflow-hidden">
              {/* Color Bar */}
              <div
                className="h-1"
                style={{ backgroundColor: category.color || '#6366f1' }}
              />

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {category.icon && (
                      <span className="text-xl">{category.icon}</span>
                    )}
                    <CardTitle className="text-base">{category.name}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(category)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteId(category.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      /{category.slug}
                    </Badge>
                    {!category.isActive && (
                      <Badge variant="secondary" className="text-xs">
                        Nonaktif
                      </Badge>
                    )}
                  </div>
                </div>
                {category.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {category.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Kategori</DialogTitle>
            <DialogDescription>
              Buat kategori baru untuk posts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value)
                  if (!formSlug) {
                    setFormSlug(generateSlug(e.target.value))
                  }
                }}
                placeholder="Contoh: Berita, Program, Pengumuman"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">/</span>
                <Input
                  id="slug"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="slug-url"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Input
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Deskripsi kategori (opsional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Warna</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  placeholder="#6366f1"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={saving || !formName}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Simpan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Kategori</DialogTitle>
            <DialogDescription>
              Ubah detail kategori
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nama</Label>
              <Input
                id="edit-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nama kategori"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">/</span>
                <Input
                  id="edit-slug"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="slug-url"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Deskripsi</Label>
              <Input
                id="edit-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Deskripsi kategori (opsional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-color">Warna</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  placeholder="#6366f1"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>
              Batal
            </Button>
            <Button onClick={handleEdit} disabled={saving || !formName}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Simpan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Kategori</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kategori ini? Posts dengan kategori ini tidak akan dihapus.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
