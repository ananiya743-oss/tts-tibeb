import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'tts-tibeb-source.zip')
    const fileBuffer = await readFile(filePath)
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="tts-tibeb-source.zip"',
        'Content-Length': fileBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache'
      }
    })
  } catch (e) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
