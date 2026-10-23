import puppeteer from 'puppeteer-core'
import fs from 'fs'
import path from 'path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const outputDir = path.resolve(process.cwd(), 'public', 'screenshots', 'pages')
const reportPath = path.resolve(process.cwd(), 'public', 'screenshots', 'audit-report.json')

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 }
  })

  const page = await browser.newPage()
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  console.log('Navigating to login...')
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2', timeout: 30000 })
  await sleep(2000)

  console.log('Typing credentials...')
  await page.focus('#email')
  await page.type('#email', 'admin@siop.local', { delay: 50 })
  await page.focus('#password')
  await page.type('#password', 'admin123', { delay: 50 })
  await sleep(1000)

  console.log('Clicking submit...')
  await page.click('button[type="submit"]')
  
  // Wait up to 10s for url to change to /dashboard
  let loggedIn = false
  for (let i = 0; i < 20; i++) {
    await sleep(500)
    const currentUrl = page.url()
    if (currentUrl.includes('/dashboard')) {
      loggedIn = true
      break
    }
  }

  console.log('Login result:', loggedIn, 'Current URL:', page.url())
  if (!loggedIn) {
    console.error('Login did not navigate to dashboard!')
    await browser.close()
    process.exit(1)
  }

  // Now capture orgchart and rekap
  const targets = [
    { id: '13', name: 'Bagan Struktur Organisasi', url: 'http://localhost:3000/dashboard/orgchart', file: '13-struktur-organisasi.png' },
    { id: '19', name: 'Rekapitulasi Keuangan', url: 'http://localhost:3000/dashboard/keuangan/rekap', file: '19-keuangan-rekap.png' }
  ]

  let report = []
  if (fs.existsSync(reportPath)) {
    report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'))
  }

  for (const item of targets) {
    console.log(`Capturing ${item.name}...`)
    const t0 = Date.now()
    const resp = await page.goto(item.url, { waitUntil: 'networkidle2', timeout: 30000 })
    await sleep(2000)
    console.log(`Current page URL: ${page.url()}`)
    const filePath = path.join(outputDir, item.file)
    await page.screenshot({ path: filePath })
    const dur = Date.now() - t0
    const status = resp ? resp.status() : 200
    console.log(`Saved ${item.file} (${dur}ms, HTTP ${status})`)

    const idx = report.findIndex((r) => r.id === item.id)
    if (idx !== -1) {
      report[idx] = { ...item, isPublic: false, status, duration: dur, success: true }
    }
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8')
  await browser.close()
  console.log('Finished successfully!')
}

run()

