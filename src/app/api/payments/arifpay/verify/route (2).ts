import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyTransaction, isArifPayConfigured } from '@/lib/arifpay'
import { sendOrderNotification } from '@/lib/email'

/**
 * POST /api/payments/arifpay/verify
 * Body: { transactionId: string, orderId?: string }
 * Server-side verification — called after the customer returns from ARIF Pay.
 * Marks order as paid ONLY if verification passes.
 */
export async function POST(req: NextRequest) {
  try {
    const { transactionId, orderId } = await req.json()
    if (!transactionId) {
      return NextResponse.json({ error: 'Missing transactionId' }, { status: 400 })
    }

    // Find the order by transaction ID (or orderId if provided)
    const order = await db.order.findFirst({
      where: orderId
        ? { id: orderId }
        : { arifPayTransactionId: transactionId },
      include: { items: true }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found for this transaction' }, { status: 404 })
    }

    // Already paid? Idempotent response
    if (order.status === 'paid') {
      return NextResponse.json({
        ok: true,
        alreadyPaid: true,
        orderNumber: order.orderNumber,
        status: 'paid'
      })
    }

    let verifyStatus: 'success' | 'failed' | 'pending' | 'cancelled' | 'expired' = 'pending'
    let verifiedAmount = 0
    let rawResponse: unknown = null

    if (!isArifPayConfigured()) {
      // Dev mode: trust the redirect for simulation
      console.warn('[ARIFPAY] Not configured — accepting dev mode payment')
      verifyStatus = 'success'
      verifiedAmount = order.totalAmount
      rawResponse = { simulated: true }
    } else {
      const result = await verifyTransaction(transactionId)
      verifyStatus = result.status
      verifiedAmount = result.amount
      rawResponse = result.rawResponse
    }

    // Update payment record
    await db.payment.upsert({
      where: { orderId: order.id },
      update: {
        status: verifyStatus === 'success' ? 'success' : verifyStatus,
        providerTransactionId: transactionId,
        verified: verifyStatus === 'success',
        verifiedAt: verifyStatus === 'success' ? new Date() : null,
        rawResponse: JSON.stringify(rawResponse)
      },
      create: {
        orderId: order.id,
        provider: 'arifpay',
        providerTransactionId: transactionId,
        amount: order.totalAmount,
        status: verifyStatus === 'success' ? 'success' : verifyStatus,
        verified: verifyStatus === 'success',
        verifiedAt: verifyStatus === 'success' ? new Date() : null,
        rawResponse: JSON.stringify(rawResponse)
      }
    })

    if (verifyStatus === 'success') {
      // Mark order PAID
      await db.order.update({
        where: { id: order.id },
        data: {
          status: 'paid',
          arifPayTransactionId: transactionId,
          paymentDate: new Date(),
          paymentVerificationStatus: 'verified_success',
          paymentResponse: JSON.stringify(rawResponse)
        }
      })
      await db.orderStatusHistory.create({
        data: { orderId: order.id, status: 'paid', note: `ARIF Pay txn ${transactionId} verified` }
      })
      await db.notification.create({
        data: {
          type: 'payment_success',
          title: 'Payment received',
          message: `${order.orderNumber} — Br ${order.totalAmount.toFixed(2)} (ARIF Pay)`,
          orderId: order.id
        }
      })
      // Send admin notification
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

      return NextResponse.json({
        ok: true,
        orderNumber: order.orderNumber,
        status: 'paid',
        transactionId
      })
    }

    // Payment failed / cancelled / expired
    await db.order.update({
      where: { id: order.id },
      data: {
        status: verifyStatus === 'cancelled' ? 'cancelled' : 'payment_failed',
        paymentVerificationStatus: verifyStatus,
        paymentResponse: JSON.stringify(rawResponse)
      }
    })
    await db.orderStatusHistory.create({
      data: { orderId: order.id, status: verifyStatus === 'cancelled' ? 'cancelled' : 'payment_failed', note: `ARIF Pay txn ${transactionId} — ${verifyStatus}` }
    })
    await db.notification.create({
      data: {
        type: 'payment_failed',
        title: 'Payment failed',
        message: `${order.orderNumber} — ${verifyStatus}`,
        orderId: order.id
      }
    })

    return NextResponse.json({
      ok: false,
      orderNumber: order.orderNumber,
      status: verifyStatus,
      transactionId
    })
  } catch (e) {
    console.error('[ARIFPAY] verify error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Verification failed' },
      { status: 500 }
    )
  }
}
