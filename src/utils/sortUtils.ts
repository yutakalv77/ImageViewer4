import { EntryItem, SortBy, SortOrder } from "../types";

export function getFileExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1 || dotIndex === 0) return "";
  return filename.slice(dotIndex + 1).toLowerCase();
}

/**
 * EntryItem 配列を指定された基準と順序でソートする純粋関数
 * フォルダ（is_dir: true）は常に先頭に配置されます。
 */
export function sortEntries(
  entries: EntryItem[],
  sortBy: SortBy = "name",
  sortOrder: SortOrder = "asc"
): EntryItem[] {
  const sorted = [...entries];
  const orderMultiplier = sortOrder === "asc" ? 1 : -1;

  sorted.sort((a, b) => {
    // フォルダは常に先頭に配置
    if (a.is_dir !== b.is_dir) {
      return a.is_dir ? -1 : 1;
    }

    let comparison = 0;

    switch (sortBy) {
      case "name": {
        comparison = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
        break;
      }
      case "created": {
        const createdA = a.created ?? 0;
        const createdB = b.created ?? 0;
        comparison = createdA - createdB;
        break;
      }
      case "modified": {
        const modifiedA = a.modified ?? 0;
        const modifiedB = b.modified ?? 0;
        comparison = modifiedA - modifiedB;
        break;
      }
      case "size": {
        const sizeA = a.size ?? 0;
        const sizeB = b.size ?? 0;
        comparison = sizeA - sizeB;
        break;
      }
      case "type": {
        const extA = a.is_dir ? "" : getFileExtension(a.name);
        const extB = b.is_dir ? "" : getFileExtension(b.name);
        comparison = extA.localeCompare(extB, undefined, { sensitivity: "base" });
        break;
      }
      default:
        comparison = 0;
    }

    // 主ソートキーで同等の場合は名前順でタイブレーク
    if (comparison === 0 && sortBy !== "name") {
      comparison = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
      return comparison;
    }

    return comparison * orderMultiplier;
  });

  return sorted;
}
