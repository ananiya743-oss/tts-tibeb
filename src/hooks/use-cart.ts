'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  title: string
  price: number
  image: string
  size?: string
  quantity: number
  inStock: boolean
}

interface CartState {
  items: CartItem[]
  open: boolean
  setOpen: (o: boolean) => void
  add: (item: Omit<CartItem, 'quantity'>, qty?: number) => void
  remove: (id: string, size?: string) => void
  updateQty: (id: string, size: string | undefined, qty: number) => void
  clear: () => void
  count: () => number
  total: () => number
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      open: false,
      setOpen: (o) => set({ open: o }),
      add: (item, qty = 1) => {
        const items = get().items
        const idx = items.findIndex((i) => i.id === item.id && i.size === item.size)
        if (idx >= 0) {
          const next = [...items]
          next[idx] = { ...next[idx], quantity: next[idx].quantity + qty }
          set({ items: next, open: true })
        } else {
          set({ items: [...items, { ...item, quantity: qty }], open: true })
        }
      },
      remove: (id, size) =>
        set({ items: get().items.filter((i) => !(i.id === id && i.size === size)) }),
      updateQty: (id, size, qty) => {
        if (qty <= 0) {
          set({ items: get().items.filter((i) => !(i.id === id && i.size === size)) })
          return
        }
        set({
          items: get().items.map((i) =>
            i.id === id && i.size === size ? { ...i, quantity: qty } : i
          )
        })
      },
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((s, i) => s + i.quantity, 0),
      total: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
    }),
    { name: 'tt-cart' }
  )
)
