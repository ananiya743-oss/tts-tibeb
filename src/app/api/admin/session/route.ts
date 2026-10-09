import { NextResponse } from 'next/server'
import { getAdmin, destroySession } from '@/lib/auth'

export async function GET() {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ admin: null })
  return NextResponse.json({ admin })
}

export async function DELETE() {
  await destroySession()
  return NextResponse.json({ ok: true })
}
