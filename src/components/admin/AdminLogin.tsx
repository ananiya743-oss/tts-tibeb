'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Mail, ArrowRight, ArrowLeft, Shield } from 'lucide-react'
import { toast } from 'sonner'

export function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed')
      } else {
        toast.success('Welcome back, ' + (data.admin?.name || 'Admin'))
        onLogin()
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 mb-4 rounded-full border border-gold/30 bg-gold/5">
            <Shield className="w-6 h-6 text-gold" />
          </div>
          <h1 className="font-display text-3xl font-bold text-gold-gradient tracking-wide">TT&apos;S TIBEB</h1>
          <p className="text-xs tracking-[0.3em] uppercase text-[#9a8c66] mt-2">Admin Portal</p>
        </div>

        <form onSubmit={submit} className="border border-[#2a2418] bg-[#0f0f0f] p-7 md:p-8 space-y-5">
          {error && (
            <div className="border border-red-500/40 bg-red-500/10 text-red-300 text-sm p-3">
              {error}
            </div>
          )}

          <label className="block">
            <span className="text-xs tracking-[0.2em] uppercase text-[#9a8c66] block mb-2">Email</span>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a8c66]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#2a2418] focus:border-gold pl-10 pr-4 py-3 text-sm text-[#f5efe2] outline-none transition-colors"
                placeholder="admin@ttstibeb.com"
                required
                autoComplete="username"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs tracking-[0.2em] uppercase text-[#9a8c66] block mb-2">Password</span>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a8c66]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#2a2418] focus:border-gold pl-10 pr-4 py-3 text-sm text-[#f5efe2] outline-none transition-colors"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold hover:bg-gold-soft disabled:opacity-60 text-black font-semibold text-sm tracking-[0.2em] uppercase py-3.5 flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>

          <div className="text-center pt-3">
            <p className="text-[10px] text-[#9a8c66] tracking-wide">
              Protected area · All actions are logged
            </p>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { window.location.hash = '' }}
            className="inline-flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-[#f5efe2]/70 hover:text-gold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to store
          </button>
        </div>

        <div className="mt-6 text-center text-[10px] text-[#9a8c66] border border-[#2a2418] p-3 bg-[#0f0f0f]/50">
          <p className="font-semibold text-[#9a8c66] tracking-[0.2em] uppercase mb-1">Demo Credentials</p>
          <p>admin@ttstibeb.com / Admin123</p>
        </div>
      </motion.div>
    </div>
  )
}
