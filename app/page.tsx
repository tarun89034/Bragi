'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import LandingHeader from "./components/LandingHeader";
import TrackCard, { type Track } from "./components/TrackCard";
import LandingFooter from "./components/LandingFooter";
import { PlayerProvider } from "./components/player/PlayerProvider";
import PlayerBar from "./components/PlayerBar";
import UploadPanel from "./components/UploadPanel";

type ApiTrack = {
  id: string;
  name: string;
  artists: string;
  preview_url: string | null;
  duration_ms: number;
  image: string | null;
  album: string;
};

const fallbackTrending: Track[] = [
  {
    id: "1",
    title: "Night Drive",
    artist: "Neon Ghost",
    coverUrl:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1200&auto=format&fit=crop",
    plays: "1.2M",
    audioUrl: null,
    source: "spotify",
  },
  {
    id: "2",
    title: "Ocean Eyes (Remix)",
    artist: "Waveform",
    coverUrl:
      "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=1200&auto=format&fit=crop",
    plays: "932K",
    audioUrl: null,
    source: "spotify",
  },
  {
    id: "3",
    title: "Golden Hour",
    artist: "Sunset Blvd",
    coverUrl:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop",
    plays: "789K",
    audioUrl: null,
    source: "spotify",
  },
  {
    id: "4",
    title: "Midnight City Lights",
    artist: "Analog Youth",
    coverUrl:
      "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?q=80&w=1200&auto=format&fit=crop",
    plays: "652K",
    audioUrl: null,
    source: "spotify",
  },
  {
    id: "5",
    title: "Low Tide",
    artist: "Coral Club",
    coverUrl:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=1200&auto=format&fit=crop",
    plays: "501K",
    audioUrl: null,
    source: "spotify",
  },
  {
    id: "6",
    title: "Echoes",
    artist: "City Trails",
    coverUrl:
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=1200&auto=format&fit=crop",
    plays: "473K",
    audioUrl: null,
    source: "spotify",
  },
  {
    id: "7",
    title: "Afterglow",
    artist: "Aurora Sky",
    coverUrl:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop",
    plays: "421K",
    audioUrl: null,
    source: "spotify",
  },
  {
    id: "8",
    title: "Pulse",
    artist: "Metroline",
    coverUrl:
      "https://images.unsplash.com/photo-1516280030429-27679b3dc9cf?q=80&w=1200&auto=format&fit=crop",
    plays: "389K",
    audioUrl: null,
    source: "spotify",
  },
];

function mapApiTrack(t: ApiTrack): Track {
  return {
    id: t.id,
    title: t.name,
    artist: t.artists,
    coverUrl:
      t.image ??
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1200&auto=format&fit=crop",
    audioUrl: t.preview_url,
    durationMs: t.duration_ms,
    source: "spotify",
  };
}

