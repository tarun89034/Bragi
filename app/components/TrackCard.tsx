import Image from "next/image";
import { usePlayer } from "./player/PlayerProvider";

export type Track = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  plays?: string;
  audioUrl?: string | null;
  durationMs?: number | null;
  source?: "spotify" | "upload";
};

export default function TrackCard({ track }: { track: Track }) {
  const player = usePlayer();
  const canPlay = Boolean(track.audioUrl);

  function handlePlay() {
    if (!canPlay) return;
    player.playTrack({
      id: track.id,
      title: track.title,
      artist: track.artist,
      coverUrl: track.coverUrl,
      audioUrl: track.audioUrl ?? undefined,
      durationMs: track.durationMs ?? undefined,
      source: track.source ?? "spotify",
    });
  }

  return (
    <article
      data-testid="track-card"
      className="group overflow-hidden rounded-md border border-neutral-200/70 bg-white transition-shadow hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800"
    >
      <div className="relative aspect-square w-full overflow-hidden">
        <Image
          src={track.coverUrl}
          alt={`${track.title} cover art`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <button
          type="button"
          aria-label={canPlay ? `Play ${track.title}` : `Preview unavailable`}
          onClick={handlePlay}
          disabled={!canPlay}
          className="absolute bottom-2 left-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow ring-1 ring-neutral-200 transition hover:bg-white disabled:opacity-60 dark:bg-neutral-900/80 dark:text-neutral-100 dark:ring-neutral-700 dark:hover:bg-neutral-900"
        >
          <svg
            className="ml-0.5 h-5 w-5"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>

      <div className="space-y-1 px-3 py-2">
        <h3 className="line-clamp-1 text-sm font-semibold">{track.title}</h3>
        <p className="line-clamp-1 text-xs text-neutral-600 dark:text-neutral-300">{track.artist}</p>
        {track.plays ? (
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{track.plays} plays</p>
        ) : null}
        {!canPlay ? (
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Preview unavailable</p>
        ) : null}
      </div>
    </article>
  );
}
