'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Heart, ShoppingBag, Truck, Shield, RotateCcw, Minus, Plus, Star } from 'lucide-react'
import { useView } from '@/hooks/use-view'
import { useCart } from '@/hooks/use-cart'
import { useWishlist } from '@/hooks/use-wishlist'
import { toast } from 'sonner'

interface Review { id: string; author: string; rating: number; comment: string; createdAt: string }
interface ProductDetail {
  id: string; title: string; slug: string; description: string
  fabricInfo: string; careInfo: string
  price: number; salePrice?: number | null
  images: string[]; sizes: string[]
  category: string; inStock: boolean; stockCount: number
  rating: number; reviewCount: number
  reviews: Review[]
}

export function ProductDetail({ id }: { id: string }) {
  const setView = useView((s) => s.setView)
  const addCart = useCart((s) => s.add)
  const toggleWish = useWishlist((s) => s.toggle)
  const hasWish = useWishlist((s) => s.ids.includes(id))

  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [size, setSize] = useState<string>('')
  const [qty, setQty] = useState(1)
  const [zoom, setZoom] = useState(false)
  const [reviewForm, setReviewForm] = useState({ author: '', rating: 5, comment: '' })

  useEffect(() => {
    setLoading(true)
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setProduct(d.product)
        setSize(d.product?.sizes?.[0] || '')
        setActiveImg(0)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-gold border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <p className="font-display text-2xl text-[#f5efe2] mb-2">Product not found</p>
          <button onClick={() => setView({ name: 'store' })} className="text-gold hover:underline mt-4">
            Return to shop
          </button>
        </div>
      </div>
    )
  }

  const onAdd = () => {
    if (!product.inStock) {
      toast.error('This item is currently sold out.')
      return
    }
    addCart({
      id: product.id,
      title: product.title,
      price: product.salePrice != null ? product.salePrice : product.price,
      image: product.images[0],
      size,
      inStock: product.inStock
    }, qty)
    toast.success('Added to your order')
  }

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewForm.author || !reviewForm.comment) {
      toast.error('Please fill all fields')
      return
    }
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id, ...reviewForm })
    })
    if (res.ok) {
      toast.success('Thank you! Your review will appear once approved.')
      setReviewForm({ author: '', rating: 5, comment: '' })
    } else {
      toast.error('Could not submit review. Try again.')
    }
  }


  return (
    <div className="min-h-screen pb-24">
      {/* Top bar */}
      <div className="border-b border-[#2a2418] sticky top-0 bg-[#0a0a0a]/85 backdrop-blur-xl z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => setView({ name: 'store' })}
            className="inline-flex items-center gap-2 text-sm text-[#f5efe2]/80 hover:text-gold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to shop
          </button>
          <span className="text-xs tracking-[0.3em] uppercase text-[#9a8c66]">
            {product.category.replace(/-/g, ' ')}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">
        <div className="grid md:grid-cols-2 gap-8 md:gap-14">
          {/* Gallery */}
          <div>
            <motion.div
              key={activeImg}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="relative aspect-[3/4] bg-[#161210] border border-[#2a2418] overflow-hidden cursor-zoom-in group"
              onClick={() => setZoom((z) => !z)}
            >
              <img
                src={product.images[activeImg]}
                alt={product.title}
                className={`w-full h-full object-cover transition-transform duration-700 ${zoom ? 'scale-150' : 'group-hover:scale-105'}`}
              />
              {!product.inStock && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-[#f5efe2] text-xs tracking-[0.3em] uppercase border border-[#f5efe2]/30 px-4 py-2">
                    Sold Out
                  </span>
                </div>
              )}
            </motion.div>
            {product.images.length > 1 && (
              <div className="flex gap-3 mt-3">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-20 h-24 border-2 overflow-hidden transition-all ${
                      activeImg === i ? 'border-gold' : 'border-[#2a2418] hover:border-gold/50'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col"
          >
            <div className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-[#9a8c66]">
              <span>★ {product.rating.toFixed(1)}</span>
              <span className="text-gold/60">·</span>
              <span>{product.reviewCount} reviews</span>
              <span className="text-gold/60">·</span>
              <span className={product.inStock ? 'text-green-400' : 'text-red-400'}>
                {product.inStock ? 'In Stock' : 'Sold Out'}
              </span>
            </div>

            <h1 className="font-display text-3xl md:text-4xl font-bold text-[#f5efe2] mt-3 leading-tight">
              {product.title}
            </h1>

            <div className="inline-flex items-center gap-3 mt-4 px-4 py-2 border border-gold/30 bg-gold/5">
              <span className="text-gold text-xs tracking-[0.2em] uppercase">Request Quote</span>
              <span className="text-[#9a8c66] text-xs">· Price on inquiry</span>
            </div>

            <p className="text-[#f5efe2]/75 leading-relaxed mt-5 text-sm md:text-base">
              {product.description}
            </p>

            {/* Size */}
            {product.sizes.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs tracking-[0.2em] uppercase text-[#9a8c66]">Select Size</span>
                  <button className="text-xs text-gold hover:underline">Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`min-w-[3rem] px-3 py-2.5 text-sm border transition-all ${
                        size === s
                          ? 'bg-gold text-black border-gold'
                          : 'border-[#2a2418] text-[#f5efe2]/80 hover:border-gold/50 hover:text-gold'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mt-6">
              <span className="text-xs tracking-[0.2em] uppercase text-[#9a8c66] block mb-3">Quantity</span>
              <div className="inline-flex items-center border border-[#2a2418]">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="p-3 hover:bg-[#1a1714] text-[#f5efe2] transition-colors"
                  aria-label="Decrease"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-[#f5efe2]">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="p-3 hover:bg-[#1a1714] text-[#f5efe2] transition-colors"
                  aria-label="Increase"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={onAdd}
                disabled={!product.inStock}
                className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-soft disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold text-sm tracking-[0.2em] uppercase py-4 transition-all"
              >
                <ShoppingBag className="w-4 h-4" /> Add to Order
              </button>
              <button
                onClick={() => { onAdd(); setTimeout(() => setView({ name: 'checkout' }), 400) }}
                disabled={!product.inStock}
                className="flex-1 min-w-[200px] inline-flex items-center justify-center border border-gold/50 hover:bg-gold hover:text-black disabled:opacity-40 text-gold text-sm tracking-[0.2em] uppercase py-4 transition-all"
              >
                Send Order Request
              </button>
              <button
                onClick={() => { toggleWish(product.id); toast.success(hasWish ? 'Removed from wishlist' : 'Added to wishlist') }}
                className={`p-4 border transition-all ${
                  hasWish ? 'bg-gold text-black border-gold' : 'border-[#2a2418] text-[#f5efe2] hover:border-gold/50 hover:text-gold'
                }`}
                aria-label="Toggle wishlist"
              >
                <Heart className={`w-5 h-5 ${hasWish ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-8 grid grid-cols-3 gap-3 text-center">
              {[
                { icon: Truck, label: 'Nationwide Delivery' },
                { icon: Shield, label: 'Secure Checkout' },
                { icon: RotateCcw, label: '14-Day Returns' }
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="border border-[#2a2418] p-3 text-[10px] tracking-[0.15em] uppercase text-[#9a8c66] flex flex-col items-center gap-2">
                  <Icon className="w-5 h-5 text-gold" />
                  {label}
                </div>
              ))}
            </div>

            {/* Accordions */}
            <div className="mt-8 space-y-3">
              <details className="border border-[#2a2418] group" open>
                <summary className="cursor-pointer p-4 text-sm tracking-[0.15em] uppercase text-[#f5efe2] hover:text-gold flex items-center justify-between list-none">
                  <span>Fabric & Craft</span>
                  <Plus className="w-4 h-4 group-open:rotate-45 transition-transform" />
                </summary>
                <div className="px-4 pb-4 text-sm text-[#f5efe2]/75 leading-relaxed">
                  {product.fabricInfo}
                </div>
              </details>
              <details className="border border-[#2a2418] group">
                <summary className="cursor-pointer p-4 text-sm tracking-[0.15em] uppercase text-[#f5efe2] hover:text-gold flex items-center justify-between list-none">
                  <span>Care Instructions</span>
                  <Plus className="w-4 h-4 group-open:rotate-45 transition-transform" />
                </summary>
                <div className="px-4 pb-4 text-sm text-[#f5efe2]/75 leading-relaxed">
                  {product.careInfo}
                </div>
              </details>
            </div>
          </motion.div>
        </div>

        {/* Reviews */}
        <div className="mt-20 max-w-4xl">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-[#f5efe2] mb-6">
            Customer <span className="text-gold-gradient italic">Reviews</span>
          </h2>

          {product.reviews.length > 0 ? (
            <div className="space-y-4 mb-10">
              {product.reviews.map((r) => (
                <div key={r.id} className="border border-[#2a2418] p-5 bg-[#0f0f0f]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-[#f5efe2]">{r.author}</span>
                    <span className="text-xs text-[#9a8c66]">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'text-gold fill-current' : 'text-[#2a2418]'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-[#f5efe2]/75 leading-relaxed">{r.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#9a8c66] mb-10 text-sm">No reviews yet — be the first to share your experience.</p>
          )}

          {/* Submit review */}
          <form onSubmit={submitReview} className="border border-[#2a2418] p-5 md:p-7 bg-[#0f0f0f]">
            <h3 className="font-display text-lg text-[#f5efe2] mb-4">Write a Review</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <input
                value={reviewForm.author}
                onChange={(e) => setReviewForm({ ...reviewForm, author: e.target.value })}
                placeholder="Your name"
                className="w-full bg-[#0a0a0a] border border-[#2a2418] focus:border-gold px-4 py-3 text-sm text-[#f5efe2] outline-none transition-colors"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#9a8c66]">Rating:</span>
                {[1,2,3,4,5].map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setReviewForm({ ...reviewForm, rating: n })}
                  >
                    <Star className={`w-5 h-5 ${n <= reviewForm.rating ? 'text-gold fill-current' : 'text-[#2a2418]'}`} />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              placeholder="Share your thoughts on this piece..."
              rows={4}
              className="w-full bg-[#0a0a0a] border border-[#2a2418] focus:border-gold px-4 py-3 text-sm text-[#f5efe2] outline-none transition-colors mb-4 resize-none"
            />
            <button
              type="submit"
              className="bg-gold hover:bg-gold-soft text-black text-xs tracking-[0.2em] uppercase px-6 py-3 font-semibold transition-colors"
            >
              Submit Review
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
