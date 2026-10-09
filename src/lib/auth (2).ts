import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { db } from './db'

const SESSION_COOKIE = 'tt_admin_session'
const SECRET = process.env.ADMIN_JWT_SECRET || 'tt-tibeb-dev-secret'

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10)
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash)
}

// Minimal JWT encode/decode (avoids pulling in jsonwebtoken which can conflict with edge)
async function encodeJWT(payload: Record<string, unknown>): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const enc = (o: unknown) =>
    Buffer.from(JSON.stringify(o)).toString('base64url')
  const data = `${enc(header)}.${enc(payload)}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return `${data}.${Buffer.from(new Uint8Array(sig)).toString('base64url')}`
}

async function decodeJWT<T = Record<string, unknown>>(token: string): Promise<T | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, payload, signature] = parts
  const data = `${header}.${payload}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )
  const sigBuf = Buffer.from(signature, 'base64url')
  const ok = await crypto.subtle.verify('HMAC', key, sigBuf, new TextEncoder().encode(data))
  if (!ok) return null
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as T
}

export async function createSession(adminId: string, email: string) {
  const token = await encodeJWT({
    sub: adminId,
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
  })
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  })
  return token
}

export async function destroySession() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
}

export async function getAdmin() {
  try {
    const jar = await cookies()
    const token = jar.get(SESSION_COOKIE)?.value
    if (!token) return null
    const payload = await decodeJWT<{ sub: string; email: string; exp: number }>(token)
    if (!payload) return null
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
    const admin = await db.adminUser.findUnique({ where: { id: payload.sub } })
    if (!admin) return null
    return { id: admin.id, email: admin.email, name: admin.name, role: admin.role }
  } catch {
    return null
  }
}

// Re-exporting for clarity
export { SESSION_COOKIE }
