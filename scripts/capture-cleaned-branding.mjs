import puppeteer from 'puppeteer-core'
import path from 'path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const outputDir = path.resolve(process.cwd(), 'public', 'screenshots', 'pages')

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 }
  })

  const page = await browser.newPage()
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  // 1. Landing Page
  console.log('Capturing Landing Page...')
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2', timeout: 30000 })
  await sleep(1500)
  await page.screenshot({ path: path.join(outputDir, '01-publik-landing.png') })

  // 2. Login
  console.log('Logging in...')
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2', timeout: 30000 })
  await sleep(1000)
  await page.type('#email', 'admin@siop.local')
  await page.type('#password', 'admin123')
  await page.click('button[type="submit"]')
  await sleep(3000)

  // 3. Dashboard
  console.log('Capturing Dashboard Utama...')
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2', timeout: 30000 })
  await sleep(1500)
  await page.screenshot({ path: path.join(outputDir, '09-dashboard-utama.png') })

  // 4. Website Settings
  console.log('Capturing Website Settings...')
  await page.goto('http://localhost:3000/dashboard/settings/website', { waitUntil: 'networkidle2', timeout: 30000 })
  await sleep(1500)
  await page.screenshot({ path: path.join(outputDir, '37-settings-website.png') })

  await browser.close()
  console.log('Branding capture completed successfully!')
}

run()

