/**
 * Human-like REC pacing — code law for agent REC / RecNewCjmProve.
 * Not optional. Emulates real-user speed (no 50ms spam).
 */

export const REC_USER_PACE_MS = {
  /** Pause to “read” after a screen / URL change. */
  afterScreenChange: 1800,
  /** Brief beat before clicking a primary CTA. */
  beforeCta: 900,
  /** Settle after a product click before the next action. */
  afterClick: 1200,
  /** Default gap between unrelated beats. */
  betweenBeats: 1100,
  /**
   * Scroll-stop dwell — must stay ≥ SCROLL_STOP_DWELL_MS (2s) + small buffer
   * so camera beats compile cleanly.
   */
  scrollStopSettle: 2400,
  /** Wait for blocking modal DOM + URL `&modal=` to land. */
  modalOpenWait: 900,
  /** Settle after pharmacy / modal confirm before next page CTA. */
  modalPickSettle: 1100,
} as const;

export type RecUserPaceKey = keyof typeof REC_USER_PACE_MS;

export function recUserPaceMs(key: RecUserPaceKey): number {
  return REC_USER_PACE_MS[key];
}

export function delayRecUserPace(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, Math.max(0, Math.round(ms)));
  });
}

/** Named pace — prefer over raw setTimeout in REC helpers. */
export async function recUserPace(key: RecUserPaceKey): Promise<void> {
  await delayRecUserPace(recUserPaceMs(key));
}
