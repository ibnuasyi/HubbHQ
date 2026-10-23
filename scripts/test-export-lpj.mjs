import http from 'http'
import fs from 'fs'

async function testExport() {
  // Get the proker id created from previous test
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  const proker = await prisma.programKerja.findFirst({
    where: { title: { contains: 'LDKO 2026' } },
  })

  if (!proker) {
    console.error('Proker not found!')
    process.exit(1)
  }

  console.log(`Testing LPJ Export for Proker ID: ${proker.id}`)
  await prisma.$disconnect()
}

testExport()

