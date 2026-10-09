'use client'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface AboutData { title: string; body: string; image: string }

export function AboutSection({ data }: { data: AboutData }) {
  return (
    <section id="about" className="py-20 md:py-28 px-4 md:px-8 border-t border-[#1a1714]">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative aspect-[4/5] overflow-hidden"
        >
          <div className="absolute inset-0 border border-gold/30 z-10 translate-x-4 -translate-y-4" />
          <img src={data.image} alt="TT's Tibeb craft" className="w-full h-full object-cover relative z-0" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-3 mb-5">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-gold text-xs tracking-[0.3em] uppercase">Our Heritage</span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-[#f5efe2] leading-tight mb-6">
            {data.title}
          </h2>
          <p className="text-[#f5efe2]/75 leading-relaxed text-sm md:text-base">
            {data.body}
          </p>
          <div className="mt-8 flex flex-wrap gap-6">
            {[
              { stat: '15+', label: 'Master Artisans' },
              { stat: '2k+', label: 'Happy Customers' },
              { stat: '100%', label: 'Handwoven' }
            ].map(({ stat, label }) => (
              <div key={label}>
                <div className="font-display text-3xl text-gold-gradient font-bold">{stat}</div>
                <div className="text-[10px] tracking-[0.2em] uppercase text-[#9a8c66] mt-1">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
