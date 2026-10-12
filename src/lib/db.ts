import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Lazy initialization — don't create the client at module load time.
// This prevents 500 errors if @prisma/client wasn't generated during the build.
let _prisma: PrismaClient | null = null

function getClient(): PrismaClient {
  if (_prisma) return _prisma

  // In development, reuse the cached client to avoid connection exhaustion during hot reload
  if (process.env.NODE_ENV !== 'production' && globalForPrisma.prisma) {
    _prisma = globalForPrisma.prisma
    return _prisma
  }

  _prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = _prisma
  }

  return _prisma
}

// Export a proxy that lazily creates the client on first use
// This way, module import never fails — errors only surface when you actually query
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient()
    const value = (client as unknown as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  }
})
