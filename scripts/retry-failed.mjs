import puppeteer from 'puppeteer-core'
import fs from 'fs'
import path from 'path'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const outputDir = path.resolve(process.cwd(), 'public', 'screenshots', 'pages')
const reportPath = path.resolve(process.cwd(), 'public', 'screenshots', 'audit-report.json')

const FAILED_PAGES = [
  { id: '13', name: 'Bagan Struktur Organisasi', url: 'http://localhost:3000/dashboard/orgchart', file: '13-struktur-organisasi.png', isPublic: false },
  { id: '19', name: 'Rekapitulasi Keuangan', url: 'http://localhost:3000/dashboard/keuangan/rekap', file: '19-keuangan-rekap.png', isPublic: false }
]

async function run() {
  console.log('Retrying capture for previously timed out pages with 30s timeout...')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 }
  })

  const page = await browser.newPage()
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  // Login as admin first
  console.log('Melakukan login admin...')
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await sleep(1000)
  await page.type('#email', 'admin@siop.local')
  await page.type('#password', 'admin123')
  await page.click('button[type="submit"]')
  try {
    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 10000 })
  } catch {
    await sleep(3000)
  }
  await sleep(1500)

  // Read existing report
  let report = []
  if (fs.existsSync(reportPath)) {
    report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'))
  }

  for (const item of FAILED_PAGES) {
    process.stdout.write(`Retrying [${item.id}/37] ${item.name} (${item.url})... `)
    const startTime = Date.now()
    try {
      const response = await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await sleep(2000)
      const status = response ? response.status() : 200
      const filePath = path.join(outputDir, item.file)
      await page.screenshot({ path: filePath })
      const duration = Date.now() - startTime
      console.log(`OK (HTTP ${status}, ${duration}ms) -> ${item.file}`)
      
      // Update report
      const idx = report.findIndex((r) => r.id === item.id)
      if (idx !== -1) {
        report[idx] = { ...item, status, duration, success: status >= 200 && status < 400 }
      }
    } catch (err) {
      console.log(`ERROR: ${err.message}`)
    }
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8')
  await browser.close()
  console.log('Retry completed and audit-report.json updated.')
}

run()

