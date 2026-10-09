import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdmin } from '@/lib/auth'

function sanitize(s: unknown, max = 1000): string {
  if (typeof s !== 'string') return ''
  return s.replace(/[<>]/g, '').slice(0, max).trim()
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const productId = url.searchParams.get('productId')
  const adminView = url.searchParams.get('admin') === '1'
  const where: Record<string, unknown> = {}
  if (productId) where.productId = productId
  if (!adminView) where.approved = true
  const reviews = await db.productReview.findMany({ where, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ reviews })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { productId, author, rating, comment } = body
  if (!productId || !author || !comment) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  const r = Math.max(1, Math.min(5, Number(rating) || 5))
  const review = await db.productReview.create({
    data: {
      productId,
      author: sanitize(author, 80),
      rating: r,
      comment: sanitize(comment, 1000),
      approved: false
    }
  })
  return NextResponse.json({ review })
}

export async function PUT(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { id, approved } = body
  const review = await db.productReview.update({ where: { id }, data: { approved: !!approved } })
  return NextResponse.json({ review })
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await db.productReview.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
