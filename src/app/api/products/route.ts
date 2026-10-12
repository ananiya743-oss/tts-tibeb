import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdmin } from '@/lib/auth'

function safeParse(s: string | null, fallback: unknown) {
  if (!s) return fallback
  try { return JSON.parse(s) } catch { return fallback }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const category = url.searchParams.get('category')
    const featured = url.searchParams.get('featured')
    const q = url.searchParams.get('q')
    const limit = Number(url.searchParams.get('limit') || 0)

    const where: Record<string, unknown> = {}
    if (category) where.category = category
    if (featured === 'true') where.featured = true
    if (q) where.title = { contains: q }

    const products = await db.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...(limit ? { take: limit } : {})
    })

    const result = products.map((p) => ({
      ...p,
      images: safeParse(p.images, []),
      sizes: safeParse(p.sizes, [])
    }))

    return NextResponse.json({ products: result })
  } catch (error) {
    console.error('[API /products] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch products',
        message: error instanceof Error ? error.message : 'Unknown error',
        dbUrlSet: !!process.env.DATABASE_URL
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    title, description, fabricInfo, careInfo,
    price, salePrice, images, sizes, category,
    inStock, stockCount, featured
  } = body

  if (!title || !description || price == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const slug = (body.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) + '-' + Date.now().toString(36)

  const product = await db.product.create({
    data: {
      title, slug, description,
      fabricInfo: fabricInfo || '',
      careInfo: careInfo || '',
      price: Number(price),
      salePrice: salePrice != null ? Number(salePrice) : null,
      images: JSON.stringify(images || []),
      sizes: JSON.stringify(sizes || []),
      category: category || 'uncategorized',
      inStock: inStock !== undefined ? !!inStock : true,
      stockCount: stockCount != null ? Number(stockCount) : 0,
      featured: !!featured
    }
  })

  return NextResponse.json({ product: { ...product, images: safeParse(product.images, []), sizes: safeParse(product.sizes, []) } })
}
