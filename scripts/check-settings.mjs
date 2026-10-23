import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function run() {
  const configs = await prisma.websiteConfig.findMany()
  console.log('Total website configs:', configs.length)
  for (const c of configs) {
    console.log(`Key: ${c.key} | Value: ${JSON.stringify(c.value)} | Category: ${c.category}`)
  }

  const themes = await prisma.theme.findMany()
  console.log('\nThemes in DB:')
  for (const t of themes) {
    console.log(`ID: ${t.id} | Name: ${t.name} | Slug: ${t.slug} | Active: ${t.isActive}`)
  }

  await prisma.$disconnect()
}

run()
