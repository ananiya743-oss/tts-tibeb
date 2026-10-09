import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdmin } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import crypto from 'crypto'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']

export async function GET() {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const media = await db.media.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })
  return NextResponse.json({ media })
}

export async function POST(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: `File type ${file.type} not allowed` }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
  }

  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }

  // Generate safe filename
  const ext = path.extname(file.name).toLowerCase().slice(0, 8) || '.jpg'
  const safeName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`
  const filePath = path.join(UPLOAD_DIR, safeName)
  const bytes = await file.arrayBuffer()
  await writeFile(filePath, Buffer.from(bytes))

  const url = `/uploads/${safeName}`
  const media = await db.media.create({
    data: {
      filename: file.name.slice(0, 200),
      url,
      mime: file.type,
      size: file.size,
      alt: formData.get('alt') as string || null
    }
  })

  return NextResponse.json({ media })
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const media = await db.media.findUnique({ where: { id } })
  if (media) {
    // Optionally delete file from disk
    const filePath = path.join(process.cwd(), 'public', media.url.replace(/^\//, ''))
    try {
      const { unlink } = await import('fs/promises')
      if (existsSync(filePath)) await unlink(filePath)
    } catch {}
    await db.media.delete({ where: { id } })
  }
  return NextResponse.json({ ok: true })
}
