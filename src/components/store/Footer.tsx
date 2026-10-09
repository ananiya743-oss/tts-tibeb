'use client'
import { Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react'

interface FooterData {
  address: string
  phone: string
  email: string
  instagram: string
  facebook: string
  tiktok: string
  copyright: string
}

export function Footer({ data, onAdminClick }: { data: FooterData; onAdminClick: () => void }) {
  return (
    <footer id="contact" className="mt-auto bg-[#080808] border-t border-[#2a2418]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-14 md:py-20">
        <div className="grid md:grid-cols-4 gap-10 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="font-display text-2xl font-bold tracking-[0.2em] text-gold-gradient mb-3">
              TT&apos;S TIBEB
            </h3>
            <p className="text-sm text-[#9a8c66] leading-relaxed max-w-sm mb-5">
              Authentic Habesha traditional wear, handwoven in Ethiopia. Heritage craftsmanship for the modern world.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Instagram, href: data.instagram },
                { icon: Facebook, href: data.facebook },
                { icon: Mail, href: `mailto:${data.email}` }
              ].map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 border border-[#2a2418] hover:border-gold/50 flex items-center justify-center text-[#f5efe2]/80 hover:text-gold transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs tracking-[0.25em] uppercase text-gold mb-4">Explore</h4>
            <ul className="space-y-2 text-sm text-[#f5efe2]/70">
              {['Home', 'Shop', 'Categories', 'About', 'Contact'].map((l) => (
                <li key={l}>
                  <a href={`#${l.toLowerCase()}`} className="hover:text-gold transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs tracking-[0.25em] uppercase text-gold mb-4">Get in Touch</h4>
            <ul className="space-y-3 text-sm text-[#f5efe2]/70">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                <span>{data.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gold flex-shrink-0" />
                <a href={`tel:${data.phone}`} className="hover:text-gold transition-colors">{data.phone}</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gold flex-shrink-0" />
                <a href={`mailto:${data.email}`} className="hover:text-gold transition-colors">{data.email}</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#2a2418] mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#9a8c66]">{data.copyright}</p>
          <div className="flex items-center gap-4 text-xs text-[#9a8c66]">
            <a href="/download" className="hover:text-gold transition-colors tracking-[0.15em] uppercase">
              Source Code
            </a>
            <span className="text-[#2a2418]">|</span>
            <button onClick={onAdminClick} className="hover:text-gold transition-colors tracking-[0.15em] uppercase">
              Admin
            </button>
            <span className="text-[#2a2418]">|</span>
            <span>Crafted with heritage in Addis Ababa</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
