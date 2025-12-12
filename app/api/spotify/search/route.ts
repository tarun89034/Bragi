import { NextRequest, NextResponse } from 'next/server'
import { SimplifiedTrack, spotifyConfigured, spotifyGet } from '@/lib/spotify/server'
import { SAMPLE_TRACKS } from '@/lib/spotify/sample'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  const limit = Number(searchParams.get('limit') || 12)

  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter q' }, { status: 400 })
  }

  // If Spotify is not configured, return filtered sample tracks with 200
  if (!spotifyConfigured()) {
    const qLower = q.toLowerCase()
    const filtered: SimplifiedTrack[] = SAMPLE_TRACKS.filter(
      (t) =>
        t.name.toLowerCase().includes(qLower) ||
        t.artists.toLowerCase().includes(qLower) ||
        t.album.toLowerCase().includes(qLower)
    ).slice(0, Math.max(1, Math.min(limit, SAMPLE_TRACKS.length)))

    return NextResponse.json({ tracks: filtered }, { status: 200 })
  }

  try {
    const data = await spotifyGet('search', {
      q,
      type: 'track',
      limit,
    })

    const items = (data?.tracks?.items ?? []) as any[]
    const tracks: SimplifiedTrack[] = items.map((t) => ({
      id: t.id,
      name: t.name,
      artists: (t.artists || []).map((a: any) => a.name).join(', '),
      preview_url: t.preview_url,
      duration_ms: t.duration_ms,
      image:
        (t.album?.images?.[1] || t.album?.images?.[0] || t.album?.images?.[2] || null)?.url ??
        null,
      album: t.album?.name ?? '',
    }))

    return NextResponse.json({ tracks })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    const isNetwork = /ECONNRESET|ETIMEDOUT|UND_|EAI_AGAIN|ENOTFOUND|fetch failed|network/i.test(
      msg
    )
    return NextResponse.json({ error: msg }, { status: isNetwork ? 502 : 500 })
  }
}
