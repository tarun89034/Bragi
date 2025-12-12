import { NextResponse } from 'next/server'
import { spotifyConfigured } from '@/lib/spotify/server'

export async function GET() {
  const configured = spotifyConfigured()
  return NextResponse.json({ configured }, { status: 200 })
}
