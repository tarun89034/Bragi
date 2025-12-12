import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SimplifiedTrack, spotifyConfigured, spotifyGet } from '@/lib/spotify/server'
import { SAMPLE_TRACKS } from '@/lib/spotify/sample'

type Body = {
  mode?: 'random' | 'for_you'
  limit?: number
}

const GENRES = [
  'pop', 'rock', 'hip-hop', 'electronic', 'dance', 'indie', 'jazz', 'classical',
  'country', 'r-n-b', 'soul', 'k-pop', 'metal', 'punk', 'folk', 'blues', 'latin'
]

function pickGenres(n: number) {
  const copy = [...GENRES]
  const out: string[] = []
  while (out.length < n && copy.length) {
    const idx = Math.floor(Math.random() * copy.length)
    out.push(copy.splice(idx, 1)[0]!)
  }
  return out
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Body
  const mode = body.mode ?? 'random'
  const limit = Math.min(Math.max(Number(body.limit ?? 10), 1), 10)

  // If Spotify isn't configured, return sample tracks immediately with 200
  if (!spotifyConfigured()) {
    const tracks: SimplifiedTrack[] = SAMPLE_TRACKS.slice(0, Math.min(limit, SAMPLE_TRACKS.length))
    return NextResponse.json({ tracks, remaining: 3 }, { status: 200 })
  }

  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase not configured. AI playlist feature is unavailable.' },
      { status: 501 }
    )
  }

  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 })
  const user = userData.user
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Enforce 3/day limit
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const { count, error: countErr } = await supabase
    .from('ai_playlist_requests')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStart.toISOString())
    .eq('user_id', user.id)
  if (countErr) {
    return NextResponse.json({ error: countErr.message }, { status: 500 })
  }
  const used = count ?? 0
  const remaining = Math.max(3 - used, 0)
  if (remaining <= 0) {
    return NextResponse.json(
      { error: 'Daily AI playlist limit reached (max 3 per day).', remaining },
      { status: 429 }
    )
  }

  // Record request
  const { error: insErr } = await supabase.from('ai_playlist_requests').insert({ user_id: user.id })
  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 })
  }

  // Build seeds
  let tracks: SimplifiedTrack[] = []
  try {
    if (mode === 'for_you') {
      // Pull recent plays and seed with top track_ids
      const { data: plays, error: playsErr } = await supabase
        .from('plays')
        .select('track_id')
        .eq('user_id', user.id)
        .order('played_at', { ascending: false })
        .limit(50)

      if (playsErr) {
        return NextResponse.json({ error: playsErr.message }, { status: 500 })
      }

      const seedTracks = Array.from(
        new Set((plays ?? []).map((p) => p.track_id))
      ).slice(0, 5)

      if (seedTracks.length > 0) {
        const data = await spotifyGet('recommendations', {
          seed_tracks: seedTracks.join(','),
          limit,
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
    }

    // Fallback to random if "for_you" had no seeds or mode is random
    if (tracks.length === 0) {
      const seeds = pickGenres(2).join(',')
      const data = await spotifyGet('recommendations', {
        seed_genres: seeds,
        limit,
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

    return NextResponse.json({ tracks, remaining: Math.max(3 - (used + 1), 0) })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
