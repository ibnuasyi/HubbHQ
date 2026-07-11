'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Post {
  id: string
  title: string
  excerpt: string
  slug: string
  category?: string
  featuredImage?: string
  publishedAt?: string
  author?: {
    name: string
  }
}

interface BlogSectionProps {
  title?: string
  subtitle?: string
  description?: string
  posts: Post[]
  showViewAll?: boolean
  viewAllLink?: string
  viewAllText?: string
  limit?: number
}

export function BlogSection({
  title = 'Berita & Artikel',
  subtitle,
  description,
  posts,
  showViewAll = true,
  viewAllLink = '/posts',
  viewAllText = 'Lihat Semua Berita',
  limit = 3,
}: BlogSectionProps) {
  const displayPosts = posts.slice(0, limit)

  return (
    <section className="py-16 lg:py-24 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          {subtitle && (
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
              {subtitle}
            </p>
          )}
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            {title}
          </h2>
          {description && (
            <p className="mt-4 text-lg text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        {/* Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayPosts.map((post) => (
            <Link key={post.id} href={`/posts/${post.slug}`}>
              <Card className="group h-full overflow-hidden hover:shadow-lg transition-all duration-300">
                {/* Featured Image */}
                {post.featuredImage && (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <CardHeader>
                  {/* Category Badge */}
                  {post.category && (
                    <Badge variant="secondary" className="w-fit mb-2">
                      {post.category}
                    </Badge>
                  )}
                  <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-3">
                    {post.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    {post.author && (
                      <span>{post.author.name}</span>
                    )}
                  </div>
                  {post.publishedAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.publishedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* View All Button */}
        {showViewAll && (
          <div className="text-center mt-12">
            <Link href={viewAllLink}>
              <button className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-primary text-primary font-medium hover:bg-primary hover:text-primary-foreground transition-colors">
                {viewAllText}
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
