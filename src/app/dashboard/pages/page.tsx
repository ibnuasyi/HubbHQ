'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, MoreHorizontal, Pencil, Trash2, ExternalLink, FileText, Loader2, Eye, PlusCircle, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Page {
  id: string
  title: string
  slug: string
  type: string
  isPublished: boolean
  _count: { sections: number }
  updatedAt: string
}

export default function PagesPage() {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newPage, setNewPage] = useState({ title: '', slug: '', type: 'page' })

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/pages')
      if (res.ok) {
        const data = await res.json()
        setPages(data)
      }
    } catch (error) {
      console.error('Error fetching pages:', error)
    } finally {
      setLoading(false)
    }
  }

  const createPage = async () => {
    if (!newPage.title || !newPage.slug) return
    setSaving(true)
    try {
      const res = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPage)
      })
      if (res.ok) {
        await fetchPages()
        setShowCreateModal(false)
        setNewPage({ title: '', slug: '', type: 'page' })
      }
    } catch (error) {
      console.error('Error creating page:', error)
    } finally {
      setSaving(false)
    }
  }

  const deletePage = async (slug: string) => {
    if (!confirm('Yakin ingin menghapus halaman ini? Tindakan ini tidak dapat dibatalkan.')) return
    try {
      const res = await fetch(`/api/pages/${slug}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchPages()
      }
    } catch (error) {
      console.error('Error deleting page:', error)
    }
  }

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'home': 'Homepage',
      'page': 'Halaman',
      'contact': 'Kontak',
      'about': 'Tentang',
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'home': 'bg-orange-100 text-orange-700',
      'page': 'bg-blue-100 text-blue-700',
      'contact': 'bg-green-100 text-green-700',
      'about': 'bg-purple-100 text-purple-700',
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Website Builder</h1>
          <p className="text-muted-foreground">
            Bangun dan kelola halaman website organisasi Anda
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Halaman Baru
        </Button>
      </div>

      {/* Quick Info */}
      <div className="bg-muted/50 rounded-xl p-4 border">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">Website Builder</h3>
            <p className="text-sm text-muted-foreground">
              Gunakan builder ini untuk membuat halaman website. Setiap halaman terdiri dari sections yang bisa Anda kustomisasi.
              Setelah selesai, aktifkan tema dan atur menu untuk menampilkan halaman.
            </p>
          </div>
        </div>
      </div>

      {/* Pages List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : pages.length === 0 ? (
        <div className="text-center py-16 bg-muted/50 rounded-xl border-2 border-dashed">
          <div className="w-16 h-16 bg-muted-foreground/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Belum ada halaman</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Buat halaman pertama untuk website organisasi Anda
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Buat Halaman Pertama
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Halaman</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead className="hidden md:table-cell">Sections</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Diperbarui</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map(page => (
                <TableRow key={page.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/pages/${page.slug}/builder`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {page.title}
                    </Link>
                    <p className="text-sm text-muted-foreground font-mono">/{page.slug}</p>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(page.type)}>
                      {getTypeLabel(page.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {page._count.sections} sections
                    </span>
                  </TableCell>
                  <TableCell>
                    {page.isPublished ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {new Date(page.updatedAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/pages/${page.slug}/builder`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/${page.slug}`} target="_blank">
                            <Eye className="mr-2 h-4 w-4" />
                            Lihat
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deletePage(page.slug)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Halaman Baru</DialogTitle>
            <DialogDescription>
              Buat halaman baru untuk website Anda
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Halaman</Label>
              <Input
                id="title"
                value={newPage.title}
                onChange={(e) => setNewPage({
                  ...newPage,
                  title: e.target.value,
                  slug: newPage.slug || generateSlug(e.target.value)
                })}
                placeholder="Contoh: Tentang Kami"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">/</span>
                <Input
                  id="slug"
                  value={newPage.slug}
                  onChange={(e) => setNewPage({ ...newPage, slug: e.target.value })}
                  placeholder="tentang-kami"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                URL akan menjadi: /{newPage.slug || 'slug-anda'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipe Halaman</Label>
              <Select value={newPage.type} onValueChange={(value) => setNewPage({ ...newPage, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="page">Halaman</SelectItem>
                  <SelectItem value="home">Homepage</SelectItem>
                  <SelectItem value="about">Tentang</SelectItem>
                  <SelectItem value="contact">Kontak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Batal
            </Button>
            <Button
              onClick={createPage}
              disabled={!newPage.title || !newPage.slug || saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Membuat...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Buat
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
