'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  FileText,
  Loader2,
  Globe,
  EyeOff,
  Search,
  Calendar,
  Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Post {
  id: string
  title: string
  slug: string
  excerpt?: string
  category?: string
  isPublished: boolean
  publishedAt?: string
  createdAt: string
  author?: { name: string }
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [filter])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter === 'published') params.set('published', 'true')
      if (filter === 'draft') params.set('published', 'false')

      const res = await fetch(`/api/posts?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts || data)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePublish = async (post: Post) => {
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !post.isPublished })
      })
      if (res.ok) {
        await fetchPosts()
      }
    } catch (error) {
      console.error('Error toggling publish:', error)
    }
  }

  const deletePost = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/posts/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchPosts()
        setDeleteId(null)
      }
    } catch (error) {
      console.error('Error deleting post:', error)
    } finally {
      setDeleting(false)
    }
  }

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(search.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(search.toLowerCase())
  )

  const publishedCount = posts.filter(p => p.isPublished).length
  const draftCount = posts.filter(p => !p.isPublished).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Posts</h1>
          <p className="text-muted-foreground">
            Kelola berita dan artikel website
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/posts/baru">
            <Plus className="w-4 h-4 mr-2" />
            Post Baru
          </Link>
        </Button>
      </div>

      {/* Quick Info */}
      <div className="bg-muted/50 rounded-xl p-4 border">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">Manajemen Posts</h3>
            <p className="text-sm text-muted-foreground">
              Buat dan kelola berita atau artikel untuk website. Posts yang dipublikasikan akan tampil di halaman berita.
            </p>
          </div>
        </div>
      </div>

      {/* Stats & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Badge variant={filter === 'all' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setFilter('all')}>
            Semua ({posts.length})
          </Badge>
          <Badge variant={filter === 'published' ? 'default' : 'outline'} className="cursor-pointer bg-green-100 text-green-700 hover:bg-green-100" onClick={() => setFilter('published')}>
            Published ({publishedCount})
          </Badge>
          <Badge variant={filter === 'draft' ? 'default' : 'outline'} className="cursor-pointer bg-yellow-100 text-yellow-700 hover:bg-yellow-100" onClick={() => setFilter('draft')}>
            Draft ({draftCount})
          </Badge>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-16 bg-muted/50 rounded-xl border-2 border-dashed">
          <div className="w-16 h-16 bg-muted-foreground/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {search ? 'Tidak ada hasil' : 'Belum ada post'}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {search
              ? `Tidak ada post yang cocok dengan "${search}"`
              : 'Buat post pertama untuk website organisasi Anda'}
          </p>
          {!search && (
            <Button asChild>
              <Link href="/dashboard/posts/baru">
                <Plus className="w-4 h-4 mr-2" />
                Buat Post Pertama
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="hidden md:table-cell">Penulis</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Tanggal</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.map(post => (
                <TableRow key={post.id}>
                  <TableCell>
                    <Link href={`/dashboard/posts/${post.id}`} className="font-medium hover:text-primary transition-colors">
                      {post.title}
                    </Link>
                    <p className="text-sm text-muted-foreground truncate max-w-xs">{post.excerpt || 'Tanpa excerpt'}</p>
                  </TableCell>
                  <TableCell>
                    {post.category ? (
                      <Badge variant="outline" className="gap-1">
                        <Tag className="w-3 h-3" />
                        {post.category}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {post.author?.name || 'Unknown'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {post.isPublished ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                        Draft
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                        : new Date(post.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                    </div>
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
                          <Link href={`/dashboard/posts/${post.id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/berita/${post.slug}`} target="_blank">
                            <Eye className="mr-2 h-4 w-4" />
                            Lihat
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => togglePublish(post)}>
                          {post.isPublished ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Globe className="mr-2 h-4 w-4" />
                              Publish
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteId(post.id)}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Post</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus post ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={deletePost}
              disabled={deleting}
            >
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
