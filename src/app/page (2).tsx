'use client'

import { useEffect, useState } from 'react'
import { Storefront } from '@/components/store/Storefront'
import { ProductDetail } from '@/components/store/ProductDetail'
import { Checkout } from '@/components/store/Checkout'
import { AdminApp } from '@/components/admin/AdminApp'
import { useView } from '@/hooks/use-view'
import type { HeroSlide } from '@/components/store/HeroBanner'

interface StorefrontData {
  products: any[]
  slides: HeroSlide[]
  announcement: string | null
  about: { title: string; body: string; image: string }
  footer: {
    address: string; phone: string; email: string
    instagram: string; facebook: string; tiktok: string; copyright: string
  }
  navItems: { label: string; href: string }[]
  contact: { email: string; whatsapp: string; telegram: string }
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    headline: 'Woven Heritage. Modern Elegance.',
    subtitle: 'Authentic Habesha traditional wear — handwoven in Ethiopia, treasured at home.',
    imageUrl: 'https://images.unsplash.com/photo-1583846552345-d27a35e2a5b2?auto=format&fit=crop&w=1920&q=80',
    ctaText: 'Explore Collection',
    ctaLink: '#shop'
  }
]

const DEFAULT_DATA: StorefrontData = {
  products: [],
  slides: DEFAULT_SLIDES,
  announcement: 'Handwoven in Addis Ababa — delivered nationwide across Ethiopia.',
  about: {
    title: 'Our Story',
    body: "TT's Tibeb was founded to honor the ancient art of Ethiopian weaving and to share it with the world.",
    image: 'https://images.unsplash.com/photo-1583846552647-1ca0d6e9c0b3?auto=format&fit=crop&w=1200&q=80'
  },
  footer: {
    address: 'Bole Road, Addis Ababa, Ethiopia',
    phone: '+251 911 234 567',
    email: 'hello@ttstibeb.com',
    instagram: 'https://instagram.com/ttstibeb',
    facebook: 'https://facebook.com/ttstibeb',
    tiktok: 'https://tiktok.com/@ttstibeb',
    copyright: "TT's Tibeb. Crafted with heritage in Addis Ababa."
  },
  navItems: [
    { label: 'Home', href: '#home' },
    { label: 'Shop', href: '#shop' },
    { label: 'Categories', href: '#categories' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' }
  ],
  contact: {
    email: 'hello@ttstibeb.com',
    whatsapp: '+251911234567',
    telegram: 'ttstibeb'
  }
}

export default function Home() {
  const [data, setData] = useState<StorefrontData>(DEFAULT_DATA)
  const [loading, setLoading] = useState(true)
  const view = useView((s) => s.view)

  // Initial data load
  useEffect(() => {
    Promise.all([
      fetch('/api/products').then((r) => r.json()),
      fetch('/api/hero').then((r) => r.json()),
      fetch('/api/content').then((r) => r.json())
    ]).then(([p, h, c]) => {
      const content = c.content || {}
      const slides: HeroSlide[] = (h.heroes || [])
        .filter((s: HeroSlide) => s.active !== false)
        .map((s: HeroSlide) => ({
          id: s.id,
          headline: s.headline,
          subtitle: s.subtitle,
          imageUrl: s.imageUrl,
          ctaText: s.ctaText,
          ctaLink: s.ctaLink,
          active: s.active
        }))
      setData({
        products: p.products || [],
        slides: slides.length > 0 ? slides : DEFAULT_DATA.slides,
        announcement: h.activeAnnouncement?.message || null,
        about: {
          title: content['about.title'] || DEFAULT_DATA.about.title,
          body: content['about.body'] || DEFAULT_DATA.about.body,
          image: content['about.image'] || DEFAULT_DATA.about.image
        },
        footer: {
          address: content['footer.address'] || DEFAULT_DATA.footer.address,
          phone: content['footer.phone'] || DEFAULT_DATA.footer.phone,
          email: content['footer.email'] || DEFAULT_DATA.footer.email,
          instagram: content['footer.instagram'] || DEFAULT_DATA.footer.instagram,
          facebook: content['footer.facebook'] || DEFAULT_DATA.footer.facebook,
          tiktok: content['footer.tiktok'] || DEFAULT_DATA.footer.tiktok,
          copyright: content['footer.copyright'] || DEFAULT_DATA.footer.copyright
        },
        navItems: (() => {
          try { return JSON.parse(content['nav.menu'] || '[]') } catch { return DEFAULT_DATA.navItems }
        })(),
        contact: {
          email: content['contact.email'] || content['footer.email'] || DEFAULT_DATA.contact.email,
          whatsapp: content['contact.whatsapp'] || content['shipping.whatsapp_number'] || DEFAULT_DATA.contact.whatsapp,
          telegram: content['contact.telegram'] || DEFAULT_DATA.contact.telegram
        }
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // Listen to hash changes for view routing (back/forward)
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace('#', '')
      const setView = useView.getState().setView
      if (h === 'admin') setView({ name: 'admin' })
      else if (h.startsWith('product/')) setView({ name: 'product', id: h.split('/')[1] })
      else if (h === 'checkout') setView({ name: 'checkout' })
      else setView({ name: 'store' })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="font-display text-2xl font-bold tracking-[0.25em] text-gold-gradient mb-4">
            TT&apos;S TIBEB
          </div>
          <div className="w-10 h-10 mx-auto rounded-full border-2 border-gold border-t-transparent animate-spin" />
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#9a8c66] mt-4">Loading Heritage</p>
        </div>
      </div>
    )
  }

  if (view.name === 'admin') {
    // Redirect to real /admin route (production-friendly)
    if (typeof window !== 'undefined') {
      window.location.href = '/admin'
    }
    return null
  }

  return (
    <>
      {view.name === 'store' && <Storefront initialData={data} />}
      {view.name === 'product' && <ProductDetail id={view.id} />}
      {view.name === 'checkout' && (
        <Checkout
          siteContent={data.footer}
          whatsappNumber={data.contact?.whatsapp}
          contactEmail={data.contact?.email}
          telegramUsername={data.contact?.telegram}
        />
      )}
    </>
  )
}
