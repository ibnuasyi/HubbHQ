import puppeteer from 'puppeteer-core'
import fs from 'fs'
import path from 'path'

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
]

const executablePath = CHROME_PATHS.find(p => fs.existsSync(p))

if (!executablePath) {
  console.error('No suitable Chrome or Edge browser executable found!')
  process.exit(1)
}

console.log(`Using browser: ${executablePath}`)

const outputDir = path.resolve(process.cwd(), 'public', 'screenshots')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

const capturedErrors = []

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

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[Browser Console Error] ${msg.text()}`)
      capturedErrors.push(msg.text())
    }
  })

  page.on('pageerror', err => {
    console.error(`[Browser Page Error] ${err.message}`)
    capturedErrors.push(err.message)
  })

  const sleep = ms => new Promise(r => setTimeout(r, ms))

  try {
    // 1. Landing Page
    console.log('1. Capturing Landing Page...')
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2', timeout: 30000 })
    await sleep(2500)
    await page.screenshot({ path: path.join(outputDir, '01-landing-page.png'), fullPage: false })
    console.log('✔ Saved 01-landing-page.png')

    // 2. Login Page
    console.log('2. Capturing Login Page...')
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2', timeout: 30000 })
    await sleep(1500)
    await page.screenshot({ path: path.join(outputDir, '02-login-page.png') })
    console.log('✔ Saved 02-login-page.png')

    // 3. Perform Login
    console.log('3. Performing Login with default admin credentials...')
    await page.type('#email', 'admin@siop.local')
    await page.type('#password', 'admin123')
    await page.click('button[type="submit"]')

    // Wait for navigation to /dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(async () => {
      console.log('Navigation wait timeout, waiting 5s...')
      await sleep(5000)
    })
    await sleep(3000)
    console.log('Current URL after login:', page.url())

    // Screenshot Dashboard
    await page.screenshot({ path: path.join(outputDir, '03-dashboard.png') })
    console.log('✔ Saved 03-dashboard.png')

    // 4. Anggota
    console.log('4. Capturing Anggota Page...')
    await page.goto('http://localhost:3000/dashboard/anggota', { waitUntil: 'networkidle2', timeout: 30000 })
    await sleep(3000)
    await page.screenshot({ path: path.join(outputDir, '04-anggota.png') })
    console.log('✔ Saved 04-anggota.png')

    // 5. Keuangan
    console.log('5. Capturing Keuangan Page...')
    await page.goto('http://localhost:3000/dashboard/keuangan', { waitUntil: 'networkidle2', timeout: 30000 })
    await sleep(3000)
    await page.screenshot({ path: path.join(outputDir, '05-keuangan.png') })
    console.log('✔ Saved 05-keuangan.png')

    // 6. Kalender Kegiatan
    console.log('6. Capturing Kalender Page...')
    await page.goto('http://localhost:3000/dashboard/kalender', { waitUntil: 'networkidle2', timeout: 30000 })
    await sleep(3000)
    await page.screenshot({ path: path.join(outputDir, '06-kalender.png') })
    console.log('✔ Saved 06-kalender.png')

    // 7. Surat
    console.log('7. Capturing Surat Page...')
    await page.goto('http://localhost:3000/dashboard/surat', { waitUntil: 'networkidle2', timeout: 30000 })
    await sleep(3000)
    await page.screenshot({ path: path.join(outputDir, '07-surat.png') })
    console.log('✔ Saved 07-surat.png')

    // 8. Website Builder / CMS
    console.log('8. Capturing Website Builder / Settings...')
    await page.goto('http://localhost:3000/dashboard/settings/website', { waitUntil: 'networkidle2', timeout: 30000 })
    await sleep(3000)
    await page.screenshot({ path: path.join(outputDir, '08-website-builder.png') })
    console.log('✔ Saved 08-website-builder.png')

    // 9. Pengaturan Organisasi & Roles
    console.log('9. Capturing Settings Page...')
    await page.goto('http://localhost:3000/dashboard/settings', { waitUntil: 'networkidle2', timeout: 30000 })
    await sleep(3000)
    await page.screenshot({ path: path.join(outputDir, '09-pengaturan.png') })
    console.log('✔ Saved 09-pengaturan.png')

    console.log('\nAll screenshots taken successfully!')
  } catch (err) {
    console.error('Error during screenshot capture:', err)
  } finally {
    await browser.close()
  }

  if (capturedErrors.length > 0) {
    console.log(`\nFound ${capturedErrors.length} browser errors during session.`)
  } else {
    console.log('\nZero browser errors detected during testing session! All pages rendered smoothly.')
  }
}

run()

