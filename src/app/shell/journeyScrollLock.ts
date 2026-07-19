/** Blocks user-initiated prototype scroll during CJM/journey mode; playback scroll still runs. */

export const JOURNEY_SCROLL_LOCK_CLASS = "studio-scroll--journey-locked";

const SCROLL_NAV_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
]);

export function isScrollNavigationKey(key: string): boolean {
  return SCROLL_NAV_KEYS.has(key);
}

function shouldBlockScrollKey(
  event: KeyboardEvent,
  scrollEl: HTMLElement
): boolean {
  if (!isScrollNavigationKey(event.key)) return false;
  if (event.ctrlKey || event.metaKey || event.altKey) return false;

  const target = event.target;
  if (!(target instanceof Node)) return false;

  if (scrollEl.contains(target)) return true;

  const active = document.activeElement;
  return active != null && scrollEl.contains(active);
}

/** Attach user-scroll blockers to the prototype scroll root. Caller must invoke cleanup. */
export function bindProtoJourneyScrollLock(scrollEl: HTMLElement): () => void {
  scrollEl.classList.add(JOURNEY_SCROLL_LOCK_CLASS);

  const blockWheel = (event: WheelEvent) => {
    event.preventDefault();
  };

  const blockTouchMove = (event: TouchEvent) => {
    event.preventDefault();
  };

  const blockKeys = (event: KeyboardEvent) => {
    if (!shouldBlockScrollKey(event, scrollEl)) return;
    event.preventDefault();
  };

  scrollEl.addEventListener("wheel", blockWheel, { passive: false });
  scrollEl.addEventListener("touchmove", blockTouchMove, { passive: false });
  window.addEventListener("keydown", blockKeys);

  return () => {
    scrollEl.classList.remove(JOURNEY_SCROLL_LOCK_CLASS);
    scrollEl.removeEventListener("wheel", blockWheel);
    scrollEl.removeEventListener("touchmove", blockTouchMove);
    window.removeEventListener("keydown", blockKeys);
  };
}
