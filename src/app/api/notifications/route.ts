import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const unreadOnly = url.searchParams.get('unread') === '1'
  const notifications = await db.notification.findMany({
    where: unreadOnly ? { read: false } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 50
  })
  const unreadCount = await db.notification.count({ where: { read: false } })
  return NextResponse.json({ notifications, unreadCount })
}

export async function PUT(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { id, read, markAllRead } = body
  if (markAllRead) {
    await db.notification.updateMany({ where: { read: false }, data: { read: true } })
    return NextResponse.json({ ok: true })
  }
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await db.notification.update({ where: { id }, data: { read: !!read } })
  return NextResponse.json({ ok: true })
}
