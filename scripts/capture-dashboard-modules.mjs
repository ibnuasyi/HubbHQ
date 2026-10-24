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

console.log(`Using browser: ${executablePath}`)

const outputDir = path.resolve(process.cwd(), 'public', 'screenshots')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

const MODULES = [
  { id: '01', name: 'Dashboard Utama Admin', url: 'http://localhost:3000/dashboard', file: '01-dashboard.png' },
  { id: '02', name: 'Tata Kelola Program Kerja & LPJ', url: 'http://localhost:3000/dashboard/proker', file: '02-proker.png' },
  { id: '03', name: 'Studio E-Sertifikat', url: 'http://localhost:3000/dashboard/sertifikat', file: '03-sertifikat.png' },
  { id: '04', name: 'Persuratan & QR Verification', url: 'http://localhost:3000/dashboard/surat', file: '04-surat.png' },
  { id: '05', name: 'Keuangan & Kas Organisasi', url: 'http://localhost:3000/dashboard/keuangan', file: '05-keuangan.png' },
  { id: '06', name: 'Direktori Anggota & KTA', url: 'http://localhost:3000/dashboard/anggota', file: '06-anggota.png' },
  { id: '07', name: 'Open Recruitment Terpadu', url: 'http://localhost:3000/dashboard/oprec', file: '07-oprec.png' },
  { id: '08', name: 'Portal Aspirasi & Advokasi', url: 'http://localhost:3000/dashboard/aspirasi', file: '08-aspirasi.png' },
  { id: '09', name: 'Kaderisasi & Jenjang Diklat', url: 'http://localhost:3000/dashboard/kaderisasi', file: '09-kaderisasi.png' },
  { id: '10', name: 'Direktori Alumni & Dana Abadi', url: 'http://localhost:3000/dashboard/alumni', file: '10-alumni.png' },
  { id: '11', name: 'Risalah Sidang & Konsideran SK', url: 'http://localhost:3000/dashboard/sidang', file: '11-sidang.png' },
]

async function run() {
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
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  try {
    // 1. Perform Login
    console.log('Navigating to login page...')
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded', timeout: 30000 })
    console.log('Waiting for #email input selector...')
    await page.waitForSelector('#email', { timeout: 15000 })
    await sleep(600)
    console.log('Entering credentials (admin@siop.local)...')
    await page.type('#email', 'admin@siop.local', { delay: 25 })
    await page.type('#password', 'admin123', { delay: 25 })
    await page.click('button[type="submit"]')

    // Wait for redirect to /dashboard
    console.log('Waiting for authentication redirect to /dashboard...')
    try {
      await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 15000 })
    } catch {
      await sleep(4000)
    }
    await sleep(2000)
    console.log('Successfully logged in! Current URL:', page.url())

    // 2. Capture Each Dashboard Module
    for (const mod of MODULES) {
      console.log(`Capturing [${mod.id}/${MODULES.length}] ${mod.name} (${mod.url})...`)
      await page.goto(mod.url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await sleep(2500)
      const filePath = path.join(outputDir, mod.file)
      await page.screenshot({ path: filePath })
      console.log(`Saved ${mod.file}`)
    }

    console.log('\nAll dashboard module screenshots captured successfully!')
  } catch (err) {
    console.error('Error during screenshot capture:', err)
  } finally {
    await browser.close()
  }
}

run()

