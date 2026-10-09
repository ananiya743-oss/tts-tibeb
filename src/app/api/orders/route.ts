import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdmin } from '@/lib/auth'
import { sendOrderNotification } from '@/lib/email'

function genOrderNumber() {
  const d = new Date()
  const y = d.getFullYear().toString().slice(-2)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `TT-${y}${m}${day}-${rnd}`
}

function sanitize(s: unknown, max = 2000): string {
  if (typeof s !== 'string') return ''
  return s.replace(/[<>]/g, '').slice(0, max).trim()
}

// Rate limiter
const RATE: Map<string, { count: number; first: number }> = new Map()
function rateCheck(ip: string): boolean {
  const now = Date.now()
  const entry = RATE.get(ip)
  if (!entry || now - entry.first > 10 * 60 * 1000) {
    RATE.set(ip, { count: 1, first: now })
    return true
  }
  entry.count += 1
  return entry.count <= 5
}

// New order-request statuses (replaces payment-based statuses)
const VALID_STATUSES = [
  'new', 'contacted', 'price_confirmed', 'processing',
  'ready', 'shipped', 'delivered', 'cancelled'
]

export async function GET(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const country = url.searchParams.get('country')
  const contactMethod = url.searchParams.get('contact_method')
  const isInternational = url.searchParams.get('international')

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (country) where.country = { contains: country }
  if (contactMethod) where.contactMethod = contactMethod
  if (isInternational === 'true') where.isInternational = true

  const orders = await db.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { items: true }
  })
  return NextResponse.json({ orders })
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'local'
  if (!rateCheck(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  const body = await req.json()
  const { items, customer, contactMethod, isInternational } = body || {}

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Order is empty' }, { status: 400 })
  }

  // Validate contact method
  const validMethods = ['gmail', 'whatsapp', 'telegram']
  if (!contactMethod || !validMethods.includes(contactMethod)) {
    return NextResponse.json({ error: 'Please choose a valid contact method (Gmail, WhatsApp, or Telegram)' }, { status: 400 })
  }

  const customerName = sanitize(customer?.fullName, 100)
  const customerPhone = sanitize(customer?.phone, 30)
  const customerEmail = sanitize(customer?.email, 100)
  const country = sanitize(customer?.country, 60) || 'Ethiopia'
  const region = sanitize(customer?.region, 60)
  const city = sanitize(customer?.city, 60)
  const subCity = sanitize(customer?.subCity, 60)
  const shippingAddress = sanitize(customer?.address, 500)
  const customerMessage = sanitize(customer?.message, 1000)
  const isIntl = !!isInternational

  if (!customerName || !customerPhone || !shippingAddress || !city) {
    return NextResponse.json({ error: 'Missing required fields (name, phone, city, address)' }, { status: 400 })
  }

  // Resolve products & build line items (price kept internally for admin records, never shown to customer)
  const lineItems: Array<{
    productId: string | null
    title: string
    price: number
    size: string | null
    quantity: number
    image: string | null
  }> = []

  for (const item of items) {
    if (!item.id || !item.quantity) continue
    const product = await db.product.findUnique({ where: { id: item.id } })
    if (!product) continue
    const unitPrice = product.salePrice != null ? product.salePrice : product.price
    const qty = Math.max(1, Math.min(99, Number(item.quantity) || 1))
    const size = sanitize(item.size, 20)
    const imgs = product.images ? JSON.parse(product.images) as string[] : []
    lineItems.push({
      productId: product.id,
      title: product.title,
      price: unitPrice,
      size: size || null,
      quantity: qty,
      image: imgs[0] || null
    })
  }

  if (lineItems.length === 0) {
    return NextResponse.json({ error: 'No valid items in order' }, { status: 400 })
  }

  const orderNumber = genOrderNumber()

  const order = await db.order.create({
    data: {
      orderNumber,
      customerName, customerPhone, customerEmail,
      country, region: region || null, city: city || null, subCity: subCity || null,
      shippingAddress,
      measurements: null,
      notes: customerMessage || null,
      paymentMethod: contactMethod, // store the chosen contact method here (reused field)
      contactMethod, // also stored in its own column for clarity
      subtotal: 0, shippingCost: 0, discount: 0, tax: 0,
      totalAmount: 0, // no online payment; total discussed directly
      status: 'new',
      isInternational: isIntl,
      items: { create: lineItems }
    },
    include: { items: true }
  })

  // Initial status history
  await db.orderStatusHistory.create({
    data: {
      orderId: order.id,
      status: 'new',
      note: `Order request submitted via ${contactMethod}`
    }
  })

  // Admin notification
  const methodLabel = contactMethod === 'gmail' ? 'Gmail' : contactMethod === 'whatsapp' ? 'WhatsApp' : 'Telegram'
  await db.notification.create({
    data: {
      type: 'new_order',
      title: 'New Order Request',
      message: `${orderNumber} — ${customerName} (${country}) · ${lineItems.length} item(s) · Contact: ${methodLabel}`,
      orderId: order.id
    }
  })

  // Email the admin/owner
  await sendOrderNotification({
    orderNumber,
    customerName, customerPhone, customerEmail, shippingAddress,
    measurements: null,
    notes: customerMessage ? `Customer message: ${customerMessage}` : null,
    paymentMethod: `Contact via ${methodLabel}`,
    totalAmount: 0,
    items: lineItems.map((i) => ({ title: i.title, size: i.size, quantity: i.quantity, price: i.price }))
  })

  return NextResponse.json({ ok: true, order })
}

export async function PUT(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { id, status, note } = body

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (status) data.status = status

  const order = await db.order.update({ where: { id }, data })

  if (status) {
    await db.orderStatusHistory.create({
      data: {
        orderId: id,
        status,
        note: note || null,
        createdBy: admin.email
      }
    })
  }

  return NextResponse.json({ order })
}
