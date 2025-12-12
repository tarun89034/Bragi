import { NextResponse } from 'next/server'

type SpotifyToken = {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
}

let cachedAccessToken: string | null = null
let cachedExpiresAt = 0

export function spotifyConfigured(): boolean {
  return Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET)
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

function isRetriableStatus(status: number) {
  return status === 429 || (status >= 500 && status <= 599)
}

function isRetriableError(err: unknown) {
  const code =
    typeof err === 'object' && err !== null && 'code' in err ? String((err as any).code) : ''
  // Common transient/network errors
  return /^(ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|ECONNREFUSED|EPIPE|UND_)/.test(code)
}

async function fetchWithRetry(
  input: string | URL | Request,
  init: RequestInit & { timeoutMs?: number } = {},
  maxAttempts = 3
): Promise<Response> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), init.timeoutMs ?? 15000)
    try {
      const res = await fetch(input, {
        ...init,
        signal: controller.signal,
        cache: 'no-store',
      })
      clearTimeout(timeout)
      if (!res.ok && isRetriableStatus(res.status) && attempt < maxAttempts) {
        const backoff = 250 * Math.pow(2, attempt - 1) + Math.random() * 150
        await sleep(backoff)
        continue
      }
      return res
    } catch (err) {
      clearTimeout(timeout)
      lastError = err
      if (attempt < maxAttempts && isRetriableError(err)) {
        const backoff = 300 * Math.pow(2, attempt - 1) + Math.random() * 200
        await sleep(backoff)
        continue
      }
      throw err
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Unknown fetch error')
}

async function fetchAppAccessToken(): Promise<string> {
  if (!spotifyConfigured()) {
    throw new Error('Spotify environment variables are not configured.')
  }
  const now = Date.now()
  if (cachedAccessToken && now < cachedExpiresAt - 15_000) {
    return cachedAccessToken
  }
  const clientId = process.env.SPOTIFY_CLIENT_ID as string
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET as string
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetchWithRetry('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
    }),
    timeoutMs: 15000,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Failed to obtain Spotify token: ${res.status} ${text}`)
  }

  const data = (await res.json()) as SpotifyToken
  cachedAccessToken = data.access_token
  cachedExpiresAt = Date.now() + data.expires_in * 1000
  return cachedAccessToken
}

export async function spotifyGet(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
) {
  const token = await fetchAppAccessToken()
  const url = new URL(`https://api.spotify.com/v1/${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v))
    })
  }
  const res = await fetchWithRetry(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    timeoutMs: 15000,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Spotify API error: ${res.status} ${text}`)
  }
  return res.json()
}

export function notConfiguredResponse() {
  return NextResponse.json(
    { error: 'Spotify API not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.' },
    { status: 501 }
  )
}

export type SimplifiedTrack = {
  id: string
  name: string
  artists: string
  preview_url: string | null
  duration_ms: number
  image: string | null
  album: string
}
