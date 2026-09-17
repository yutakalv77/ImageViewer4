/**
 * DOM and event inspection utility functions
 */

/**
 * Checks if the event target is an interactive input or editable element
 * (e.g. INPUT, TEXTAREA, or contentEditable).
 */
export function isTargetEditable(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  return Boolean(
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable ||
    target.contentEditable === "true" ||
    target.getAttribute("contenteditable") === "true"
  );
}

/**
 * Alias for backward compatibility
 */
export const isTargetInputOrTextarea = isTargetEditable;
