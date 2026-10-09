'use client'
import { motion } from 'framer-motion'
import {
  ArrowLeft, CheckCircle2, Mail, MessageCircle, Send, ShoppingBag
} from 'lucide-react'
import { useState } from 'react'
import { useCart } from '@/hooks/use-cart'
import { useView } from '@/hooks/use-view'
import { toast } from 'sonner'

interface CheckoutProps {
  whatsappNumber?: string
  contactEmail?: string
  telegramUsername?: string
}

type ContactMethod = 'gmail' | 'whatsapp' | 'telegram'

export function Checkout({
  whatsappNumber = '+251911234567',
  contactEmail = 'hello@ttstibeb.com',
  telegramUsername = 'TTs2126'
}: CheckoutProps) {
  const items = useCart((s) => s.items)
  const clear = useCart((s) => s.clear)
  const setView = useView((s) => s.setView)
  const [done, setDone] = useState<null | { orderNumber: string; contactMethod: ContactMethod }>(null)
  const [submitting, setSubmitting] = useState<null | ContactMethod>(null)

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

  // Build order message text — products + quantities + IMAGE URLs (messaging apps auto-preview URLs so the owner sees product images inline)
  const buildOrderMessage = (method: ContactMethod) => {
    const itemList = items
      .map((i) => {
        const line = `${i.title}${i.size ? ` (${i.size})` : ''} × ${i.quantity}`
        // Include the product image URL — WhatsApp, Telegram, and Gmail all auto-preview URLs
        // so the owner sees the product image inline when they receive the message.
        if (i.image) {
          return `${line}\n${i.image}`
        }
        return line
      })
      .join('\n\n')

    const intro =
      method === 'gmail'
        ? `Hello,\n\nI would like to order the following products:\n\n${itemList}\n\nPlease contact me regarding availability, shipping, and the final price.\n\nThank you.`
        : method === 'whatsapp'
        ? `Hello, I would like to order the following products:\n\n${itemList}\n\nPlease provide availability, shipping information, and the final price.\n\nThank you.`
        : `Hello, I would like to order:\n\n${itemList}\n\nPlease contact me regarding availability, shipping, and the final price.`

    return intro
  }

  const chooseMethod = async (method: ContactMethod) => {
    setSubmitting(method)
    try {
      // Save order to database
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, size: i.size, quantity: i.quantity })),
          // Minimal customer info — customer provides full details in the chat
          customer: {
            fullName: '—', // customer will provide in chat
            phone: '—',
            email: '',
            country: '—',
            city: '—',
            address: '—'
          },
          contactMethod: method,
          isInternational: false
        })
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to create order')
        setSubmitting(null)
        return
      }

      // Open the chosen contact platform with pre-filled message
      if (method === 'gmail') {
        const subject = encodeURIComponent('New Product Order Request')
        const body = encodeURIComponent(buildOrderMessage('gmail'))
        window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`
      } else if (method === 'whatsapp') {
        const text = encodeURIComponent(buildOrderMessage('whatsapp'))
        window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${text}`, '_blank')
      } else if (method === 'telegram') {
        const text = encodeURIComponent(buildOrderMessage('telegram'))
        window.open(`https://t.me/${telegramUsername.replace(/^@/, '')}?text=${text}`, '_blank')
      }

      setDone({
        orderNumber: data.order.orderNumber,
        contactMethod: method
      })
      clear()
    } catch {
      toast.error('Network error. Try again.')
    } finally {
      setSubmitting(null)
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
            We will contact you on {methodLabel} regarding product availability, final pricing, shipping, and delivery.
            <br />
            If the {methodLabel} app didn&apos;t open automatically, click below to contact us again.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => chooseMethod(done.contactMethod)}
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

  // ============ Main checkout — items + 3 contact buttons ============
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

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-10">
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
            Choose how you&apos;d like to contact us below — your messaging app will open with the order details pre-filled.
            We&apos;ll discuss pricing, shipping, and delivery directly with you.
          </p>
        </motion.div>

        {/* Items summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="border border-[#2a2418] bg-[#0f0f0f] p-5 md:p-6 mb-8"
        >
          <h2 className="font-display text-lg text-[#f5efe2] mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gold" /> Your Order ({items.length})
          </h2>
          <div className="space-y-3">
            {items.map((i) => (
              <div key={`${i.id}-${i.size}`} className="flex gap-3 items-center">
                <div className="w-14 h-16 bg-[#161210] overflow-hidden flex-shrink-0">
                  <img src={i.image} alt={i.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[#f5efe2] line-clamp-1">{i.title}</div>
                  {i.size && <div className="text-[10px] text-[#9a8c66] tracking-[0.15em] uppercase mt-0.5">Size: {i.size}</div>}
                  <div className="text-xs text-gold mt-1">Quantity: {i.quantity}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contact method chooser — 3 BIG buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-display text-xl text-[#f5efe2] text-center mb-2">
            Choose how to contact us
          </h2>
          <p className="text-xs text-[#9a8c66] text-center mb-6">
            Click one — your app opens with your order ready to send
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ContactButton
              onClick={() => chooseMethod('gmail')}
              loading={submitting === 'gmail'}
              icon={<Mail className="w-7 h-7" />}
              label="Gmail"
              hint="Open email app"
              tone="red"
            />
            <ContactButton
              onClick={() => chooseMethod('whatsapp')}
              loading={submitting === 'whatsapp'}
              icon={<MessageCircle className="w-7 h-7" />}
              label="WhatsApp"
              hint="Open WhatsApp"
              tone="green"
            />
            <ContactButton
              onClick={() => chooseMethod('telegram')}
              loading={submitting === 'telegram'}
              icon={<Send className="w-7 h-7" />}
              label="Telegram"
              hint="Open Telegram"
              tone="blue"
            />
          </div>

          <p className="text-[10px] text-[#9a8c66] text-center mt-6 leading-relaxed">
            Final pricing, shipping, and delivery are confirmed with you directly through your chosen platform.
            <br />
            You can provide your name, address, and contact details in the chat with us.
          </p>
        </motion.div>
      </div>
    </div>
  )
}

function ContactButton({
  onClick, loading, icon, label, hint, tone
}: {
  onClick: () => void
  loading: boolean
  icon: React.ReactNode
  label: string
  hint: string
  tone: 'red' | 'green' | 'blue'
}) {
  const toneClasses = {
    red: 'hover:border-red-500 hover:bg-red-500/10 hover:text-red-400',
    green: 'hover:border-green-500 hover:bg-green-500/10 hover:text-green-400',
    blue: 'hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-400'
  }
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`p-6 border-2 border-[#2a2418] text-center transition-all disabled:opacity-50 ${toneClasses[tone]}`}
    >
      <div className="flex flex-col items-center gap-3">
        {loading ? (
          <div className="w-7 h-7 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        ) : (
          icon
        )}
        <div>
          <div className="font-display text-lg text-[#f5efe2]">{label}</div>
          <div className="text-[10px] tracking-[0.15em] uppercase text-[#9a8c66] mt-1">{hint}</div>
        </div>
      </div>
    </button>
  )
}
