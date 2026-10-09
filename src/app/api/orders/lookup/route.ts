import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/orders/lookup?order=TT-XXXX&email=customer@example.com
 * Customer-facing order lookup (no auth required, but needs email match for security)
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const orderNumber = url.searchParams.get('order')
  const email = url.searchParams.get('email')

  if (!orderNumber) {
    return NextResponse.json({ error: 'Missing order number' }, { status: 400 })
  }

  const order = await db.order.findFirst({
    where: {
      orderNumber,
      ...(email ? { customerEmail: email } : {})
    },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: 'asc' } }
    }
  })

  if (!order) {
    return NextResponse.json({ error: 'Order not found. Check your order number and email.' }, { status: 404 })
  }

  return NextResponse.json({ order })
}
