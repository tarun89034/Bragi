import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/database.types'

type PlayInsert = Database['public']['Tables']['plays']['Insert']

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Partial<PlayInsert> | null
  if (!body || !body.track_id || !body.track_name || !body.artist_name) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const supabase = await createClient()
  if (!supabase) {
    // Supabase not configured; gracefully ignore logging.
    return NextResponse.json({ ok: true, skipped: 'supabase_not_configured' })
  }

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()

  if (userErr) {
    return NextResponse.json({ error: userErr.message }, { status: 500 })
  }

  if (!user) {
    // Not authenticated; skip logging silently
    return NextResponse.json({ ok: true, skipped: 'unauthenticated' })
  }

  const payload: PlayInsert = {
    user_id: user.id,
    track_id: body.track_id,
    track_name: body.track_name,
    artist_name: body.artist_name,
    preview_url: body.preview_url ?? null,
    duration_ms: body.duration_ms ?? null,
    source: 'spotify',
    played_at: body.played_at,
  }

  const { error } = await supabase.from('plays').insert(payload)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
