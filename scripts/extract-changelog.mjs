import fs from 'fs'

const version = (process.argv[2] || '').replace(/^v/, '').trim()

if (!version) {
  console.error('Error: Version argument required (e.g. 1.2.0 or v1.2.0)')
  process.exit(1)
}

if (!fs.existsSync('CHANGELOG.md')) {
  console.warn('Warning: CHANGELOG.md not found')
  process.exit(0)
}

const content = fs.readFileSync('CHANGELOG.md', 'utf-8')
const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const regex = new RegExp(`## \\[${escaped}\\][^\\n]*\\n([\\s\\S]*?)(?=\\n## \\[|$)`)
const match = content.match(regex)

if (match && match[1]?.trim()) {
  fs.writeFileSync('release_body.md', match[1].trim(), 'utf-8')
  console.log(`Successfully extracted changelog for version ${version} to release_body.md`)
} else {
  console.log(`No changelog section found matching version [${version}]`)
}

