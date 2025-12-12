import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { spotifyConfigured, spotifyGet, type SimplifiedTrack } from '@/lib/spotify/server'
import { SAMPLE_TRACKS } from '@/lib/spotify/sample'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  if (!supabase) {
    // Without Supabase config, we can't authenticate -> treat as unauthenticated
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr) {
    return NextResponse.json({ error: userErr.message }, { status: 500 })
  }
  const user = userData.user
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // If Spotify is not configured, return sample tracks rather than 501
  if (!spotifyConfigured()) {
    const tracks: SimplifiedTrack[] = SAMPLE_TRACKS
    return NextResponse.json({ tracks }, { status: 200 })
  }

  try {
    // Use recent plays as seeds if available
    const { data: plays, error: playsErr } = await supabase
      .from('plays')
      .select('track_id')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
      .limit(50)

    if (playsErr) {
      return NextResponse.json({ error: playsErr.message }, { status: 500 })
    }

    const seedTracks = Array.from(new Set((plays ?? []).map((p) => p.track_id))).slice(0, 5)

    let tracks: SimplifiedTrack[] = []
    if (seedTracks.length > 0) {
      const data = await spotifyGet('recommendations', {
        seed_tracks: seedTracks.join(','),
        limit: 12,
      })
      const items = (data?.tracks ?? []) as any[]
      tracks = items.map((t) => ({
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
    }

    // Fallback to genre-based recommendations if no seeds
    if (tracks.length === 0) {
      const data = await spotifyGet('recommendations', {
        seed_genres: 'pop',
        limit: 12,
      })
      const items = (data?.tracks ?? []) as any[]
      tracks = items.map((t) => ({
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
    }

    return NextResponse.json({ tracks })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    const isNetwork = /ECONNRESET|ETIMEDOUT|UND_|EAI_AGAIN|ENOTFOUND|fetch failed|network/i.test(msg)
    return NextResponse.json({ error: msg }, { status: isNetwork ? 502 : 500 })
  }
}
