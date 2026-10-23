'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Shield,
  MapPin,
  Briefcase,
  FileText,
  Tag,
  Menu,
  Palette,
  Globe,
  ArrowRight,
  Settings,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const settingSections = [
  {
    title: 'Organisasi & Akses',
    items: [
      {
        title: 'Role & Izin Akses',
        description: 'Kelola hak akses, tingkat otorisasi, dan perizinan sistem untuk setiap role pengguna.',
        href: '/dashboard/settings/roles',
        icon: Shield,
        color: 'text-blue-500 bg-blue-500/10',
      },
      {
        title: 'Jabatan Organisasi',
        description: 'Atur hierarki dan struktur jabatan fungsional maupun struktural anggota.',
        href: '/dashboard/settings/jabatan',
        icon: Briefcase,
        color: 'text-indigo-500 bg-indigo-500/10',
      },
      {
        title: 'Wilayah & Cabang',
        description: 'Daftar pembagian wilayah, koordinator daerah, dan cabang organisasi.',
        href: '/dashboard/settings/wilayah',
        icon: MapPin,
        color: 'text-emerald-500 bg-emerald-500/10',
      },
      {
        title: 'Format & Jenis Surat',
        description: 'Konfigurasi template penomoran otomatis, kode klasifikasi, dan jenis persuratan.',
        href: '/dashboard/settings/jenis-surat',
        icon: FileText,
        color: 'text-amber-500 bg-amber-500/10',
      },
    ],
  },
  {
    title: 'Website & Konten Publik',
    items: [
      {
        title: 'Profil & Identitas Website',
        description: 'Nama organisasi, logo, kontak resmi, media sosial, dan identitas lembaga.',
        href: '/dashboard/settings/website',
        icon: Globe,
        color: 'text-sky-500 bg-sky-500/10',
      },
      {
        title: 'Tema & Visual',
        description: 'Pilih tema tampilan landing page, palet warna primer, dan gaya tata letak.',
        href: '/dashboard/settings/themes',
        icon: Palette,
        color: 'text-purple-500 bg-purple-500/10',
      },
      {
        title: 'Menu Navigasi',
        description: 'Atur tautan menu header publik, sub-menu dropdown, dan urutan tautan footer.',
        href: '/dashboard/settings/menu',
        icon: Menu,
        color: 'text-rose-500 bg-rose-500/10',
      },
      {
        title: 'Kategori Berita',
        description: 'Pengelompokan kategori artikel berita, pengumuman, dan publikasi media.',
        href: '/dashboard/settings/categories',
        icon: Tag,
        color: 'text-teal-500 bg-teal-500/10',
      },
    ],
  },
]

export default function SettingsHubPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pengaturan Sistem</h1>
            <p className="text-sm text-muted-foreground">
              Pusat konfigurasi master data, perizinan pengguna, dan pengaturan website organisasi.
            </p>
          </div>
        </div>
      </div>

      {settingSections.map((section, idx) => (
        <div key={idx} className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight text-foreground/90">
            {section.title}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {section.items.map((item, itemIdx) => {
              const Icon = item.icon
              return (
                <Card key={itemIdx} className="group relative flex flex-col justify-between transition-all hover:border-primary/50 hover:shadow-md">
                  <CardHeader className="space-y-2">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base font-semibold">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="text-xs leading-relaxed line-clamp-3">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button variant="ghost" size="sm" asChild className="w-full justify-between group-hover:text-primary">
                      <Link href={item.href}>
                        <span>Buka Pengaturan</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

