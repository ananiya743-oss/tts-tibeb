'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Heart, Search, Menu, X } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { useWishlist } from '@/hooks/use-wishlist'
import { useView } from '@/hooks/use-view'

interface NavItem { label: string; href: string }

interface HeaderProps {
  navItems: NavItem[]
  announcement?: string | null
  onSearchClick: () => void
}

export function Header({ navItems, announcement, onSearchClick }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const cartCount = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0))
  const cartOpen = useCart((s) => s.setOpen)
  const wishCount = useWishlist((s) => s.ids.length)
  const wishOpen = useWishlist((s) => s.setOpen)
  const setView = useView((s) => s.setView)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const go = (href: string) => {
    setMobileOpen(false)
    setView({ name: 'store' })
    setTimeout(() => {
      const el = document.querySelector(href)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  return (
    <>
      {/* Announcement bar */}
      <AnimatePresence>
        {announcement && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gold-shimmer text-black text-center text-[11px] md:text-xs font-medium tracking-wide overflow-hidden"
          >
            <div className="px-4 py-2">{announcement}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`sticky top-0 z-40 transition-all duration-500 ${
          scrolled
            ? 'bg-[#0a0a0a]/85 backdrop-blur-xl border-b border-[#2a2418] shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 -ml-2 text-[#f5efe2] hover:text-gold transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo */}
            <button
              onClick={() => go('#home')}
              className="flex items-center gap-2 group"
            >
              <span className="font-display text-xl md:text-2xl font-bold tracking-[0.2em] text-gold-gradient">
                TT&apos;S TIBEB
              </span>
            </button>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => go(item.href)}
                  className="link-underline text-sm tracking-[0.15em] uppercase text-[#f5efe2]/85 hover:text-gold transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 md:gap-2">
              <button
                onClick={onSearchClick}
                className="p-2 text-[#f5efe2]/85 hover:text-gold transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => wishOpen(true)}
                className="p-2 text-[#f5efe2]/85 hover:text-gold transition-colors relative"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishCount > 0 && (
                  <span className="absolute top-1 right-1 bg-gold text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {wishCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => cartOpen(true)}
                className="p-2 text-[#f5efe2]/85 hover:text-gold transition-colors relative"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 bg-gold text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/70 z-50 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed left-0 top-0 bottom-0 w-[80%] max-w-xs bg-[#0d0d0d] z-50 md:hidden border-r border-[#2a2418] flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-[#2a2418]">
                <span className="font-display text-lg font-bold tracking-[0.15em] text-gold-gradient">TT&apos;S TIBEB</span>
                <button onClick={() => setMobileOpen(false)} className="p-2 text-[#f5efe2]/70 hover:text-gold">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex flex-col p-5 gap-5">
                {navItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => go(item.href)}
                    className="text-left text-sm tracking-[0.2em] uppercase text-[#f5efe2]/85 hover:text-gold transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
