import { SearchScope } from "../types";

/**
 * Toggles the search scope between 'folder' and 'everything'
 */
export function toggleSearchScope(current: SearchScope): SearchScope {
  return current === "folder" ? "everything" : "folder";
}

/**
 * Determines effective search scope based on whether Shift key was held during submission
 */
export function determineSearchScope(options: {
  isShiftKey: boolean;
  activeScope: SearchScope;
}): SearchScope {
  const { isShiftKey, activeScope } = options;
  if (!isShiftKey) {
    return activeScope;
  }
  return toggleSearchScope(activeScope);
}

/**
 * Returns placeholder text based on current search scope and Everything availability
 */
export function getSearchPlaceholder(
  scope: SearchScope,
  everythingEnabled: boolean,
  t: (key: string, opts?: any) => string
): string {
  if (!everythingEnabled) {
    return t("common.search_placeholder", { defaultValue: "検索..." });
  }

  if (scope === "everything") {
    return t("common.search_placeholder_everything", {
      defaultValue: "Everything全体検索... (Shift+Enterでフォルダ内)",
    });
  }

  return t("common.search_placeholder_folder", {
    defaultValue: "フォルダ内を検索... (Shift+Enterで全体)",
  });
}

/**
 * Returns tooltip description for the search scope toggle button
 */
export function getSearchScopeTooltip(
  scope: SearchScope,
  t: (key: string, opts?: any) => string
): string {
  if (scope === "everything") {
    return t("common.search_scope_everything_tooltip", {
      defaultValue: "Everythingで全体検索中（クリックでフォルダ内検索に切替）",
    });
  }

  return t("common.search_scope_folder_tooltip", {
    defaultValue: "現在のフォルダ内を検索中（クリックでEverything全体検索に切替）",
  });
}
