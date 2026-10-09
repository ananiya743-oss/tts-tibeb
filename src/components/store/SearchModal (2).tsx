'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { useView } from '@/hooks/use-view'
import type { Product } from './ProductCard'

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const setView = useView((s) => s.setView)
  const setSearch = useView((s) => s.setSearch)
  const setCategory = useView((s) => s.setCategory)

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => {
      if (q.trim()) {
        fetch(`/api/products?q=${encodeURIComponent(q)}`)
          .then((r) => r.json())
          .then((d) => setResults(d.products || []))
          .catch(() => setResults([]))
      } else {
        setResults([])
      }
    }, 250)
    return () => clearTimeout(t)
  }, [q, open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 z-50 bg-[#0d0d0d] border-b border-[#2a2418]"
          >
            <div className="max-w-3xl mx-auto px-4 py-6">
              <div className="flex items-center gap-3 border-b border-gold/30 pb-3">
                <Search className="w-5 h-5 text-gold" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search for kemis, netela, accessories..."
                  className="flex-1 bg-transparent outline-none text-lg text-[#f5efe2] placeholder:text-[#9a8c66]"
                />
                <button onClick={onClose} className="p-2 text-[#f5efe2]/70 hover:text-gold">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {results.length > 0 && (
                <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-2">
                  {results.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onClose()
                        setView({ name: 'product', id: p.id })
                      }}
                      className="w-full flex items-center gap-4 p-2 hover:bg-[#1a1714] transition-colors text-left"
                    >
                      <div className="w-14 h-16 bg-[#161210] overflow-hidden flex-shrink-0">
                        <img src={p.images?.[0]} alt={p.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-[#f5efe2] line-clamp-1">{p.title}</div>
                        <div className="text-[10px] tracking-[0.2em] uppercase text-gold/80 mt-1">
                          Request Quote
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {q && results.length === 0 && (
                <p className="mt-6 text-center text-[#9a8c66] text-sm">No pieces match &quot;{q}&quot;</p>
              )}

              {!q && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {['kemis', 'wedding', 'netela', 'gold', 'gabi'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setQ(s)}
                      className="text-xs tracking-[0.15em] uppercase border border-[#2a2418] hover:border-gold/50 text-[#f5efe2]/70 hover:text-gold px-3 py-1.5 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
