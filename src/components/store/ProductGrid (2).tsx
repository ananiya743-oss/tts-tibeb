'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ProductCard, type Product } from './ProductCard'
import { useView } from '@/hooks/use-view'

interface Props {
  initialProducts: Product[]
}

export function ProductGrid({ initialProducts }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [loading, setLoading] = useState(false)
  const category = useView((s) => s.category)
  const search = useView((s) => s.search)
  const setCategory = useView((s) => s.setCategory)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const q = new URLSearchParams()
    if (category) q.set('category', category)
    if (search) q.set('q', search)
    fetch(`/api/products?${q.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setProducts(d.products || [])
      })
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [category, search])

  const cats = ['All', 'habesha-kemis', 'netela', 'kuta-gabi', 'wedding', 'accessories']

  return (
    <section id="shop" className="py-20 md:py-28 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="h-px w-8 bg-gold/60" />
            <span className="text-gold text-xs tracking-[0.3em] uppercase">The Collection</span>
            <span className="h-px w-8 bg-gold/60" />
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-[#f5efe2]">
            Shop Our <span className="text-gold-gradient italic">Heritage</span>
          </h2>
          <p className="mt-4 text-[#9a8c66] max-w-xl mx-auto">
            Each piece is handwoven by master artisans in Ethiopia — a timeless expression of culture and craftsmanship.
          </p>
        </motion.div>

        {/* Category filter */}
        <div id="categories" className="flex flex-wrap items-center justify-center gap-2 md:gap-3 mb-12">
          {cats.map((c) => {
            const active = (category === null && c === 'All') || category === c
            return (
              <button
                key={c}
                onClick={() => setCategory(c === 'All' ? null : c)}
                className={`text-[11px] tracking-[0.2em] uppercase px-4 py-2 border transition-all ${
                  active
                    ? 'bg-gold text-black border-gold'
                    : 'border-[#2a2418] text-[#f5efe2]/70 hover:border-gold/50 hover:text-gold'
                }`}
              >
                {c.replace(/-/g, ' ')}
              </button>
            )
          })}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-[#0f0f0f] border border-[#2a2418]">
                <div className="aspect-[3/4] skeleton-shimmer" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-1/3 skeleton-shimmer" />
                  <div className="h-4 w-3/4 skeleton-shimmer" />
                  <div className="h-5 w-1/4 skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-[#9a8c66]">
            <p className="font-display text-2xl text-[#f5efe2] mb-2">No pieces found</p>
            <p className="text-sm">Try a different category or check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
