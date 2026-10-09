'use client'
import { create } from 'zustand'

export type View =
  | { name: 'store' }
  | { name: 'product'; id: string }
  | { name: 'checkout' }
  | { name: 'admin' }

interface ViewState {
  view: View
  category: string | null
  search: string
  setView: (v: View) => void
  setCategory: (c: string | null) => void
  setSearch: (s: string) => void
}

function readInitialView(): View {
  if (typeof window === 'undefined') return { name: 'store' }
  const h = window.location.hash.replace('#', '')
  if (h === 'admin') return { name: 'admin' }
  if (h.startsWith('product/')) return { name: 'product', id: h.split('/')[1] }
  if (h === 'checkout') return { name: 'checkout' }
  return { name: 'store' }
}

export const useView = create<ViewState>((set) => ({
  view: typeof window !== 'undefined' ? readInitialView() : { name: 'store' },
  category: null,
  search: '',
  setView: (v) => {
    set({ view: v })
    if (typeof window !== 'undefined') {
      let h = ''
      if (v.name === 'admin') h = 'admin'
      else if (v.name === 'product') h = `product/${v.id}`
      else if (v.name === 'checkout') h = 'checkout'
      else h = ''
      window.location.hash = h
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  },
  setCategory: (c) => set({ category: c }),
  setSearch: (s) => set({ search: s }),
}))
