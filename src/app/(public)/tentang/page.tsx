import type { Metadata } from 'next'
import Header from '@/themes/default/Header'
import Footer from '@/themes/default/sections/Footer'
import About from '@/themes/default/sections/About'
import VisiMisi from '@/themes/default/sections/VisiMisi'
import Team from '@/themes/default/sections/Team'
import Partners from '@/themes/default/sections/Partners'
import Cta from '@/themes/default/sections/Cta'

export const metadata: Metadata = {
  title: 'Tentang Kami - SIOP',
  description: 'Tentang organisasi SIOP, visi misi, dan struktur organisasi',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header config={{ transparent: true }} />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 py-24">
          <div className="container mx-auto px-4 text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Tentang Kami</h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Mengenal lebih dekat organisasi kami, visi misi, dan orang-orang di baliknya
            </p>
          </div>
        </section>

        <About
          config={{
            variant: 'default',
            title: 'Profil Organisasi',
            subtitle: 'Sistem Informasi Organisasi Profesional',
            content: `
              <p><strong>SIOP</strong> (Sistem Informasi Organisasi Profesional) adalah organisasi yang bergerak di bidang sosial dan kemanusiaan yang berdiri sejak tahun 2014.</p>
              <p>Kami berkomitmen untuk membangun masyarakat yang lebih baik melalui kolaborasi, profesionalisme, dan inovasi dalam setiap program kerja yang kami jalankan.</p>
              <p>Dengan dukungan dari berbagai pihak, kami telah berhasil menjalankan puluhan program kerja yang memberikan manfaat nyata bagi masyarakat.</p>
            `,
            image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800',
            imagePosition: 'right',
            showStats: true,
            stats: [
              { value: '500+', label: 'Anggota' },
              { value: '50+', label: 'Program' },
              { value: '10+', label: 'Tahun' }
            ]
          }}
        />

        <VisiMisi
          config={{
            variant: 'default',
            title: 'Visi & Misi Kami',
            vision: 'Menjadi organisasi profesional yang memberikan kontribusi nyata bagi kemajuan masyarakat dan bangsa melalui kolaborasi, inovasi, dan keberlanjutan.',
            missionTitle: 'Misi Kami',
            missions: [
              { number: '1', text: 'Meningkatkan kesejahteraan masyarakat melalui program-program sosial yang berkelanjutan' },
              { number: '2', text: 'Mengembangkan sumber daya manusia yang profesional dan berdaya saing tinggi' },
              { number: '3', text: 'Membangun jejaring kerja sama dengan pemerintah, swasta, dan komunitas lainnya' },
              { number: '4', text: 'Melakukan inovasi dalam pemberdayaan masyarakat dan pelestarian lingkungan' },
              { number: '5', text: 'Menjalankan tata kelola organisasi yang transparan dan akuntabel' }
            ]
          }}
        />

        <Team
          config={{
            variant: 'default',
            title: 'Struktur Organisasi',
            subtitle: 'Tim pengurus yang berpengalaman dan berdedikasi',
            layout: 'grid',
            members: [
              { name: 'Ahmad Wijaya', position: 'Ketua Umum', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400', bio: 'Berpengalaman lebih dari 15 tahun di organisasi sosial' },
              { name: 'Sari Dewi', position: 'Sekretaris Jenderal', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', bio: 'Spesialis manajemen organisasi' },
              { name: 'Budi Santoso', position: 'Bendahara Umum', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', bio: 'Ahli keuangan dan manajemen' },
              { name: 'Rina Susilo', position: 'Koordinator Program', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', bio: 'Pengalaman di bidang pemberdayaan masyarakat' }
            ]
          }}
        />

        <Partners
          config={{
            title: 'Mitra & Partner',
            subtitle: 'Berbagi keberhasilan dengan mitra strategis kami',
            showTiers: true,
            partners: [
              { name: 'Perusahaan A', tier: 'platinum', website: '#' },
              { name: 'Perusahaan B', tier: 'gold', website: '#' },
              { name: 'Perusahaan C', tier: 'gold', website: '#' },
              { name: 'Perusahaan D', tier: 'silver', website: '#' },
              { name: 'Perusahaan E', tier: 'silver', website: '#' },
              { name: 'Perusahaan F', tier: 'silver', website: '#' }
            ]
          }}
        />

        <Cta
          config={{
            title: 'Bergabung dengan Kami',
            subtitle: 'Jadilah bagian dari organisasi yang memberikan dampak positif',
            primaryCtaText: 'Daftar Sekarang',
            primaryCtaLink: '/daftar'
          }}
        />
      </main>
      <Footer />
    </div>
  )
}
