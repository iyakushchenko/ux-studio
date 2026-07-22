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

/** Compress presentation time only; callers keep DOM/readiness guards intact. */
export function playbackMs(ms: number, floorMs = 12): number {
  if (playbackTimingMode !== "fast" || ms <= 0) return ms;
  return Math.max(floorMs, Math.round(ms * 0.06));
}

export function isFastPlayback(): boolean {
  return playbackTimingMode === "fast";
}
