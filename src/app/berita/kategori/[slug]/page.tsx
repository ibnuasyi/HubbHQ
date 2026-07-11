'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Calendar, Tag, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  category: string
  featuredImage: string
  isPublished: boolean
  publishedAt: string
  createdAt: string
}

interface Category {
  id: string
  name: string
  slug: string
  color: string
}

export default function CategoryPage() {
  const params = useParams()
  const slug = params.slug as string

  const [posts, setPosts] = useState<Post[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [slug])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch category details
      const catRes = await fetch(`/api/categories?slug=${slug}`)
      if (catRes.ok) {
        const catData = await catRes.json()
        if (catData.categories && catData.categories.length > 0) {
          setCategory(catData.categories[0])
        } else if (catData.id) {
          setCategory(catData)
        }
      }

      // Fetch posts with this category
      const postsRes = await fetch(`/api/posts?category=${slug}&published=true`)
      if (postsRes.ok) {
        const postsData = await postsRes.json()
        setPosts(postsData.posts || postsData || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary/5 border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/berita" className="hover:text-primary">
              Berita
            </Link>
            <span>/</span>
            <span>Kategori</span>
          </div>

          <div className="flex items-center gap-3">
            {category?.color && (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
                style={{ backgroundColor: category.color }}
              >
                <Tag className="w-6 h-6" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">
                {category?.name || slug}
              </h1>
              <p className="text-muted-foreground mt-1">
                {posts.length} post dalam kategori ini
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Belum ada post</h2>
            <p className="text-muted-foreground mb-6">
              Belum ada post dalam kategori ini
            </p>
            <Button asChild>
              <Link href="/berita">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Berita
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/berita/${post.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  {post.featuredImage && (
                    <div className="aspect-video overflow-hidden rounded-t-lg">
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(post.publishedAt || post.createdAt)}
                    </div>
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-primary">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-muted-foreground text-sm line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8">
          <Button variant="outline" asChild>
            <Link href="/berita">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Semua Berita
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
