'use client'
import { motion } from 'framer-motion'
import { Heart, ShoppingBag } from 'lucide-react'
import { useWishlist } from '@/hooks/use-wishlist'
import { useCart } from '@/hooks/use-cart'
import { useView } from '@/hooks/use-view'

export interface Product {
  id: string
  title: string
  slug: string
  description: string
  price: number
  salePrice?: number | null
  images: string[]
  sizes: string[]
  category: string
  inStock: boolean
  stockCount: number
  featured: boolean
  rating: number
  reviewCount: number
}

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const toggleWish = useWishlist((s) => s.toggle)
  const hasWish = useWishlist((s) => s.ids.includes(product.id))
  const addCart = useCart((s) => s.add)
  const setView = useView((s) => s.setView)

  const img = product.images?.[0] || ''

  const quickAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!product.inStock) return
    addCart({
      id: product.id,
      title: product.title,
      price: product.salePrice != null ? product.salePrice : product.price,
      image: img,
      size: product.sizes?.[0],
      inStock: product.inStock
    }, 1)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.08 }}
      onClick={() => setView({ name: 'product', id: product.id })}
      className="group cursor-pointer card-lift bg-[#0f0f0f] border border-[#2a2418] hover:border-[#d4af37]/40 flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#161210]">
        {img ? (
          <img
            src={img}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#9a8c66] text-xs">No image</div>
        )}

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.featured && (
            <span className="bg-[#0a0a0a]/80 text-gold border border-gold/30 text-[10px] font-bold tracking-widest px-2 py-1">
              FEATURED
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleWish(product.id)
          }}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all ${
            hasWish
              ? 'bg-gold text-black'
              : 'bg-[#0a0a0a]/60 backdrop-blur text-[#f5efe2] hover:bg-gold hover:text-black'
          }`}
          aria-label="Toggle wishlist"
        >
          <Heart className={`w-4 h-4 ${hasWish ? 'fill-current' : ''}`} />
        </button>

        {/* Stock overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-[#f5efe2] text-xs tracking-[0.3em] uppercase border border-[#f5efe2]/30 px-4 py-2">
              Sold Out
            </span>
          </div>
        )}

        {/* Quick add (desktop hover) */}
        {product.inStock && (
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={quickAdd}
              className="w-full bg-[#0a0a0a]/85 backdrop-blur border border-gold/40 text-gold hover:bg-gold hover:text-black text-xs tracking-[0.2em] uppercase py-3 flex items-center justify-center gap-2 transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Quick Add
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 md:p-5 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-[#9a8c66]">
          <span>{product.category.replace(/-/g, ' ')}</span>
          <span className="text-gold/60">·</span>
          <span>★ {product.rating.toFixed(1)} ({product.reviewCount})</span>
        </div>
        <h3 className="font-display text-base md:text-lg text-[#f5efe2] leading-snug line-clamp-2 group-hover:text-gold transition-colors">
          {product.title}
        </h3>
        <div className="mt-auto pt-2">
          <span className="text-[10px] tracking-[0.2em] uppercase text-gold/80">Request Quote</span>
        </div>
      </div>
    </motion.div>
  )
}
