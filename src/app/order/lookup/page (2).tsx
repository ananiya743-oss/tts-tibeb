'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, ArrowLeft, CheckCircle2, Clock, Truck, Package, Home } from 'lucide-react'
import Link from 'next/link'

interface OrderItem { id: string; title: string; price: number; size: string | null; quantity: number; image: string | null }
interface StatusEvent { id: string; status: string; note: string | null; createdAt: string }
interface Order {
  id: string; orderNumber: string; customerName: string; customerEmail: string
  customerPhone: string; country: string; region: string | null; city: string | null
  shippingAddress: string; items: OrderItem[]; subtotal: number; shippingCost: number
  totalAmount: number; status: string; paymentMethod: string; arifPayTransactionId: string | null
  paymentDate: string | null; isInternational: boolean; createdAt: string
  statusHistory: StatusEvent[]
}

const STATUS_FLOW = ['pending_payment', 'payment_processing', 'paid', 'processing', 'shipped', 'delivered']
const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending Payment',
  payment_processing: 'Payment Processing',
  paid: 'Paid',
  payment_failed: 'Payment Failed',
  pending_shipping_quote: 'Pending Shipping Quote',
  shipping_confirmed: 'Shipping Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded'
}

export default function OrderLookupPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const orderParam = params.get('order')
    if (orderParam) {
      setOrderNumber(orderParam)
      // Auto-search with just order number
      setTimeout(() => doLookup(orderParam, ''), 300)
    }
  }, [])

  const doLookup = async (num?: string, em?: string) => {
    const onum = num ?? orderNumber
    const eml = em ?? email
    if (!onum) { setError('Please enter your order number'); return }
    setLoading(true); setError(null)
    try {
      const q = new URLSearchParams({ order: onum })
      if (eml) q.set('email', eml)
      const res = await fetch(`/api/orders/lookup?${q.toString()}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Order not found')
        setOrder(null)
      } else {
        setOrder(data.order)
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const statusIcon = (status: string) => {
    if (['paid', 'delivered'].includes(status)) return <CheckCircle2 className="w-4 h-4 text-green-400" />
    if (['processing', 'shipped', 'shipping_confirmed', 'payment_processing'].includes(status)) return <Truck className="w-4 h-4 text-gold" />
    if (['cancelled', 'payment_failed', 'refunded'].includes(status)) return <Package className="w-4 h-4 text-red-400" />
    return <Clock className="w-4 h-4 text-amber-400" />
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5efe2] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#f5efe2]/80 hover:text-gold transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to store
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <span className="h-px w-8 bg-gold/60" />
            <span className="text-gold text-xs tracking-[0.3em] uppercase">Order Tracking</span>
            <span className="h-px w-8 bg-gold/60" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">Track Your <span className="text-gold-gradient italic">Order</span></h1>
        </motion.div>

        {!order && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-[#2a2418] bg-[#0f0f0f] p-6 md:p-8 mb-6">
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <label className="block">
                <span className="text-xs tracking-[0.15em] uppercase text-[#9a8c66] block mb-2">Order Number *</span>
                <input
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="TT-XXXXXX-XXXX"
                  className="w-full bg-[#0a0a0a] border border-[#2a2418] focus:border-gold px-4 py-3 text-sm text-[#f5efe2] outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs tracking-[0.15em] uppercase text-[#9a8c66] block mb-2">Email (optional, for security)</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[#0a0a0a] border border-[#2a2418] focus:border-gold px-4 py-3 text-sm text-[#f5efe2] outline-none"
                />
              </label>
            </div>
            {error && <div className="text-red-400 text-sm mb-4">{error}</div>}
            <button
              onClick={() => doLookup()}
              disabled={loading}
              className="w-full bg-gold hover:bg-gold-soft disabled:opacity-60 text-black font-semibold text-sm tracking-[0.2em] uppercase py-4 flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" /> {loading ? 'Searching...' : 'Track Order'}
            </button>
          </motion.div>
        )}

        {order && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Header */}
            <div className="border border-gold/30 bg-[#0f0f0f] p-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-[10px] tracking-[0.2em] uppercase text-[#9a8c66]">Order Number</div>
                  <div className="font-display text-2xl text-gold">{order.orderNumber}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] tracking-[0.2em] uppercase text-[#9a8c66]">Status</div>
                  <div className="flex items-center gap-2 mt-1 justify-end">
                    {statusIcon(order.status)}
                    <span className="font-medium">{STATUS_LABELS[order.status] || order.status}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="border border-[#2a2418] bg-[#0f0f0f] p-6">
              <h2 className="font-display text-lg mb-4">Order Timeline</h2>
              <div className="space-y-4">
                {order.statusHistory.map((event, i) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${i === order.statusHistory.length - 1 ? 'bg-gold/20 border-gold' : 'border-[#2a2418] bg-[#0a0a0a]'}`}>
                        {statusIcon(event.status)}
                      </div>
                      {i < order.statusHistory.length - 1 && <div className="w-px h-8 bg-[#2a2418] mt-1" />}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="text-sm font-medium">{STATUS_LABELS[event.status] || event.status}</div>
                      <div className="text-xs text-[#9a8c66]">{new Date(event.createdAt).toLocaleString()}</div>
                      {event.note && <div className="text-xs text-[#f5efe2]/70 mt-1">{event.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Items */}
            <div className="border border-[#2a2418] bg-[#0f0f0f] p-6">
              <h2 className="font-display text-lg mb-4">Items</h2>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-14 h-16 bg-[#161210] overflow-hidden flex-shrink-0">
                      {item.image && <img src={item.image} alt={item.title} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm">{item.title}</div>
                      {item.size && <div className="text-xs text-[#9a8c66]">Size: {item.size}</div>}
                      <div className="text-xs text-gold mt-1">{item.quantity} × Br {item.price.toFixed(2)}</div>
                    </div>
                    <div className="text-gold font-semibold">Br {(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#2a2418] mt-4 pt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[#9a8c66]">Subtotal</span><span>Br {order.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-[#9a8c66]">Shipping</span><span>{order.shippingCost ? `Br ${order.shippingCost.toFixed(2)}` : '—'}</span></div>
                <div className="flex justify-between font-display text-lg pt-2 border-t border-[#2a2418]"><span>Total</span><span className="text-gold">Br {order.totalAmount.toFixed(2)}</span></div>
              </div>
            </div>

            {/* Payment info */}
            <div className="border border-[#2a2418] bg-[#0f0f0f] p-6">
              <h2 className="font-display text-lg mb-4">Payment</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><div className="text-[10px] tracking-[0.2em] uppercase text-[#9a8c66]">Method</div><div>{order.paymentMethod}</div></div>
                <div><div className="text-[10px] tracking-[0.2em] uppercase text-[#9a8c66]">Status</div><div className="capitalize">{order.status.replace(/_/g, ' ')}</div></div>
                {order.arifPayTransactionId && (
                  <div><div className="text-[10px] tracking-[0.2em] uppercase text-[#9a8c66]">Transaction ID</div><div className="font-mono text-xs">{order.arifPayTransactionId}</div></div>
                )}
                {order.paymentDate && (
                  <div><div className="text-[10px] tracking-[0.2em] uppercase text-[#9a8c66]">Payment Date</div><div>{new Date(order.paymentDate).toLocaleString()}</div></div>
                )}
              </div>
            </div>

            {/* Shipping info */}
            <div className="border border-[#2a2418] bg-[#0f0f0f] p-6">
              <h2 className="font-display text-lg mb-4">Shipping Address</h2>
              <div className="text-sm space-y-1">
                <div>{order.customerName}</div>
                <div className="text-[#9a8c66]">{order.shippingAddress}</div>
                <div className="text-[#9a8c66]">{[order.city, order.region, order.country].filter(Boolean).join(', ')}</div>
                <div className="text-[#9a8c66] mt-2">📞 {order.customerPhone}</div>
                {order.customerEmail && <div className="text-[#9a8c66]">✉ {order.customerEmail}</div>}
              </div>
            </div>

            <div className="flex gap-3">
              <Link href="/" className="flex-1 border border-gold/40 hover:bg-gold hover:text-black text-gold text-xs tracking-[0.15em] uppercase px-5 py-3 transition-colors text-center">
                Continue Shopping
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
