'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Save, Palette, Truck, CreditCard, Image as ImageIcon, Users, Loader2, X,
  Plus, Trash2, Upload, Eye, EyeOff, CheckCircle2, AlertCircle, Settings as SettingsIcon
} from 'lucide-react'
import { toast } from 'sonner'

type Section = 'theme' | 'shipping' | 'payment' | 'media' | 'admin_users'

export function AdminSettings() {
  const [section, setSection] = useState<Section>('theme')

  const tabs: { id: Section; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'theme', label: 'Theme & Colors', icon: Palette },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'media', label: 'Media Library', icon: ImageIcon },
    { id: 'admin_users', label: 'Admin Users', icon: Users }
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[#f5efe2] flex items-center gap-3">
          <SettingsIcon className="w-6 h-6 text-gold" /> Settings
        </h1>
        <p className="text-sm text-[#9a8c66] mt-1">Configure your store's appearance, shipping, payments, and admin team.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSection(t.id)}
            className={`inline-flex items-center gap-2 text-xs tracking-[0.15em] uppercase px-4 py-2 border transition-all ${
              section === t.id
                ? 'bg-gold text-black border-gold'
                : 'border-[#2a2418] text-[#f5efe2]/70 hover:border-gold/40 hover:text-gold'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <motion.div key={section} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border border-[#2a2418] bg-[#0f0f0f] p-5 md:p-7 max-w-3xl">
        {section === 'theme' && <ThemeSection />}
        {section === 'shipping' && <ShippingSection />}
        {section === 'payment' && <PaymentSection />}
        {section === 'media' && <MediaSection />}
        {section === 'admin_users' && <AdminUsersSection />}
      </motion.div>

      <style jsx global>{`
        .tt-input {
          width: 100%;
          background: #0a0a0a;
          border: 1px solid #2a2418;
          color: #f5efe2;
          padding: 0.65rem 0.9rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .tt-input:focus { border-color: #d4af37; }
        .tt-input::placeholder { color: #6b5d44; }
      `}</style>
    </div>
  )
}

// =============== THEME SECTION ===============
function ThemeSection() {
  const [theme, setTheme] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/theme', { cache: 'no-store' }).then(r => r.json()).then(d => setTheme(d.theme || {}))
  }, [])

  const colors = [
    { key: 'color.primary', label: 'Primary (Gold)' },
    { key: 'color.gold_soft', label: 'Gold Soft' },
    { key: 'color.gold_deep', label: 'Gold Deep' },
    { key: 'color.background', label: 'Background' },
    { key: 'color.foreground', label: 'Foreground Text' },
    { key: 'color.card', label: 'Card Background' },
    { key: 'color.border', label: 'Border' },
    { key: 'color.accent', label: 'Accent' }
  ]

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/theme', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: theme })
    })
    if (res.ok) {
      toast.success('Theme saved — apply by reloading the storefront')
    } else {
      toast.error('Save failed')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 p-3 border border-gold/30 bg-gold/5">
        <Palette className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[#f5efe2]/80">
          Customize your brand colors. The selected colors will override the default theme on the storefront. Use the "Reset to defaults" button to restore the original black-and-gold palette.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {colors.map(({ key, label }) => (
          <label key={key} className="block">
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#9a8c66] block mb-2">{label}</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme[key] || '#d4af37'}
                onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
                className="w-10 h-10 bg-transparent border border-[#2a2418] cursor-pointer"
              />
              <input
                value={theme[key] || ''}
                onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
                className="tt-input flex-1"
                placeholder="#d4af37"
              />
            </div>
          </label>
        ))}
      </div>

      <div>
        <span className="text-[10px] tracking-[0.2em] uppercase text-[#9a8c66] block mb-2">Background Image URL (optional)</span>
        <input
          value={theme['bg.image'] || ''}
          onChange={(e) => setTheme({ ...theme, 'bg.image': e.target.value })}
          className="tt-input"
          placeholder="https://..."
        />
      </div>

      <div className="flex justify-between gap-3 pt-3">
        <button
          onClick={() => {
            const defaults: Record<string, string> = {}
            colors.forEach(({ key }) => { defaults[key] = '' })
            defaults['bg.image'] = ''
            setTheme(defaults)
            toast.success('Reset to defaults — click Save to apply')
          }}
          className="text-xs tracking-[0.15em] uppercase text-[#f5efe2]/70 hover:text-gold"
        >
          Reset to defaults
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-gold hover:bg-gold-soft disabled:opacity-60 text-black text-xs tracking-[0.2em] uppercase px-6 py-3 font-semibold"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Theme'}
        </button>
      </div>
    </div>
  )
}

// =============== SHIPPING SECTION ===============
function ShippingSection() {
  const [content, setContent] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/content', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setContent(d.content || {}))
  }, [])

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        values: {
          'shipping.ethiopia_cost': content['shipping.ethiopia_cost'] || '200',
          'shipping.ethiopia_free_threshold': content['shipping.ethiopia_free_threshold'] || '5000',
          'shipping.international_notice': content['shipping.international_notice'] || '',
          'shipping.contact_email': content['shipping.contact_email'] || '',
          'shipping.whatsapp_number': content['shipping.whatsapp_number'] || '',
          'contact.telegram': content['contact.telegram'] || ''
        }
      })
    })
    if (res.ok) toast.success('Shipping settings saved')
    else toast.error('Save failed')
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 border border-gold/30 bg-gold/5">
        <Truck className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[#f5efe2]/80">
          Configure shipping rates for Ethiopian orders and the contact info shown to international customers.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-[10px] tracking-[0.2em] uppercase text-[#9a8c66] block mb-2">Ethiopia Shipping Cost (Br)</span>
          <input
            type="number"
            value={content['shipping.ethiopia_cost'] || ''}
            onChange={(e) => setContent({ ...content, 'shipping.ethiopia_cost': e.target.value })}
            className="tt-input"
            placeholder="200"
          />
        </label>
        <label className="block">
          <span className="text-[10px] tracking-[0.2em] uppercase text-[#9a8c66] block mb-2">Free Shipping Threshold (Br)</span>
          <input
            type="number"
            value={content['shipping.ethiopia_free_threshold'] || ''}
            onChange={(e) => setContent({ ...content, 'shipping.ethiopia_free_threshold': e.target.value })}
            className="tt-input"
            placeholder="5000"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-[10px] tracking-[0.2em] uppercase text-[#9a8c66] block mb-2">International Shipping Notice</span>
        <textarea
          value={content['shipping.international_notice'] || ''}
          onChange={(e) => setContent({ ...content, 'shipping.international_notice': e.target.value })}
          rows={3}
          className="tt-input resize-none"
          placeholder="The displayed product price does not include international shipping costs..."
        />
      </label>

      <div className="grid md:grid-cols-3 gap-4">
        <label className="block">
          <span className="text-[10px] tracking-[0.2em] uppercase text-[#9a8c66] block mb-2">WhatsApp Number</span>
          <input
            value={content['shipping.whatsapp_number'] || ''}
            onChange={(e) => setContent({ ...content, 'shipping.whatsapp_number': e.target.value })}
            className="tt-input"
            placeholder="+251911234567"
          />
        </label>
        <label className="block">
          <span className="text-[10px] tracking-[0.2em] uppercase text-[#9a8c66] block mb-2">Contact Email</span>
          <input
            value={content['shipping.contact_email'] || ''}
            onChange={(e) => setContent({ ...content, 'shipping.contact_email': e.target.value })}
            className="tt-input"
            placeholder="hello@ttstibeb.com"
          />
        </label>
        <label className="block">
          <span className="text-[10px] tracking-[0.2em] uppercase text-[#9a8c66] block mb-2">Telegram Username</span>
          <input
            value={content['contact.telegram'] || ''}
            onChange={(e) => setContent({ ...content, 'contact.telegram': e.target.value })}
            className="tt-input"
            placeholder="ttstibeb"
          />
        </label>
      </div>

      <div className="flex justify-end pt-3">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-gold hover:bg-gold-soft disabled:opacity-60 text-black text-xs tracking-[0.2em] uppercase px-6 py-3 font-semibold"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Shipping Settings'}
        </button>
      </div>
    </div>
  )
}

// =============== PAYMENT SECTION ===============
function PaymentSection() {
  const [content, setContent] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/content', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setContent(d.content || {}))
  }, [])

  const isConfigured = !!(
    process.env.NEXT_PUBLIC_ARIFPAY_CONFIGURED ||
    content['payment.arifpay_enabled'] !== 'false'
  )

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        values: {
          'payment.arifpay_enabled': content['payment.arifpay_enabled'] || 'true',
          'payment.environment': content['payment.environment'] || 'sandbox',
          'payment.currency': content['payment.currency'] || 'ETB',
          'payment.instructions': content['payment.instructions'] || ''
        }
      })
    })
    if (res.ok) toast.success('Payment settings saved')
    else toast.error('Save failed')
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className={`flex items-start gap-3 p-3 border ${isConfigured ? 'border-green-500/40 bg-green-500/5' : 'border-amber-500/40 bg-amber-500/5'}`}>
        {isConfigured ? <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5" />}
        <div className="flex-1">
          <p className="text-xs text-[#f5efe2]/80 mb-2">
            ARIF Pay is configured via environment variables on the server. Set these in your <code className="text-gold">.env</code> file:
          </p>
          <ul className="text-[10px] font-mono text-[#9a8c66] space-y-0.5">
            <li>ARIFPAY_API_KEY=•••••••••••••••••••••••</li>
            <li>ARIFPAY_SECRET=•••••••••••••••••••••••</li>
            <li>ARIFPAY_MERCHANT_ID=••••••••••••••</li>
            <li>ARIFPAY_CALLBACK_URL=https://yoursite.com/api/payments/arifpay/callback</li>
            <li>ARIFPAY_ENV=sandbox | production</li>
          </ul>
          <p className="text-[10px] text-[#9a8c66] mt-2">
            API keys are NEVER exposed to the frontend. They live only on the server.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-[10px] tracking-[0.2em] uppercase text-[#9a8c66] block mb-2">ARIF Pay Status</span>
          <select
            value={content['payment.arifpay_enabled'] || 'true'}
            onChange={(e) => setContent({ ...content, 'payment.arifpay_enabled': e.target.value })}
            className="tt-input"
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] tracking-[0.2em] uppercase text-[#9a8c66] block mb-2">Environment</span>
          <select
            value={content['payment.environment'] || 'sandbox'}
            onChange={(e) => setContent({ ...content, 'payment.environment': e.target.value })}
            className="tt-input"
          >
            <option value="sandbox">Sandbox (test)</option>
            <option value="production">Production (live)</option>
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] tracking-[0.2em] uppercase text-[#9a8c66] block mb-2">Currency</span>
          <input
            value={content['payment.currency'] || 'ETB'}
            onChange={(e) => setContent({ ...content, 'payment.currency': e.target.value })}
            className="tt-input"
            placeholder="ETB"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-[10px] tracking-[0.2em] uppercase text-[#9a8c66] block mb-2">Payment Instructions (shown to customers)</span>
        <textarea
          value={content['payment.instructions'] || ''}
          onChange={(e) => setContent({ ...content, 'payment.instructions': e.target.value })}
          rows={3}
          className="tt-input resize-none"
          placeholder="You will be redirected to ARIF Pay to complete your payment securely."
        />
      </label>

      <div className="flex justify-end pt-3">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-gold hover:bg-gold-soft disabled:opacity-60 text-black text-xs tracking-[0.2em] uppercase px-6 py-3 font-semibold"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Payment Settings'}
        </button>
      </div>
    </div>
  )
}

// =============== MEDIA LIBRARY ===============
function MediaSection() {
  const [media, setMedia] = useState<Array<{ id: string; url: string; filename: string; size: number; createdAt: string }>>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetch('/api/media', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setMedia(d.media || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const upload = async (file: File) => {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/media', { method: 'POST', body: fd })
    if (res.ok) {
      toast.success('Uploaded')
      load()
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error || 'Upload failed')
    }
    setUploading(false)
  }

  const del = async (id: string) => {
    if (!confirm('Delete this media file?')) return
    const res = await fetch(`/api/media?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Deleted')
      load()
    } else {
      toast.error('Delete failed')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 border border-gold/30 bg-gold/5">
        <ImageIcon className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[#f5efe2]/80">
          Upload images for banners, products, and content. Click any image to copy its URL. Max 5MB each — JPEG, PNG, WebP, GIF, SVG allowed.
        </p>
      </div>

      <label className="block">
        <div className="border-2 border-dashed border-[#2a2418] hover:border-gold/40 p-8 text-center cursor-pointer transition-colors">
          {uploading ? (
            <><Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-2" /><p className="text-sm text-[#f5efe2]">Uploading...</p></>
          ) : (
            <><Upload className="w-8 h-8 text-gold mx-auto mb-2" /><p className="text-sm text-[#f5efe2]">Click to upload image</p><p className="text-xs text-[#9a8c66] mt-1">or drag & drop</p></>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) upload(f)
            }}
          />
        </div>
      </label>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square skeleton-shimmer" />)}
        </div>
      ) : media.length === 0 ? (
        <p className="text-sm text-[#9a8c66] text-center py-12">No media uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {media.map((m) => (
            <div key={m.id} className="border border-[#2a2418] group relative overflow-hidden">
              <div className="aspect-square bg-[#161210]">
                <img src={m.url} alt={m.filename} className="w-full h-full object-cover" />
              </div>
              <div className="p-2">
                <div className="text-[10px] text-[#f5efe2] truncate">{m.filename}</div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + m.url)
                    toast.success('URL copied')
                  }}
                  className="text-[10px] text-gold hover:underline mt-1 block truncate text-left w-full"
                >
                  {m.url}
                </button>
              </div>
              <button
                onClick={() => del(m.id)}
                className="absolute top-1 right-1 p-1 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// =============== ADMIN USERS ===============
function AdminUsersSection() {
  const [users, setUsers] = useState<Array<{ id: string; email: string; name: string | null; role: string; createdAt: string }>>([])
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; email: string; role: string } | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'admin' })

  const load = () => {
    fetch('/api/admin-users', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        setUsers(d.users || [])
        setCurrentAdmin(d.currentAdmin)
      })
  }
  useEffect(() => { load() }, [])

  const add = async () => {
    if (!form.email || !form.password) {
      toast.error('Email and password are required')
      return
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    const res = await fetch('/api/admin-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (res.ok) {
      toast.success('Admin user added')
      setForm({ email: '', password: '', name: '', role: 'admin' })
      setShowAdd(false)
      load()
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error || 'Failed to add user')
    }
  }

  const del = async (id: string, email: string) => {
    if (!confirm(`Delete admin user "${email}"? They will lose access immediately.`)) return
    const res = await fetch(`/api/admin-users?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('User deleted')
      load()
    } else {
      toast.error('Delete failed')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 border border-gold/30 bg-gold/5">
        <Users className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[#f5efe2]/80">
          Manage administrator accounts. Only super_admin users can add or remove other admins.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs tracking-[0.2em] uppercase text-[#9a8c66]">{users.length} admin user(s)</span>
        {currentAdmin?.role === 'super_admin' && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="inline-flex items-center gap-2 bg-gold hover:bg-gold-soft text-black text-xs tracking-[0.15em] uppercase px-4 py-2 font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Add Admin
          </button>
        )}
      </div>

      {showAdd && (
        <div className="border border-gold/30 bg-[#0a0a0a] p-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="tt-input" />
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name (optional)" className="tt-input" />
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password (min 6 chars)" className="tt-input" />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="tt-input">
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="text-xs tracking-[0.15em] uppercase text-[#f5efe2]/70 hover:text-gold">Cancel</button>
            <button onClick={add} className="inline-flex items-center gap-2 bg-gold hover:bg-gold-soft text-black text-xs tracking-[0.15em] uppercase px-4 py-2 font-semibold">
              <Save className="w-3.5 h-3.5" /> Save
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="border border-[#2a2418] bg-[#0a0a0a] p-3 flex items-center justify-between">
            <div>
              <div className="text-sm text-[#f5efe2]">{u.email} {currentAdmin?.id === u.id && <span className="text-[10px] text-gold">(you)</span>}</div>
              <div className="text-[10px] text-[#9a8c66]">{u.name || '—'} · {u.role} · added {new Date(u.createdAt).toLocaleDateString()}</div>
            </div>
            {currentAdmin?.role === 'super_admin' && u.id !== currentAdmin.id && (
              <button
                onClick={() => del(u.id, u.email)}
                className="p-2 text-[#9a8c66] hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
