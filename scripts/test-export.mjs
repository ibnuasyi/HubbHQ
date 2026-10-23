import http from 'http'
import fs from 'fs'

async function checkUrl(url, filename) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      console.log(`GET ${url} -> HTTP ${res.statusCode}`)
      const chunks = []
      res.on('data', (d) => chunks.push(d))
      res.on('end', () => {
        const buf = Buffer.concat(chunks)
        console.log(`Received ${buf.length} bytes for ${filename}`)
        if (buf.length > 0) {
          console.log(`Magic bytes:`, buf.subarray(0, 4))
        }
        resolve(res.statusCode)
      })
    }).on('error', reject)
  })
}

async function run() {
  const prokerId = 'cmvl5mxi100018yrbqpybxcov'
  // Test PDF and Excel export
  // Note: endpoints require session, so let's verify route handler directly
  console.log('Testing route handlers directly with Prisma data...')
}

run()

