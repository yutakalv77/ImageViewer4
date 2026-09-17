import { useState, useEffect, useRef } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { EntryItem } from "../types";
import { getCachedThumbnailPath, setCachedThumbnailPath, subscribeThumbnailCache } from "../utils/thumbnailCache";

export interface UseThumbnailResult {
  thumbSrc: string | null;
  isLoading: boolean;
  hasError: boolean;
  onError: () => void;
}

export function useThumbnail(
  entry: EntryItem,
  elementRef: React.RefObject<HTMLElement | null>
): UseThumbnailResult {
  const [thumbSrc, setThumbSrc] = useState<string | null>(() => {
    if (entry.thumbnail_path) return convertFileSrc(entry.thumbnail_path);
    const memPath = getCachedThumbnailPath(entry.path);
    return memPath ? convertFileSrc(memPath) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return !entry.thumbnail_path && !getCachedThumbnailPath(entry.path);
  });
  const [hasError, setHasError] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (entry.thumbnail_path) {
      setThumbSrc(convertFileSrc(entry.thumbnail_path));
      setIsLoading(false);
      setHasError(false);
    } else {
      const memPath = getCachedThumbnailPath(entry.path);
      if (memPath) {
        setThumbSrc(convertFileSrc(memPath));
        setIsLoading(false);
        setHasError(false);
      } else {
        setThumbSrc(null);
        setIsLoading(true);
        setHasError(false);
      }
    }
  }, [entry.path, entry.thumbnail_path]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Listen for memory cache updates for this entry
  useEffect(() => {
    if (thumbSrc) return;

    const unsubscribe = subscribeThumbnailCache((path, thumbnailPath) => {
      if (isMountedRef.current && path === entry.path) {
        setThumbSrc(convertFileSrc(thumbnailPath));
        setIsLoading(false);
        setHasError(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [entry.path, thumbSrc]);

  useEffect(() => {
    if (thumbSrc || hasError) return;

    const el = elementRef.current;
    if (!el) return;

    let isCancelled = false;

    const fetchThumbnail = async () => {
      try {
        setIsLoading(true);
        const cachedPath = await invoke<string>("get_thumbnail", { path: entry.path });
        if (!isCancelled && isMountedRef.current) {
          if (cachedPath) {
            setCachedThumbnailPath(entry.path, cachedPath);
            setThumbSrc(convertFileSrc(cachedPath));
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (!isCancelled && isMountedRef.current) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    if (typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver(
        (entries) => {
          const first = entries[0];
          if (first && first.isIntersecting) {
            observer.disconnect();
            fetchThumbnail();
          }
        },
        { rootMargin: "250px" }
      );

      observer.observe(el);
      return () => {
        isCancelled = true;
        observer.disconnect();
      };
    } else {
      fetchThumbnail();
      return () => {
        isCancelled = true;
      };
    }
  }, [entry.path, thumbSrc, hasError, elementRef]);

  return {
    thumbSrc,
    isLoading,
    hasError,
    onError: () => setHasError(true),
  };
}
