/** Class / attr applied when the prototype scroll pane actually overflows on Y. */
export const STUDIO_SCROLL_OVERFLOW_CLASS = "studio-scroll--overflow";
export const STUDIO_SCROLL_OVERFLOW_ATTR = "data-studio-scroll-overflow";

/**
 * True when content is taller than the visible pane (subpixel-tolerant).
 * Used to reserve `scrollbar-gutter: stable` only when a classic scrollbar would appear.
 */
export function elementOverflowsY(el: HTMLElement, tolerancePx = 1): boolean {
  return el.scrollHeight > el.clientHeight + tolerancePx;
}

/**
 * Toggle overflow gutter marker on the prototype scroll root.
 * Short pages keep no gutter (no empty white strip); tall pages reserve the track
 * so modal/journey `overflow: hidden` lock does not shift content on X.
 */
export function syncStudioScrollOverflowGutter(el: HTMLElement): boolean {
  const overflows = elementOverflowsY(el);
  el.classList.toggle(STUDIO_SCROLL_OVERFLOW_CLASS, overflows);
  if (overflows) {
    el.setAttribute(STUDIO_SCROLL_OVERFLOW_ATTR, "true");
  } else {
    el.removeAttribute(STUDIO_SCROLL_OVERFLOW_ATTR);
  }
  return overflows;
}
