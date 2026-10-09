import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdmin } from '@/lib/auth'

export async function GET() {
  const items = await db.themeSetting.findMany()
  const map: Record<string, string> = {}
  for (const i of items) map[i.id] = i.value
  return NextResponse.json({ theme: map })
}

export async function PUT(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const values = body.values || body
  for (const [k, v] of Object.entries(values)) {
    const valueStr = typeof v === 'string' ? v : JSON.stringify(v)
    await db.themeSetting.upsert({
      where: { id: k },
      update: { value: valueStr },
      create: { id: k, value: valueStr }
    })
  }
  return NextResponse.json({ ok: true })
}
