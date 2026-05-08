export interface EntryItem {
  name: string;
  path: string;
  is_dir: boolean;
  thumbnail_path: string | null;
}

export interface ViewerState {
  isOpen: boolean;
  currentIndex: number;
}

export interface DirectoryResult {
  entries: EntryItem[];
  path: string;
}

export interface HistoryEntry {
  path: string;
  lastVisited: number; // timestamp
}

export interface FavoriteEntry {
  path: string;
  addedAt: number; // timestamp
}

export type ViewMode = "single" | "spread";
export type ReadingDirection = "rtl" | "ltr";
export type ThemeMode = "dark" | "light" | "system";
export type StartupFolderType = "none" | "last";
export type BackgroundStyle = "cover" | "contain" | "tile";

export interface BackgroundSettings {
  path: string | null;
  opacity: number;
  blur: number;
  style: BackgroundStyle;
}

export interface ImageInfo {
  name: string;
  location: string;
  full_path: string;
  format: string;
  width: number;
  height: number;
  bpp: number;
  size_bytes: number;
  colors: number | null;
  modified: string;
  order: string;
  load_time_ms: number;
}
