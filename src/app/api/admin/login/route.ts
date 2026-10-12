import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createSession } from '@/lib/auth'

// In-memory rate limiter for login attempts — 5 attempts / 5 min per IP
const ATTEMPTS: Map<string, { count: number; first: number }> = new Map()
function check(ip: string): { ok: boolean; retryIn?: number } {
  const now = Date.now()
  const e = ATTEMPTS.get(ip)
  if (!e || now - e.first > 5 * 60 * 1000) {
    ATTEMPTS.set(ip, { count: 1, first: now })
    return { ok: true }
  }
  e.count += 1
  if (e.count > 5) {
    return { ok: false, retryIn: Math.ceil((5 * 60 * 1000 - (now - e.first)) / 1000) }
  }
  return { ok: true }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'local'
    const limit = check(ip)
    if (!limit.ok) {
      return NextResponse.json(
        { error: `Too many login attempts. Try again in ${limit.retryIn}s.` },
        { status: 429 }
      )
    }
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })

    const admin = await db.adminUser.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (!admin) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const ok = await verifyPassword(password, admin.passwordHash)
    if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    await createSession(admin.id, admin.email)
    // Reset attempts on success
    ATTEMPTS.delete(ip)
    return NextResponse.json({ admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } })
  } catch (error) {
    console.error('[API /admin/login] Error:', error)
    return NextResponse.json(
      {
        error: 'Server error during login',
        message: error instanceof Error ? error.message : 'Unknown error',
        dbUrlSet: !!process.env.DATABASE_URL
      },
      { status: 500 }
    )
  }
}
