# Panduan Pengembangan Tema HubbHQ

Dokumen ini menjelaskan arsitektur, struktur folder, konvensi section, dan tata cara pembuatan tema kustom untuk website builder pada platform HubbHQ.

---

## 1. Arsitektur Mesin Tema

HubbHQ mengadopsi arsitektur tema modular berbasis Next.js App Router dan Tailwind CSS. Setiap tema memiliki identitas terisolasi yang mendefinisikan palet warna, tipografi, radius sudut, variasi header/footer, serta komponen visual section.

### Fitur Kunci Mesin Tema:
- **Pemuatan Dinamis Otomatis:** Berkas `src/lib/themes.ts` secara dinamis memuat komponen dan konfigurasi section berdasarkan `slug` tema dari direktori `@/themes/[theme-slug]/sections/`.
- **Graceful Fallback:** Apabila suatu tema kustom tidak mengimplementasikan section tertentu (misalnya `newsletter` atau `faq`), mesin tema otomatis menggunakan komponen standar dari tema `default`.
- **Integrasi Website Config:** Seluruh tema secara reaktif membaca metadata organisasi (nama organisasi, deskripsi, logo, favicon, media sosial) melalui hook `useWebsiteConfig`.
- **Manajemen Tema Terpadu:** Pengelola organisasi dapat mengaktifkan, mengkustomisasi, dan melihat pratinjau tema secara langsung melalui antarmuka dasbor di `/dashboard/settings/themes`.

---

## 2. Struktur Direktori Tema

Setiap tema ditempatkan di dalam folder `src/themes/[nama-tema]/` dengan konvensi penamaan folder menggunakan huruf kecil dan tanda hubung (*kebab-case*):

```
src/themes/[nama-tema]/
|-- theme.json              # Manifest metadata, variabel warna, tipografi, & daftar section
|-- Header.tsx              # Komponen header navigasi (mendukung mode transparan & mobile menu)
|-- sections/               # Direktori komponen dan konfigurasi section
|   |-- Hero.config.ts      # Skema konfigurasi field & varian section Hero
|   |-- Hero.tsx            # Komponen visual render section Hero
|   |-- About.config.ts     # Skema konfigurasi field & varian section About
|   |-- About.tsx           # Komponen visual render section About
|   |-- Footer.tsx          # Komponen footer (informasi instansi, link cepat, kontak)
|   +-- ...                 # Komponen section lainnya
+-- preview.jpg             # Berkas gambar pratinjau tema (ukuran 1200x630 piksel)
```

Thumbnail pratinjau juga disarankan disalin ke `public/themes/[nama-tema]/preview.jpg` agar dapat diakses oleh browser pada halaman dasbor dan metadata OpenGraph.

---

## 3. Konfigurasi Manifest (theme.json)

Berkas `theme.json` merupakan titik masuk utama konfigurasi tema. Berkas ini mendefinisikan identitas tema, token warna CSS, tipografi bawaan, serta daftar section yang didukung:

