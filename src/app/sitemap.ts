import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://siop.example.com'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/tentang`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/berita`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/galeri`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/kontak`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]

  // Get published pages from database
  const publishedPages = await prisma.page.findMany({
    where: { isPublished: true },
    select: {
      slug: true,
      updatedAt: true,
    },
    take: 100,
  })

  const pageUrls: MetadataRoute.Sitemap = publishedPages.map((page) => ({
    url: `${baseUrl}/${page.slug}`,
    lastModified: page.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Get published posts
  const publishedPosts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      slug: true,
      updatedAt: true,
    },
    take: 100,
  })

  const postUrls: MetadataRoute.Sitemap = publishedPosts.map((post) => ({
    url: `${baseUrl}/berita/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // Get published events
  const events = await prisma.calendarEvent.findMany({
    where: { isPublic: true },
    select: {
      id: true,
      startDate: true,
      updatedAt: true,
    },
    take: 50,
  })

  const eventUrls: MetadataRoute.Sitemap = events.map((event) => ({
    url: `${baseUrl}/events/${event.id}`,
    lastModified: event.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }))

  return [...staticPages, ...pageUrls, ...postUrls, ...eventUrls]
}
