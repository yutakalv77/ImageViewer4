/**
 * Formats byte size into human-readable format (B, KB, MB, GB, TB).
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const k = 1024;
  const dm = Math.max(0, decimals);
  const sizes = ["B", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeI = Math.min(i, sizes.length - 1);

  if (safeI === 0) {
    return `${bytes} B`;
  }

  const value = (bytes / Math.pow(k, safeI)).toFixed(dm);
  return `${value} ${sizes[safeI]}`;
}
