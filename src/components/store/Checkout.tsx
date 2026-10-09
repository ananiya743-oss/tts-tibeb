'use client'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Shield, Truck, CheckCircle2, AlertCircle, Mail, MessageCircle, Send, Loader2
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useCart } from '@/hooks/use-cart'
import { useView } from '@/hooks/use-view'
import { toast } from 'sonner'

const ETHIOPIAN_REGIONS = [
  'Addis Ababa', 'Afar', 'Amhara', 'Benishangul-Gumuz', 'Dire Dawa',
  'Gambela', 'Harari', 'Oromia', 'Sidama', 'Somali',
  'South Ethiopia', 'South West Ethiopia', 'Tigray'
]

const COUNTRIES = [
  'Ethiopia', 'United States', 'United Kingdom', 'Canada', 'Germany',
  'France', 'Italy', 'Spain', 'Netherlands', 'Sweden', 'Switzerland',
  'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain',
  'Kenya', 'Djibouti', 'Sudan', 'South Sudan', 'Egypt', 'South Africa',
  'Nigeria', 'Ghana', 'Australia', 'Japan', 'China', 'India', 'Other'
]

interface CheckoutProps {
  whatsappNumber?: string
  contactEmail?: string
  telegramUsername?: string
}

type ContactMethod = 'gmail' | 'whatsapp' | 'telegram' | null

