'use client'

import * as React from 'react'
import { WebsiteHeader, WebsiteFooter } from '@/components/website'
import {
  HeroSection,
  FeatureSection,
  BlogSection,
  CTASection,
  StatsSection,
} from '@/components/website'
import {
  Users,
  Target,
  Shield,
  GraduationCap,
  Heart,
  Megaphone,
  FileText,
  Calendar,
  BookOpen,
} from 'lucide-react'

// Sample data - replace with actual API calls
const statsData = [
  { value: '500', label: 'Anggota Aktif', suffix: '+' },
  { value: '25', label: 'Program Kerja', suffix: '+' },
  { value: '10', label: 'Tahun Berdiri', suffix: '+' },
  { value: '15', label: 'Daerah', suffix: '+' },
]

const tentangFeatures = [
  {
    icon: Target,
    title: 'Visi Kami',
    description: 'Menjadi organisasi yang unggul dalam pemberdayaan masyarakat dan generasi muda Indonesia.',
    link: '/visi-misi',
  },
  {
    icon: Shield,
    title: 'Misi Kami',
    description: 'Mengembangkan potensi generasi muda melalui pendidikan, pelatihan, dan kegiatan sosial.',
    link: '/visi-misi',
  },
  {
    icon: Users,
    title: 'Nilai-Nilai',
    description: 'Berpegang pada nilai-nilai kebangsaan, keadilan, dan kesejahteraan rakyat.',
    link: '/tentang-kami',
  },
]

const programFeatures = [
  {
    icon: GraduationCap,
    title: 'Pendidikan',
    description: 'Program pelatihan dan pengembangan kapasitas anggota untuk masa depan yang lebih baik.',
    link: '/program/pendidikan',
  },
  {
    icon: Heart,
    title: 'Sosial',
    description: 'Kegiatan bakti sosial dan pemberdayaan masyarakat di berbagai daerah.',
    link: '/program/sosial',
  },
  {
    icon: Megaphone,
    title: 'Advokasi',
    description: 'Perjuangan hak-hak rakyat melalui advokasi kebijakan yang berpihak pada rakyat.',
    link: '/program/advokasi',
  },
]

// Sample posts - replace with actual API
const samplePosts = [
  {
    id: '1',
    title: 'Pelantikan Pengurus Baru Periode 2026-2028',
    excerpt: 'Pelantikan pengurus baru telah dilaksanakan dengan penuh semangat dan harapan untuk masa depan yang lebih baik.',
    slug: 'pelantikan-pengurus-baru',
    category: 'Pengumuman',
    publishedAt: '2026-07-01',
    featuredImage: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&auto=format&fit=crop',
    author: { name: 'Admin' },
  },
  {
    id: '2',
    title: 'Workshop Pengembangan Kader Muda',
    excerpt: 'Workshop untuk mengembangkan kemampuan dan kapasitas kader muda dalam organisasi.',
    slug: 'workshop-kader-muda',
    category: 'Agenda',
    publishedAt: '2026-06-28',
    featuredImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop',
    author: { name: 'Admin' },
  },
  {
    id: '3',
    title: 'Bakti Sosial di Pedalaman Jawa',
    excerpt: 'Kegiatan bakti sosial yang dilakukan di beberapa daerah pedalaman untuk membantu masyarakat.',
    slug: 'bakti-sosial',
    category: 'Berita',
    publishedAt: '2026-06-25',
    featuredImage: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&auto=format&fit=crop',
    author: { name: 'Admin' },
  },
]

export default function WebsiteHomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <WebsiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection
          subtitle="Bersama Membangun Negeri"
          primaryButtonText="Pelajari Lebih Lanjut"
          primaryButtonLink="/tentang-kami"
          secondaryButtonText="Bergabung Sekarang"
          secondaryButtonLink="/anggota/daftar"
          showVideoButton={false}
        />

        {/* Stats Section */}
        <StatsSection
          stats={statsData}
          backgroundStyle="primary"
        />

        {/* Tentang Kami Section */}
        <FeatureSection
          subtitle="Tentang Kami"
          title="Siapa Kami?"
          description="Kami adalah organisasi yang berdedikasi untuk membangun Indonesia yang lebih baik melalui pemberdayaan masyarakat."
          features={tentangFeatures}
          columns={3}
          showViewAll={true}
          viewAllLink="/tentang-kami"
          viewAllText="Selengkapnya"
        />

        {/* Program Kerja Section */}
        <FeatureSection
          subtitle="Program Kerja"
          title="Apa Yang Kami Lakukan"
          description="Berbagai program kerja untuk meningkatkan kapasitas dan kesejahteraan masyarakat."
          features={programFeatures}
          columns={3}
          backgroundStyle="muted"
          showViewAll={true}
          viewAllLink="/program-kerja"
          viewAllText="Lihat Semua Program"
        />

        {/* Berita Section */}
        <BlogSection
          title="Berita & Artikel Terbaru"
          description="Ikuti kabar terbaru dari organisasi kami."
          posts={samplePosts}
          showViewAll={true}
          viewAllLink="/posts"
          viewAllText="Lihat Semua Berita"
        />

        {/* CTA Section */}
        <CTASection
          title="Bergabunglah Bersama Kami"
          description="Jadilah bagian dari gerakan kami dalam membangun Indonesia yang lebih adil dan sejahtera."
          primaryButtonText="Daftar Sekarang"
          primaryButtonLink="/anggota/daftar"
          secondaryButtonText="Hubungi Kami"
          secondaryButtonLink="/kontak"
          backgroundStyle="primary"
        />
      </main>

      <WebsiteFooter />
    </div>
  )
}
