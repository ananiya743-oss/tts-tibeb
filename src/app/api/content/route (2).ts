import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const key = url.searchParams.get('key')
  if (key) {
    const item = await db.siteContent.findUnique({ where: { id: key } })
    return NextResponse.json({ value: item?.value || null })
  }
  const items = await db.siteContent.findMany()
  const map: Record<string, string> = {}
  for (const i of items) map[i.id] = i.value
  return NextResponse.json({ content: map })
}

export async function PUT(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  // body: { values: { 'key': 'value', ... } }
  const values = body.values || body
  for (const [k, v] of Object.entries(values)) {
    const valueStr = typeof v === 'string' ? v : JSON.stringify(v)
    await db.siteContent.upsert({
      where: { id: k },
      update: { value: valueStr },
      create: { id: k, value: valueStr }
    })
  }
  return NextResponse.json({ ok: true })
}
