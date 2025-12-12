"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePlayer, type PlayerTrack } from "./player/PlayerProvider";

type ListedFile = {
  name: string;
  path: string;
  updated_at?: string;
  size?: number;
  contentType?: string;
};

export default function UploadPanel() {
  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);
  const player = usePlayer();

  const [userId, setUserId] = useState<string | null>(null);
  const [files, setFiles] = useState<ListedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    }
    init();
  }, [supabase]);

  async function loadFiles() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/uploads/list");
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `Failed to list uploads (${res.status})`);
      }
      const data = (await res.json()) as { files: ListedFile[] };
      setFiles(data.files ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error loading uploads.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (userId) {
      loadFiles().catch(() => {});
    } else {
      setFiles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErrorMsg(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/uploads", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as { path?: string; signedUrl?: string | null; error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Upload failed.");
      }
      await loadFiles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error uploading.";
      setErrorMsg(msg);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function playFile(path: string, name: string) {
    try {
      const res = await fetch(`/api/uploads/download?path=${encodeURIComponent(path)}`);
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Failed to get signed URL.");
      }
      const track: PlayerTrack = {
        id: path,
        title: name,
        artist: "You",
        coverUrl: null,
        audioUrl: data.url,
        durationMs: null,
        source: "upload",
      };
      player.playTrack(track);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error playing file.";
      setErrorMsg(msg);
    }
  }

  async function deleteFile(path: string) {
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/uploads?path=${encodeURIComponent(path)}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to delete file.");
      }
      await loadFiles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error deleting file.";
      setErrorMsg(msg);
    }
  }

  return (
    <div className="rounded-md border border-neutral-200/70 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold">Your uploads</h4>
        {userId ? (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-700">
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleUpload}
              aria-label="Upload audio"
            />
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M5 20h14v-2H5v2zM11 4h2v9h-2V4zm-2 5h6l-3 3-3-3z" />
            </svg>
            {uploading ? "Uploading..." : "Upload"}
          </label>
        ) : (
          <span className="text-xs text-neutral-600 dark:text-neutral-300">Sign in to upload</span>
        )}
      </div>

      {errorMsg ? <p className="mb-2 text-xs text-red-600 dark:text-red-400">{errorMsg}</p> : null}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`s-${i}`} className="animate-pulse h-10 rounded bg-neutral-100 dark:bg-neutral-700" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <p className="text-xs text-neutral-600 dark:text-neutral-300">No uploads yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-200/70 dark:divide-neutral-700">
          {files.map((f) => (
            <li key={f.path} className="flex items-center justify-between py-2">
              <div className="min-w-0">
                <p className="truncate text-sm">{f.name}</p>
                <p className="truncate text-xs text-neutral-600 dark:text-neutral-400">
                  {f.contentType || "audio"} • {f.size ? `${Math.round(f.size / 1024)} KB` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded p-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700"
                  onClick={() => playFile(f.path, f.name)}
                  aria-label={`Play ${f.name}`}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="rounded p-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700"
                  onClick={() => deleteFile(f.path)}
                  aria-label={`Delete ${f.name}`}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d="M6 7h12v2H6V7zm2 3h8l-1 8H9L8 10zm3-6h2v2h-2V4z" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
