import { NextRequest, NextResponse } from 'next/server'
import { notConfiguredResponse, SimplifiedTrack, spotifyConfigured, spotifyGet } from '@/lib/spotify/server'
import { SAMPLE_TRACKS } from '@/lib/spotify/sample'

export async function GET(req: NextRequest) {
  // If Spotify isn't configured, return sample tracks with 200 to avoid noisy 501s
  if (!spotifyConfigured()) {
    const limit = Number(new URL(req.url).searchParams.get('limit') || 12)
    const tracks: SimplifiedTrack[] = SAMPLE_TRACKS.slice(0, Math.max(1, Math.min(limit, SAMPLE_TRACKS.length)))
    return NextResponse.json({ tracks }, { status: 200 })
  }

  const { searchParams } = new URL(req.url)
  const genre = searchParams.get('genre') || 'pop'
  const limit = Number(searchParams.get('limit') || 12)

  try {
    const data = await spotifyGet('recommendations', {
      seed_genres: genre,
      limit,
    })

    const items = (data?.tracks ?? []) as any[]
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
