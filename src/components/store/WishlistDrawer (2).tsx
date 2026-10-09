'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, Trash2 } from 'lucide-react'
import { useWishlist } from '@/hooks/use-wishlist'
import { useView } from '@/hooks/use-view'
import type { Product } from './ProductCard'

export function WishlistDrawer() {
  const open = useWishlist((s) => s.open)
  const setOpen = useWishlist((s) => s.setOpen)
  const ids = useWishlist((s) => s.ids)
  const toggle = useWishlist((s) => s.toggle)
  const setView = useView((s) => s.setView)
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    if (ids.length === 0) { setProducts([]); return }
    Promise.all(
      ids.map((id) =>
        fetch(`/api/products/${id}`).then((r) => r.json()).then((d) => d.product).catch(() => null)
      )
    ).then((arr) => setProducts(arr.filter(Boolean) as Product[]))
  }, [ids])

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
                <Heart className="w-5 h-5 text-gold" />
                <span className="font-display text-lg text-[#f5efe2] tracking-wide">
                  Wishlist ({ids.length})
                </span>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 text-[#f5efe2]/70 hover:text-gold">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {products.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-8">
                  <Heart className="w-12 h-12 text-[#2a2418] mb-4" />
                  <p className="font-display text-xl text-[#f5efe2] mb-2">No saved pieces yet</p>
                  <p className="text-sm text-[#9a8c66]">Tap the heart on any item to save it here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className="flex gap-3 border border-[#2a2418] p-3 hover:border-gold/40 transition-colors cursor-pointer"
                      onClick={() => { setOpen(false); setView({ name: 'product', id: p.id }) }}
                    >
                      <div className="w-20 h-24 bg-[#161210] flex-shrink-0 overflow-hidden">
                        <img src={p.images?.[0]} alt={p.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm text-[#f5efe2] line-clamp-2">{p.title}</h4>
                        <div className="text-[10px] tracking-[0.15em] uppercase text-gold/80 mt-1">Request Quote</div>
                        <div className="text-[10px] tracking-[0.15em] uppercase mt-1">
                          {p.inStock ? <span className="text-green-400">In Stock</span> : <span className="text-red-400">Sold Out</span>}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggle(p.id) }}
                        className="self-start p-2 text-[#9a8c66] hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
