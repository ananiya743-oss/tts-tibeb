'use client'
import { motion } from 'framer-motion'
import { Download, Code, Package, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5efe2] py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-3 mb-3">
            <span className="h-px w-8 bg-gold/60" />
            <span className="text-gold text-xs tracking-[0.3em] uppercase">Source Code</span>
            <span className="h-px w-8 bg-gold/60" />
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Download <span className="text-gold-gradient italic">TT's Tibeb</span>
          </h1>
          <p className="text-[#9a8c66] text-sm max-w-md mx-auto">
            Complete source code for the e-commerce website + admin panel. 162 files, ~168 KB compressed.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="border border-gold/30 bg-[#0f0f0f] p-8 md:p-10"
        >
          <div className="flex items-center gap-3 mb-6">
            <Package className="w-8 h-8 text-gold" />
            <div>
              <div className="font-display text-lg text-[#f5efe2]">tts-tibeb-source.zip</div>
              <div className="text-xs text-[#9a8c66]">168 KB · 162 files · ZIP archive</div>
            </div>
          </div>

          <div className="space-y-3 text-sm text-[#f5efe2]/80 mb-8">
            <div className="flex items-start gap-2">
              <Code className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
              <span>Next.js 16 + TypeScript + Tailwind + Prisma</span>
            </div>
            <div className="flex items-start gap-2">
              <Code className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
              <span>Full storefront + admin CMS + order management</span>
            </div>
            <div className="flex items-start gap-2">
              <Code className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
              <span>Gmail / WhatsApp / Telegram order-request system</span>
            </div>
            <div className="flex items-start gap-2">
              <Code className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
              <span>.env.example + README with setup instructions</span>
            </div>
          </div>

          <a
            href="/api/download"
            className="w-full inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-soft text-black font-semibold text-sm tracking-[0.2em] uppercase py-4 transition-colors"
          >
            <Download className="w-5 h-5" />
            Download Source Code
          </a>

          <p className="text-[10px] text-[#9a8c66] text-center mt-4">
            If the download doesn't start automatically, right-click the button and select &quot;Save link as...&quot;
          </p>
        </motion.div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-[#f5efe2]/70 hover:text-gold transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Back to store
          </Link>
        </div>
      </div>
    </div>
  )
}
