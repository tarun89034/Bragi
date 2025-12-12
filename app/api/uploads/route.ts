import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase not configured. Upload feature is unavailable.' },
      { status: 501 }
    )
  }

  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 })
  const user = userData.user
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  }

  // NOTE: Requires a pre-created storage bucket "user-songs" with appropriate RLS.
  const path = `${user.id}/${Date.now()}-${file.name}`

  const { data, error } = await supabase.storage.from('user-songs').upload(path, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Try to create a signed URL for download preview
  const { data: signed, error: signedErr } = await supabase.storage
    .from('user-songs')
    .createSignedUrl(data.path, 60 * 60) // 1 hour

  const signedUrl = signed?.signedUrl ?? null

  return NextResponse.json({ path: data.path, signedUrl })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase not configured. Delete feature is unavailable.' },
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
  if (!path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase.storage.from('user-songs').remove([path])
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
