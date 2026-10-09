'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistState {
  ids: string[]
  open: boolean
  setOpen: (o: boolean) => void
  toggle: (id: string) => void
  has: (id: string) => boolean
  clear: () => void
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      open: false,
      setOpen: (o) => set({ open: o }),
      toggle: (id) => {
        const ids = get().ids
        if (ids.includes(id)) set({ ids: ids.filter((x) => x !== id) })
        else set({ ids: [...ids, id] })
      },
      has: (id) => get().ids.includes(id),
      clear: () => set({ ids: [] }),
    }),
    { name: 'tt-wishlist' }
  )
)
