import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateDatabase() {
  console.log('1. Updating WebsiteConfig in database to HubbHQ defaults...')
  
  const updates = [
    { key: 'appName', value: 'HubbHQ', description: 'Nama aplikasi', category: 'general', isPublic: true },
    { key: 'appDescription', value: 'HubbHQ - Sistem Informasi Organisasi Modern', description: 'Deskripsi aplikasi', category: 'general', isPublic: true },
    { key: 'websiteUrl', value: '', description: 'Website URL', category: 'social', isPublic: true },
    { key: 'contactEmail', value: 'admin@siop.local', description: 'Email kontak', category: 'contact', isPublic: true },
    { key: 'contactPhone', value: '+62 812 3456 7890', description: 'Telepon kontak', category: 'contact', isPublic: true },
    { key: 'contactAddress', value: 'Jakarta, Indonesia', description: 'Alamat kontak', category: 'contact', isPublic: true },
    { key: 'instagramUrl', value: '', description: 'Instagram URL', category: 'social', isPublic: true },
    { key: 'facebookUrl', value: '', description: 'Facebook URL', category: 'social', isPublic: true },
    { key: 'twitterUrl', value: '', description: 'Twitter URL', category: 'social', isPublic: true },
    { key: 'youtubeUrl', value: '', description: 'YouTube URL', category: 'social', isPublic: true },
    { key: 'primaryColor', value: '#2563eb', description: 'Warna utama', category: 'appearance', isPublic: false },
  ]

  for (const u of updates) {
    await prisma.websiteConfig.upsert({
      where: { key: u.key },
      update: { value: u.value, description: u.description, category: u.category, isPublic: u.isPublic },
      create: { key: u.key, value: u.value, description: u.description, category: u.category, isPublic: u.isPublic },
    })
  }

  // Update themes in DB
  console.log('2. Updating Theme records in database...')
  await prisma.theme.updateMany({
    where: { slug: 'kpri-style' },
    data: { name: 'Organ2 Style', slug: 'organ2-style', description: 'Tema bergaya modern untuk organisasi' },
  })

  console.log('Database configuration updated successfully.')
}

function cleanFilesInDir(dir) {
  const files = fs.readdirSync(dir)
  for (const f of files) {
    const fullPath = path.join(dir, f)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      cleanFilesInDir(fullPath)
    } else if (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.json') || f.endsWith('.js') || f.endsWith('.mjs')) {
      let content = fs.readFileSync(fullPath, 'utf-8')
      if (content.includes('KPRI') || content.includes('kpri')) {
        console.log(`Cleaning KPRI in: ${fullPath}`)
        content = content
          .replace(/KPRI - Konfederasi Pergerakan/g, 'HubbHQ')
          .replace(/Konfederasi Pergerakan Rakyat Indonesia/g, 'HubbHQ')
          .replace(/KPRI Style/g, 'Organ2 Style')
          .replace(/kpri-style/g, 'organ2-style')
          .replace(/KPRI About/g, 'About')
          .replace(/KPRI CTA/g, 'CTA')
          .replace(/KPRI Hero/g, 'Hero')
          .replace(/KPRI Programs/g, 'Programs')
          .replace(/KPRI Stats/g, 'Stats')
          .replace(/KPRI Team/g, 'Team')
          .replace(/KPRI Visi Misi/g, 'Visi Misi')
          .replace(/KPRI Green/g, 'Emerald Green')
          .replace(/Hijau KPRI/g, 'Hijau Zamrud')
          .replace(/like KPRI/g, 'modern style')
          .replace(/KPRI style/g, 'modern style')
          .replace(/KPRI/g, 'HubbHQ')
          .replace(/kpri/g, 'hubbhq')
        fs.writeFileSync(fullPath, content, 'utf-8')
      }
    }
  }
}

async function run() {
  await updateDatabase()
  console.log('3. Cleaning theme config files in src/themes...')
  cleanFilesInDir(path.resolve(process.cwd(), 'src', 'themes'))
  console.log('4. Cleaning prisma/seed-full.ts...')
  cleanFilesInDir(path.resolve(process.cwd(), 'prisma'))
  console.log('All KPRI occurrences cleaned!')
  await prisma.$disconnect()
}

run().catch(console.error)

