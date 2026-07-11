import type { Metadata } from 'next'
import Header from '@/themes/organ2-style/Header'
import Footer from '@/themes/organ2-style/sections/Footer'
import Hero from '@/themes/organ2-style/sections/Hero'
import About from '@/themes/organ2-style/sections/About'
import VisiMisi from '@/themes/organ2-style/sections/VisiMisi'
import Programs from '@/themes/organ2-style/sections/Programs'
import Stats from '@/themes/organ2-style/sections/Stats'
import Team from '@/themes/organ2-style/sections/Team'
import Cta from '@/themes/organ2-style/sections/Cta'

export const metadata: Metadata = {
  title: 'Beranda',
  description: 'HubbHQ - Sistem Informasi Organisasi Modern',
  keywords: ['organisasi', 'organ2', 'sistem informasi', 'manajemen'],
  alternates: { canonical: '/organ2-style' },
  openGraph: {
    title: 'HubbHQ - Organ2 Style',
    description: 'Website resmi HubbHQ - Sistem Informasi Organisasi Modern',
    url: '/organ2-style',
    siteName: 'HubbHQ',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'HubbHQ Organization' }],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HubbHQ - Organ2 Style',
    description: 'Sistem Informasi Organisasi Modern',
    images: ['/og-image.png'],
  },
}

export default function Organ2StyleHomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* Hero Section - Split variant */}
        <Hero
          config={{
            variant: 'split',
            title: 'Organisasi Modern',
            subtitle: 'Bersama Membangun Negeri',
            description: 'Kami adalah organisasi yang berdedikasi untuk membangun Indonesia yang lebih baik melalui pemberdayaan masyarakat dan generasi muda.',
            ctaText: 'Pelajari Lebih Lanjut',
            ctaLink: '/tentang',
            ctaSecondaryText: 'Bergabung Sekarang',
            ctaSecondaryLink: '/anggota/daftar',
            showScrollIndicator: false,
          }}
        />

        {/* Stats Section */}
        <Stats
          config={{
            variant: 'default',
            animate: true,
            columns: '4',
            stats: [
              { value: '500+', label: 'Anggota Aktif' },
              { value: '50+', label: 'Program Kerja' },
              { value: '20+', label: 'Daerah' },
              { value: '10+', label: 'Tahun Berdiri' }
            ]
          }}
        />

        {/* About Section - Cards variant */}
        <About
          config={{
            variant: 'cards',
            title: 'Tentang Kami',
            subtitle: 'Tentang Organisasi',
            description: 'Kami adalah organisasi yang berfokus pada pemberdayaan masyarakat dan generasi muda Indonesia.',
            features: [
              { icon: '🎯', title: 'Visi', description: 'Menjadi organisasi yang unggul dalam pemberdayaan masyarakat dan generasi muda Indonesia.', link: '/visi-misi' },
              { icon: '🛡️', title: 'Misi', description: 'Mengembangkan potensi generasi muda melalui pendidikan, pelatihan, dan kegiatan sosial.', link: '/visi-misi' },
              { icon: '👥', title: 'Nilai-Nilai', description: 'Berpegang pada nilai-nilai kebangsaan, keadilan, dan kesejahteraan rakyat.', link: '/tentang' },
            ],
            ctaText: 'Selengkapnya',
            ctaLink: '/tentang'
          }}
        />

        {/* Visi Misi Section */}
        <VisiMisi
          config={{
            title: 'Visi & Misi Kami',
            vision: 'Menjadi organisasi profesional yang memberikan kontribusi nyata bagi kemajuan masyarakat dan bangsa.',
            missionTitle: 'Misi Kami',
            missions: [
              { number: '1', text: 'Meningkatkan kesejahteraan masyarakat melalui program-program sosial' },
              { number: '2', text: 'Mengembangkan sumber daya manusia yang profesional dan berdaya saing' },
              { number: '3', text: 'Membangun jejaring kerja sama dengan berbagai pihak terkait' },
              { number: '4', text: 'Melakukan inovasi dalam pemberdayaan masyarakat' }
            ]
          }}
        />

        {/* Programs Section - Cards variant */}
        <Programs
          config={{
            variant: 'cards',
            title: 'Program Kerja',
            subtitle: 'Apa Yang Kami Lakukan',
            description: 'Berbagai program kerja untuk meningkatkan kapasitas dan kesejahteraan masyarakat.',
            columns: '3',
            programs: [
              { title: 'Pendidikan', description: 'Program beasiswa dan pelatihan untuk masyarakat.', icon: '📚', image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800', link: '/program/pendidikan' },
              { title: 'Kesehatan', description: 'Penyuluhan dan layanan kesehatan gratis.', icon: '🏥', image: 'https://images.unsplash.com/photo-1576091160399-1129e8d78d3e?w=800', link: '/program/kesehatan' },
              { title: 'Lingkungan', description: 'Gerakan penghijauan dan pengelolaan sampah.', icon: '🌱', image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800', link: '/program/lingkungan' },
              { title: 'Ekonomi', description: 'Pelatihan kewirausahaan dan bantuan modal.', icon: '💰', image: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800', link: '/program/ekonomi' },
              { title: 'Sosial', description: 'Bantuan sosial dan bencana alam.', icon: '❤️', image: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800', link: '/program/sosial' },
              { title: 'Budaya', description: 'Pelestarian budaya lokal.', icon: '🎭', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800', link: '/program/budaya' },
            ],
            ctaText: 'Lihat Semua Program',
            ctaLink: '/program'
          }}
        />

        {/* Team Section */}
        <Team
          config={{
            variant: 'grid',
            title: 'Tim Kami',
            subtitle: 'Pengurus',
            members: [
              { name: 'Ahmad Wijaya', position: 'Ketua Umum', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400', bio: 'Berpengalaman lebih dari 15 tahun di organisasi sosial' },
              { name: 'Sari Dewi', position: 'Sekretaris Jenderal', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', bio: 'Spesialis manajemen organisasi' },
              { name: 'Budi Santoso', position: 'Bendahara Umum', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', bio: 'Ahli keuangan dan manajemen' },
              { name: 'Rina Susilo', position: 'Koordinator Program', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', bio: 'Pengalaman di bidang pemberdayaan masyarakat' }
            ]
          }}
        />

        {/* CTA Section */}
        <Cta
          config={{
            title: 'Bergabunglah Bersama Kami',
            subtitle: 'Jadilah bagian dari perubahan positif',
            description: 'Kami membuka kesempatan bagi siapa saja yang ingin berkontribusi dan berkembang bersama untuk membangun Indonesia yang lebih adil dan sejahtera.',
            primaryCtaText: 'Daftar Sekarang',
            primaryCtaLink: '/anggota/daftar',
            secondaryCtaText: 'Hubungi Kami',
            secondaryCtaLink: '/kontak',
            contactPhone: '+62 21 1234 5678',
            contactEmail: 'info@konfederasipergerakan.org'
          }}
        />
      </main>

      <Footer />
    </div>
  )
}
