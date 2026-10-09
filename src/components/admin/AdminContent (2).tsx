'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, ImageIcon, Bell, FileText, Megaphone, Plus, Edit2, Trash2, X, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

type Section = 'hero' | 'announcement' | 'about' | 'footer' | 'nav'

interface Content {
  [key: string]: string
}

interface Slide {
  id?: string
  headline: string
  subtitle: string
  imageUrl: string
  ctaText: string
  ctaLink: string
  active: boolean
}

const EMPTY_SLIDE: Slide = {
  headline: '',
  subtitle: '',
  imageUrl: '',
  ctaText: 'Explore Collection',
  ctaLink: '#shop',
  active: true
}

export function AdminContent() {
  const [section, setSection] = useState<Section>('hero')
  const [content, setContent] = useState<Content>({})
  const [slides, setSlides] = useState<Slide[]>([])
  const [editing, setEditing] = useState<Slide | null>(null)
  const [announcement, setAnnouncement] = useState({
    message: '', link: '', active: true
  })
  const [saving, setSaving] = useState(false)

  const loadHeroes = () => {
    fetch('/api/hero', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        const list: Slide[] = (d.heroes || []).map((s: any) => ({
          id: s.id,
          headline: s.headline,
          subtitle: s.subtitle,
          imageUrl: s.imageUrl,
          ctaText: s.ctaText,
          ctaLink: s.ctaLink,
          active: s.active
        }))
        setSlides(list)
        if (d.activeAnnouncement) {
          setAnnouncement({
            message: d.activeAnnouncement.message,
            link: d.activeAnnouncement.link || '',
            active: d.activeAnnouncement.active
          })
        }
      })
  }

  useEffect(() => {
    fetch('/api/content', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setContent(d.content || {}))
    loadHeroes()
  }, [])

  const saveContent = async (values: Content) => {
    setSaving(true)
    const res = await fetch('/api/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values })
    })
    if (res.ok) {
      toast.success('Content saved')
      setContent({ ...content, ...values })
    } else {
      toast.error('Save failed')
    }
    setSaving(false)
  }

  const saveSlide = async () => {
    if (!editing) return
    if (!editing.headline || !editing.imageUrl) {
      toast.error('Headline and image URL are required')
      return
    }
    setSaving(true)
    const isEdit = !!editing.id
    const res = await fetch('/api/hero', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'hero',
        ...(isEdit ? { id: editing.id } : {}),
        data: {
          headline: editing.headline,
          subtitle: editing.subtitle,
          imageUrl: editing.imageUrl,
          ctaText: editing.ctaText,
          ctaLink: editing.ctaLink,
          active: editing.active
        }
      })
    })
    if (res.ok) {
      toast.success(isEdit ? 'Slide updated' : 'Slide added')
      setEditing(null)
      loadHeroes()
    } else {
      toast.error('Save failed')
    }
    setSaving(false)
  }

  const toggleSlideVisibility = async (s: Slide) => {
    if (!s.id) return
    const res = await fetch('/api/hero', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'hero',
        id: s.id,
        data: { ...s, active: !s.active }
      })
    })
    if (res.ok) {
      toast.success(`Slide ${!s.active ? 'shown' : 'hidden'}`)
      loadHeroes()
    } else {
      toast.error('Failed to update')
    }
  }

  const deleteSlide = async (s: Slide) => {
    if (!s.id) return
    if (!confirm(`Delete this slide? This cannot be undone.`)) return
    const res = await fetch(`/api/hero?kind=hero&id=${s.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Slide deleted')
      loadHeroes()
    } else {
      toast.error('Failed to delete')
    }
  }

  const saveAnnouncement = async () => {
    setSaving(true)
    const res = await fetch('/api/hero', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'announcement', data: announcement })
    })
    if (res.ok) {
      toast.success('Announcement saved')
    } else {
      toast.error('Save failed')
    }
    setSaving(false)
  }

  const tabs: { id: Section; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'hero', label: 'Hero Banner', icon: ImageIcon },
    { id: 'announcement', label: 'Announcement', icon: Megaphone },
    { id: 'about', label: 'About Page', icon: FileText },
    { id: 'footer', label: 'Footer / Contact', icon: FileText },
    { id: 'nav', label: 'Navigation', icon: Bell }
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[#f5efe2]">Site Content</h1>
        <p className="text-sm text-[#9a8c66] mt-1">Edit your storefront content live — changes appear instantly.</p>
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

      <motion.div
        key={section}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-[#2a2418] bg-[#0f0f0f] p-5 md:p-7 max-w-3xl"
      >
        {section === 'hero' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 border border-gold/30 bg-gold/5">
              <ImageIcon className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[#f5efe2]/80">
                All visible slides form the homepage slideshow, auto-rotating every 6.5 seconds. Add multiple slides to create a dynamic hero. Hide a slide anytime without deleting it.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs tracking-[0.2em] uppercase text-[#9a8c66]">
                {slides.length} slide{slides.length === 1 ? '' : 's'} · {slides.filter(s => s.active).length} visible
              </span>
              <button
                onClick={() => setEditing({ ...EMPTY_SLIDE })}
                className="inline-flex items-center gap-2 bg-gold hover:bg-gold-soft text-black text-xs tracking-[0.15em] uppercase px-4 py-2 font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Slide
              </button>
            </div>

            {slides.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-[#2a2418]">
                <ImageIcon className="w-8 h-8 text-[#2a2418] mx-auto mb-3" />
                <p className="text-sm text-[#9a8c66]">No slides yet. Click &quot;Add Slide&quot; to create your first.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {slides.map((s, i) => (
                  <div
                    key={s.id || i}
                    className={`flex gap-4 p-3 border transition-all ${
                      s.active ? 'border-[#2a2418] bg-[#0a0a0a]' : 'border-[#2a2418] bg-[#0a0a0a]/50 opacity-60'
                    }`}
                  >
                    <div className="w-24 h-16 bg-[#161210] flex-shrink-0 overflow-hidden relative">
                      {s.imageUrl ? (
                        <img src={s.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-[#9a8c66]">No image</div>
                      )}
                      <span className="absolute top-1 left-1 bg-[#0a0a0a]/80 text-gold text-[9px] font-bold w-5 h-5 flex items-center justify-center">
                        {i + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[#f5efe2] font-medium line-clamp-1">{s.headline || '(no headline)'}</div>
                      <div className="text-xs text-[#9a8c66] line-clamp-1 mt-0.5">{s.subtitle || '(no subtitle)'}</div>
                      <div className="text-[10px] tracking-[0.15em] uppercase text-[#9a8c66] mt-1">
                        {s.ctaText || 'Explore'} → {s.ctaLink || '#shop'}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => toggleSlideVisibility(s)}
                        className={`p-1.5 border transition-colors ${
                          s.active
                            ? 'text-gold border-gold/40 hover:bg-gold hover:text-black'
                            : 'text-[#9a8c66] border-[#2a2418] hover:text-gold hover:border-gold/40'
                        }`}
                        title={s.active ? 'Hide slide' : 'Show slide'}
                      >
                        {s.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => setEditing({ ...s })}
                        className="p-1.5 border border-[#2a2418] hover:border-gold/40 text-[#f5efe2]/80 hover:text-gold transition-colors"
                        title="Edit slide"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteSlide(s)}
                        className="p-1.5 border border-[#2a2418] hover:border-red-500/40 text-[#f5efe2]/80 hover:text-red-400 transition-colors"
                        title="Delete slide"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Slide Editor Modal */}
            <AnimatePresence>
              {editing && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setEditing(null)}
                    className="fixed inset-0 bg-black/70 z-50"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                    className="fixed inset-0 z-50 overflow-y-auto"
                  >
                    <div className="min-h-full flex items-start justify-center p-4 md:p-8">
                      <div className="bg-[#0d0d0d] border border-[#2a2418] w-full max-w-2xl my-8">
                        <div className="flex items-center justify-between p-5 border-b border-[#2a2418] sticky top-0 bg-[#0d0d0d] z-10">
                          <h3 className="font-display text-lg text-[#f5efe2] flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-gold" />
                            {editing.id ? 'Edit Slide' : 'New Slide'}
                          </h3>
                          <button onClick={() => setEditing(null)} className="text-[#f5efe2]/70 hover:text-gold">
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="p-5 md:p-6 space-y-4">
                          <Field label="Headline *">
                            <input
                              value={editing.headline}
                              onChange={(e) => setEditing({ ...editing, headline: e.target.value })}
                              className="tt-input"
                              placeholder="Woven Heritage. Modern Elegance."
                            />
                            <p className="text-[10px] text-[#9a8c66] mt-1">
                              The last two words get the gold gradient treatment automatically.
                            </p>
                          </Field>
                          <Field label="Subtitle">
                            <textarea
                              value={editing.subtitle}
                              onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
                              rows={2}
                              className="tt-input resize-none"
                              placeholder="Authentic Habesha traditional wear — handwoven in Ethiopia."
                            />
                          </Field>
                          <Field label="Background Image URL *">
                            <input
                              value={editing.imageUrl}
                              onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })}
                              className="tt-input"
                              placeholder="https://..."
                            />
                          </Field>
                          {editing.imageUrl && (
                            <div className="w-full h-40 bg-[#161210] overflow-hidden border border-[#2a2418]">
                              <img src={editing.imageUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            <Field label="CTA Text">
                              <input
                                value={editing.ctaText}
                                onChange={(e) => setEditing({ ...editing, ctaText: e.target.value })}
                                className="tt-input"
                                placeholder="Explore Collection"
                              />
                            </Field>
                            <Field label="CTA Link">
                              <input
                                value={editing.ctaLink}
                                onChange={(e) => setEditing({ ...editing, ctaLink: e.target.value })}
                                className="tt-input"
                                placeholder="#shop"
                              />
                            </Field>
                          </div>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editing.active}
                              onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                              className="w-4 h-4 accent-[#d4af37]"
                            />
                            <span className="text-sm text-[#f5efe2]">Visible in slideshow</span>
                          </label>
                        </div>

                        <div className="p-5 border-t border-[#2a2418] flex justify-end gap-3 sticky bottom-0 bg-[#0d0d0d]">
                          <button
                            onClick={() => setEditing(null)}
                            className="px-5 py-2.5 text-sm tracking-[0.15em] uppercase text-[#f5efe2]/70 hover:text-gold transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={saveSlide}
                            disabled={saving}
                            className="inline-flex items-center gap-2 bg-gold hover:bg-gold-soft disabled:opacity-60 text-black text-xs tracking-[0.2em] uppercase px-6 py-3 font-semibold transition-colors"
                          >
                            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Slide'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}


        {section === 'announcement' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 border border-gold/30 bg-gold/5">
              <Bell className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[#f5efe2]/80">
                The announcement bar appears at the very top of every store page. Only one announcement can be active at a time — saving a new active announcement will deactivate the previous one.
              </p>
            </div>
            <Field label="Announcement Message">
              <textarea
                value={announcement.message}
                onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                rows={2}
                className="tt-input resize-none"
                placeholder="Handwoven in Addis Ababa — delivered nationwide across Ethiopia"
              />
            </Field>
            <Field label="Optional Link URL">
              <input
                value={announcement.link}
                onChange={(e) => setAnnouncement({ ...announcement, link: e.target.value })}
                className="tt-input"
                placeholder="#shop"
              />
            </Field>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={announcement.active}
                onChange={(e) => setAnnouncement({ ...announcement, active: e.target.checked })}
                className="w-4 h-4 accent-[#d4af37]"
              />
              <span className="text-sm text-[#f5efe2]">Active (shown site-wide)</span>
            </label>
            <SaveBar onSave={saveAnnouncement} saving={saving} />
          </div>
        )}

        {section === 'about' && (
          <div className="space-y-4">
            <Field label="About Title">
              <input
                value={content['about.title'] || ''}
                onChange={(e) => setContent({ ...content, 'about.title': e.target.value })}
                className="tt-input"
                placeholder="Our Story"
              />
            </Field>
            <Field label="About Body">
              <textarea
                value={content['about.body'] || ''}
                onChange={(e) => setContent({ ...content, 'about.body': e.target.value })}
                rows={8}
                className="tt-input resize-none"
              />
            </Field>
            <Field label="About Image URL">
              <input
                value={content['about.image'] || ''}
                onChange={(e) => setContent({ ...content, 'about.image': e.target.value })}
                className="tt-input"
              />
            </Field>
            {content['about.image'] && (
              <div className="w-full h-40 bg-[#161210] overflow-hidden border border-[#2a2418]">
                <img src={content['about.image']} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <SaveBar onSave={() => saveContent({
              'about.title': content['about.title'] || '',
              'about.body': content['about.body'] || '',
              'about.image': content['about.image'] || ''
            })} saving={saving} />
          </div>
        )}

        {section === 'footer' && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Address">
                <input
                  value={content['footer.address'] || ''}
                  onChange={(e) => setContent({ ...content, 'footer.address': e.target.value })}
                  className="tt-input"
                />
              </Field>
              <Field label="Phone">
                <input
                  value={content['footer.phone'] || ''}
                  onChange={(e) => setContent({ ...content, 'footer.phone': e.target.value })}
                  className="tt-input"
                />
              </Field>
              <Field label="Email">
                <input
                  value={content['footer.email'] || ''}
                  onChange={(e) => setContent({ ...content, 'footer.email': e.target.value })}
                  className="tt-input"
                />
              </Field>
              <Field label="Copyright Text">
                <input
                  value={content['footer.copyright'] || ''}
                  onChange={(e) => setContent({ ...content, 'footer.copyright': e.target.value })}
                  className="tt-input"
                />
              </Field>
              <Field label="Instagram URL">
                <input
                  value={content['footer.instagram'] || ''}
                  onChange={(e) => setContent({ ...content, 'footer.instagram': e.target.value })}
                  className="tt-input"
                />
              </Field>
              <Field label="Facebook URL">
                <input
                  value={content['footer.facebook'] || ''}
                  onChange={(e) => setContent({ ...content, 'footer.facebook': e.target.value })}
                  className="tt-input"
                />
              </Field>
              <Field label="TikTok URL">
                <input
                  value={content['footer.tiktok'] || ''}
                  onChange={(e) => setContent({ ...content, 'footer.tiktok': e.target.value })}
                  className="tt-input"
                />
              </Field>
              <Field label="Business Email (for order requests)">
                <input
                  value={content['contact.email'] || ''}
                  onChange={(e) => setContent({ ...content, 'contact.email': e.target.value })}
                  className="tt-input"
                  placeholder="hello@ttstibeb.com"
                />
              </Field>
              <Field label="WhatsApp Number (for order requests)">
                <input
                  value={content['contact.whatsapp'] || ''}
                  onChange={(e) => setContent({ ...content, 'contact.whatsapp': e.target.value })}
                  className="tt-input"
                  placeholder="+251911234567"
                />
              </Field>
              <Field label="Telegram Username (for order requests)">
                <input
                  value={content['contact.telegram'] || ''}
                  onChange={(e) => setContent({ ...content, 'contact.telegram': e.target.value })}
                  className="tt-input"
                  placeholder="ttstibeb"
                />
              </Field>
            </div>
            <SaveBar onSave={() => saveContent({
              'footer.address': content['footer.address'] || '',
              'footer.phone': content['footer.phone'] || '',
              'footer.email': content['footer.email'] || '',
              'footer.copyright': content['footer.copyright'] || '',
              'footer.instagram': content['footer.instagram'] || '',
              'footer.facebook': content['footer.facebook'] || '',
              'footer.tiktok': content['footer.tiktok'] || '',
              'contact.email': content['contact.email'] || '',
              'contact.whatsapp': content['contact.whatsapp'] || '',
              'contact.telegram': content['contact.telegram'] || ''
            })} saving={saving} />
          </div>
        )}

        {section === 'nav' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 border border-gold/30 bg-gold/5">
              <Bell className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[#f5efe2]/80">
                Edit the navigation menu as JSON. Each item has <code className="text-gold">{`{ label, href }`}</code>. Hrefs can be anchors like <code className="text-gold">#shop</code>.
              </p>
            </div>
            <Field label="Navigation Menu (JSON)">
              <textarea
                value={content['nav.menu'] || ''}
                onChange={(e) => setContent({ ...content, 'nav.menu': e.target.value })}
                rows={10}
                className="tt-input resize-none font-mono text-xs"
              />
            </Field>
            <SaveBar onSave={() => saveContent({ 'nav.menu': content['nav.menu'] || '[]' })} saving={saving} />
          </div>
        )}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] tracking-[0.2em] uppercase text-[#9a8c66] block mb-1.5">{label}</span>
      {children}
    </label>
  )
}

function SaveBar({ onSave, saving }: { onSave: () => void; saving: boolean }) {
  return (
    <div className="pt-3 flex justify-end">
      <button
        onClick={onSave}
        disabled={saving}
        className="inline-flex items-center gap-2 bg-gold hover:bg-gold-soft disabled:opacity-60 text-black text-xs tracking-[0.2em] uppercase px-6 py-3 font-semibold transition-colors"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}
