import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdmin } from '@/lib/auth'

function safeParse(s: string | null, fallback: unknown) {
  if (!s) return fallback
  try { return JSON.parse(s) } catch { return fallback }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await db.product.findUnique({ where: { id }, include: { reviews: true } })
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({
    product: {
      ...product,
      images: safeParse(product.images, []),
      sizes: safeParse(product.sizes, []),
      reviews: product.reviews.filter((r) => r.approved)
    }
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  const data: Record<string, unknown> = {}
  for (const k of ['title', 'description', 'fabricInfo', 'careInfo', 'category']) {
    if (body[k] !== undefined) data[k] = body[k]
  }
  if (body.price !== undefined) data.price = Number(body.price)
  if (body.salePrice !== undefined) data.salePrice = body.salePrice == null ? null : Number(body.salePrice)
  if (body.inStock !== undefined) data.inStock = !!body.inStock
  if (body.stockCount !== undefined) data.stockCount = Number(body.stockCount)
  if (body.featured !== undefined) data.featured = !!body.featured
  if (body.images !== undefined) data.images = JSON.stringify(body.images || [])
  if (body.sizes !== undefined) data.sizes = JSON.stringify(body.sizes || [])

  const product = await db.product.update({ where: { id }, data })
  return NextResponse.json({ product: { ...product, images: safeParse(product.images, []), sizes: safeParse(product.sizes, []) } })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await db.product.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
