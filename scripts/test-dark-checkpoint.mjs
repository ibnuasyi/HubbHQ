import puppeteer from 'puppeteer-core'
import fs from 'fs'
import path from 'path'

const SCREENSHOT_DIR = path.resolve('public/screenshots/pages')

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })

  console.log('Login admin...')
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' })
  await page.type('input[type="email"]', 'admin@siop.local')
  await page.type('input[type="password"]', 'admin123')
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ])

  console.log('Buka proker detail...')
  await page.goto('http://localhost:3000/dashboard/proker/cmvl5mxi100018yrbqpybxcov', { waitUntil: 'networkidle2' })

  // Emulate or set dark mode
  await page.evaluate(() => {
    document.documentElement.classList.add('dark')
    document.documentElement.setAttribute('data-theme', 'dark')
  })
  await new Promise(r => setTimeout(r, 1000))

  // Capture checkpoint section in dark mode
  const checkpointSection = await page.$('.space-y-2')
  if (checkpointSection) {
    await checkpointSection.screenshot({ path: path.join(SCREENSHOT_DIR, 'checkpoint-dark-mode.png') })
    console.log('Screenshot checkpoint-dark-mode.png tersimpan')
  }

  // Also full page in dark mode
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14c-proker-dark-mode.png'), fullPage: true })
  console.log('Screenshot 14c-proker-dark-mode.png tersimpan')

  await browser.close()
}

run().catch(console.error)

