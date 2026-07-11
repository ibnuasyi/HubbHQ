import type { Metadata } from 'next'
import Header from '@/themes/default/Header'
import Footer from '@/themes/default/sections/Footer'
import Gallery from '@/themes/default/sections/Gallery'

export const metadata: Metadata = {
  title: 'Galeri - SIOP',
  description: 'Dokumentasi kegiatan dan foto-foto SIOP',
}

export default function GaleriPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 py-24">
          <div className="container mx-auto px-4 text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Galeri Kegiatan</h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Dokumentasi foto kegiatan dan event yang telah kami jalankan
            </p>
          </div>
        </section>

        <Gallery
          config={{
            title: '',
            columns: '3',
            lightbox: true,
            showFilter: true
          }}
        />
      </main>
      <Footer />
    </div>
  )
}