```json
{
  "name": "Organ2 Style",
  "slug": "organ2-style",
  "version": "1.0.0",
  "author": "HubbHQ Core Team",
  "description": "Tema formal untuk organisasi pergerakan dengan layout yang bersih dan profesional",
  "thumbnail": "/themes/organ2-style/preview.jpg",
  "defaultSections": [
    "hero",
    "about",
    "visimisi",
    "programs",
    "stats",
    "team",
    "cta",
    "footer"
  ],
  "availableSections": [
    { "key": "hero", "name": "Hero Section", "icon": "image", "description": "Banner utama dengan headline dan tombol CTA" },
    { "key": "about", "name": "About Section", "icon": "info", "description": "Profil singkat dan sejarah organisasi" },
    { "key": "visimisi", "name": "Visi Misi", "icon": "target", "description": "Visi, misi, dan pilar strategis organisasi" },
    { "key": "programs", "name": "Programs Section", "icon": "folder", "description": "Daftar program kerja dan kegiatan unggulan" },
    { "key": "stats", "name": "Stats Section", "icon": "chart", "description": "Statistik pencapaian dan jumlah kader/alumni" },
    { "key": "team", "name": "Team Section", "icon": "users", "description": "Bagan pimpinan dan struktur kepengurusan" },
    { "key": "contact", "name": "Contact Section", "icon": "mail", "description": "Formulir narahubung dan informasi alamat" },
    { "key": "events", "name": "Events Section", "icon": "calendar", "description": "Kalender dan agenda kegiatan terdekat" },
    { "key": "gallery", "name": "Gallery Section", "icon": "image", "description": "Dokumentasi kegiatan dan arsip foto" },
    { "key": "cta", "name": "CTA Section", "icon": "megaphone", "description": "Banner ajakan bergabung atau berdonasi" },
    { "key": "footer", "name": "Footer", "icon": "layout", "description": "Footer penutup halaman website" }
  ],
  "config": {
    "primaryColor": "#16a34a",
    "secondaryColor": "#15803d",
    "accentColor": "#f59e0b",
    "backgroundColor": "#ffffff",
    "backgroundSecondary": "#f8fafc",
    "textColor": "#1e293b",
    "textMuted": "#64748b",
    "borderColor": "#e2e8f0",
    "fontFamily": "Plus Jakarta Sans",
    "borderRadius": "0.75rem"
  },
  "layouts": {
    "default": {
      "containerWidth": "max-w-7xl",
      "spacing": "py-20"
    },
    "compact": {
      "containerWidth": "max-w-5xl",
      "spacing": "py-12"
    },
    "wide": {
      "containerWidth": "max-w-none px-6",
      "spacing": "py-16"
    }
  }
}
```

---

## 4. Daftar Section Standar yang Didukung

Platform HubbHQ menyediakan 14 tipe section standar yang dapat langsung dipakai atau di-override oleh tema:

| Kunci Section | Nama Modul | Fungsi Utama |
| :--- | :--- | :--- |
| `hero` | Hero Banner | Banner pembuka beranda, judul utama, pengantar, dan tombol aksi (CTA). |
| `about` | Tentang Organisasi | Penjelasan identitas instansi, sejarah singkat, dan foto ilustrasi. |
| `visimisi` | Visi & Misi | Pemaparan visi jangka panjang dan butir-butir misi kerja. |
| `programs` | Program Kerja | Kartu program kegiatan utama yang terhubung dengan divisi kerja. |
| `team` | Struktur Pengurus | Menampilkan foto pimpinan, ketua umum, presidium, atau divisi struktural. |
| `stats` | Counter Statistik | Kartu angka pencapaian (jumlah anggota, cabang, kegiatan sukses). |
| `events` | Kalender Agenda | Daftar kegiatan mendatang dengan tanggal, waktu, dan lokasi. |
| `gallery` | Galeri Dokumentasi | Album foto dan arsip dokumentasi kegiatan organisasi. |
| `documents` | Pusat Dokumen | Berkas publik yang dapat diunduh (AD/ART, SK, formulir pendaftaran). |
| `faq` | Tanya Jawab | Pertanyaan umum seputar organisasi dalam format akordion interaktif. |
| `cta` | Call To Action | Ajakan bergabung menjadi kader/relawan atau tautan pendaftaran acara. |
| `partners` | Kolaborator | Logo instansi mitra, sponsor, atau jejaring lembaga terafiliasi. |
| `newsletter` | Langganan Berita | Kotak input alamat email untuk berlangganan pengumuman organisasi. |
| `contact` | Kotak Kontak | Formulir pesan publik, alamat kantor sekretariat, email, dan telepon. |

---

## 5. Implementasi Komponen Navigasi (Header.tsx)

Komponen `Header.tsx` berfungsi merender bilah navigasi utama pada bagian atas website. Komponen ini wajib mendukung responsivitas perangkat bergerak (*mobile drawer/hamburger*), sinkronisasi logo instansi, serta mode transparan ketika pengguna berada pada posisi puncak halaman:

```tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useWebsiteConfig } from '@/hooks/use-website-config'
import { Menu, X, Phone, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  config?: {
    logo?: string
    logoText?: string
    transparent?: boolean
    sticky?: boolean
  }
  isPreview?: boolean
}

export default function Header({ config, isPreview = false }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { config: websiteConfig } = useWebsiteConfig()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const logoUrl = websiteConfig.logoUrl || config?.logo
  const logoText = websiteConfig.appName || config?.logoText || 'HubbHQ'
  const isTransparent = config?.transparent && !isScrolled

  const navItems = [
    { label: 'Beranda', href: '/' },
    { label: 'Tentang', href: '/tentang' },
    { label: 'Program', href: '/program' },
    { label: 'Berita', href: '/berita' },
    { label: 'Kontak', href: '/kontak' },
  ]

  return (
    <header className={cn(
      "w-full z-50 transition-all duration-300",
      config?.sticky !== false && "sticky top-0",
      isTransparent ? "bg-transparent text-white" : "bg-white/95 backdrop-blur shadow-sm text-foreground"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Nama Organisasi */}
          <Link href="/" className="flex items-center gap-3">
            {logoUrl ? (
              <Image src={logoUrl} alt={logoText} width={40} height={40} className="h-10 w-auto object-contain" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                {logoText.charAt(0)}
              </div>
            )}
            <span className="font-bold text-lg tracking-tight">{logoText}</span>
          </Link>

          {/* Navigasi Desktop */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-primary transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Tombol Hamburger Mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted focus:outline-none"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Drawer Menu Mobile */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border bg-background">
            <nav className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="px-2 py-1 text-sm font-medium hover:text-primary"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
```

---

## 6. Implementasi Pasangan Section (Config & Component)

Setiap section terdiri dari dua berkas yang saling melengkapi:
1. `[NamaSection].config.ts`: Skema metadata, daftar varian tata letak, dan konfigurasi field input visual builder.
2. `[NamaSection].tsx`: Komponen visual React yang merender tampilan berdasarkan nilai konfigurasi.

### 6.1 Berkas Skema Konfigurasi (Contoh: `Hero.config.ts`)

```typescript
export const heroConfig = {
  name: 'Hero Section',
  defaultVariant: 'default',
  variants: {
    default: {
      label: 'Centered Hero',
      fields: [
        {
          key: 'title',
          label: 'Judul Utama',
          type: 'text',
          default: 'Mewujudkan Kepemimpinan Berintegritas',
          required: true,
        },
        {
          key: 'subtitle',
          label: 'Subjudul',
          type: 'textarea',
          default: 'Platform koordinasi terpadu organisasi mahasiswa dan pemuda modern.',
        },
        {
          key: 'ctaText',
          label: 'Teks Tombol Aksi',
          type: 'text',
          default: 'Kenali Program Kerja',
        },
        {
          key: 'ctaLink',
          label: 'Tautan Tombol Aksi',
          type: 'url',
          default: '/program',
        },
        {
          key: 'backgroundImage',
          label: 'Gambar Latar Belakang',
          type: 'image',
          default: '',
        },
      ],
    },
    split: {
      label: 'Side-by-Side (Split)',
      fields: [
        { key: 'title', label: 'Judul Utama', type: 'text', default: 'Selamat Datang' },
        { key: 'description', label: 'Uraian Deskripsi', type: 'textarea', default: '' },
        { key: 'image', label: 'Gambar Sisi Kanan', type: 'image', default: '' },
      ],
    },
  },
}
```

#### Tipe Field Builder yang Didukung:
- `text`: Input teks satu baris.
- `textarea`: Input teks multi-baris untuk uraian panjang.
- `image`: Pemilih berkas gambar atau input URL media.
- `url`: Validasi URL tujuan internal maupun eksternal.
- `select`: Pilihan dropdown dengan daftar `options: [{ label, value }]`.
- `color`: Pemilih kode warna heksadesimal (`#ffffff`).
- `number`: Input angka metrik.
- `boolean`: Sakelar hidup/mati (*toggle switch*).

### 6.2 Berkas Komponen Tampilan (Contoh: `Hero.tsx`)

```tsx
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface HeroProps {
  config: {
    variant?: 'default' | 'split'
    title?: string
    subtitle?: string
    description?: string
    ctaText?: string
    ctaLink?: string
    backgroundImage?: string
    image?: string
  }
  isPreview?: boolean
}

export default function Hero({ config }: HeroProps) {
  const variant = config.variant || 'default'

  if (variant === 'split') {
    return (
      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              {config.title || 'Selamat Datang'}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
              {config.description}
            </p>
          </div>
          {config.image && (
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-border">
              <img src={config.image} alt={config.title || 'Hero'} className="w-full h-auto object-cover" />
            </div>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="relative py-24 md:py-36 bg-gradient-to-b from-primary/10 via-background to-background text-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground">
          {config.title || 'Selamat Datang di HubbHQ'}
        </h1>
        {config.subtitle && (
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {config.subtitle}
          </p>
        )}
        {config.ctaText && (
          <div className="mt-8">
            <Button size="lg" asChild className="rounded-xl font-semibold px-8 py-6 text-base">
              <Link href={config.ctaLink || '/'}>{config.ctaText}</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
```

