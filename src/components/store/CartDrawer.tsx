'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { useView } from '@/hooks/use-view'

export function CartDrawer() {
  const open = useCart((s) => s.open)
  const setOpen = useCart((s) => s.setOpen)
  const items = useCart((s) => s.items)
  const updateQty = useCart((s) => s.updateQty)
  const remove = useCart((s) => s.remove)
  const total = useCart((s) => s.total())
  const setView = useView((s) => s.setView)

  const goCheckout = () => {
    setOpen(false)
    setView({ name: 'checkout' })
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/70 z-50"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0d0d0d] z-50 border-l border-[#2a2418] flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-[#2a2418]">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-gold" />
                <span className="font-display text-lg text-[#f5efe2] tracking-wide">
                  Your Bag ({items.reduce((n, i) => n + i.quantity, 0)})
                </span>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 text-[#f5efe2]/70 hover:text-gold">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-8">
                  <ShoppingBag className="w-12 h-12 text-[#2a2418] mb-4" />
                  <p className="font-display text-xl text-[#f5efe2] mb-2">Your bag is empty</p>
                  <p className="text-sm text-[#9a8c66] mb-6">Discover our handwoven heritage pieces.</p>
                  <button
                    onClick={() => setOpen(false)}
                    className="bg-gold text-black text-xs tracking-[0.2em] uppercase px-6 py-3 font-semibold hover:bg-gold-soft transition-colors"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {items.map((item) => (
                    <div key={`${item.id}-${item.size}`} className="flex gap-3 border border-[#2a2418] p-3">
                      <div className="w-20 h-24 bg-[#161210] flex-shrink-0 overflow-hidden">
                        {item.image && (
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm text-[#f5efe2] line-clamp-2">{item.title}</h4>
                        {item.size && (
                          <span className="text-[10px] text-[#9a8c66] tracking-[0.15em] uppercase">
                            Size: {item.size}
                          </span>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div className="inline-flex items-center border border-[#2a2418]">
                            <button
                              onClick={() => updateQty(item.id, item.size, item.quantity - 1)}
                              className="p-1.5 text-[#f5efe2]/80 hover:text-gold"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-3 text-xs text-[#f5efe2]">{item.quantity}</span>
                            <button
                              onClick={() => updateQty(item.id, item.size, item.quantity + 1)}
                              className="p-1.5 text-[#f5efe2]/80 hover:text-gold"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => remove(item.id, item.size)}
                            className="text-[#9a8c66] hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-[#2a2418] p-5 space-y-3">
                <p className="text-xs text-[#9a8c66]">
                  Final pricing and shipping are confirmed with you directly after we receive your request.
                </p>
                <button
                  onClick={goCheckout}
                  className="w-full bg-gold hover:bg-gold-soft text-black font-semibold text-sm tracking-[0.2em] uppercase py-4 flex items-center justify-center gap-2 transition-colors"
                >
                  Send Order Request <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="w-full text-center text-xs tracking-[0.15em] uppercase text-[#f5efe2]/70 hover:text-gold"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
