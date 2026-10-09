import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdmin, hashPassword } from '@/lib/auth'

export async function GET() {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const users = await db.adminUser.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true }
  })
  return NextResponse.json({ users, currentAdmin: admin })
}

export async function POST(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (admin.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only super admins can add users' }, { status: 403 })
  }
  const { email, password, name, role } = await req.json()
  if (!email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 chars' }, { status: 400 })

  const existing = await db.adminUser.findUnique({ where: { email: email.toLowerCase().trim() } })
  if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 400 })

  const passwordHash = await hashPassword(password)
  const user = await db.adminUser.create({
    data: {
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name || null,
      role: role || 'admin'
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true }
  })
  return NextResponse.json({ user })
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (admin.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only super admins can delete users' }, { status: 403 })
  }
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  if (id === admin.id) return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  await db.adminUser.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
