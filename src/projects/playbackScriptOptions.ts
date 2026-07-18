/** Shared options for all journey playback script runners (director + retreat sync). */
export type PlaybackScriptOptions = {
  /** Apply interactions instantly — no demo cursor animation. */
  skip?: boolean;
  /** Restore cumulative UI for manual beat stepping / CJM step-back. */
  syncState?: boolean;
  /** Beat-enter / step-back sync — snap scroll and DOM with no eased camera moves. */
  instant?: boolean;
};

/** Options passed into shell-owned retreat sync (always skip + syncState). */
export type RetreatScriptOptions = PlaybackScriptOptions & {
  skip: true;
  syncState: true;
};

export function retreatScriptOptions(instant?: boolean): RetreatScriptOptions {
  return { skip: true, syncState: true, instant: instant ?? true };
}
