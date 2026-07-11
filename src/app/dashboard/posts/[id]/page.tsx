'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Globe,
  Eye,
  Loader2,
  X,
  Plus,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface Post {
  id?: string
  title: string
  slug: string
  content: string
  excerpt: string
  category: string
  tags: string
  featuredImage: string
  isPublished: boolean
}

interface Category {
  id: string
  name: string
}

export default function EditPostPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [loading, setLoading] = useState(id !== 'baru')
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const [post, setPost] = useState<Post>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    category: '',
    tags: '',
    featuredImage: '',
    isPublished: false
  })

  useEffect(() => {
    fetchCategories()
    if (id !== 'baru') {
      fetchPost()
    }
  }, [id])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/posts/${id}`)
      if (res.ok) {
        const data = await res.json()
        setPost(data)
        // Parse tags from comma-separated string
        if (data.tags) {
          setTags(data.tags.split(',').map((t: string) => t.trim()).filter(Boolean))
        }
        // Parse categories
        if (data.category) {
          setSelectedCategories(data.category.split(',').map((c: string) => c.trim()).filter(Boolean))
        }
      }
    } catch (error) {
      console.error('Error fetching post:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePost = async (publish?: boolean) => {
    setSaving(true)
    try {
      const postData = {
        ...post,
        isPublished: publish !== undefined ? publish : post.isPublished,
        tags: tags.join(','),
        category: selectedCategories.join(',')
      }

      const method = id === 'baru' ? 'POST' : 'PATCH'
      const url = id === 'baru' ? '/api/posts' : `/api/posts/${id}`

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      })

      if (res.ok) {
        const data = await res.json()
        if (id === 'baru') {
          router.push(`/dashboard/posts/${data.id}`)
        } else {
          await fetchPost()
        }
      }
    } catch (error) {
      console.error('Error saving post:', error)
    } finally {
      setSaving(false)
    }
  }

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  // Tag handlers
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
    }
    setTagInput('')
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  // Category handlers
  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(c => c !== categoryId))
    } else {
      setSelectedCategories([...selectedCategories, categoryId])
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-96 bg-muted rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/posts">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold">
                {id === 'baru' ? 'Post Baru' : 'Edit Post'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {id === 'baru' ? 'Buat post baru' : `Mengedit: ${post.title}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => savePost()}
              disabled={saving || !post.title}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Simpan Draft
            </Button>
            <Button
              onClick={() => savePost(true)}
              disabled={saving || !post.title}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Globe className="w-4 h-4 mr-2" />
              )}
              {post.isPublished ? 'Update' : 'Publikasi'}
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Konten</CardTitle>
                  <CardDescription>Judul dan konten utama post</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Judul</Label>
                    <Input
                      id="title"
                      value={post.title}
                      onChange={(e) => setPost({
                        ...post,
                        title: e.target.value,
                        slug: e.target.value ? generateSlug(e.target.value) : post.slug
                      })}
                      placeholder="Judul post"
                      className="text-lg font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">URL Slug</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">/berita/</span>
                      <Input
                        id="slug"
                        value={post.slug}
                        onChange={(e) => setPost({ ...post, slug: e.target.value })}
                        placeholder="url-slug"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Konten</Label>
                    <Textarea
                      id="content"
                      value={post.content}
                      onChange={(e) => setPost({ ...post, content: e.target.value })}
                      placeholder="Tulis konten post di sini..."
                      className="min-h-[400px] font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* SEO */}
              <Card>
                <CardHeader>
                  <CardTitle>SEO & Metadata</CardTitle>
                  <CardDescription>Pengaturan untuk optimasi search engine</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="excerpt">Excerpt / Meta Description</Label>
                    <Textarea
                      id="excerpt"
                      value={post.excerpt}
                      onChange={(e) => setPost({ ...post, excerpt: e.target.value })}
                      placeholder="Deskripsi singkat untuk SEO (maksimal 160 karakter)..."
                      rows={3}
                      maxLength={160}
                    />
                    <p className="text-xs text-muted-foreground">
                      {post.excerpt.length}/160 karakter
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge
                      className={post.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                    >
                      {post.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  {post.isPublished && (
                    <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                      <Link href={`/berita/${post.slug}`} target="_blank">
                        <Eye className="w-4 h-4 mr-2" />
                        Lihat di Website
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Featured Image */}
              <Card>
                <CardHeader>
                  <CardTitle>Featured Image</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="featuredImage">URL Gambar</Label>
                    <Input
                      id="featuredImage"
                      value={post.featuredImage}
                      onChange={(e) => setPost({ ...post, featuredImage: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  {post.featuredImage && (
                    <div className="relative">
                      <img
                        src={post.featuredImage}
                        alt="Preview"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => setPost({ ...post, featuredImage: '' })}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Categories */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Kategori</CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/dashboard/settings/categories">
                        <Plus className="w-3 h-3 mr-1" />
                        Kelola
                      </Link>
                    </Button>
                  </div>
                  <CardDescription>Pilih satu atau lebih kategori</CardDescription>
                </CardHeader>
                <CardContent>
                  {categories.length === 0 ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      <p>Belum ada kategori</p>
                      <Button variant="link" size="sm" className="mt-2" asChild>
                        <Link href="/dashboard/settings/categories">
                          Buat kategori baru
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <Button
                          key={category.id}
                          variant={selectedCategories.includes(category.id) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleCategory(category.id)}
                          className={cn(
                            selectedCategories.includes(category.id) && 'bg-primary'
                          )}
                        >
                          {selectedCategories.includes(category.id) && (
                            <Check className="w-3 h-3 mr-1" />
                          )}
                          {category.name}
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                  <CardDescription>Tekan Enter atau koma untuk menambah tag</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Tags Display */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="px-3 py-1.5 text-sm font-medium gap-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                          onClick={() => removeTag(tag)}
                        >
                          {tag}
                          <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Tag Input */}
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Ketik tag dan tekan Enter..."
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    {tags.length} tag ditambahkan
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