---

## 7. Implementasi Komponen Kaki Halaman (Footer.tsx)

Komponen `sections/Footer.tsx` ditempatkan di dalam folder sections tema:

```tsx
'use client'

import Link from 'next/link'
import { useWebsiteConfig } from '@/hooks/use-website-config'
import { Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  const { config } = useWebsiteConfig()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-muted/30 text-muted-foreground py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-foreground text-lg mb-3">
              {config.appName || 'HubbHQ Organization'}
            </h3>
            <p className="text-sm leading-relaxed">
              {config.appDescription || 'Sistem Informasi Organisasi Terpadu'}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground text-sm mb-3">Navigasi Utama</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/tentang" className="hover:text-foreground">Tentang Kami</Link></li>
              <li><Link href="/program" className="hover:text-foreground">Program Kerja</Link></li>
              <li><Link href="/berita" className="hover:text-foreground">Berita & Publikasi</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground text-sm mb-3">Layanan Anggota</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/aspirasi" className="hover:text-foreground">Kotak Aspirasi</Link></li>
              <li><Link href="/login" className="hover:text-foreground">Portal Dasbor Pengurus</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground text-sm mb-3">Sekretariat</h4>
            <p className="text-sm">
              Hak Cipta &copy; {currentYear} {config.appName || 'HubbHQ'}. Seluruh hak cipta dilindungi undang-undang.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
```

---

## 8. Pendaftaran dan Pengaktifan Tema Baru

### 8.1 Registrasi ke Basis Data via Inisialisasi Setup
Jika tema baru ditujukan sebagai bawaan instalasi, daftarkan tema pada berkas `src/app/api/setup/route.ts` di dalam blok `theme.createMany`:

```typescript
{
  name: 'Nama Tema Baru',
  slug: 'nama-tema-baru',
  version: '1.0.0',
  description: 'Deskripsi keunggulan dan gaya visual tema',
  author: 'Nama Pembuat',
  isActive: false,
  config: {
    primaryColor: '#0ea5e9',
    secondaryColor: '#0284c7',
    accentColor: '#f59e0b',
    backgroundColor: '#ffffff',
    fontFamily: 'Inter',
    borderRadius: '0.5rem'
  }
}
```

### 8.2 Registrasi Manual via API / Dasbor
Administrator organisasi juga dapat mengunggah atau menginstal tema melalui API `POST /api/themes`:

```http
POST /api/themes HTTP/1.1
Content-Type: application/json
Authorization: Bearer <TOKEN>

{
  "name": "Tema Minimalis Biru",
  "slug": "minimalis-biru",
  "version": "1.0.0",
  "description": "Desain bersih untuk yayasan sosial",
  "author": "Komunitas",
  "config": {
    "primaryColor": "#0284c7",
    "fontFamily": "Inter"
  }
}
```

---

## 9. Panduan Uji Kelaikan Tema (Checklist)

Sebelum merilis tema kustom ke lingkungan produksi, pastikan seluruh item berikut telah diverifikasi:

- [ ] Folder tema diletakkan di `src/themes/[slug]/`.
- [ ] Berkas `theme.json` memiliki sintaks JSON yang valid tanpa kesalahan koma.
- [ ] Komponen `Header.tsx` memiliki penanganan mobile menu dan mengimpor `useWebsiteConfig`.
- [ ] Semua section yang dideklarasikan pada `availableSections` memiliki berkas `.config.ts` dan `.tsx`.
- [ ] Komponen `Footer.tsx` terpasang di dalam direktori `sections/`.
- [ ] Berkas pratinjau `preview.jpg` berukuran rasio 1200x630 piksel tersimpan dengan benar.
- [ ] Uji responsivitas pada resolusi ponsel (360px), tablet (768px), dan layar lebar (1280px+).
- [ ] Pastikan tidak ada eror kompilasi dengan menjalankan `npm run build` atau `npm run lint`.
