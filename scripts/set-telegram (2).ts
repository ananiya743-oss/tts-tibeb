// One-time script: set Telegram username to @TTs2126
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
  await db.siteContent.upsert({
    where: { id: 'contact.telegram' },
    update: { value: 'TTs2126' },
    create: { id: 'contact.telegram', value: 'TTs2126' }
  })
  console.log('✓ Telegram username set to @TTs2126')
  console.log('  Stored as: TTs2126 (without @ — the @ is added automatically when opening Telegram)')
}

main().finally(() => db.$disconnect())
