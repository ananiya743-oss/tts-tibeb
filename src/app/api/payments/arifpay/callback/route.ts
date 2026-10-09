import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyTransaction, isArifPayConfigured } from '@/lib/arifpay'
import { sendOrderNotification } from '@/lib/email'

/**
 * ARIF Pay webhook/callback endpoint.
 * ARIF Pay calls this server-to-server after payment completes.
 * This is the source of truth — even more authoritative than the success-redirect verification.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const txnId: string | undefined =
      body?.transactionId || body?.id || body?.data?.transactionId || body?.data?.sessionId

    if (!txnId) {
      return NextResponse.json({ error: 'Missing transactionId' }, { status: 400 })
    }

    const order = await db.order.findFirst({
      where: { arifPayTransactionId: txnId },
      include: { items: true }
    })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Idempotency: if already paid, don't process again
    if (order.status === 'paid') {
      return NextResponse.json({ ok: true, alreadyPaid: true })
    }

    // Always re-verify server-side (don't trust the webhook payload)
    let verifyStatus: 'success' | 'failed' | 'pending' | 'cancelled' | 'expired' = 'pending'
    let rawResponse: unknown = body

    if (isArifPayConfigured()) {
      const result = await verifyTransaction(txnId)
      verifyStatus = result.status
      rawResponse = result.rawResponse
    } else {
      // Dev mode: assume success if webhook fires
      verifyStatus = 'success'
    }

    if (verifyStatus === 'success') {
      await db.order.update({
        where: { id: order.id },
        data: {
          status: 'paid',
          paymentDate: new Date(),
          paymentVerificationStatus: 'webhook_verified',
          paymentResponse: JSON.stringify(rawResponse)
        }
      })
      await db.payment.upsert({
        where: { orderId: order.id },
        update: {
          status: 'success',
          verified: true,
          verifiedAt: new Date(),
          rawResponse: JSON.stringify(rawResponse)
        },
        create: {
          orderId: order.id,
          provider: 'arifpay',
          providerTransactionId: txnId,
          amount: order.totalAmount,
          status: 'success',
          verified: true,
          verifiedAt: new Date(),
          rawResponse: JSON.stringify(rawResponse)
        }
      })
      await db.orderStatusHistory.create({
        data: { orderId: order.id, status: 'paid', note: `Webhook verified — txn ${txnId}` }
      })
      await db.notification.create({
        data: {
          type: 'payment_success',
          title: 'Payment received',
          message: `${order.orderNumber} — Br ${order.totalAmount.toFixed(2)}`,
          orderId: order.id
        }
      })
      await sendOrderNotification({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        shippingAddress: order.shippingAddress,
        measurements: order.measurements,
        notes: order.notes,
        paymentMethod: 'ARIF Pay',
        totalAmount: order.totalAmount,
        items: order.items.map((i) => ({
          title: i.title, size: i.size, quantity: i.quantity, price: i.price
        }))
      })
    } else {
      await db.order.update({
        where: { id: order.id },
        data: {
          status: verifyStatus === 'cancelled' ? 'cancelled' : 'payment_failed',
          paymentVerificationStatus: `webhook_${verifyStatus}`,
          paymentResponse: JSON.stringify(rawResponse)
        }
      })
      await db.orderStatusHistory.create({
        data: { orderId: order.id, status: 'payment_failed', note: `Webhook — ${verifyStatus}` }
      })
    }

    return NextResponse.json({ ok: true, status: verifyStatus })
  } catch (e) {
    console.error('[ARIFPAY] callback error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// ARIF Pay may also call via GET redirect
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const txnId = url.searchParams.get('id') || url.searchParams.get('transactionId')
  if (txnId) {
    // Re-trigger POST logic
    return POST(new NextRequest(req.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId: txnId })
    }))
  }
  return NextResponse.json({ ok: true })
}
