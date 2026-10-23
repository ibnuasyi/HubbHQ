import puppeteer from 'puppeteer-core'
import fs from 'fs'
import path from 'path'

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
]

const executablePath = CHROME_PATHS.find((p) => fs.existsSync(p))

if (!executablePath) {
  console.error('No suitable Chrome or Edge browser executable found!')
  process.exit(1)
}

const outputDir = path.resolve(process.cwd(), 'public', 'screenshots', 'pages')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

const PAGES_TO_TEST = [
  // Public pages
  { id: '01', name: 'Halaman Depan Utama', url: 'http://localhost:3000/', file: '01-publik-landing.png', isPublic: true },
  { id: '02', name: 'Halaman Login Autentikasi', url: 'http://localhost:3000/login', file: '02-publik-login.png', isPublic: true },
  { id: '03', name: 'Halaman Registrasi Anggota', url: 'http://localhost:3000/register', file: '03-publik-register.png', isPublic: true },
  { id: '04', name: 'Portal Berita Publik', url: 'http://localhost:3000/berita', file: '04-publik-berita.png', isPublic: true },
  { id: '05', name: 'Galeri Foto & Album Publik', url: 'http://localhost:3000/galeri', file: '05-publik-galeri.png', isPublic: true },
  { id: '06', name: 'Halaman Kontak Organisasi', url: 'http://localhost:3000/kontak', file: '06-publik-kontak.png', isPublic: true },
  { id: '07', name: 'Halaman Tentang Organisasi', url: 'http://localhost:3000/tentang', file: '07-publik-tentang.png', isPublic: true },
  { id: '08', name: 'Tema Organ2 Style Publik', url: 'http://localhost:3000/organ2-style', file: '08-publik-tema-organ2.png', isPublic: true },

  // Dashboard pages (authenticated)
  { id: '09', name: 'Dashboard Utama Admin', url: 'http://localhost:3000/dashboard', file: '09-dashboard-utama.png', isPublic: false },
  { id: '10', name: 'Direktori Anggota', url: 'http://localhost:3000/dashboard/anggota', file: '10-anggota-list.png', isPublic: false },
  { id: '11', name: 'Form Tambah Anggota', url: 'http://localhost:3000/dashboard/anggota/baru', file: '11-anggota-tambah.png', isPublic: false },
  { id: '12', name: 'Manajemen Divisi', url: 'http://localhost:3000/dashboard/divisi', file: '12-divisi-list.png', isPublic: false },
  { id: '13', name: 'Bagan Struktur Organisasi', url: 'http://localhost:3000/dashboard/orgchart', file: '13-struktur-organisasi.png', isPublic: false },
  { id: '14', name: 'Daftar Program Kerja', url: 'http://localhost:3000/dashboard/proker', file: '14-proker-list.png', isPublic: false },
  { id: '15', name: 'Form Tambah Program Kerja', url: 'http://localhost:3000/dashboard/proker/baru', file: '15-proker-tambah.png', isPublic: false },
  { id: '16', name: 'Manajemen Proposal Dana', url: 'http://localhost:3000/dashboard/proposal', file: '16-proposal-dana.png', isPublic: false },
  { id: '17', name: 'Keuangan & Transaksi', url: 'http://localhost:3000/dashboard/keuangan', file: '17-keuangan-transaksi.png', isPublic: false },
  { id: '18', name: 'Iuran Kas Anggota', url: 'http://localhost:3000/dashboard/keuangan/kas', file: '18-keuangan-kas.png', isPublic: false },
  { id: '19', name: 'Rekapitulasi Keuangan', url: 'http://localhost:3000/dashboard/keuangan/rekap', file: '19-keuangan-rekap.png', isPublic: false },
  { id: '20', name: 'Persuratan & QR Code', url: 'http://localhost:3000/dashboard/surat', file: '20-persuratan.png', isPublic: false },
  { id: '21', name: 'Kalender & Agenda Kegiatan', url: 'http://localhost:3000/dashboard/kalender', file: '21-kalender-agenda.png', isPublic: false },
  { id: '22', name: 'Digital Library & Buku', url: 'http://localhost:3000/dashboard/library', file: '22-digital-library.png', isPublic: false },
  { id: '23', name: 'Website Page Builder', url: 'http://localhost:3000/dashboard/pages', file: '23-website-pages.png', isPublic: false },
  { id: '24', name: 'Artikel Berita (Posts)', url: 'http://localhost:3000/dashboard/posts', file: '24-website-posts.png', isPublic: false },
  { id: '25', name: 'Galeri Media CMS', url: 'http://localhost:3000/dashboard/gallery', file: '25-website-gallery.png', isPublic: false },
  { id: '26', name: 'Tanya Jawab (FAQ) CMS', url: 'http://localhost:3000/dashboard/faq', file: '26-website-faq.png', isPublic: false },
  { id: '27', name: 'Profil Pengguna', url: 'http://localhost:3000/dashboard/profile', file: '27-user-profile.png', isPublic: false },
  { id: '28', name: 'Kustomisasi Tampilan (Appearance)', url: 'http://localhost:3000/dashboard/appearance', file: '28-appearance.png', isPublic: false },
  { id: '29', name: 'Pusat Pengaturan Sistem', url: 'http://localhost:3000/dashboard/settings', file: '29-settings-hub.png', isPublic: false },
  { id: '30', name: 'Pengaturan Role & Izin', url: 'http://localhost:3000/dashboard/settings/roles', file: '30-settings-roles.png', isPublic: false },
  { id: '31', name: 'Pengaturan Wilayah & Cabang', url: 'http://localhost:3000/dashboard/settings/wilayah', file: '31-settings-wilayah.png', isPublic: false },
  { id: '32', name: 'Pengaturan Struktur Jabatan', url: 'http://localhost:3000/dashboard/settings/jabatan', file: '32-settings-jabatan.png', isPublic: false },
  { id: '33', name: 'Pengaturan Format & Jenis Surat', url: 'http://localhost:3000/dashboard/settings/jenis-surat', file: '33-settings-jenis-surat.png', isPublic: false },
  { id: '34', name: 'Pengaturan Kategori Berita', url: 'http://localhost:3000/dashboard/settings/categories', file: '34-settings-categories.png', isPublic: false },
  { id: '35', name: 'Pengaturan Menu Navigasi', url: 'http://localhost:3000/dashboard/settings/menu', file: '35-settings-menu.png', isPublic: false },
  { id: '36', name: 'Pengaturan Tema Visual Website', url: 'http://localhost:3000/dashboard/settings/themes', file: '36-settings-themes.png', isPublic: false },
  { id: '37', name: 'Pengaturan Identitas Website', url: 'http://localhost:3000/dashboard/settings/website', file: '37-settings-website.png', isPublic: false },
]

