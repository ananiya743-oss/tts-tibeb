import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdmin } from '@/lib/auth'

export async function GET() {
  // Slideshow: return ALL hero slides ordered oldest-first (so admin control order = display order)
  const heroes = await db.heroBanner.findMany({ orderBy: { createdAt: 'asc' } })
  // Backward-compat: keep "active" pointing to first active slide (legacy single-slide consumers)
  const active = heroes.find((h) => h.active) || heroes[0] || null
  const announcements = await db.announcement.findMany({ orderBy: { createdAt: 'desc' } })
  const activeAnn = await db.announcement.findFirst({ where: { active: true } })
  return NextResponse.json({ heroes, active, announcements, activeAnnouncement: activeAnn })
}

export async function POST(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { kind, data } = body

  if (kind === 'hero') {
    // Slides can coexist — multiple active slides form the slideshow.
    // No auto-deactivation of other slides.
    const hero = await db.heroBanner.create({ data: {
      headline: data.headline,
      subtitle: data.subtitle,
      imageUrl: data.imageUrl,
      ctaText: data.ctaText || 'Explore Collection',
      ctaLink: data.ctaLink || '#shop',
      active: data.active !== undefined ? !!data.active : true
    }})
    return NextResponse.json({ hero })
  }
  if (kind === 'announcement') {
    if (data.active) {
      await db.announcement.updateMany({ where: { active: true }, data: { active: false } })
    }
    const ann = await db.announcement.create({ data: {
      message: data.message,
      link: data.link || null,
      active: !!data.active
    }})
    return NextResponse.json({ announcement: ann })
  }
  return NextResponse.json({ error: 'Unknown kind' }, { status: 400 })
}

export async function PUT(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { kind, id, data } = body

  if (kind === 'hero') {
    const hero = await db.heroBanner.update({ where: { id }, data: {
      headline: data.headline,
      subtitle: data.subtitle,
      imageUrl: data.imageUrl,
      ctaText: data.ctaText,
      ctaLink: data.ctaLink,
      active: !!data.active
    }})
    return NextResponse.json({ hero })
  }
  if (kind === 'announcement') {
    if (data.active) {
      await db.announcement.updateMany({ where: { active: true, NOT: { id } }, data: { active: false } })
    }
    const ann = await db.announcement.update({ where: { id }, data: {
      message: data.message,
      link: data.link || null,
      active: !!data.active
    }})
    return NextResponse.json({ announcement: ann })
  }
  return NextResponse.json({ error: 'Unknown kind' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const kind = url.searchParams.get('kind')
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  if (kind === 'hero') await db.heroBanner.delete({ where: { id } })
  else if (kind === 'announcement') await db.announcement.delete({ where: { id } })
  else return NextResponse.json({ error: 'Unknown kind' }, { status: 400 })
  return NextResponse.json({ ok: true })
}
