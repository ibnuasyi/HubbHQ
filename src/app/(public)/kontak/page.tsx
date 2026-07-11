import type { Metadata } from 'next'
import Header from '@/themes/default/Header'
import Footer from '@/themes/default/sections/Footer'
import Contact from '@/themes/default/sections/Contact'

export const metadata: Metadata = {
  title: 'Kontak - SIOP',
  description: 'Hubungi kami untuk informasi lebih lanjut',
}

export default function KontakPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 py-24">
          <div className="container mx-auto px-4 text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Hubungi Kami</h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Kami siap membantu dan menjawab pertanyaan Anda
            </p>
          </div>
        </section>

        <Contact
          config={{
            variant: 'default',
            title: '',
            subtitle: '',
            address: 'Jl. Sudirman No. 123, Jakarta Pusat 10220',
            phone: '+62 21 1234 5678',
            email: 'info@siop.org',
            whatsapp: '6281234567890',
            mapsEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.521260322283!2d106.8195613507864!3d-6.194741395493371!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f5390917b759%3A0x6b45e67356080477!2sMonas%2C%20Jakarta!5e0!3m2!1sen!2sid!4v1690000000000!5m2!1sen!2sid',
            showForm: true
          }}
        />
      </main>
      <Footer />
    </div>
  )
}
