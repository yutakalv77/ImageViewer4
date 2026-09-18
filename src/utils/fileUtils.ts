import { isZipVirtualPath } from "./pathUtils";

/**
 * Utility functions for file operations and name manipulation
 */


// Characters prohibited in Windows file/folder names
const INVALID_FILENAME_CHARS_REGEX = /[\\/:*?"<>|]/;

// Reserved device names in Windows (e.g., CON, PRN, AUX, NUL, COM1-9, LPT1-9)
const WINDOWS_RESERVED_NAMES_REGEX = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\..*)?$/i;

/**
 * Validates whether a file name is valid on the filesystem (Windows compatible).
 */
export function isValidFileName(name: string | null | undefined): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (trimmed.length === 0) return false;
  if (trimmed === "." || trimmed === ".." || trimmed.endsWith(".")) return false;
  if (INVALID_FILENAME_CHARS_REGEX.test(trimmed)) return false;
  if (WINDOWS_RESERVED_NAMES_REGEX.test(trimmed)) return false;
  return true;
}

/**
 * Splits a file name into base name and extension.
 * If there is no extension or it is a dotfile (e.g. ".gitignore"), extension is empty.
 */
export function getNameAndExtension(fileName: string): { baseName: string; extension: string } {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex <= 0) {
    return { baseName: fileName, extension: "" };
  }
  return {
    baseName: fileName.substring(0, dotIndex),
    extension: fileName.substring(dotIndex),
  };
}

/**
 * Computes a new absolute path when renaming a file/folder.
 * Preserves the directory path and path separator.
 */
export function getRenamedPath(oldPath: string, newName: string): string {
  const separator = oldPath.includes("\\") ? "\\" : "/";
  const parts = oldPath.split(separator);
  parts.pop(); // Remove old file name
  return [...parts, newName].join(separator);
}

/**
 * Returns the file or folder name from a path.
 */
export function getEntryNameFromPath(path: string): string {
  const parts = path.split(/[/\\]/).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : path;
}

/**
 * Checks whether an entry at path can be moved to trash.
 * ZIP virtual entries cannot be trashed.
 */
export function canTrashEntry(path: string | null | undefined): boolean {
  if (!path) return false;
  return !isZipVirtualPath(path);
}

