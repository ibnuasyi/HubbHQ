# Panduan Pembuatan Tema Baru

Panduan ini menjelaskan cara membuat tema baru untuk website builder di HubbHQ.

## 📁 Struktur Folder Tema

Setiap tema harus memiliki struktur folder seperti ini:

```
src/themes/[nama-tema]/
├── theme.json           # Konfigurasi tema
├── Header.tsx           # Component header
├── sections/
│   ├── Hero.config.ts   # Config untuk section Hero
│   ├── Hero.tsx         # Component Hero
│   ├── About.config.ts  # Config untuk section About
│   ├── About.tsx        # Component About
│   └── ... (section lainnya)
└── preview.jpg          # Preview gambar tema
```

## 1. Membuat Folder Tema

```bash
# Buat folder tema baru
mkdir src/themes/my-custom-theme
mkdir src/themes/my-custom-theme/sections
```

## 2. Membuat theme.json

File `theme.json` adalah konfigurasi utama tema:

```json
{
  "name": "My Custom Theme",
  "slug": "my-custom-theme",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Deskripsi tema Anda",
  "thumbnail": "/themes/my-custom-theme/preview.jpg",
  "defaultSections": ["hero", "about", "cta", "footer"],
  "availableSections": [
    { "key": "hero", "name": "Hero Section", "icon": "image" },
    { "key": "about", "name": "About Section", "icon": "info" },
    { "key": "cta", "name": "CTA Section", "icon": "megaphone" },
    { "key": "footer", "name": "Footer", "icon": "layout" }
  ],
  "config": {
    "primaryColor": "#6366f1",
    "secondaryColor": "#4f46e5",
    "accentColor": "#f59e0b",
    "backgroundColor": "#ffffff",
    "textColor": "#1e293b",
    "fontFamily": "Plus Jakarta Sans",
    "borderRadius": "0.75rem"
  },
  "layouts": {
    "default": {
      "containerWidth": "max-w-7xl",
      "spacing": "py-20"
    }
  }
}
```

## 3. Membuat Header Component

```tsx
// src/themes/my-custom-theme/Header.tsx
'use client'

import Link from 'next/link'
import { useWebsiteConfig } from '@/hooks/use-website-config'

export default function Header() {
  const { config } = useWebsiteConfig()

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold">
            {config.appName || 'Organisasi'}
          </Link>

          <nav className="flex gap-6">
            <Link href="/tentang" className="hover:text-primary">
              Tentang
            </Link>
            <Link href="/anggota" className="hover:text-primary">
              Anggota
            </Link>
            <Link href="/kontak" className="hover:text-primary">
              Kontak
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
```

## 4. Membuat Section Component

Setiap section membutuhkan dua file:

### 4.1 Config File (Hero.config.ts)

```typescript
// src/themes/my-custom-theme/sections/Hero.config.ts
export const heroConfig = {
  name: 'Hero Section',
  defaultVariant: 'default',
  variants: {
    default: {
      label: 'Default',
      fields: [
        {
          key: 'title',
          label: 'Judul',
          type: 'text',
          default: 'Selamat Datang'
        },
        {
          key: 'subtitle',
          label: 'Subtitle',
          type: 'text',
          default: 'Deskripsi singkat'
        },
        {
          key: 'backgroundImage',
          label: 'Gambar Background',
          type: 'image',
          default: ''
        },
        {
          key: 'ctaText',
          label: 'Teks CTA',
          type: 'text',
          default: 'Pelajari Lebih Lanjut'
        },
        {
          key: 'ctaLink',
          label: 'Link CTA',
          type: 'url',
          default: '/tentang'
        }
      ]
    },
    // Variant lain bisa ditambahkan di sini
    split: {
      label: 'Split Layout',
      fields: [
        { key: 'title', label: 'Judul', type: 'text' },
        { key: 'description', label: 'Deskripsi', type: 'textarea' },
        { key: 'image', label: 'Gambar', type: 'image' }
      ]
    }
  }
}
```

### 4.2 Component File (Hero.tsx)

```tsx
// src/themes/my-custom-theme/sections/Hero.tsx
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface HeroProps {
  config: {
    variant?: 'default' | 'split'
    title: string
    subtitle?: string
    description?: string
    backgroundImage?: string
    ctaText?: string
    ctaLink?: string
    showScrollIndicator?: boolean
  }
}

export default function Hero({ config }: HeroProps) {
  const variant = config.variant || 'default'

  if (variant === 'split') {
    return (
      <section className="grid md:grid-cols-2 gap-8 py-20">
        <div>
          <h1 className="text-4xl font-bold">{config.title}</h1>
          <p className="mt-4 text-lg text-gray-600">{config.description}</p>
          {config.ctaText && (
            <Link href={config.ctaLink || '/'}>
              <Button className="mt-6">{config.ctaText}</Button>
            </Link>
          )}
        </div>
        {config.backgroundImage && (
          <img
            src={config.backgroundImage}
            alt={config.title}
            className="rounded-lg shadow-lg"
          />
        )}
      </section>
    )
  }

  // Default variant
  return (
    <section
      className="relative py-32 text-white text-center"
      style={{
        backgroundImage: config.backgroundImage
          ? `url(${config.backgroundImage})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 max-w-4xl mx-auto px-4">
        <h1 className="text-5xl font-bold">{config.title}</h1>
        {config.subtitle && (
          <p className="mt-4 text-xl">{config.subtitle}</p>
        )}
        {config.ctaText && (
          <Link href={config.ctaLink || '/'}>
            <Button size="lg" className="mt-8">
              {config.ctaText}
            </Button>
          </Link>
        )}
      </div>
    </section>
  )
}
```

## 5. Membuat Footer Component

```tsx
// src/themes/my-custom-theme/sections/Footer.tsx
'use client'

