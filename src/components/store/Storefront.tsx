'use client'
import { useEffect, useState } from 'react'
import { Header } from './Header'
import { HeroBanner, type HeroSlide } from './HeroBanner'
import { ProductGrid } from './ProductGrid'
import { AboutSection } from './AboutSection'
import { Footer } from './Footer'
import { CartDrawer } from './CartDrawer'
import { WishlistDrawer } from './WishlistDrawer'
import { SearchModal } from './SearchModal'
import type { Product } from './ProductCard'

interface StorefrontData {
  products: Product[]
  slides: HeroSlide[]
  announcement: string | null
  about: { title: string; body: string; image: string }
  footer: {
    address: string; phone: string; email: string
    instagram: string; facebook: string; tiktok: string; copyright: string
  }
  navItems: { label: string; href: string }[]
  contact: {
    email: string
    whatsapp: string
    telegram: string
  }
}

export function Storefront({ initialData }: { initialData: StorefrontData }) {
  const [data, setData] = useState(initialData)
  const [searchOpen, setSearchOpen] = useState(false)

  // Refresh dynamic content (announcement, hero slides) when storefront becomes visible
  useEffect(() => {
    const refresh = async () => {
      const h = await fetch('/api/hero').then((r) => r.json())
      const c = await fetch('/api/content').then((r) => r.json())
      const content = c.content || {}
      const slides: HeroSlide[] = (h.heroes || [])
        .filter((s: { active?: boolean }) => s.active !== false)
        .map((s: HeroSlide) => ({
          id: s.id,
          headline: s.headline,
          subtitle: s.subtitle,
          imageUrl: s.imageUrl,
          ctaText: s.ctaText,
          ctaLink: s.ctaLink,
          active: s.active
        }))
      setData((d) => ({
        ...d,
        slides: slides.length > 0 ? slides : d.slides,
        announcement: h.activeAnnouncement?.message || null,
        about: {
          title: content['about.title'] || d.about.title,
          body: content['about.body'] || d.about.body,
          image: content['about.image'] || d.about.image
        },
        footer: {
          address: content['footer.address'] || d.footer.address,
          phone: content['footer.phone'] || d.footer.phone,
          email: content['footer.email'] || d.footer.email,
          instagram: content['footer.instagram'] || d.footer.instagram,
          facebook: content['footer.facebook'] || d.footer.facebook,
          tiktok: content['footer.tiktok'] || d.footer.tiktok,
          copyright: content['footer.copyright'] || d.footer.copyright
        },
        navItems: (() => {
          try { return JSON.parse(content['nav.menu'] || '[]') } catch { return d.navItems }
        })(),
        contact: {
          email: content['contact.email'] || content['footer.email'] || d.contact?.email || 'hello@ttstibeb.com',
          whatsapp: content['contact.whatsapp'] || content['shipping.whatsapp_number'] || d.contact?.whatsapp || '+251911234567',
          telegram: content['contact.telegram'] || d.contact?.telegram || 'ttstibeb'
        }
      }))
    }
    refresh()
  }, [])

  return (
    <div className="flex-1 flex flex-col">
      <Header
        navItems={data.navItems}
        announcement={data.announcement}
        onSearchClick={() => setSearchOpen(true)}
      />
      <HeroBanner slides={data.slides} />
      <ProductGrid initialProducts={data.products} />
      <AboutSection data={data.about} />
      <Footer
        data={data.footer}
        onAdminClick={() => { window.location.hash = 'admin' }}
      />
      <CartDrawer />
      <WishlistDrawer />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
