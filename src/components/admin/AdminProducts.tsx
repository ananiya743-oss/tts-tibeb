'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, X, Save, Package, Star } from 'lucide-react'
import { toast } from 'sonner'
import type { Product } from '@/components/store/ProductCard'

const EMPTY = {
  id: '', title: '', description: '', fabricInfo: '', careInfo: '',
  price: 0, salePrice: null as number | null,
  images: [] as string[], sizes: ['XS', 'S', 'M', 'L', 'XL'],
  category: 'habesha-kemis', inStock: true, stockCount: 0, featured: false
}

const CATS = ['habesha-kemis', 'netela', 'kuta-gabi', 'wedding', 'accessories']

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<typeof EMPTY | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/products', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const toggleStock = async (p: Product) => {
    const res = await fetch(`/api/products/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inStock: !p.inStock })
    })
    if (res.ok) {
      toast.success(`Marked ${!p.inStock ? 'in stock' : 'sold out'}`)
      load()
    } else {
      toast.error('Failed to update')
    }
  }

  const del = async (p: Product) => {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return
    const res = await fetch(`/api/products/${p.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Product deleted')
      load()
    } else {
      toast.error('Failed to delete')
    }
  }

  const save = async () => {
    if (!editing) return
    if (!editing.title || !editing.description || !editing.price) {
      toast.error('Title, description, and price are required')
      return
    }
    const body = {
      title: editing.title,
      description: editing.description,
      fabricInfo: editing.fabricInfo,
      careInfo: editing.careInfo,
      price: Number(editing.price),
      salePrice: editing.salePrice,
      images: editing.images,
      sizes: editing.sizes,
      category: editing.category,
      inStock: editing.inStock,
      stockCount: Number(editing.stockCount),
      featured: editing.featured
    }
    const res = await fetch(editing.id ? `/api/products/${editing.id}` : '/api/products', {
      method: editing.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (res.ok) {
      toast.success(editing.id ? 'Product updated' : 'Product created')
      setEditing(null)
      load()
    } else {
      toast.error('Save failed')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#f5efe2]">Products</h1>
          <p className="text-sm text-[#9a8c66] mt-1">Manage your catalog of {products.length} pieces.</p>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="inline-flex items-center gap-2 bg-gold hover:bg-gold-soft text-black text-xs tracking-[0.2em] uppercase px-5 py-3 font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square skeleton-shimmer" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id} className="border border-[#2a2418] bg-[#0f0f0f] p-4 flex gap-4">
              <div className="w-24 h-28 bg-[#161210] flex-shrink-0 overflow-hidden">
                <img src={p.images?.[0]} alt={p.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-center gap-2 text-[10px] tracking-[0.15em] uppercase text-[#9a8c66] mb-1">
                  {p.featured && <Star className="w-3 h-3 text-gold fill-current" />}
                  {p.category.replace(/-/g, ' ')}
                </div>
                <h3 className="text-sm text-[#f5efe2] font-medium line-clamp-2">{p.title}</h3>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-gold font-semibold">Br {(p.salePrice != null ? p.salePrice : p.price).toFixed(2)}</span>
                  {p.salePrice != null && (
                    <span className="text-[#9a8c66] line-through text-xs">Br {p.price.toFixed(2)}</span>
                  )}
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => toggleStock(p)}
                    className={`text-[10px] tracking-[0.15em] uppercase px-2 py-1 border ${
                      p.inStock
                        ? 'text-green-400 border-green-500/40 bg-green-500/10'
                        : 'text-red-400 border-red-500/40 bg-red-500/10'
                    }`}
                  >
                    {p.inStock ? 'In Stock' : 'Sold Out'}
                  </button>
                </div>
                <div className="mt-auto flex gap-2 pt-3">
                  <button
                    onClick={() => setEditing({
                      id: p.id, title: p.title, description: p.description,
                      fabricInfo: p.fabricInfo, careInfo: p.careInfo,
                      price: p.price, salePrice: p.salePrice ?? null,
                      images: p.images, sizes: p.sizes, category: p.category,
                      inStock: p.inStock, stockCount: p.stockCount, featured: p.featured
                    })}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 border border-[#2a2418] hover:border-gold/40 text-[#f5efe2]/80 hover:text-gold text-xs tracking-[0.1em] uppercase py-2 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => del(p)}
                    className="px-3 border border-[#2a2418] hover:border-red-500/40 text-[#f5efe2]/80 hover:text-red-400 text-xs py-2 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editing && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditing(null)}
              className="fixed inset-0 bg-black/70 z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="fixed inset-0 z-50 overflow-y-auto"
            >
              <div className="min-h-full flex items-start justify-center p-4 md:p-8">
                <div className="bg-[#0d0d0d] border border-[#2a2418] w-full max-w-3xl my-8">
                  <div className="flex items-center justify-between p-5 border-b border-[#2a2418] sticky top-0 bg-[#0d0d0d] z-10">
                    <h2 className="font-display text-lg text-[#f5efe2] flex items-center gap-2">
                      <Package className="w-5 h-5 text-gold" />
                      {editing.id ? 'Edit Product' : 'New Product'}
                    </h2>
                    <button onClick={() => setEditing(null)} className="text-[#f5efe2]/70 hover:text-gold">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-5 md:p-6 space-y-5">
                    <div className="grid md:grid-cols-2 gap-4">
                      <Field label="Title *">
                        <input
                          value={editing.title}
                          onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                          className="tt-input"
                          placeholder="Yebelo Premium White Kemis"
                        />
                      </Field>
                      <Field label="Category">
                        <select
                          value={editing.category}
                          onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                          className="tt-input"
                        >
                          {CATS.map((c) => (
                            <option key={c} value={c}>{c.replace(/-/g, ' ')}</option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    <Field label="Description *">
                      <textarea
                        value={editing.description}
                        onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                        rows={4}
                        className="tt-input resize-none"
                      />
                    </Field>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Field label="Fabric Info">
                        <textarea
                          value={editing.fabricInfo}
                          onChange={(e) => setEditing({ ...editing, fabricInfo: e.target.value })}
                          rows={3}
                          className="tt-input resize-none"
                        />
                      </Field>
                      <Field label="Care Info">
                        <textarea
                          value={editing.careInfo}
                          onChange={(e) => setEditing({ ...editing, careInfo: e.target.value })}
                          rows={3}
                          className="tt-input resize-none"
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Field label="Price (Br) *">
                        <input
                          type="number" step="0.01"
                          value={editing.price}
                          onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                          className="tt-input"
                        />
                      </Field>
                      <Field label="Sale Price (Br)">
                        <input
                          type="number" step="0.01"
                          value={editing.salePrice ?? ''}
                          onChange={(e) => setEditing({ ...editing, salePrice: e.target.value ? Number(e.target.value) : null })}
                          className="tt-input"
                        />
                      </Field>
                      <Field label="Stock Count">
                        <input
                          type="number"
                          value={editing.stockCount}
                          onChange={(e) => setEditing({ ...editing, stockCount: Number(e.target.value) })}
                          className="tt-input"
                        />
                      </Field>
                      <Field label="Status">
                        <label className="flex items-center gap-2 h-[42px]">
                          <input
                            type="checkbox"
                            checked={editing.inStock}
                            onChange={(e) => setEditing({ ...editing, inStock: e.target.checked })}
                            className="w-4 h-4 accent-[#d4af37]"
                          />
                          <span className="text-sm text-[#f5efe2]">In Stock</span>
                        </label>
                      </Field>
                    </div>

                    <Field label="Sizes (comma-separated)">
                      <input
                        value={editing.sizes.join(', ')}
                        onChange={(e) => setEditing({ ...editing, sizes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                        className="tt-input"
                        placeholder="XS, S, M, L, XL"
                      />
                    </Field>

                    <Field label="Image URLs (one per line)">
                      <textarea
                        value={editing.images.join('\n')}
                        onChange={(e) => setEditing({ ...editing, images: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
                        rows={4}
                        className="tt-input resize-none font-mono text-xs"
                        placeholder="https://images.unsplash.com/..."
                      />
                    </Field>
                    {editing.images.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {editing.images.map((img, i) => (
                          <div key={i} className="w-20 h-24 flex-shrink-0 overflow-hidden border border-[#2a2418]">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editing.featured}
                        onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
                        className="w-4 h-4 accent-[#d4af37]"
                      />
                      <span className="text-sm text-[#f5efe2]">Featured product (shown on homepage)</span>
                    </label>
                  </div>

                  <div className="p-5 border-t border-[#2a2418] flex justify-end gap-3 sticky bottom-0 bg-[#0d0d0d]">
                    <button
                      onClick={() => setEditing(null)}
                      className="px-5 py-2.5 text-sm tracking-[0.15em] uppercase text-[#f5efe2]/70 hover:text-gold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={save}
                      className="inline-flex items-center gap-2 bg-gold hover:bg-gold-soft text-black text-xs tracking-[0.2em] uppercase px-6 py-3 font-semibold transition-colors"
                    >
                      <Save className="w-4 h-4" /> Save
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .tt-input {
          width: 100%;
          background: #0a0a0a;
          border: 1px solid #2a2418;
          color: #f5efe2;
          padding: 0.65rem 0.9rem;
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] tracking-[0.2em] uppercase text-[#9a8c66] block mb-1.5">{label}</span>
      {children}
    </label>
  )
}
