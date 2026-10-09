'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Mail, Phone, MapPin, User, MessageSquare, Ruler, CreditCard,
  ShoppingCart, Globe, Search, Truck, Clock, CheckCircle2, AlertCircle, Save, Loader2,
  Send, MessageCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface OrderItem {
  id: string; title: string; price: number; size: string | null
  quantity: number; image: string | null
}
interface StatusEvent {
  id: string; status: string; note: string | null; createdAt: string
}
interface Order {
  id: string; orderNumber: string
  customerName: string; customerPhone: string; customerEmail: string
  country: string; region: string | null; city: string | null; subCity: string | null
  shippingAddress: string; measurements: string | null; notes: string | null
  paymentMethod: string; subtotal: number; shippingCost: number; discount: number
  totalAmount: number; status: string; isInternational: boolean
  contactMethod: string | null
  arifPayTransactionId: string | null; paymentDate: string | null
  paymentVerificationStatus: string | null
  createdAt: string; updatedAt: string
  items: OrderItem[]
  statusHistory: StatusEvent[]
}

const STATUSES = [
  'new', 'contacted', 'price_confirmed', 'processing',
  'ready', 'shipped', 'delivered', 'cancelled'
]

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  price_confirmed: 'Price Confirmed',
  processing: 'Processing',
  ready: 'Ready',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  // Legacy statuses (for old orders)
  pending_payment: 'Pending Payment',
  payment_processing: 'Payment Processing',
  paid: 'Paid',
  payment_failed: 'Payment Failed',
  pending_shipping_quote: 'Pending Shipping Quote',
  shipping_confirmed: 'Shipping Confirmed',
  refunded: 'Refunded'
}

const STATUS_TONES: Record<string, string> = {
  new: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  contacted: 'text-blue-400 border-blue-500/40 bg-blue-500/10',
  price_confirmed: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
  processing: 'text-blue-400 border-blue-500/40 bg-blue-500/10',
  ready: 'text-green-400 border-green-500/40 bg-green-500/10',
  shipped: 'text-indigo-400 border-indigo-500/40 bg-indigo-500/10',
  delivered: 'text-green-500 border-green-500/40 bg-green-500/10',
  cancelled: 'text-red-400 border-red-500/40 bg-red-500/10',
  // Legacy
  pending_payment: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  payment_processing: 'text-blue-400 border-blue-500/40 bg-blue-500/10',
  paid: 'text-green-400 border-green-500/40 bg-green-500/10',
  payment_failed: 'text-red-400 border-red-500/40 bg-red-500/10',
  pending_shipping_quote: 'text-purple-400 border-purple-500/40 bg-purple-500/10',
  shipping_confirmed: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
  refunded: 'text-orange-400 border-orange-500/40 bg-orange-500/10'
}

const statusIcon = (status: string) => {
  if (['delivered', 'paid', 'ready'].includes(status)) return <CheckCircle2 className="w-3.5 h-3.5" />
  if (['cancelled', 'payment_failed', 'refunded'].includes(status)) return <AlertCircle className="w-3.5 h-3.5" />
  return <Clock className="w-3.5 h-3.5" />
}

const CONTACT_METHOD_LABELS: Record<string, string> = {
  gmail: 'Gmail',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram'
}

const CONTACT_METHOD_TONES: Record<string, string> = {
  gmail: 'text-red-400 border-red-500/40 bg-red-500/10',
  whatsapp: 'text-green-400 border-green-500/40 bg-green-500/10',
  telegram: 'text-blue-400 border-blue-500/40 bg-blue-500/10'
}

