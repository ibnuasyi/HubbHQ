import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const prokers = await prisma.programKerja.findMany({
    select: { id: true, title: true, pic: { select: { name: true } } },
    take: 5
  })
  const proposals = await prisma.proposalDana.findMany({
    select: { id: true, title: true, amount: true, status: true, programKerjaId: true },
    take: 5
  })
  console.log('Prokers:', JSON.stringify(prokers, null, 2))
  console.log('Proposals:', JSON.stringify(proposals, null, 2))
}

main().finally(() => prisma.$disconnect())

