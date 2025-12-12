"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type PlayerSource = "spotify" | "upload";

export type PlayerTrack = {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string | null;
  audioUrl?: string | null;
  durationMs?: number | null;
  source?: PlayerSource;
};

type PlayerState = {
  queue: PlayerTrack[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
};

type PlayerContextValue = PlayerState & {
  currentTrack: PlayerTrack | null;
  playTrack: (track: PlayerTrack) => void;
  setQueue: (tracks: PlayerTrack[], autoplay?: boolean) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  clear: () => void;
};

type PersistedState = {
  queue: Omit<PlayerTrack, "audioUrl"> & { audioUrl?: string | null }[];
  currentIndex: number;
  currentTime: number;
  isPlaying: boolean;
};

const STORAGE_KEY = "bragi_player_state";

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueueState] = useState<PlayerTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [pendingSeek, setPendingSeek] = useState<number | null>(null);

  const currentTrack = useMemo(() => {
    return queue.length > 0 ? queue[currentIndex] ?? null : null;
  }, [queue, currentIndex]);

  // Initialize audio element once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "metadata";
    }
    const audio = audioRef.current!;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => {
      setDuration(audio.duration);
      // apply pending seek if any
      if (pendingSeek !== null) {
        audio.currentTime = Math.max(0, Math.min(pendingSeek, audio.duration || Infinity));
        setPendingSeek(null);
      }
    };
    const onEnd = () => {
      next();
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore persisted queue/state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const persisted = JSON.parse(raw) as PersistedState;
      const tracks = persisted.queue ?? [];
      // For upload sources, re-sign URLs; spotify previews can reuse audioUrl directly
      const restore = async () => {
        const restored: PlayerTrack[] = await Promise.all(
          tracks.map(async (t) => {
            if (t.source === "upload") {
              try {
                const res = await fetch(
                  `/api/uploads/download?path=${encodeURIComponent(t.id)}`
                );
                const data = (await res.json()) as { url?: string };
                return {
                  ...t,
                  audioUrl: data.url ?? null,
                };
              } catch {
                return { ...t, audioUrl: null };
              }
            }
            // spotify
            return {
              ...t,
              audioUrl: t.audioUrl ?? null,
            };
          })
        );
        setQueueState(restored);
        setCurrentIndex(
          Number.isFinite(persisted.currentIndex) ? Math.max(0, persisted.currentIndex) : 0
        );
        setPendingSeek(Number.isFinite(persisted.currentTime) ? persisted.currentTime : 0);
        // Attempt autoplay if persisted said playing
        if (persisted.isPlaying) {
          const audio = audioRef.current;
          const ct = restored[persisted.currentIndex];
          if (audio && ct?.audioUrl) {
            audio.src = ct.audioUrl;
            audio
              .play()
              .then(() => {
                setIsPlaying(true);
              })
              .catch(() => setIsPlaying(false));
          }
        }
      };
      restore().catch(() => {});
    } catch {
      // ignore
    }
  }, []);

  // Load current track into audio element when it changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const track = currentTrack;
    if (!track || !track.audioUrl) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    audio.src = track.audioUrl;
    // Try to play; if fails due to user gesture, keep paused
    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        setCurrentTime(audio.currentTime);
        setDuration(audio.duration || (track.durationMs ? track.durationMs / 1000 : 0));
        // Log play to server if Spotify source
        if (track.source === "spotify") {
          fetch("/api/plays", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              track_id: track.id,
              track_name: track.title,
              artist_name: track.artist,
              preview_url: track.audioUrl,
              duration_ms: track.durationMs ?? null,
              played_at: new Date().toISOString(),
            }),
          }).catch(() => {
            // ignore logging errors
          });
        }
      })
      .catch(() => {
        setIsPlaying(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  // Persist state changes (throttled)
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const payload: PersistedState = {
          queue: queue.map((t) => ({
            id: t.id,
            title: t.title,
            artist: t.artist,
            coverUrl: t.coverUrl ?? null,
            durationMs: t.durationMs ?? null,
            source: t.source ?? "spotify",
            audioUrl: t.source === "spotify" ? t.audioUrl ?? null : undefined, // avoid persisting expired upload URLs
          })),
          currentIndex,
          currentTime,
          isPlaying,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // ignore storage errors
      }
    }, 250);
    return () => clearTimeout(id);
  }, [queue, currentIndex, currentTime, isPlaying]);

  const playTrack = useCallback((track: PlayerTrack) => {
    setQueueState([track]);
    setCurrentIndex(0);
  }, []);

  const setQueue = useCallback((tracks: PlayerTrack[], autoplay: boolean = true) => {
    setQueueState(tracks);
    setCurrentIndex(0);
    if (!autoplay) {
      const audio = audioRef.current;
      if (audio) audio.pause();
      setIsPlaying(false);
    }
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

  const next = useCallback(() => {
    if (queue.length === 0) return;
    const nextIndex = currentIndex + 1;
    if (nextIndex < queue.length) {
      setCurrentIndex(nextIndex);
    } else {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
      }
      setIsPlaying(false);
    }
  }, [currentIndex, queue.length]);

  const prev = useCallback(() => {
    if (queue.length === 0) return;
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentIndex(prevIndex);
    } else {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
      }
    }
  }, [currentIndex, queue.length]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio || Number.isNaN(time)) return;
    audio.currentTime = Math.max(0, Math.min(time, audio.duration || Infinity));
    setCurrentTime(audio.currentTime);
  }, []);

  const clear = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = "";
    }
    setQueueState([]);
    setCurrentIndex(0);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const value: PlayerContextValue = {
    queue,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    currentTrack,
    playTrack,
    setQueue,
    togglePlay,
    next,
    prev,
    seek,
    clear,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
