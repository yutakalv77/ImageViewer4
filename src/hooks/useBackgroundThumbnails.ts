import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { EntryItem } from "../types";
import { setCachedThumbnailPath, extractUncachedImagePaths } from "../utils/thumbnailCache";

export interface ThumbnailReadyPayload {
  path: string;
  thumbnail_path: string;
}

export interface UseBackgroundThumbnailsOptions {
  entries: EntryItem[];
  highPerformanceMode: boolean;
  onThumbnailReady?: (path: string, thumbnailPath: string) => void;
}

/**
 * Custom hook that starts background thumbnail pre-generation for un-cached images,
 * dynamically throttled by highPerformanceMode, and listens for completion events.
 */
export function useBackgroundThumbnails({
  entries,
  highPerformanceMode,
  onThumbnailReady,
}: UseBackgroundThumbnailsOptions) {
  const onReadyRef = useRef(onThumbnailReady);
  onReadyRef.current = onThumbnailReady;

  // Listen to background thumbnail completion events from Rust
  useEffect(() => {
    let unlisten: UnlistenFn | null = null;
    let isCancelled = false;

    listen<ThumbnailReadyPayload>("thumbnail-ready", (event) => {
      if (isCancelled) return;
      const { path, thumbnail_path } = event.payload;
      setCachedThumbnailPath(path, thumbnail_path);
      onReadyRef.current?.(path, thumbnail_path);
    }).then((fn) => {
      if (isCancelled) {
        fn();
      } else {
        unlisten = fn;
      }
    }).catch((err) => {
      console.error("Failed to listen to thumbnail-ready event:", err);
    });

    return () => {
      isCancelled = true;
      if (unlisten) unlisten();
    };
  }, []);

  // Trigger background generation when entries or mode changes
  useEffect(() => {
    const unCachedPaths = extractUncachedImagePaths(entries);

    if (unCachedPaths.length === 0) return;

    invoke("start_background_thumbnails", {
      paths: unCachedPaths,
      highPerformance: highPerformanceMode,
    }).catch((err) => {
      console.error("Failed to start background thumbnails:", err);
    });

    return () => {
      invoke("cancel_background_thumbnails").catch(() => {});
    };
  }, [entries, highPerformanceMode]);
}
