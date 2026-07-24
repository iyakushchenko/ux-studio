export type PlaybackTimingMode = "normal" | "fast";

let playbackTimingMode: PlaybackTimingMode = "normal";

export function getPlaybackTimingMode(): PlaybackTimingMode {
  return playbackTimingMode;
}

export function setPlaybackTimingMode(mode: PlaybackTimingMode): PlaybackTimingMode {
  const previous = playbackTimingMode;
  playbackTimingMode = mode;
  return previous;
}

/**
 * Universal floor under every `playbackMs()` call, regardless of what a
 * call site passes as `floorMs` — a caller can ask for a lower floor, but
 * never actually get less than this. PP-50: a real Chromium tab still needs
 * genuine wall-clock time to scroll/paint/reflow; a caller-supplied floor as
 * low as 12ms (~1 frame at 60fps) raced real layout and caused a functional
 * click-miss on a freshly-scrolled calendar cell, not just cosmetic drift
 * (the class already tolerated as diagnostic-only in playbackScrollMonitor.ts).
 * One shared minimum here means every project/CJM gets the safety margin —
 * no per-call-site tuning required, and none can accidentally regress it.
 * PO, 2026-07-24: "still stupidly fast" even after the PP-50 fix — nudged
 * slower again (40→48).
 */
const PLAYBACK_MIN_SAFE_FLOOR_MS = 48;

/**
 * Fast mode's own compression ratio for real-DOM-settle waits (scroll,
 * cursor re-aim). Was 0.06 (~17x, PP-50) → 0.2 → 0.28 (PO, 2026-07-24: a bit
 * slower again) — still a large, meaningful CI/QA speedup without racing
 * real rendering.
 */
const PLAYBACK_FAST_RATIO = 0.28;

/**
 * Compress presentation time only; callers keep DOM/readiness guards intact.
 * For waits where the real browser must catch up (scroll settle, cursor
 * hotspot re-aim) — enforces `PLAYBACK_MIN_SAFE_FLOOR_MS` no matter what a
 * caller passes. Do not use this for tight, many-times-per-second loops
 * (e.g. per-character typing) — the floor will dominate and effectively
 * cancel the speedup; use `playbackPacingMs()` for that instead.
 */
export function playbackMs(ms: number, floorMs = PLAYBACK_MIN_SAFE_FLOOR_MS): number {
  if (playbackTimingMode !== "fast" || ms <= 0) return ms;
  const floor = Math.max(floorMs, PLAYBACK_MIN_SAFE_FLOOR_MS);
  return Math.max(floor, Math.round(ms * PLAYBACK_FAST_RATIO));
}

/**
 * Same compression ratio as `playbackMs()`, but for pure presentational
 * rhythm with no real-DOM-settle risk — a keystroke or hover-dwell tick is
 * a trivial DOM write, not a scroll/reflow the browser needs real time to
 * catch up on. PP-50's safety floor doesn't apply and shouldn't: at ~26ms
 * per character, a 48ms floor would swallow the entire compression and
 * leave fast-mode typing indistinguishable from normal speed (PO, 2026-07-24
 * — "type-in is at regular (slow) speed"). Same ratio as `playbackMs()` so
 * the two mechanisms stay in sync when that number is tuned.
 */
export function playbackPacingMs(ms: number, floorMs = 4): number {
  if (playbackTimingMode !== "fast" || ms <= 0) return ms;
  return Math.max(floorMs, Math.round(ms * PLAYBACK_FAST_RATIO));
}

export function isFastPlayback(): boolean {
  return playbackTimingMode === "fast";
}

/** Pacing-only wait (no real-DOM-settle floor) — see playbackPacingMs(). */
export function delayPacing(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, playbackPacingMs(ms)));
}
