import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import Header from '@/themes/default/Header'
import Footer from '@/themes/default/sections/Footer'
import SanitizedHtml from '@/components/SanitizedHtml'
import { Calendar, Tag, User, ArrowLeft, Share2, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const post = await prisma.post.findUnique({
    where: { slug },
  })

  if (!post) {
    return {
      title: 'Artikel Tidak Ditemukan',
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://siop.example.com'
  const postUrl = `${baseUrl}/berita/${post.slug}`

  return {
    title: post.title,
    description: post.excerpt || `${post.title} - SIOP`,
    keywords: post.tags?.split(',').map(t => t.trim()).filter(Boolean) || [],
    authors: [{ name: post.authorName || 'SIOP' }],
    openGraph: {
      title: post.title,
      description: post.excerpt || `${post.title} - SIOP`,
      url: postUrl,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      images: post.featuredImage ? [
        {
          url: post.featuredImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || `${post.title} - SIOP`,
      images: post.featuredImage ? [post.featuredImage] : [],
    },
    alternates: {
      canonical: `/berita/${post.slug}`,
    },
  }
}

export default async function BeritaDetailPage({ params }: Props) {
  const { slug } = await params

  // Fetch post dari database
  const post = await prisma.post.findUnique({
    where: { slug },
  })

  if (!post || post.status !== 'PUBLISHED') {
    notFound()
  }

  // Fetch related posts (same category, exclude current)
  const relatedPosts = post.category
    ? await prisma.post.findMany({
        where: {
          category: post.category,
          status: 'PUBLISHED',
          NOT: { id: post.id },
        },
        take: 3,
        orderBy: { publishedAt: 'desc' },
      })
    : await prisma.post.findMany({
        where: { status: 'PUBLISHED', NOT: { id: post.id } },
        take: 3,
        orderBy: { publishedAt: 'desc' },
      })

  // Format category slug dari nama
  const categorySlug = post.category?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ''

  // Generate share URLs
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(`${post.title}\n${shareUrl}`)}`

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/berita" className="hover:text-primary flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Berita
            </Link>
            {post.category && (
              <>
                <span>/</span>
                <Link
                  href={`/berita/kategori/${categorySlug}`}
                  className="hover:text-primary"
                >
                  {post.category}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Hero Image */}
        <section className="relative h-80 md:h-96">
          {post.featuredImage ? (
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 pb-8 text-white">
            {post.category && (
              <Link href={`/berita/kategori/${categorySlug}`}>
                <Badge className="mb-4 bg-primary hover:bg-primary/90 cursor-pointer">
                  <Tag className="w-3 h-3 mr-1" />
                  {post.category}
                </Badge>
              </Link>
            )}
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
            <div className="flex items-center gap-4 text-white/80 flex-wrap">
              {post.authorName && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{post.authorName}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })
                    : 'Tidak dipublikasi'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              {post.excerpt && (
                <div className="text-lg text-muted-foreground mb-8 pb-8 border-b">
                  {post.excerpt}
                </div>
              )}

              <SanitizedHtml
                html={post.content}
                className="prose prose-lg max-w-none"
              />

              {/* Tags */}
              {post.tags && (
                <div className="mt-8 pt-8 border-t">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">Tags:</span>
                    {post.tags.split(',').map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Share */}
              <div className="mt-12 pt-8 border-t">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Bagikan:
                  </span>
                  <div className="flex gap-2">
                    <a
                      href={twitterShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
                    >
                      𝕏
                    </a>
                    <a
                      href={whatsappShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-green-500 text-white rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors"
                    >
                      📱
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="py-16 bg-muted/50">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold mb-8">Artikel Lainnya</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.id}
                    href={`/berita/${related.slug}`}
                    className="bg-background rounded-xl overflow-hidden shadow hover:shadow-lg transition-shadow"
                  >
                    {related.featuredImage && (
                      <div className="aspect-video">
                        <img
                          src={related.featuredImage}
                          alt={related.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-lg line-clamp-2 hover:text-primary">
                        {related.title}
                      </h3>
                      {related.excerpt && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {related.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {related.publishedAt
                          ? new Date(related.publishedAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : ''}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}