export default function Home() {
  const [trending, setTrending] = useState<Track[]>([]);
  const [forYou, setForYou] = useState<Track[]>([]);
  const [aiPicks, setAiPicks] = useState<Track[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingForYou, setLoadingForYou] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forYouError, setForYouError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState<boolean>(false);
  const [spotifyIsConfigured, setSpotifyIsConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchStatus() {
      try {
        const res = await fetch("/api/spotify/status", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { configured: boolean };
        if (active) {
          setSpotifyIsConfigured(data.configured);
          if (!data.configured) {
            setErrorMsg("Spotify API not configured. Showing sample tracks.");
          }
        }
      } catch {
        // ignore
      }
    }

    async function fetchFeatured() {
      setLoadingTrending(true);
      setErrorMsg(null);
      try {
        const res = await fetch(`/api/spotify/featured?limit=12`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error || `Failed to load featured tracks (${res.status}).`);
        }

        const data = (await res.json()) as { tracks: ApiTrack[] };
        const mapped = (data.tracks || []).map(mapApiTrack);
        if (active) {
          setTrending(mapped);
        }
      } catch (err: unknown) {
        if (active) {
          setTrending(fallbackTrending);
          const msg = err instanceof Error ? err.message : "Unknown error fetching tracks.";
          setErrorMsg(msg);
        }
      } finally {
        if (active) setLoadingTrending(false);
      }
    }

    fetchStatus().catch(() => {});
    fetchFeatured();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function fetchForYou() {
      setLoadingForYou(true);
      setForYouError(null);
      try {
        const res = await fetch("/api/spotify/for-you", { cache: "no-store" });
        if (res.status === 401) {
          if (active) {
            setIsAuthed(false);
            setForYou([]);
          }
          return;
        }
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error || `Failed to load recommendations (${res.status})`);
        }
        const data = (await res.json()) as { tracks: ApiTrack[] };
        const mapped = (data.tracks || []).map(mapApiTrack);
        if (active) {
          setIsAuthed(true);
          setForYou(mapped);
        }
      } catch (err: unknown) {
        if (active) {
          const msg = err instanceof Error ? err.message : "Unknown error fetching recommendations.";
          setForYouError(msg);
        }
      } finally {
        if (active) setLoadingForYou(false);
      }
    }

    async function fetchAiPicks() {
      setLoadingAi(true);
      setAiError(null);
      try {
        const res = await fetch("/api/ai/playlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "random", limit: 10 }),
        });
        if (!res.ok) {
          // Fallback gracefully
          const r2 = await fetch(`/api/spotify/featured?limit=12`);
          if (r2.ok) {
            const d2 = (await r2.json()) as { tracks: ApiTrack[] };
            const mapped = (d2.tracks || []).map(mapApiTrack);
            setAiPicks(mapped);
            return;
          }
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error || `Failed to load AI picks (${res.status})`);
        }
        const data = (await res.json()) as { tracks: ApiTrack[] };
        const mapped = (data.tracks || []).map(mapApiTrack);
        setAiPicks(mapped);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error fetching AI picks.";
        setAiError(msg);
      } finally {
        setLoadingAi(false);
      }
    }

    fetchForYou().catch(() => {});
    fetchAiPicks().catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const displayTrending = trending.length > 0 ? trending : fallbackTrending;

  return (
    <PlayerProvider>
      <div className="min-h-screen pb-20">
        <LandingHeader />

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-neutral-200/70 dark:border-neutral-800">
          <div className="absolute inset-0 -z-10">
            <Image
              src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1920&auto=format&fit=crop"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/50 via-blue-800/40 to-blue-900/50" />
          </div>

          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div className="text-white">
              <h1 className="text-balance text-4xl font-bold sm:text-5xl">
                Meet Bragi — your AI muse for music
              </h1>
              <p className="mt-4 max-w-xl text-blue-100">
                AI-powered discovery, streaming, and sharing. Explore an
                ever-growing mix from emerging creators and your favorite artists.
              </p>

              <div className="mt-6">
                <form
                  action="/search"
                  className="flex max-w-xl items-center gap-2 rounded-md bg-white p-2 dark:bg-neutral-800"
                >
                  <svg
                    className="h-5 w-5 text-neutral-500 dark:text-neutral-300"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.3-4.3" />
                  </svg>
                  <input
                    name="q"
                    type="search"
                    placeholder="Search for artists, tracks, podcasts"
                    className="w-full bg-transparent text-sm text-neutral-900 placeholder-neutral-500 outline-none dark:text-neutral-100 dark:placeholder-neutral-400"
                    aria-label="Search"
                  />
                  <button
                    type="submit"
                    className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Search
                  </button>
                </form>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-blue-100">or</span>
                  <a
                    href="/signup"
                    className="rounded bg-white/10 px-3 py-1.5 text-white ring-1 ring-white/20 backdrop-blur hover:bg-white/20"
                  >
                    Create an account
                  </a>
                  <a
                    href="/upload"
                    className="rounded bg-white/10 px-3 py-1.5 text-white ring-1 ring-white/20 backdrop-blur hover:bg-white/20"
                  >
                    Upload your tracks
                  </a>
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="overflow-hidden rounded-md bg-white/95 shadow-xl ring-1 ring-black/5 backdrop-blur dark:bg-neutral-800">
                <div className="border-b border-neutral-200/70 px-4 py-3 dark:border-neutral-700">
                  <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                    Trending on Bragi
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 p-4">
                  {loadingTrending
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={`skeleton-${i}`}
                          className="animate-pulse overflow-hidden rounded-md border border-neutral-200/70 bg-white dark:border-neutral-700 dark:bg-neutral-800"
                        >
                          <div className="aspect-square w-full bg-neutral-200 dark:bg-neutral-700" />
                          <div className="space-y-2 px-3 py-2">
                            <div className="h-3 w-2/3 rounded bg-neutral-200 dark:bg-neutral-700" />
                            <div className="h-2 w-1/2 rounded bg-neutral-200 dark:bg-neutral-700" />
                          </div>
                        </div>
                      ))
                    : displayTrending.slice(0, 6).map((t) => <TrackCard key={t.id} track={t} />)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trending grid */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-xl font-semibold">Trending on Bragi</h2>
            <a href="/explore" className="text-sm text-blue-600 hover:text-blue-700">
              Explore all
            </a>
          </div>

          {errorMsg ? <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-300">{errorMsg}</p> : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {loadingTrending
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={`grid-skeleton-${i}`}
                    className="animate-pulse overflow-hidden rounded-md border border-neutral-200/70 bg-white dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    <div className="aspect-square w-full bg-neutral-200 dark:bg-neutral-700" />
                    <div className="space-y-2 px-3 py-2">
                      <div className="h-3 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
                      <div className="h-2 w-2/3 rounded bg-neutral-200 dark:bg-neutral-700" />
                    </div>
                  </div>
                ))
              : displayTrending.map((t) => <TrackCard key={t.id} track={t} />)}
          </div>
        </section>

        {/* For You row */}
        <section className="border-y border-neutral-200/70 bg-neutral-50/60 dark:border-neutral-800 dark:bg-neutral-900/60">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-end justify-between">
              <h3 className="text-lg font-semibold">For You</h3>
              {!isAuthed ? (
                <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
                  Sign in to personalize
                </a>
              ) : null}
            </div>
            {forYouError ? (
              <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-300">{forYouError}</p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {loadingForYou
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={`fy-s-${i}`}
                      className="animate-pulse overflow-hidden rounded-md border border-neutral-200/70 bg-white dark:border-neutral-700 dark:bg-neutral-800"
                    >
                      <div className="aspect-square w-full bg-neutral-200 dark:bg-neutral-700" />
                      <div className="space-y-2 px-3 py-2">
                        <div className="h-3 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
                        <div className="h-2 w-2/3 rounded bg-neutral-200 dark:bg-neutral-700" />
                      </div>
                    </div>
                  ))
                : forYou.map((t) => <TrackCard key={t.id} track={t} />)}
            </div>
          </div>
        </section>

        {/* AI DJ Picks */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between">
            <h3 className="text-lg font-semibold">AI DJ Picks</h3>
            <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
              Start AI DJ
            </a>
          </div>
          {aiError ? (
            <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-300">{aiError}</p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {loadingAi
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={`ai-s-${i}`}
                    className="animate-pulse overflow-hidden rounded-md border border-neutral-200/70 bg-white dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    <div className="aspect-square w-full bg-neutral-200 dark:bg-neutral-700" />
                    <div className="space-y-2 px-3 py-2">
                      <div className="h-3 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
                      <div className="h-2 w-2/3 rounded bg-neutral-200 dark:bg-neutral-700" />
                    </div>
                  </div>
                ))
              : aiPicks.map((t) => <TrackCard key={t.id} track={t} />)}
          </div>
        </section>

        {/* Charts */}
        <section className="border-y border-neutral-200/70 bg-neutral-50/60 dark:border-neutral-800 dark:bg-neutral-900/60">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <h3 className="mb-4 text-lg font-semibold">Top 50 — Global</h3>
              <ol className="space-y-3">
                {(loadingTrending ? displayTrending.slice(0, 8) : displayTrending.slice(0, 8)).map(
                  (t, i) => (
                    <li key={`${t.id}-${i}`} className="flex items-center gap-3">
                      <span className="w-6 shrink-0 text-sm tabular-nums text-neutral-500 dark:text-neutral-400">
                        {i + 1}
                      </span>
                      <div className="relative h-12 w-12 overflow-hidden rounded">
                        <Image
                          src={t.coverUrl}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{t.title}</p>
                        <p className="truncate text-xs text-neutral-600 dark:text-neutral-400">
                          {t.artist}
                        </p>
                      </div>
                    </li>
                  )
                )}
              </ol>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold">New & hot</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {(loadingTrending
                  ? displayTrending.slice(4, 8)
                  : displayTrending.slice(4, 8)
                ).map((t) => (
                  <TrackCard key={t.id} track={t} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Creator CTA + Uploads */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid items-start gap-6 rounded-md border border-neutral-200/70 bg-white p-6 sm:grid-cols-2 lg:gap-10 dark:border-neutral-700 dark:bg-neutral-800">
            <div>
              <h3 className="text-2xl font-semibold">Share your sound on Bragi</h3>
              <p className="mt-2 text-neutral-700 dark:text-neutral-300">
                Upload your tracks and connect with fans. Get heard everywhere
                your audience already is.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href="/upload"
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Upload now
                </a>
                <a
                  href="/creators"
                  className="rounded border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-700"
                >
                  Learn more
                </a>
              </div>
            </div>
            <UploadPanel />
          </div>
        </section>

        {/* Mobile apps */}
        <section className="border-y border-neutral-200/70 bg-neutral-50/60 dark:border-neutral-800 dark:bg-neutral-900/60">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div className="relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded">
                <Image
                  src="https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=1600&auto=format&fit=crop"
                  alt="Mobile app"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="text-2xl font-semibold">
                  Never stop listening—get the Bragi app
                </h3>
                <p className="mt-2 max-w-prose text-neutral-700 dark:text-neutral-300">
                  Save tracks, follow creators, and pick up where you left off on
                  any device.
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 rounded border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-700"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M16.365 1.43c.04.052.076.106.11.162-1.04.604-1.74 1.61-1.9 2.757-.04.052-.08.103-.12.154-.313.402-.84.72-1.35.67-.048-.74.22-1.487.7-2.07.48-.58 1.24-1.03 2.04-1.14.174-.025.352-.027.52-.027zM20.36 17.59c-.34.79-.5 1.13-1.03 1.83-.67.93-1.62 2.08-2.79 2.1-1.04 .02-1.31-.67-2.73-.67-1.42 0-1.72 .65-2.76 .68-1.17 .03-2.06-1.01-2.73-1.93-1.87-2.62-2.06-5.69-.91-7.32 .82-1.18 2.11-1.87 3.36-1.87 1.25 0 2.03 .68 3.06 .68 1.01 0 1.61-.68 3.06 -.68 1.1 0 2.27 .6 3.09 1.64-2.71 1.49-2.26 5.37 .38 6.53z" />
                    </svg>
                    App Store
                  </a>
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 rounded border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-700"
                  >
                    <svg
                      viewBox="0 0 512 512"
                      className="h-5 w-5"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M325.3 234.3L74.8 6.5c-4.7-4.2-10.8-6.5-17-6.5C25.8 0 0 25.8 0 57.8v396.4C0 486.2 25.8 512 57.8 512c6.2 0 12.3-2.3 17-6.5l250.5-227.8-85.8-43.4 85.8-43.1zM362.8 258.4l-32 29.1 90.7 46.3 71.3-64.9c13.1-11.9 13.1-32.6 0-44.5l-71.3-64.9-90.7 46.3 32 29.1c7.2 6.6 7.2 17.5 0 24.5z" />
                    </svg>
                    Google Play
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <LandingFooter />
        <PlayerBar />
      </div>
    </PlayerProvider>
  );
}
