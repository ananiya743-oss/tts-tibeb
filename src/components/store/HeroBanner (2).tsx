'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

export interface HeroSlide {
  id?: string
  headline: string
  subtitle: string
  imageUrl: string
  ctaText: string
  ctaLink: string
  active?: boolean
}

interface HeroBannerProps {
  slides: HeroSlide[]
}

const SLIDE_DURATION = 6500 // ms per slide

export function HeroBanner({ slides }: HeroBannerProps) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = slides.length

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % Math.max(count, 1))
  }, [count])

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + count) % Math.max(count, 1))
  }, [count])

  useEffect(() => {
    if (count <= 1 || paused) return
    const t = setInterval(next, SLIDE_DURATION)
    return () => clearInterval(t)
  }, [count, paused, next])

  // Safety: if slides shrink, clamp current
  useEffect(() => {
    if (current >= count) setCurrent(0)
  }, [count, current])

  if (count === 0) {
    return (
      <section id="home" className="relative min-h-[60vh] flex items-center justify-center">
        <p className="text-[#9a8c66] text-sm tracking-[0.2em] uppercase">No slides configured</p>
      </section>
    )
  }

  const slide = slides[current]

  // Split headline so the last two words get the gold gradient treatment
  const words = slide.headline.split(' ')
  const headPrefix = words.slice(0, Math.max(0, words.length - 2)).join(' ')
  const headSuffix = words.slice(Math.max(0, words.length - 2)).join(' ')

  const scrollTo = (href: string) => {
    const el = document.querySelector(href || '#shop')
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      id="home"
      className="relative min-h-[88vh] md:min-h-[92vh] flex items-center overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides stack — all rendered, crossfade via opacity */}
      <div className="absolute inset-0 z-0">
        {slides.map((s, i) => (
          <motion.div
            key={s.id || i}
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: i === current ? 1 : 0 }}
            transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
            aria-hidden={i !== current}
          >
            <div
              className={`absolute inset-0 bg-cover bg-center ${i === current ? 'kenburns' : ''}`}
              style={{ backgroundImage: `url(${s.imageUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/75 to-[#0a0a0a]/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/40" />
          </motion.div>
        ))}
      </div>

      {/* Content — re-mounts on slide change for entrance animation */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="max-w-2xl pointer-events-auto"
          >
            <div className="mb-5 inline-flex items-center gap-3">
              <span className="h-px w-10 bg-gold" />
              <span className="text-gold text-xs tracking-[0.3em] uppercase">Habesha Heritage</span>
            </div>

            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05] text-[#f5efe2]">
              {headPrefix}
              {headPrefix && ' '}
              {headSuffix && (
                <span className="text-gold-gradient italic">{headSuffix}</span>
              )}
            </h1>

            <p className="mt-6 text-base md:text-lg text-[#f5efe2]/75 max-w-xl leading-relaxed">
              {slide.subtitle}
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <button
                onClick={() => scrollTo(slide.ctaLink)}
                className="group inline-flex items-center gap-3 bg-gold hover:bg-gold-soft text-black font-semibold text-sm tracking-[0.15em] uppercase px-7 py-4 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(212,175,55,0.4)]"
              >
                {slide.ctaText}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => scrollTo('#about')}
                className="inline-flex items-center gap-3 border border-[#d4af37]/40 hover:border-gold text-[#f5efe2] hover:text-gold font-medium text-sm tracking-[0.15em] uppercase px-7 py-4 transition-all duration-300"
              >
                Our Story
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Arrows (only when > 1 slide) */}
      {count > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-[#0a0a0a]/50 hover:bg-gold hover:text-black backdrop-blur border border-[#d4af37]/30 hover:border-gold text-[#f5efe2] transition-all"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-[#0a0a0a]/50 hover:bg-gold hover:text-black backdrop-blur border border-[#d4af37]/30 hover:border-gold text-[#f5efe2] transition-all"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dot indicators + progress bar */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
            {slides.map((s, i) => (
              <button
                key={s.id || i}
                onClick={() => setCurrent(i)}
                className="group relative h-2 transition-all duration-500"
                style={{ width: i === current ? 36 : 8 }}
                aria-label={`Go to slide ${i + 1}`}
              >
                <span
                  className={`absolute inset-0 rounded-full transition-all ${
                    i === current ? 'bg-gold' : 'bg-[#f5efe2]/30 group-hover:bg-[#f5efe2]/60'
                  }`}
                />
                {i === current && !paused && (
                  <motion.span
                    key={`prog-${current}`}
                    className="absolute inset-0 rounded-full bg-gold-soft/70 origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: SLIDE_DURATION / 1000, ease: 'linear' }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Slide counter */}
          <div className="absolute bottom-10 right-6 z-20 hidden md:flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase text-[#9a8c66]">
            <span className="text-gold font-semibold">{String(current + 1).padStart(2, '0')}</span>
            <span>/</span>
            <span>{String(count).padStart(2, '0')}</span>
          </div>
        </>
      )}

      {/* Decorative bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0a0a] to-transparent z-[5] pointer-events-none" />
    </section>
  )
}
