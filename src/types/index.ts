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
