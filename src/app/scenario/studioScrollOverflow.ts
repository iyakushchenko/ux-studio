/** Class / attr applied when the prototype scroll pane actually overflows on Y. */
export const STUDIO_SCROLL_OVERFLOW_CLASS = "studio-scroll--overflow";
export const STUDIO_SCROLL_OVERFLOW_ATTR = "data-studio-scroll-overflow";

/** Matches `::-webkit-scrollbar { width: 4px }` — lock padding fallback. */
export const STUDIO_SCROLLBAR_SIZE_FALLBACK_PX = 4;

const SCROLLBAR_SIZE_VAR = "--studio-scrollbar-size";

/**
 * True when content is taller than the visible pane (subpixel-tolerant).
 * Used to force thin-track `overflow-y: scroll` only when a scrollbar would appear.
 */
export function elementOverflowsY(el: HTMLElement, tolerancePx = 1): boolean {
  return el.scrollHeight > el.clientHeight + tolerancePx;
}

/** Classic layout scrollbar inset (0 when overlay / none). */
export function measureScrollbarInlineSize(el: HTMLElement): number {
  return Math.max(0, el.offsetWidth - el.clientWidth);
}

/**
 * Toggle overflow marker on a scroll host (prototype pane or `.chat__column`).
 * Short pages keep `overflow-y: auto` (no empty track). Tall pages force
 * `overflow-y: scroll` so the thin thumb track stays reserved — no X jump when
 * modal/journey lock hides the scrollbar (padding uses measured inset).
 */
export function syncStudioScrollOverflowGutter(el: HTMLElement): boolean {
  const overflows = elementOverflowsY(el);
  el.classList.toggle(STUDIO_SCROLL_OVERFLOW_CLASS, overflows);
  if (overflows) {
    el.setAttribute(STUDIO_SCROLL_OVERFLOW_ATTR, "true");
    // Class → `overflow-y: scroll`; force layout before measuring inset.
    void el.offsetWidth;
    const size = measureScrollbarInlineSize(el);
    el.style.setProperty(
      SCROLLBAR_SIZE_VAR,
      `${size > 0 ? size : STUDIO_SCROLLBAR_SIZE_FALLBACK_PX}px`
    );
  } else {
    el.removeAttribute(STUDIO_SCROLL_OVERFLOW_ATTR);
    el.style.removeProperty(SCROLLBAR_SIZE_VAR);
  }
  return overflows;
}
