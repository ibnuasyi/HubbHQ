import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/themes/default/Header'
import Footer from '@/themes/default/sections/Footer'

export const metadata: Metadata = {
  title: 'Berita - SIOP',
  description: 'Berita dan artikel terbaru dari SIOP',
}

export default function BeritaPage() {
  // This would normally fetch from API
  const posts = [
    {
      id: '1',
      title: 'SIOP Launching Program Beasiswa 2024',
      slug: 'siop-launching-program-beasiswa-2024',
      excerpt: 'Program beasiswa untuk mahasiswa kurang mampu resmi diluncurkan dengan target 100 penerima.',
      featuredImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
      category: 'Program',
      publishedAt: '2024-01-15',
      author: { name: 'Tim SIOP' }
    },
    {
      id: '2',
      title: 'Workshop Digital Marketing untuk UMKM',
      slug: 'workshop-digital-marketing-umkm',
      excerpt: 'Pelatihan digital marketing gratis untuk pelaku UMKM di wilayah Jakarta.',
      featuredImage: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800',
      category: 'Workshop',
      publishedAt: '2024-01-10',
      author: { name: 'Tim SIOP' }
    },
    {
      id: '3',
      title: ' aksi Bersih-Bersih Pantai',
      slug: 'aksi-bersih-bersih-pantai',
      excerpt: 'Ribuan volunteer hadir dalam aksi bersih-bersih pantai yang diikuti seluruh anggota.',
      featuredImage: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800',
      category: 'Kegiatan',
      publishedAt: '2024-01-05',
      author: { name: 'Tim SIOP' }
    },
    {
      id: '4',
      title: 'Kolaborasi dengan Pemerintah Daerah',
      slug: 'kolaborasi-dengan-pemerintah-daerah',
      excerpt: 'SIOP resmi menjalin kerja sama dengan pemerintah daerah untuk program pemberdayaan masyarakat.',
      featuredImage: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800',
      category: 'Kerja Sama',
      publishedAt: '2024-01-01',
      author: { name: 'Tim SIOP' }
    }
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 py-24">
          <div className="container mx-auto px-4 text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Berita & Artikel</h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Informasi terbaru tentang kegiatan dan program kami
            </p>
          </div>
        </section>

        {/* Posts Grid */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                >
                  <Link href={`/berita/${post.slug}`} className="block">
                    <div className="relative aspect-video">
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-4 left-4 px-3 py-1 bg-indigo-600 text-white text-sm rounded-full">
                        {post.category}
                      </span>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <span>{new Date(post.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span>•</span>
                        <span>{post.author.name}</span>
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-indigo-600 transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-gray-600 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <span className="inline-flex items-center text-indigo-600 font-medium mt-4">
                        Baca selengkapnya
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-12">
              <nav className="flex gap-2">
                <button className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50" disabled>
                  Previous
                </button>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg">1</button>
                <button className="px-4 py-2 border rounded-lg hover:bg-gray-100">2</button>
                <button className="px-4 py-2 border rounded-lg hover:bg-gray-100">3</button>
                <button className="px-4 py-2 border rounded-lg hover:bg-gray-100">
                  Next
                </button>
              </nav>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