const ContactMethodIcon = ({ method, className }: { method: string; className?: string }) => {
  if (method === 'gmail') return <Mail className={className} />
  if (method === 'whatsapp') return <MessageCircle className={className} />
  if (method === 'telegram') return <Send className={className} />
  return <MessageCircle className={className} />
}

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Order | null>(null)
  const [shippingCostInput, setShippingCostInput] = useState('')

  const load = () => {
    setLoading(true)
    fetch('/api/orders', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openOrder = async (o: Order) => {
    // Fetch full order details (with statusHistory + payment)
    try {
      const res = await fetch(`/api/orders/${o.id}`, { cache: 'no-store' })
      const data = await res.json()
      if (data.order) {
        setSelected(data.order)
        setShippingCostInput(data.order.shippingCost ? String(data.order.shippingCost) : '')
      } else {
        setSelected(o)
        setShippingCostInput(o.shippingCost ? String(o.shippingCost) : '')
      }
    } catch {
      setSelected(o)
      setShippingCostInput(o.shippingCost ? String(o.shippingCost) : '')
    }
  }

  const updateStatus = async (o: Order, status: string, note?: string) => {
    const res = await fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: o.id, status, note })
    })
    if (res.ok) {
      toast.success(`Marked ${STATUS_LABELS[status]}`)
      load()
      if (selected?.id === o.id) {
        const updated = await fetch(`/api/orders/${o.id}`).then(r => r.json())
        setSelected(updated.order)
      }
    } else {
      toast.error('Failed to update status')
    }
  }

  const updateShipping = async (o: Order) => {
    const cost = Number(shippingCostInput)
    if (isNaN(cost) || cost < 0) {
      toast.error('Invalid shipping cost')
      return
    }
    const res = await fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: o.id, shippingCost: cost, status: 'shipping_confirmed', note: `Shipping cost set: Br ${cost.toFixed(2)}` })
    })
    if (res.ok) {
      toast.success('Shipping cost updated & status changed to "Shipping Confirmed"')
      load()
      const updated = await fetch(`/api/orders/${o.id}`).then(r => r.json())
      setSelected(updated.order)
    } else {
      toast.error('Failed to update shipping')
    }
  }

  // Filter logic
  const filtered = orders.filter((o) => {
    if (filter !== 'all' && o.status !== filter) return false
    if (filter === 'international' && !o.isInternational) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q) ||
        o.country.toLowerCase().includes(q) ||
        o.city?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'new', label: 'New' },
    { id: 'contacted', label: 'Contacted' },
    { id: 'price_confirmed', label: 'Price Confirmed' },
    { id: 'processing', label: 'Processing' },
    { id: 'ready', label: 'Ready' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'international', label: 'International' }
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#f5efe2]">Orders</h1>
          <p className="text-sm text-[#9a8c66] mt-1">Manage and fulfill customer orders.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a8c66]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, name, email, phone, country..."
            className="pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#2a2418] focus:border-gold text-sm text-[#f5efe2] outline-none w-full md:w-80"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => {
          const count = t.id === 'international'
            ? orders.filter(o => o.isInternational).length
            : t.id === 'all' ? orders.length : orders.filter(o => o.status === t.id).length
          return (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`text-xs tracking-[0.15em] uppercase px-4 py-2 border transition-all ${
                filter === t.id ? 'bg-gold text-black border-gold' : 'border-[#2a2418] text-[#f5efe2]/70 hover:border-gold/40 hover:text-gold'
              }`}
            >
              {t.label} ({count})
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 skeleton-shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-[#2a2418] bg-[#0f0f0f]">
          <p className="font-display text-xl text-[#f5efe2] mb-2">No orders found</p>
          <p className="text-sm text-[#9a8c66]">Try adjusting your filters or search.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <div
              key={o.id}
              className={`border p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4 hover:border-gold/30 transition-colors cursor-pointer ${
                o.isInternational ? 'border-purple-500/30 bg-purple-500/5' : 'border-[#2a2418] bg-[#0f0f0f]'
              }`}
              onClick={() => openOrder(o)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs text-gold">{o.orderNumber}</span>
                  <span className={`text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 border ${STATUS_TONES[o.status]} flex items-center gap-1`}>
                    {statusIcon(o.status)} {STATUS_LABELS[o.status] || o.status}
                  </span>
                  {o.contactMethod && (
                    <span className={`text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 border ${CONTACT_METHOD_TONES[o.contactMethod]} flex items-center gap-1`}>
                      <ContactMethodIcon method={o.contactMethod} className="w-3 h-3" />
                      {CONTACT_METHOD_LABELS[o.contactMethod] || o.contactMethod}
                    </span>
                  )}
                  {o.isInternational && (
                    <span className="text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 border border-purple-500/40 bg-purple-500/10 text-purple-400 flex items-center gap-1">
                      <Globe className="w-3 h-3" /> International
                    </span>
                  )}
                  <span className="text-[10px] text-[#9a8c66]">{new Date(o.createdAt).toLocaleString()}</span>
                </div>
                <div className="mt-2 text-sm text-[#f5efe2]">
                  {o.customerName} · {o.customerPhone}
                </div>
                <div className="text-xs text-[#9a8c66] mt-1">
                  {o.items.length} item(s) · {o.city}, {o.country}
                </div>
              </div>
              <div className="text-right">
                <button
                  onClick={(e) => { e.stopPropagation(); openOrder(o) }}
                  className="text-xs tracking-[0.15em] uppercase px-4 py-2 border border-[#2a2418] hover:border-gold/40 text-[#f5efe2]/80 hover:text-gold transition-colors whitespace-nowrap"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 bg-black/70 z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="fixed inset-0 z-50 overflow-y-auto"
            >
              <div className="min-h-full flex items-start justify-center p-4 md:p-8">
                <div className="bg-[#0d0d0d] border border-[#2a2418] w-full max-w-3xl my-8">
                  {/* Header */}
                  <div className="sticky top-0 bg-[#0d0d0d] z-10 flex items-center justify-between p-5 border-b border-[#2a2418]">
                    <div>
                      <h2 className="font-display text-lg text-[#f5efe2]">Order Details</h2>
                      <p className="font-mono text-xs text-gold mt-1">{selected.orderNumber}</p>
                    </div>
                    <button onClick={() => setSelected(null)} className="text-[#f5efe2]/70 hover:text-gold">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-5 md:p-6 space-y-5">
                    {/* Status */}
                    <div>
                      <span className="text-[10px] tracking-[0.2em] uppercase text-[#9a8c66] block mb-2">Update Status</span>
                      <div className="flex gap-2 flex-wrap">
                        {STATUSES.map((s) => (
                          <button
                            key={s}
                            onClick={() => updateStatus(selected, s)}
                            className={`text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 border transition-all ${
                              selected.status === s
                                ? 'bg-gold text-black border-gold'
                                : 'border-[#2a2418] text-[#f5efe2]/70 hover:border-gold/40 hover:text-gold'
                            }`}
                          >
                            {STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Customer */}
                    <Section title="Customer Information">
                      <DetailRow icon={User} label="Name" value={selected.customerName} />
                      <DetailRow icon={Phone} label="Phone" value={selected.customerPhone} />
                      {selected.customerEmail && <DetailRow icon={Mail} label="Email" value={selected.customerEmail} />}
                      <DetailRow icon={Globe} label="Country" value={selected.country} />
                      {selected.region && <DetailRow icon={MapPin} label="Region" value={selected.region} />}
                      {selected.city && <DetailRow icon={MapPin} label="City" value={selected.city} />}
                      {selected.subCity && <DetailRow icon={MapPin} label="Sub-City" value={selected.subCity} />}
                      <DetailRow icon={MapPin} label="Address" value={selected.shippingAddress} />
                      {selected.measurements && <DetailRow icon={Ruler} label="Measurements" value={selected.measurements} />}
                      {selected.notes && <DetailRow icon={MessageSquare} label="Notes" value={selected.notes} />}
                    </Section>

                    {/* Items */}
                    <Section title="Order Items">
                      <div className="divide-y divide-[#1a1714]">
                        {selected.items.map((it) => (
                          <div key={it.id} className="p-3 flex gap-3">
                            <div className="w-14 h-16 bg-[#161210] overflow-hidden flex-shrink-0">
                              {it.image && <img src={it.image} alt="" className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm text-[#f5efe2]">{it.title}</div>
                              {it.size && <div className="text-xs text-[#9a8c66]">Size: {it.size}</div>}
                              <div className="text-xs text-gold mt-1">
                                Quantity: {it.quantity}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 text-xs text-[#9a8c66]">
                        Final price to be quoted directly to the customer.
                      </div>
                    </Section>

                    {/* Contact Preference */}
                    <Section title="Customer's Contact Preference">
                      {selected.contactMethod ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 border border-[#2a2418] bg-[#0a0a0a]/50">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${CONTACT_METHOD_TONES[selected.contactMethod]}`}>
                              <ContactMethodIcon method={selected.contactMethod} className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="text-[10px] tracking-[0.2em] uppercase text-[#9a8c66]">Customer chose</div>
                              <div className="font-display text-lg text-[#f5efe2]">
                                {CONTACT_METHOD_LABELS[selected.contactMethod] || selected.contactMethod}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const method = selected.contactMethod
                              if (method === 'gmail' && selected.customerEmail) {
                                window.location.href = `mailto:${selected.customerEmail}?subject=${encodeURIComponent('Regarding your order ' + selected.orderNumber)}`
                              } else if (method === 'whatsapp' && selected.customerPhone) {
                                window.open(`https://wa.me/${selected.customerPhone.replace(/[^0-9]/g, '')}`, '_blank')
                              } else if (method === 'telegram' && selected.customerPhone) {
                                // Try phone-based Telegram lookup (works if phone is registered on Telegram)
                                window.open(`https://t.me/+${selected.customerPhone.replace(/[^0-9]/g, '')}`, '_blank')
                              } else {
                                alert('Customer contact info not available for this method')
                              }
                            }}
                            className="w-full inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-soft text-black text-xs tracking-[0.15em] uppercase py-3 font-semibold"
                          >
                            <ContactMethodIcon method={selected.contactMethod} className="w-4 h-4" />
                            Contact Customer via {CONTACT_METHOD_LABELS[selected.contactMethod]}
                          </button>
                          <p className="text-[10px] text-[#9a8c66]">
                            Opens your {CONTACT_METHOD_LABELS[selected.contactMethod]} with the customer&apos;s contact info pre-filled (where technically possible).
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-[#9a8c66]">No contact method recorded.</p>
                      )}
                    </Section>

                    {/* Timeline */}
                    <Section title="Order Timeline">
                      <div className="space-y-3">
                        {selected.statusHistory.map((event, i) => (
                          <div key={event.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center border ${i === selected.statusHistory.length - 1 ? 'bg-gold/20 border-gold text-gold' : 'border-[#2a2418] bg-[#0a0a0a] text-[#9a8c66]'}`}>
                                {statusIcon(event.status)}
                              </div>
                              {i < selected.statusHistory.length - 1 && <div className="w-px h-6 bg-[#2a2418] mt-1" />}
                            </div>
                            <div className="flex-1 pb-2">
                              <div className="text-sm font-medium">{STATUS_LABELS[event.status] || event.status}</div>
                              <div className="text-xs text-[#9a8c66]">{new Date(event.createdAt).toLocaleString()}</div>
                              {event.note && <div className="text-xs text-[#f5efe2]/70 mt-1">{event.note}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Section>

                    {/* Meta */}
                    <div className="text-xs text-[#9a8c66] flex items-center gap-2 pt-2 border-t border-[#2a2418]">
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Placed on {new Date(selected.createdAt).toLocaleString()}
                      {selected.isInternational && <span className="text-purple-400">· International</span>}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-[10px] tracking-[0.2em] uppercase text-[#9a8c66] block mb-2">{title}</span>
      <div className="border border-[#2a2418] p-4 space-y-2 text-sm bg-[#0a0a0a]/50">
        {children}
      </div>
    </div>
  )
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="text-[10px] tracking-[0.15em] uppercase text-[#9a8c66]">{label}</div>
        <div className="text-sm text-[#f5efe2] break-words">{value}</div>
      </div>
    </div>
  )
}
