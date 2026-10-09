import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createCheckout, isArifPayConfigured } from '@/lib/arifpay'
import { sendOrderNotification } from '@/lib/email'

/**
 * POST /api/payments/arifpay/create
 * Body: { orderId: string }
 * Creates an ARIF Pay checkout session for an existing order and returns the redirect URL.
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json()
    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    if (order.status === 'paid') {
      return NextResponse.json({ error: 'Order already paid' }, { status: 400 })
    }

    if (!isArifPayConfigured()) {
      // DEV MODE: simulate a successful payment for local testing
      console.warn('[ARIFPAY] Not configured — simulating payment for dev mode')

      // Mark order as paid with fake transaction
      const fakeTxnId = 'DEV-' + Date.now().toString(36).toUpperCase()
      await db.order.update({
        where: { id: order.id },
        data: {
          status: 'paid',
          arifPayTransactionId: fakeTxnId,
          paymentDate: new Date(),
          paymentVerificationStatus: 'dev_mode_simulated',
          paymentResponse: JSON.stringify({ simulated: true, amount: order.totalAmount })
        }
      })
      await db.payment.upsert({
        where: { orderId: order.id },
        update: {
          status: 'success',
          providerTransactionId: fakeTxnId,
          verified: true,
          verifiedAt: new Date(),
          rawResponse: JSON.stringify({ simulated: true })
        },
        create: {
          orderId: order.id,
          provider: 'arifpay',
          providerTransactionId: fakeTxnId,
          amount: order.totalAmount,
          status: 'success',
          verified: true,
          verifiedAt: new Date(),
          rawResponse: JSON.stringify({ simulated: true })
        }
      })
      await db.orderStatusHistory.create({
        data: { orderId: order.id, status: 'paid', note: 'Payment completed (dev mode simulated)' }
      })
      await db.notification.create({
        data: {
          type: 'payment_success',
          title: 'Payment received',
          message: `${order.orderNumber} — Br ${order.totalAmount.toFixed(2)} (dev simulated)`,
          orderId: order.id
        }
      })
      // Send admin + customer emails
      await sendOrderNotification({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        shippingAddress: order.shippingAddress,
        measurements: order.measurements,
        notes: order.notes,
        paymentMethod: 'arifpay (dev)',
        totalAmount: order.totalAmount,
        items: order.items.map((i) => ({
          title: i.title, size: i.size, quantity: i.quantity, price: i.price
        }))
      })

      return NextResponse.json({
        checkoutUrl: `/?success=1&order=${order.orderNumber}&id=${fakeTxnId}&dev=1#checkout`,
        transactionId: fakeTxnId,
        devMode: true
      })
    }

    // PRODUCTION: real ARIF Pay
    const checkout = await createCheckout({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.totalAmount,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      description: `Order ${order.orderNumber}`
    })

    await db.order.update({
      where: { id: order.id },
      data: {
        arifPayTransactionId: checkout.transactionId,
        arifPayCheckoutUrl: checkout.checkoutUrl,
        status: 'payment_processing'
      }
    })
    await db.payment.upsert({
      where: { orderId: order.id },
      update: {
        providerTransactionId: checkout.transactionId,
        checkoutUrl: checkout.checkoutUrl,
        amount: order.totalAmount,
        status: 'pending'
      },
      create: {
        orderId: order.id,
        provider: 'arifpay',
        providerTransactionId: checkout.transactionId,
        checkoutUrl: checkout.checkoutUrl,
        amount: order.totalAmount,
        status: 'pending'
      }
    })
    await db.orderStatusHistory.create({
      data: { orderId: order.id, status: 'payment_processing', note: 'ARIF Pay checkout created' }
    })

    return NextResponse.json({
      checkoutUrl: checkout.checkoutUrl,
      transactionId: checkout.transactionId
    })
  } catch (e) {
    console.error('[ARIFPAY] create error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Payment initiation failed' },
      { status: 500 }
    )
  }
}
