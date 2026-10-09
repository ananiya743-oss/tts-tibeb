import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE = 'tt_admin_session'
const SECRET = process.env.ADMIN_JWT_SECRET || 'tt-tibeb-dev-secret'

async function decodeJWT(token: string): Promise<{ sub: string; email: string; exp: number } | null> {
  try {
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
    // Use atob for base64url decoding (edge-compatible, no Buffer)
    const sigStr = signature.replace(/-/g, '+').replace(/_/g, '/')
    const sigBuf = Uint8Array.from(atob(sigStr), c => c.charCodeAt(0))
    const ok = await crypto.subtle.verify('HMAC', key, sigBuf, new TextEncoder().encode(data))
    if (!ok) return null
    const payloadStr = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(payloadStr)
  } catch {
    return null
  }
}

async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return false
  const payload = await decodeJWT(token)
  if (!payload) return false
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return false
  return true
}

/**
 * Protects /admin/* routes — only authenticated admins may pass.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (!pathname.startsWith('/admin')) return NextResponse.next()
  if (pathname.startsWith('/admin/_')) return NextResponse.next()

  const authed = await isAuthenticated(req)
  const isLoginPage = pathname === '/admin/login' || pathname === '/admin/login/'

  if (!authed) {
    if (isLoginPage) return NextResponse.next()
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/admin/login'
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated admin
  if (isLoginPage || pathname === '/admin' || pathname === '/admin/') {
    const dashUrl = req.nextUrl.clone()
    dashUrl.pathname = '/admin/dashboard'
    return NextResponse.redirect(dashUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}
