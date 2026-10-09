// One-time script: change admin password to Admin123
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  const email = 'admin@ttstibeb.com'
  const newPassword = 'Admin123'
  const passwordHash = await bcrypt.hash(newPassword, 10)

  const admin = await db.adminUser.findUnique({ where: { email } })
  if (!admin) {
    console.log(`No admin user found with email ${email}. Creating one.`)
    await db.adminUser.create({
      data: { email, passwordHash, name: 'TT Admin', role: 'super_admin' }
    })
  } else {
    await db.adminUser.update({ where: { email }, data: { passwordHash } })
  }

  console.log(`✓ Admin password updated to: ${newPassword}`)
  console.log(`  Login: ${email} / ${newPassword}`)
}

main().finally(() => db.$disconnect())
