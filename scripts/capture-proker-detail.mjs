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

  // Login
  console.log('Logging in...')
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2', timeout: 30000 })
  await sleep(1500)
  await page.type('#email', 'admin@siop.local')
  await page.type('#password', 'admin123')
  await page.click('button[type="submit"]')
  await sleep(3000)

  // Visit proker list
  console.log('Capturing updated proker list...')
  await page.goto('http://localhost:3000/dashboard/proker', { waitUntil: 'networkidle2', timeout: 30000 })
  await sleep(1500)
  await page.screenshot({ path: path.join(outputDir, '14-proker-list.png') })

  // Visit proker detail
  const prokerId = 'cmvl5mxi100018yrbqpybxcov'
  console.log(`Capturing proker detail for ${prokerId}...`)
  await page.goto(`http://localhost:3000/dashboard/proker/${prokerId}`, { waitUntil: 'networkidle2', timeout: 30000 })
  await sleep(2000)
  await page.screenshot({ path: path.join(outputDir, '14b-proker-detail-matriks.png') })

  // Click Proposal Tab
  console.log('Clicking proposal tab...')
  const tabs = await page.$$('[role="tab"]')
  if (tabs.length >= 4) {
    await tabs[2].click() // Proposal tab
    await sleep(1500)
    await page.screenshot({ path: path.join(outputDir, '14c-proker-detail-proposal.png') })

    // Click LPJ Tab
    console.log('Clicking LPJ tab...')
    await tabs[3].click() // LPJ tab
    await sleep(1500)
    await page.screenshot({ path: path.join(outputDir, '14d-proker-detail-lpj.png') })
  }

  await browser.close()
  console.log('All screenshots captured successfully!')
}

run()
