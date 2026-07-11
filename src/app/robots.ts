import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://siop.example.com'

  return {
    rules: [
      {
        // Allow all public pages
        userAgent: '*',
        allow: [
          '/',
          '/tentang',
          '/berita',
          '/berita/*',
          '/galeri',
          '/kontak',
          '/program',
          '/events',
          '/events/*',
        ],
        // Disallow all dashboard and API routes
        disallow: [
          '/dashboard',
          '/api',
          '/login',
          '/register',
          '/verify',
          '/admin',
          '/_next',
          '/favicon.ico',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
