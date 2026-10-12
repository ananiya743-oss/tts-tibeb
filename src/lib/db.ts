import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  })
}

// In development, cache the client to avoid multiple instances during hot reload
// In production (Vercel serverless), we still cache on globalThis — Vercel reuses
// the same function instance for warm requests, so this is more efficient than
// creating a new client every single request.
export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
