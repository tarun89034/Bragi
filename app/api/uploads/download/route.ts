import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase not configured. Download feature is unavailable.' },
      { status: 501 }
    )
  }

  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 })
  const user = userData.user
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 })

  // Ensure user only accesses own path
  if (!path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

  const { data, error } = await supabase.storage
    .from('user-songs')
    .createSignedUrl(path, 60 * 60)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ url: data.signedUrl })
}
