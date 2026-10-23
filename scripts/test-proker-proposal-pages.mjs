import puppeteer from 'puppeteer-core'
import fs from 'fs'
import path from 'path'

const SCREENSHOT_DIR = path.resolve('public/screenshots/pages')
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })

  console.log('1. Melakukan login admin...')
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' })
  await page.type('input[type="email"]', 'admin@siop.local')
  await page.type('input[type="password"]', 'admin123')
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ])
  console.log('Login berhasil. URL:', page.url())

  // Test 1: Halaman Daftar Proker
  console.log('2. Mengakses /dashboard/proker...')
  await page.goto('http://localhost:3000/dashboard/proker', { waitUntil: 'networkidle2' })
  await page.waitForSelector('h1', { timeout: 10000 })
  await new Promise(r => setTimeout(r, 1000))
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14-proker-list.png'), fullPage: true })
  console.log('Screenshot 14-proker-list.png tersimpan')

  // Test 2: Klik langsung kartu proker pertama untuk membuka halaman tersendiri
  console.log('3. Menguji klik langsung kartu proker ke halaman tersendiri...')
  const prokerCard = await page.$('.group.cursor-pointer')
  if (prokerCard) {
    await Promise.all([
      prokerCard.click(),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ])
    console.log('Navigasi sukses! URL halaman proker:', page.url())
    await new Promise(r => setTimeout(r, 1500))
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14b-proker-detail-page.png'), fullPage: true })
    console.log('Screenshot 14b-proker-detail-page.png tersimpan')
  } else {
    console.log('Kartu proker tidak ditemukan via selector, mencoba navigasi langsung...')
    await page.goto('http://localhost:3000/dashboard/proker/cmvl5mxi100018yrbqpybxcov', { waitUntil: 'networkidle2' })
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14b-proker-detail-page.png'), fullPage: true })
  }

  // Test 3: Halaman Daftar Proposal
  console.log('4. Mengakses /dashboard/proposal...')
  await page.goto('http://localhost:3000/dashboard/proposal', { waitUntil: 'networkidle2' })
  await page.waitForSelector('h1', { timeout: 10000 })
  await new Promise(r => setTimeout(r, 1000))
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16-proposal-dana.png'), fullPage: true })
  console.log('Screenshot 16-proposal-dana.png tersimpan')

  // Test 4: Klik langsung kartu proposal pertama untuk membuka halaman tersendiri
  console.log('5. Menguji klik langsung proposal ke halaman tersendiri...')
  const proposalCard = await page.$('.group.cursor-pointer')
  if (proposalCard) {
    await Promise.all([
      proposalCard.click(),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ])
    console.log('Navigasi sukses! URL halaman proposal:', page.url())
    await new Promise(r => setTimeout(r, 1500))
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16b-proposal-detail-page.png'), fullPage: true })
    console.log('Screenshot 16b-proposal-detail-page.png tersimpan')
  } else {
    console.log('Proposal card tidak ditemukan, mencoba URL langsung...')
    await page.goto('http://localhost:3000/dashboard/proposal/cmvl5mxjm000b8yrbpnaowsex', { waitUntil: 'networkidle2' })
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16b-proposal-detail-page.png'), fullPage: true })
  }

  await browser.close()
  console.log('Pengujian dan screenshot selesai dengan sukses!')
}

run().catch((err) => {
  console.error('Error saat pengujian:', err)
  process.exit(1)
})