export function Checkout({
  whatsappNumber = '+251911234567',
  contactEmail = 'hello@ttstibeb.com',
  telegramUsername = 'ttstibeb'
}: CheckoutProps) {
  const items = useCart((s) => s.items)
  const clear = useCart((s) => s.clear)
  const setView = useView((s) => s.setView)

  const [form, setForm] = useState({
    fullName: '', phone: '', email: '',
    country: 'Ethiopia', region: '', city: '', subCity: '', address: '',
    message: ''
  })
  const [contactMethod, setContactMethod] = useState<ContactMethod>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<null | { orderNumber: string; contactMethod: ContactMethod }>(null)

  if (items.length === 0 && !done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div>
          <p className="font-display text-2xl text-[#f5efe2] mb-2">Your order is empty</p>
          <button
            onClick={() => setView({ name: 'store' })}
            className="text-gold hover:underline mt-4 inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Browse products
          </button>
        </div>
      </div>
    )
  }

  const isInternational = form.country !== 'Ethiopia'

  // Build the order message text for WhatsApp/Telegram/Email
  const buildOrderMessage = (method: ContactMethod) => {
    const itemList = items
      .map((i) => `${i.title}${i.size ? ` (${i.size})` : ''} × ${i.quantity}`)
      .join('\n')

    const customerInfo = [
      `Name: ${form.fullName || '—'}`,
      `Phone: ${form.phone || '—'}`,
      ...(method !== 'whatsapp' ? [`Email: ${form.email || '—'}`] : []),
      `Country: ${form.country}`,
      ...(form.region ? [`Region: ${form.region}`] : []),
      `City: ${form.city || '—'}`,
      `Address: ${form.address || '—'}`
    ].join('\n')

    const intro =
      method === 'gmail'
        ? `Hello,\n\nI would like to order the following products:\n\n${itemList}\n\nCustomer Information:\n\n${customerInfo}\n${form.message ? `\nAdditional Message:\n${form.message}\n` : ''}\nPlease contact me regarding availability, shipping, and the final price.\n\nThank you.`
        : method === 'whatsapp'
        ? `Hello, I would like to order the following products:\n\n${itemList}\n\nCustomer Information:\n\n${customerInfo}${form.message ? `\n\nAdditional Message:\n${form.message}` : ''}\n\nPlease provide availability, shipping information, and the final price.\n\nThank you.`
        : `Hello, I would like to order:\n\n${itemList}\n\n${customerInfo}${form.message ? `\n\nAdditional Message:\n${form.message}` : ''}\n\nPlease contact me regarding availability, shipping, and the final price.`

    return intro
  }

  const openGmail = () => {
    const subject = encodeURIComponent('New Product Order Request')
    const body = encodeURIComponent(buildOrderMessage('gmail'))
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`
  }

  const openWhatsApp = () => {
    const text = encodeURIComponent(buildOrderMessage('whatsapp'))
    window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${text}`, '_blank')
  }

  const openTelegram = () => {
    const text = encodeURIComponent(buildOrderMessage('telegram'))
    // Try t.me/<username> with ?text= (works on Telegram Web; mobile app may ignore text param)
    window.open(`https://t.me/${telegramUsername.replace(/^@/, '')}?text=${text}`, '_blank')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fullName || !form.phone || !form.address || !form.city) {
      toast.error('Please fill all required fields')
      return
    }
    if (!contactMethod) {
      toast.error('Please choose a contact method')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, size: i.size, quantity: i.quantity })),
          customer: form,
          contactMethod,
          isInternational
        })
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Order failed')
      } else {
        // Open the chosen contact platform with prefilled message
        if (contactMethod === 'gmail') openGmail()
        else if (contactMethod === 'whatsapp') openWhatsApp()
        else if (contactMethod === 'telegram') openTelegram()

        setDone({
          orderNumber: data.order.orderNumber,
          contactMethod
        })
        clear()
      }
    } catch {
      toast.error('Network error. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ============ Confirmation screen ============
  if (done) {
    const methodLabel = done.contactMethod === 'gmail' ? 'Gmail' : done.contactMethod === 'whatsapp' ? 'WhatsApp' : 'Telegram'
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full text-center border border-gold/30 bg-[#0f0f0f] p-8 md:p-12"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/10 border border-gold flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-gold" />
          </div>
          <h1 className="font-display text-3xl text-[#f5efe2] mb-3">Order Request Sent</h1>
          <p className="text-[#9a8c66] text-sm mb-6">
            Thank you for your order request. We have received your request.
          </p>

          <div className="border border-[#2a2418] p-4 mb-6 space-y-3">
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-[#9a8c66]">You selected</div>
              <div className="font-display text-xl text-gold mt-1">{methodLabel}</div>
            </div>
            <div className="pt-2 border-t border-[#2a2418]">
              <div className="text-[10px] tracking-[0.2em] uppercase text-[#9a8c66]">Order Number</div>
              <div className="font-display text-2xl text-gold mt-1">{done.orderNumber}</div>
            </div>
          </div>

          <p className="text-xs text-[#9a8c66] mb-6 leading-relaxed">
            We will contact you regarding product availability, final pricing, shipping, and delivery.
            <br />
            If the {methodLabel} app didn&apos;t open automatically, you can contact us again below.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => {
                if (done.contactMethod === 'gmail') openGmail()
                else if (done.contactMethod === 'whatsapp') openWhatsApp()
                else if (done.contactMethod === 'telegram') openTelegram()
              }}
              className="border border-gold/40 hover:bg-gold hover:text-black text-gold text-xs tracking-[0.15em] uppercase px-5 py-3 transition-colors"
            >
              Contact Us Again
            </button>
            <button
              onClick={() => setView({ name: 'store' })}
              className="bg-gold hover:bg-gold-soft text-black text-xs tracking-[0.15em] uppercase px-5 py-3 font-semibold transition-colors"
            >
              Back to Shop
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="border-b border-[#2a2418]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <button
            onClick={() => setView({ name: 'store' })}
            className="inline-flex items-center gap-2 text-sm text-[#f5efe2]/80 hover:text-gold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Continue shopping
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <div className="inline-flex items-center gap-3 mb-3">
            <span className="h-px w-8 bg-gold/60" />
            <span className="text-gold text-xs tracking-[0.3em] uppercase">Order Request</span>
            <span className="h-px w-8 bg-gold/60" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-[#f5efe2]">
            Send Your <span className="text-gold-gradient italic">Order Request</span>
          </h1>
          <p className="text-sm text-[#9a8c66] mt-3 max-w-xl mx-auto">
            Fill in your details, choose how you&apos;d like us to contact you, and we&apos;ll reach out with availability, pricing, and delivery options.
          </p>
        </motion.div>

        {isInternational && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 border border-amber-500/40 bg-amber-500/5 p-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#f5efe2]/80 leading-relaxed">
                Shipping and final pricing will be confirmed with you directly after we receive your request.
              </p>
            </div>
          </motion.div>
        )}

        <form onSubmit={submit} className="grid lg:grid-cols-[1fr_400px] gap-8">
          <div className="space-y-6">
            <div className="border border-[#2a2418] p-5 md:p-7 bg-[#0f0f0f]">
              <h2 className="font-display text-lg text-[#f5efe2] mb-5">Customer Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Full Name *">
                  <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="tt-input" placeholder="Your full name" required />
                </Field>
                <Field label="Phone Number *">
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="tt-input" placeholder="+251 9..." required />
                </Field>
                <Field label="Email Address">
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="tt-input" placeholder="you@example.com" />
                </Field>
                <Field label="Country *">
                  <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value, region: '', subCity: '' })} className="tt-input">
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                {!isInternational && (
                  <Field label="Region / State *">
                    <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="tt-input" required>
                      <option value="">Select region</option>
                      {ETHIOPIAN_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </Field>
                )}
                <Field label="City *">
                  <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="tt-input" placeholder="City" required />
                </Field>
                {!isInternational && (
                  <Field label="Sub-City / Woreda">
                    <input value={form.subCity} onChange={(e) => setForm({ ...form, subCity: e.target.value })} className="tt-input" placeholder="Optional" />
                  </Field>
                )}
                <Field label="Delivery Address *" full>
                  <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} className="tt-input resize-none" placeholder="Street, house number, landmarks" required />
                </Field>
                <Field label="Additional Message (optional)" full>
                  <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} className="tt-input resize-none" placeholder="Tell us about color preferences, delivery timing, custom measurements, etc." />
                </Field>
              </div>
            </div>

            {/* Contact Method Chooser */}
            <div className="border border-[#2a2418] p-5 md:p-7 bg-[#0f0f0f]">
              <h2 className="font-display text-lg text-[#f5efe2] mb-2">How would you like to contact us?</h2>
              <p className="text-xs text-[#9a8c66] mb-5">
                Choose one — we&apos;ll open your selected app with your order details pre-filled so you can send the request.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <ContactOption
                  active={contactMethod === 'gmail'}
                  onClick={() => setContactMethod('gmail')}
                  icon={<Mail className="w-5 h-5" />}
                  label="Gmail"
                  hint="Open your email app"
                  tone="red"
                />
                <ContactOption
                  active={contactMethod === 'whatsapp'}
                  onClick={() => setContactMethod('whatsapp')}
                  icon={<MessageCircle className="w-5 h-5" />}
                  label="WhatsApp"
                  hint="Open WhatsApp chat"
                  tone="green"
                />
                <ContactOption
                  active={contactMethod === 'telegram'}
                  onClick={() => setContactMethod('telegram')}
                  icon={<Send className="w-5 h-5" />}
                  label="Telegram"
                  hint="Open Telegram chat"
                  tone="blue"
                />
              </div>
              {contactMethod && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 border border-gold/30 bg-gold/5 text-xs text-[#f5efe2]/80"
                >
                  ✓ You chose <span className="text-gold font-semibold capitalize">{contactMethod}</span>.
                  When you click &quot;Send Order Request&quot; below, your {contactMethod === 'gmail' ? 'email app' : contactMethod === 'whatsapp' ? 'WhatsApp' : 'Telegram'} will open with all your order details pre-filled.
                </motion.div>
              )}
            </div>
          </div>

          {/* Order Summary (NO PRICES) */}
          <div>
            <div className="border border-[#2a2418] bg-[#0f0f0f] sticky top-24">
              <div className="p-5 md:p-6 border-b border-[#2a2418]">
                <h2 className="font-display text-lg text-[#f5efe2] mb-4">Your Order</h2>
                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {items.map((i) => (
                    <div key={`${i.id}-${i.size}`} className="flex gap-3">
                      <div className="w-14 h-16 bg-[#161210] overflow-hidden flex-shrink-0">
                        <img src={i.image} alt={i.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-[#f5efe2] line-clamp-1">{i.title}</div>
                        {i.size && <div className="text-[10px] text-[#9a8c66]">Size: {i.size}</div>}
                        <div className="text-xs text-gold mt-1">Qty: {i.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5 md:p-6 space-y-3 text-sm">
                <p className="text-xs text-[#9a8c66] leading-relaxed">
                  Final pricing, shipping costs, and delivery timeline will be confirmed with you directly after we receive your request.
                </p>
                <button
                  type="submit"
                  disabled={submitting || !contactMethod}
                  className="w-full bg-gold hover:bg-gold-soft disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold text-sm tracking-[0.2em] uppercase py-4 mt-2 transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                  ) : (
                    <>Send Order Request</>
                  )}
                </button>
                {!contactMethod && (
                  <p className="text-[10px] text-amber-400 text-center">↑ Choose a contact method first</p>
                )}
                <div className="grid grid-cols-3 gap-2 text-center pt-3">
                  <Trust icon={Shield} label="Secure" />
                  <Trust icon={Truck} label="Direct Contact" />
                  <Trust icon={MessageCircle} label="Quick Reply" />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <style jsx global>{`
        .tt-input {
          width: 100%;
          background: #0a0a0a;
          border: 1px solid #2a2418;
          color: #f5efe2;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .tt-input:focus { border-color: #d4af37; }
        .tt-input::placeholder { color: #6b5d44; }
      `}</style>
    </div>
  )
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? 'md:col-span-2' : ''}`}>
      <span className="text-xs tracking-[0.15em] uppercase text-[#9a8c66] block mb-2">{label}</span>
      {children}
    </label>
  )
}

function ContactOption({
  active, onClick, icon, label, hint, tone
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  hint: string
  tone: 'red' | 'green' | 'blue'
}) {
  const toneClasses = {
    red: 'hover:border-red-500/50 hover:bg-red-500/5',
    green: 'hover:border-green-500/50 hover:bg-green-500/5',
    blue: 'hover:border-blue-500/50 hover:bg-blue-500/5'
  }
  const activeTone = {
    red: 'border-red-500 bg-red-500/10 text-red-400',
    green: 'border-green-500 bg-green-500/10 text-green-400',
    blue: 'border-blue-500 bg-blue-500/10 text-blue-400'
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-4 border text-left transition-all ${
        active ? activeTone[tone] : `border-[#2a2418] text-[#f5efe2]/80 ${toneClasses[tone]}`
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="font-semibold text-sm">{label}</span>
      </div>
      <div className="text-[10px] text-[#9a8c66] tracking-[0.1em] uppercase">{hint}</div>
    </button>
  )
}

function Trust({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-[10px] tracking-[0.15em] uppercase text-[#9a8c66]">
      <Icon className="w-4 h-4 text-gold" />
      {label}
    </div>
  )
}
