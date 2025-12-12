import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase not configured. List feature is unavailable.' },
      { status: 501 }
    )
  }

  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 })
  const user = userData.user
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const prefix = `${user.id}/`
  const { data, error } = await supabase.storage.from('user-songs').list(prefix, {
    limit: 100,
    offset: 0,
    sortBy: { column: 'updated_at', order: 'desc' },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const files = (data ?? []).map((f) => ({
    name: f.name,
    path: `${prefix}${f.name}`,
    updated_at: (f as any).updated_at as string | undefined,
    size: (f as any).metadata?.size as number | undefined,
    contentType: (f as any).metadata?.mimetype as string | undefined,
  }))

  return NextResponse.json({ files })
}
