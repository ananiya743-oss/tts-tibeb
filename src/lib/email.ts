import nodemailer from 'nodemailer'
import { db } from './db'

const HOST = process.env.SMTP_HOST || ''
const PORT = Number(process.env.SMTP_PORT || 465)
const USER = process.env.SMTP_USER || ''
const PASS = process.env.SMTP_PASS || ''
const FROM = process.env.SMTP_FROM || "TT's Tibeb <orders@ttstibeb.com>"
const TO = process.env.ORDER_NOTIFY_EMAIL || 'ananiya743@gmail.com'

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (!HOST || !USER || !PASS) return null
  if (transporter) return transporter
  transporter = nodemailer.createTransport({
    host: HOST,
    port: PORT,
    secure: PORT === 465,
    auth: { user: USER, pass: PASS }
  })
  return transporter
}

export interface OrderEmailPayload {
  orderNumber: string
  customerName: string
  customerPhone: string
  customerEmail: string
  shippingAddress: string
  measurements?: string | null
  notes?: string | null
  paymentMethod: string
  totalAmount: number
  items: Array<{
    title: string
    size?: string | null
    quantity: number
    price: number
  }>
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderOrderEmail(p: OrderEmailPayload): { subject: string; html: string; text: string } {
  const itemsHtml = p.items
    .map(
      (i, idx) => `
      <tr style="border-bottom:1px solid #2a2418;">
        <td style="padding:10px 12px;color:#f4e7c2;">${idx + 1}</td>
        <td style="padding:10px 12px;color:#f4e7c2;">${escapeHtml(i.title)}${i.size ? ` <span style="color:#9a8c66;">(${escapeHtml(i.size)})</span>` : ''}</td>
        <td style="padding:10px 12px;color:#f4e7c2;text-align:center;">${i.quantity}</td>
        <td style="padding:10px 12px;color:#d4af37;text-align:right;">Br ${i.price.toFixed(2)}</td>
        <td style="padding:10px 12px;color:#d4af37;text-align:right;">Br ${(i.price * i.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join('')

  const subject = `New Order ${p.orderNumber} — TT's Tibeb`
  const html = `
  <div style="background:#0d0d0d;padding:32px;font-family:Georgia,serif;max-width:640px;margin:0 auto;border:1px solid #2a2418;">
    <div style="text-align:center;border-bottom:1px solid #d4af37;padding-bottom:18px;margin-bottom:24px;">
      <h1 style="color:#d4af37;letter-spacing:3px;margin:0;font-size:24px;">TT'S TIBEB</h1>
      <p style="color:#9a8c66;margin:6px 0 0;letter-spacing:2px;font-size:11px;">NEW ORDER NOTIFICATION</p>
    </div>
    <p style="color:#f4e7c2;font-size:16px;">Order <strong style="color:#d4af37;">${escapeHtml(p.orderNumber)}</strong> has just been placed.</p>

    <h3 style="color:#d4af37;margin-top:28px;letter-spacing:1px;">CUSTOMER DETAILS</h3>
    <table style="width:100%;color:#f4e7c2;font-size:14px;">
      <tr><td style="padding:4px 0;color:#9a8c66;width:140px;">Name</td><td>${escapeHtml(p.customerName)}</td></tr>
      <tr><td style="padding:4px 0;color:#9a8c66;">Phone</td><td>${escapeHtml(p.customerPhone)}</td></tr>
      <tr><td style="padding:4px 0;color:#9a8c66;">Email</td><td>${escapeHtml(p.customerEmail)}</td></tr>
      <tr><td style="padding:4px 0;color:#9a8c66;">Shipping Address</td><td>${escapeHtml(p.shippingAddress)}</td></tr>
      ${p.measurements ? `<tr><td style="padding:4px 0;color:#9a8c66;">Measurements</td><td>${escapeHtml(p.measurements)}</td></tr>` : ''}
      ${p.notes ? `<tr><td style="padding:4px 0;color:#9a8c66;">Notes</td><td>${escapeHtml(p.notes)}</td></tr>` : ''}
      <tr><td style="padding:4px 0;color:#9a8c66;">Payment Method</td><td>${escapeHtml(p.paymentMethod)}</td></tr>
    </table>

    <h3 style="color:#d4af37;margin-top:28px;letter-spacing:1px;">ORDER ITEMS</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="background:#1a1610;">
          <th style="padding:10px 12px;color:#9a8c66;text-align:left;">#</th>
          <th style="padding:10px 12px;color:#9a8c66;text-align:left;">Item</th>
          <th style="padding:10px 12px;color:#9a8c66;text-align:center;">Qty</th>
          <th style="padding:10px 12px;color:#9a8c66;text-align:right;">Price</th>
          <th style="padding:10px 12px;color:#9a8c66;text-align:right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot>
        <tr>
          <td colspan="4" style="padding:14px 12px;color:#f4e7c2;text-align:right;font-weight:bold;letter-spacing:1px;">TOTAL</td>
          <td style="padding:14px 12px;color:#d4af37;text-align:right;font-size:18px;font-weight:bold;">Br ${p.totalAmount.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>

    <p style="color:#9a8c66;font-size:12px;margin-top:28px;text-align:center;border-top:1px solid #2a2418;padding-top:18px;">
      This is an automated notification from TT's Tibeb. Process this order in the admin panel.
    </p>
  </div>`

  const text = `New Order ${p.orderNumber}\n\nCustomer: ${p.customerName}\nPhone: ${p.customerPhone}\nEmail: ${p.customerEmail}\nAddress: ${p.shippingAddress}\n${p.measurements ? `Measurements: ${p.measurements}\n` : ''}${p.notes ? `Notes: ${p.notes}\n` : ''}Payment: ${p.paymentMethod}\n\nItems:\n${p.items.map((i) => `  - ${i.title}${i.size ? ` (${i.size})` : ''} x${i.quantity} @ Br ${i.price.toFixed(2)} = Br ${(i.price * i.quantity).toFixed(2)}`).join('\n')}\n\nTotal: Br ${p.totalAmount.toFixed(2)}`

  return { subject, html, text }
}

export async function sendOrderNotification(p: OrderEmailPayload) {
  const { subject, html, text } = renderOrderEmail(p)
  const t = getTransporter()
  if (!t) {
    // SMTP not configured — log + persist so admin can see in dev
    console.log('──────────────────────────────────────────────')
    console.log(`[EMAIL] Order ${p.orderNumber} notification (SMTP not configured, logging only)`)
    console.log(`To: ${TO}`)
    console.log(`Subject: ${subject}`)
    console.log(text)
    console.log('──────────────────────────────────────────────')
    await db.siteContent.upsert({
      where: { id: 'last_order_email' },
      update: { value: JSON.stringify({ to: TO, subject, text, html, at: new Date().toISOString() }) },
      create: { id: 'last_order_email', value: JSON.stringify({ to: TO, subject, text, html, at: new Date().toISOString() }) }
    })
    return { delivered: false, reason: 'SMTP_NOT_CONFIGURED', loggedTo: TO }
  }
  try {
    const info = await t.sendMail({ from: FROM, to: TO, subject, html, text })
    return { delivered: true, messageId: info.messageId }
  } catch (e) {
    console.error('[EMAIL] send error:', e)
    return { delivered: false, reason: 'SMTP_ERROR', error: String(e) }
  }
}
