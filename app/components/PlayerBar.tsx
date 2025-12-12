"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { usePlayer, type PlayerTrack } from "./player/PlayerProvider";

type ApiTrack = {
  id: string;
  name: string;
  artists: string;
  preview_url: string | null;
  duration_ms: number;
  image: string | null;
  album: string;
};

function mapApiTracks(items: ApiTrack[]): PlayerTrack[] {
  return items
    .filter((t) => Boolean(t.preview_url))
    .map((t) => ({
      id: t.id,
      title: t.name,
      artist: t.artists,
      coverUrl: t.image ?? null,
      audioUrl: t.preview_url ?? null,
      durationMs: t.duration_ms,
      source: "spotify",
    }));
}

export default function PlayerBar() {
  const player = usePlayer();
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const progress = useMemo(() => {
    if (!player.duration || player.duration <= 0) return 0;
    return Math.min(100, Math.max(0, (player.currentTime / player.duration) * 100));
  }, [player.currentTime, player.duration]);

  async function fetchAIPlaylist(mode: "random" | "for_you") {
    setErrorMsg(null);
    setLoadingQueue(true);
    try {
      let tracks: ApiTrack[] = [];
      if (mode === "for_you") {
        const res = await fetch("/api/ai/playlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "for_you", limit: 10 }),
        });
        if (res.ok) {
          const data = (await res.json()) as { tracks: ApiTrack[] };
          tracks = data.tracks ?? [];
        } else if (res.status === 401 || res.status === 429 || res.status === 501) {
          const r2 = await fetch("/api/spotify/for-you");
          if (r2.ok) {
            const d2 = (await r2.json()) as { tracks: ApiTrack[] };
            tracks = d2.tracks ?? [];
          } else {
            const r3 = await fetch("/api/spotify/featured?limit=12");
            const d3 = (await r3.json()) as { tracks: ApiTrack[] };
            tracks = d3.tracks ?? [];
          }
        } else {
          const msg = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(msg.error || "Failed to fetch AI playlist.");
        }
      } else {
        const res = await fetch("/api/ai/playlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "random", limit: 10 }),
        });
        if (res.ok) {
          const data = (await res.json()) as { tracks: ApiTrack[] };
          tracks = data.tracks ?? [];
        } else {
          const r2 = await fetch("/api/spotify/featured?limit=12");
          const d2 = (await r2.json()) as { tracks: ApiTrack[] };
          tracks = d2.tracks ?? [];
        }
      }
      const mapped = mapApiTracks(tracks);
      if (mapped.length === 0) {
        setErrorMsg("No playable previews available in this selection.");
        return;
      }
      player.setQueue(mapped, true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error starting AI DJ.";
      setErrorMsg(msg);
    } finally {
      setLoadingQueue(false);
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const pct = Number(e.target.value);
    const targetSeconds = (pct / 100) * (player.duration || 0);
    player.seek(targetSeconds);
  }

  const ct = player.currentTrack;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200/70 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* Left: cover and info */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded bg-neutral-100 dark:bg-neutral-800">
            {ct?.coverUrl ? (
              <Image src={ct.coverUrl} alt="" fill sizes="48px" className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-neutral-400 dark:text-neutral-500">
                ♫
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {ct ? ct.title : "Start the AI DJ"}
            </p>
            <p className="truncate text-xs text-neutral-600 dark:text-neutral-400">
              {ct ? ct.artist : "Personalized or trending queue"}
            </p>
          </div>
        </div>

        {/* Center: controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded p-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
            onClick={() => player.prev()}
            aria-label="Previous"
            disabled={!ct}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M6 6h2v12H6zM9 12l9-6v12z" />
            </svg>
          </button>
          <button
            type="button"
            className="rounded p-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
            onClick={() => player.togglePlay()}
            aria-label={player.isPlaying ? "Pause" : "Play"}
            disabled={!ct || !ct.audioUrl}
          >
            {player.isPlaying ? (
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
                <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className="rounded p-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
            onClick={() => player.next()}
            aria-label="Next"
            disabled={!ct}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M18 6h-2v12h2zM15 12L6 6v12z" />
            </svg>
          </button>
        </div>

        {/* Seek */}
        <div className="hidden flex-1 items-center gap-2 sm:flex">
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={progress}
            onChange={handleSeek}
            aria-label="Seek"
            className="w-full accent-blue-500"
          />
        </div>

        {/* Right: AI & actions */}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchAIPlaylist("for_you")}
            className="inline-flex items-center gap-2 rounded border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            disabled={loadingQueue}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M12 3l4 7H8l4-7zm0 18l-4-7h8l-4 7z" />
            </svg>
            For You
          </button>
          <button
            type="button"
            onClick={() => fetchAIPlaylist("random")}
            className="inline-flex items-center gap-2 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            disabled={loadingQueue}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M4 4h6l-2 3 6 7H9l2 3H4v-3h3l-3-4V4zm13 0h3v3h-3V4zm0 13h3v3h-3v-3z" />
            </svg>
            AI DJ
          </button>
          <button
            type="button"
            onClick={() => player.clear()}
            className="rounded p-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
            aria-label="Clear queue"
          >
            Clear
          </button>
        </div>
      </div>
      {errorMsg ? (
        <div className="mx-auto max-w-7xl px-4 pb-3 text-xs text-red-600 sm:px-6 lg:px-8 dark:text-red-400">
          {errorMsg}
        </div>
      ) : null}
    </div>
  );
}