import Link from 'next/link'
import { useWebsiteConfig } from '@/hooks/use-website-config'
import { Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  const { config } = useWebsiteConfig()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">
              {config.appName || 'Organisasi'}
            </h3>
            <p className="text-sm">{config.appDescription}</p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Menu</h4>
            <ul className="space-y-2">
              <li><Link href="/tentang">Tentang</Link></li>
              <li><Link href="/anggota">Anggota</Link></li>
              <li><Link href="/kontak">Kontak</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Kontak</h4>
            <ul className="space-y-2 text-sm">
              {config.contactEmail && (
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {config.contactEmail}
                </li>
              )}
              {config.contactPhone && (
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {config.contactPhone}
                </li>
              )}
            </ul>
          </div>

          <div>
            <p className="text-sm">
              © {currentYear} {config.appName || 'Organisasi'}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
```

## 6. Register Tema di Code

### 6.1 Update src/lib/themes.ts

Tambahkan loader untuk tema baru:

```typescript
// Tambahkan di function loadThemeSections()
if (themeSlug === 'my-custom-theme') {
  try {
    const [hero, about, cta] = await Promise.all([
      import('@/themes/my-custom-theme/sections/Hero.config'),
      import('@/themes/my-custom-theme/sections/About.config'),
      import('@/themes/my-custom-theme/sections/Cta.config'),
    ])

    sectionConfigs.hero = hero.heroConfig
    sectionConfigs.about = about.aboutConfig
    sectionConfigs.cta = cta.ctaConfig

    sectionComponents.hero = () => import('@/themes/my-custom-theme/sections/Hero')
    sectionComponents.about = () => import('@/themes/my-custom-theme/sections/About')
    sectionComponents.cta = () => import('@/themes/my-custom-theme/sections/Cta')
    sectionComponents.footer = () => import('@/themes/my-custom-theme/sections/Footer')
    sectionComponents.header = () => import('@/themes/my-custom-theme/Header')
  } catch (error) {
    console.error('Error loading my-custom-theme:', error)
  }
  return
}
```

### 6.2 Update src/app/api/setup/route.ts

Tambahkan tema baru ke seed data:

```typescript
{
  name: 'My Custom Theme',
  slug: 'my-custom-theme',
  version: '1.0.0',
  description: 'Tema kustom dengan desain modern',
  author: 'HubbHQ',
  isActive: false,
  config: {
    primaryColor: '#6366f1',
    secondaryColor: '#4f46e5',
    accentColor: '#f59e0b',
    backgroundColor: '#ffffff',
    fontFamily: 'Plus Jakarta Sans',
    borderRadius: '0.75rem'
  }
}
```

## 7. Membuat Preview Gambar

Buat screenshot tema Anda dengan ukuran:
- Width: 1200px
- Height: 630px
- Format: JPG atau PNG
- Simpan di: `public/themes/my-custom-theme/preview.jpg`

## 8. Types untuk Section Config

Gunakan interface berikut untuk type safety:

```typescript
interface SectionConfig {
  name: string
  defaultVariant: string
  variants: {
    [variantName: string]: {
      label: string
      fields: Array<{
        key: string
        label: string
        type: 'text' | 'textarea' | 'image' | 'url' | 'select' | 'color' | 'number'
        default?: any
        options?: Array<{ label: string; value: string }>
        required?: boolean
      }>
    }
  }
}
```

## 📝 Checklist Pembuatan Tema

- [ ] Buat folder tema baru
- [ ] Buat `theme.json`
- [ ] Buat `Header.tsx`
- [ ] Buat section components dengan config
- [ ] Buat `Footer.tsx`
- [ ] Register tema di `themes.ts`
- [ ] Tambahkan ke setup seed
- [ ] Buat preview image
- [ ] Test dengan `npm run dev`

## 🎨 Best Practices

1. **Responsive Design**: Selalu gunakan class Tailwind responsive
2. **Accessibility**: Tambahkan alt text dan aria labels
3. **Performance**: Optimasi gambar dan lazy load
4. **Consistency**: Gunakan CSS variables untuk warna tema
5. **Dark Mode**: Pertimbangkan dark mode support

## 🔧 Debugging

Jika tema tidak muncul:
1. Cek console untuk error
2. Pastikan semua import path benar
3. Verify theme.json syntax
4. Clear cache: `rm -rf .next`

---

Dibuat oleh **Ibnu Batuthah**
