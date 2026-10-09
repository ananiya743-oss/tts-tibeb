/**
 * ARIF Pay — Ethiopian payment gateway integration
 *
 * Docs: https://developer.arifpay.net
 *
 * Flow:
 *   1. Server creates a checkout session → returns { checkoutUrl, transactionId }
 *   2. Customer is redirected to checkoutUrl on ARIF Pay's domain
 *   3. Customer pays (cards, telebirr, CBE, etc.)
 *   4. ARIF Pay redirects back to ?id=TRANSACTION_ID on success
 *   5. Server calls verify(transactionId) → confirms payment status
 *   6. Order is marked PAID only after verification passes
 */

const API_BASE =
  process.env.ARIFPAY_ENV === 'production'
    ? 'https://gateway.arifpay.net'
    : 'https://gateway.arifpay.net/sandbox'

const API_KEY = process.env.ARIFPAY_API_KEY || ''
const SECRET = process.env.ARIFPAY_SECRET || ''
const MERCHANT_ID = process.env.ARIFPAY_MERCHANT_ID || ''
const CALLBACK_URL = process.env.ARIFPAY_CALLBACK_URL || 'http://localhost:3000/api/payments/arifpay/callback'

export function isArifPayConfigured() {
  return !!(API_KEY && SECRET && MERCHANT_ID)
}

export interface CreateCheckoutInput {
  orderId: string
  orderNumber: string
  amount: number // ETB
  customerName: string
  customerEmail: string
  customerPhone: string
  description?: string
}

export interface CreateCheckoutOutput {
  checkoutUrl: string
  transactionId: string
  rawResponse?: unknown
}

/**
 * Create an ARIF Pay checkout session.
 * Returns the URL the customer should be redirected to.
 */
export async function createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutOutput> {
  if (!isArifPayConfigured()) {
    throw new Error('ARIF Pay is not configured. Set ARIFPAY_API_KEY, ARIFPAY_SECRET, ARIFPAY_MERCHANT_ID in .env')
  }

  const payload = {
    apiKey: API_KEY,
    secret: SECRET,
    merchantId: MERCHANT_ID,
    amount: input.amount.toFixed(2),
    currency: 'ETB',
    paymentMethods: ['CARD', 'TELEBIRR', 'CBE', 'DASHEN', 'AWASH'],
    notifyUrl: CALLBACK_URL,
    cancelUrl: `${process.env.APP_URL || 'http://localhost:3000'}/?cancelled=1&order=${input.orderNumber}#checkout`,
    successUrl: `${process.env.APP_URL || 'http://localhost:3000'}/?success=1&order=${input.orderNumber}&id={transactionId}#checkout`,
    errorUrl: `${process.env.APP_URL || 'http://localhost:3000'}/?failed=1&order=${input.orderNumber}#checkout`,
    customRef: input.orderNumber,
    customRef2: input.orderId,
    customer: {
      email: input.customerEmail || 'guest@ttstibeb.com',
      firstName: input.customerName.split(' ')[0] || 'Customer',
      lastName: input.customerName.split(' ').slice(1).join(' ') || '',
      phoneNumber: input.customerPhone,
    },
    description: input.description || `Order ${input.orderNumber} — TT's Tibeb`,
    items: [
      {
        name: `Order ${input.orderNumber}`,
        quantity: 1,
        price: input.amount.toFixed(2),
        total: input.amount.toFixed(2),
      },
    ],
  }

  const res = await fetch(`${API_BASE}/api/v2/checkout/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-arifpay-key': API_KEY,
    },
    body: JSON.stringify(payload),
  })

  const data = await res.json().catch(() => null)

  if (!res.ok || !data) {
    console.error('[ARIFPAY] createCheckout failed:', res.status, data)
    throw new Error(`ARIF Pay checkout creation failed: ${data?.message || res.statusText}`)
  }

  // ARIF Pay response shape (per docs): { status: 'Success', data: { checkoutUrl, sessionId, ... } }
  const checkoutUrl: string | undefined =
    data?.data?.checkoutUrl || data?.checkoutUrl || data?.data?.paymentUrl
  const transactionId: string | undefined =
    data?.data?.sessionId || data?.data?.transactionId || data?.transactionId || data?.data?.id

  if (!checkoutUrl || !transactionId) {
    console.error('[ARIFPAY] Unexpected response shape:', JSON.stringify(data))
    throw new Error('ARIF Pay response missing checkoutUrl or transactionId')
  }

  return { checkoutUrl, transactionId, rawResponse: data }
}

export interface VerifyResult {
  status: 'success' | 'failed' | 'pending' | 'cancelled' | 'expired'
  transactionId: string
  amount: number
  rawResponse: unknown
}

/**
 * Server-side verification of an ARIF Pay transaction.
 * NEVER trust the frontend success redirect — always call this.
 */
export async function verifyTransaction(transactionId: string): Promise<VerifyResult> {
  if (!isArifPayConfigured()) {
    throw new Error('ARIF Pay is not configured')
  }

  const res = await fetch(`${API_BASE}/api/v2/checkout/verify/${transactionId}`, {
    method: 'GET',
    headers: {
      'x-arifpay-key': API_KEY,
      'x-arifpay-secret': SECRET,
    },
  })

  const data = await res.json().catch(() => null)

  if (!res.ok || !data) {
    console.error('[ARIFPAY] verify failed:', res.status, data)
    return {
      status: 'failed',
      transactionId,
      amount: 0,
      rawResponse: data,
    }
  }

  // ARIF Pay response: { status: 'Success', data: { status: 'Paid'|'Pending'|..., amount, ... } }
  const inner = data?.data || data
  const innerStatus: string = (inner?.status || data?.status || '').toString().toLowerCase()
  const amount: number = Number(inner?.amount || inner?.totalAmount || 0)

  let mapped: VerifyResult['status'] = 'pending'
  if (['paid', 'success', 'successful', 'completed'].includes(innerStatus)) mapped = 'success'
  else if (['failed', 'error', 'declined'].includes(innerStatus)) mapped = 'failed'
  else if (['cancelled', 'canceled'].includes(innerStatus)) mapped = 'cancelled'
  else if (['expired', 'timeout'].includes(innerStatus)) mapped = 'expired'

  return {
    status: mapped,
    transactionId,
    amount,
    rawResponse: data,
  }
}
