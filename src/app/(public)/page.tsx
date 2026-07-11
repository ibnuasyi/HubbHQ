import type { Metadata } from 'next'
import Header from '@/themes/default/Header'
import Footer from '@/themes/default/sections/Footer'
import Hero from '@/themes/default/sections/Hero'
import About from '@/themes/default/sections/About'
import VisiMisi from '@/themes/default/sections/VisiMisi'
import Programs from '@/themes/default/sections/Programs'
import Stats from '@/themes/default/sections/Stats'
import Team from '@/themes/default/sections/Team'
import Cta from '@/themes/default/sections/Cta'
import Contact from '@/themes/default/sections/Contact'
import Newsletter from '@/themes/default/sections/Newsletter'

// Homepage SEO metadata
export const metadata: Metadata = {
  title: 'Beranda',
  description: 'Website resmi Konfederasi Pergerakan Rakyat Indonesia - Membangun Gerakan yang Kuat untuk Rakyat',
  keywords: ['organisasi', 'gerakan', 'rakyat', 'kebangsaan', 'kPRI'],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'KPRI - Konfederasi Pergerakan Rakyat Indonesia',
    description: 'Website resmi KPRI - Membangun Gerakan yang Kuat untuk Rakyat',
    url: '/',
    siteName: 'KPRI',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'KPRI Organization',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KPRI - Konfederasi Pergerakan Rakyat Indonesia',
    description: 'Membangun Gerakan yang Kuat untuk Rakyat',
    images: ['/og-image.png'],
  },
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero
          config={{
            variant: 'default',
            title: 'Konfederasi Pergerakan Rakyat Indonesia',
            subtitle: 'Bersama Membangun Negeri',
            content: '<p>Kami adalah organisasi yang berdedikasi untuk membangun Indonesia yang lebih baik melalui pemberdayaan masyarakat dan generasi muda.</p>',
            ctaText: 'Pelajari Lebih Lanjut',
            ctaLink: '/tentang',
            ctaSecondaryText: 'Bergabung Sekarang',
            ctaSecondaryLink: '/anggota/daftar',
            showScrollIndicator: true,
          }}
        />

        <Stats
          config={{
            animate: true,
            columns: '4',
            stats: [
              { value: '500+', label: 'Anggota Aktif', icon: '👥' },
              { value: '50+', label: 'Program Kerja', icon: '📋' },
              { value: '20+', label: 'Mitra', icon: '🤝' },
              { value: '10+', label: 'Tahun Pengalaman', icon: '🏆' }
            ]
          }}
        />

        <About
          config={{
            variant: 'cards',
            title: 'Tentang KPRI',
            subtitle: 'Tentang Kami',
            content: 'Kami adalah organisasi yang berfokus pada pemberdayaan masyarakat dan generasi muda Indonesia.',
            features: [
              { icon: '🎯', title: 'Visi', description: 'Menjadi organisasi yang unggul dalam pemberdayaan masyarakat dan generasi muda Indonesia.', link: '/visi-misi' },
              { icon: '🛡️', title: 'Misi', description: 'Mengembangkan potensi generasi muda melalui pendidikan, pelatihan, dan kegiatan sosial.', link: '/visi-misi' },
              { icon: '👥', title: 'Nilai-Nilai', description: 'Berpegang pada nilai-nilai kebangsaan, keadilan, dan kesejahteraan rakyat.', link: '/tentang-kami' },
            ],
            ctaText: 'Selengkapnya',
            ctaLink: '/tentang'
          }}
        />

        <VisiMisi
          config={{
            title: 'Visi & Misi',
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

        <Programs
          config={{
            variant: 'default',
            title: 'Program Kerja',
            subtitle: 'Apa Yang Kami Lakukan',
            columns: '3',
            programs: [
              { title: 'Pendidikan', description: 'Program beasiswa dan pelatihan untuk masyarakat.', icon: '📚' },
              { title: 'Kesehatan', description: 'Penyuluhan dan layanan kesehatan gratis.', icon: '🏥' },
              { title: 'Lingkungan', description: 'Gerakan penghijauan dan pengelolaan sampah.', icon: '🌱' },
              { title: 'Ekonomi', description: 'Pelatihan kewirausahaan dan bantuan modal.', icon: '💰' },
              { title: 'Sosial', description: 'Bantuan sosial dan bencana alam.', icon: '❤️' },
              { title: 'Budaya', description: 'Pelestarian budaya lokal.', icon: '🎭' }
            ],
            ctaText: 'Lihat Semua Program',
            ctaLink: '/program'
          }}
        />

        <Team
          config={{
            title: 'Tim Kami',
            subtitle: 'Pengurus dan volunteers yang berdedikasi tinggi',
            layout: 'grid',
            members: [
              { name: 'Ahmad Wijaya', position: 'Ketua Umum', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400', bio: 'Berpengalaman lebih dari 15 tahun di organisasi sosial' },
              { name: 'Sari Dewi', position: 'Sekretaris Jenderal', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', bio: 'Spesialis manajemen organisasi' },
              { name: 'Budi Santoso', position: 'Bendahara Umum', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', bio: 'Ahli keuangan dan manajemen' },
              { name: 'Rina Susilo', position: 'Koordinator Program', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', bio: 'Pengalaman di bidang pemberdayaan masyarakat' }
            ]
          }}
        />

        <Cta
          config={{
            title: 'Bergabung dengan Kami',
            subtitle: 'Jadilah bagian dari perubahan positif untuk masyarakat',
            description: 'Kami membuka kesempatan bagi siapa saja yang ingin berkontribusi dan berkembang bersama',
            primaryCtaText: 'Daftar Sekarang',
            primaryCtaLink: '/anggota/daftar',
            secondaryCtaText: 'Hubungi Kami',
            secondaryCtaLink: '/kontak'
          }}
        />

        <Newsletter
          config={{
            title: 'Berlangganan Newsletter',
            subtitle: 'Dapatkan update terbaru tentang kegiatan kami',
            buttonText: 'Berlangganan'
          }}
        />

        <Contact
          config={{
            title: 'Hubungi Kami',
            subtitle: 'Kami siap membantu dan menjawab pertanyaan Anda',
            address: 'Jl. Merdeka No. 123, Jakarta Pusat 10110',
            phone: '+62 21 1234 5678',
            email: 'info@konfederasipergerakan.org',
            whatsapp: '6281234567890',
            showForm: true
          }}
        />
      </main>
      <Footer />
    </div>
  )
}