async function run() {
  console.log(`Starting full screenshot and functional test on ${PAGES_TO_TEST.length} pages...`)
  console.log(`Using browser: ${executablePath}`)

  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
    },
  })

  const page = await browser.newPage()
  const results = []

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  // 1. Process public pages first
  const publicPages = PAGES_TO_TEST.filter((p) => p.isPublic)
  for (const item of publicPages) {
    process.stdout.write(`Testing [${item.id}/37] ${item.name} (${item.url})... `)
    const startTime = Date.now()
    try {
      const response = await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await sleep(1500)
      const status = response ? response.status() : 200
      const filePath = path.join(outputDir, item.file)
      await page.screenshot({ path: filePath })
      const duration = Date.now() - startTime

      // Check for any occurrence of KPRI in page content
      const pageText = await page.evaluate(() => document.body.innerText || '')
      const hasKpri = pageText.toLowerCase().includes('kpri')

      if (hasKpri) {
        console.log(`OK (HTTP ${status}, ${duration}ms) -> ${item.file} [WARNING: KPRI found in text!]`)
      } else {
        console.log(`OK (HTTP ${status}, ${duration}ms) -> ${item.file} [VERIFIED: Clean HubbHQ]`)
      }

      results.push({ ...item, status, duration, success: status >= 200 && status < 400, hasKpri })
    } catch (err) {
      console.log(`ERROR: ${err.message}`)
      results.push({ ...item, status: 'ERROR', duration: Date.now() - startTime, success: false, error: err.message, hasKpri: false })
    }
  }

  // 2. Perform Login as Admin
  console.log('\n--- Melakukan Login Administrator (admin@siop.local / admin123) ---')
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await sleep(1000)
  await page.type('#email', 'admin@siop.local')
  await page.type('#password', 'admin123')
  await page.click('button[type="submit"]')
  
  // Tunggu redirect ke /dashboard
  try {
    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 10000 })
  } catch {
    await sleep(3000)
  }
  await sleep(2000)
  console.log(`Login Selesai. URL saat ini: ${page.url()}\n`)

  // 3. Process dashboard pages
  const dashboardPages = PAGES_TO_TEST.filter((p) => !p.isPublic)
  for (const item of dashboardPages) {
    process.stdout.write(`Testing [${item.id}/37] ${item.name} (${item.url})... `)
    const startTime = Date.now()
    try {
      const response = await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await sleep(1500)
      const status = response ? response.status() : 200
      const filePath = path.join(outputDir, item.file)
      await page.screenshot({ path: filePath })
      const duration = Date.now() - startTime

      // Check for any occurrence of KPRI in page content
      const pageText = await page.evaluate(() => document.body.innerText || '')
      const hasKpri = pageText.toLowerCase().includes('kpri')

      if (hasKpri) {
        console.log(`OK (HTTP ${status}, ${duration}ms) -> ${item.file} [WARNING: KPRI found in text!]`)
      } else {
        console.log(`OK (HTTP ${status}, ${duration}ms) -> ${item.file} [VERIFIED: Clean HubbHQ]`)
      }

      results.push({ ...item, status, duration, success: status >= 200 && status < 400, hasKpri })
    } catch (err) {
      console.log(`ERROR: ${err.message}`)
      results.push({ ...item, status: 'ERROR', duration: Date.now() - startTime, success: false, error: err.message, hasKpri: false })
    }
  }

  await browser.close()

  // Write summary report
  const reportPath = path.resolve(process.cwd(), 'public', 'screenshots', 'audit-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf-8')

  const kpriFoundCount = results.filter((r) => r.hasKpri).length
  console.log(`\n=== HASIL AUDIT KPRI vs HUBBHQ ===`)
  console.log(`Total Halaman Diuji: ${results.length}`)
  console.log(`Halaman Sukses (HTTP 200): ${results.filter((r) => r.success).length}`)
  console.log(`Halaman Bersih (Clean HubbHQ): ${results.length - kpriFoundCount}`)
  console.log(`Halaman yang Masih Mengandung KPRI: ${kpriFoundCount}`)
  console.log(`Laporan audit tersimpan di ${reportPath}`)
}

run()
