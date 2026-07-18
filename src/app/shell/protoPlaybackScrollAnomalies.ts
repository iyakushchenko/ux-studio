export type ScrollAnomalyKind =
  | "scroll-reversal"
  | "scroll-jump"
  | "scroll-stutter"
  | "scroll-interrupted"
  | "scroll-competing"
  | "scroll-path-deviation"
  | "scroll-excessive-burst";

export type ScrollAnomaly = {
  kind: ScrollAnomalyKind;
  message: string;
  detail?: string;
};

export type ScrollSample = {
  t: number;
  top: number;
};

export const SCROLL_REVERSAL_WINDOW_MS = 700;
export const SCROLL_REVERSAL_MIN_DELTA_PX = 10;
export const SCROLL_REVERSAL_MIN_COUNT = 3;
export const SCROLL_JUMP_OUTSIDE_ANIM_PX = 52;
export const SCROLL_STUTTER_FRAME_MS = 50;
export const SCROLL_STUTTER_MIN_FRAMES = 3;
export const SCROLL_PATH_DEVIATION_PX = 36;

/** After a viewport director script ends — extra eased scrolls in this window are suspicious. */
export const SCROLL_BURST_POST_SCRIPT_MS = 1400;
/** More than one additional eased scroll after select-book-time / reserve is excessive. */
export const SCROLL_BURST_MAX_POST_SCRIPT_ANIMATIONS = 1;
/** Cumulative passive travel in the post-script window (stacked camera moves). */
export const SCROLL_BURST_POST_SCRIPT_TRAVEL_PX = 300;

export type ScrollBurstContext = {
  scriptLabel?: string;
  animationStarts: number;
  travelPx: number;
  windowMs: number;
};

export function detectScrollIntraScriptStack(ctx: {
  scriptLabel?: string;
  animationStarts: number;
}): ScrollAnomaly | null {
  if (ctx.animationStarts <= 1) return null;
  const script = ctx.scriptLabel ? `"${ctx.scriptLabel}"` : "director script";
  return {
    kind: "scroll-competing",
    message: `Stacked eased scrolls during ${script} (${ctx.animationStarts} starts before outcome)`,
    detail: `animationStarts=${ctx.animationStarts} script=${ctx.scriptLabel ?? "?"}`,
  };
}

export function detectScrollExcessiveBurst(
  ctx: ScrollBurstContext
): ScrollAnomaly | null {
  const overAnimations =
    ctx.animationStarts > SCROLL_BURST_MAX_POST_SCRIPT_ANIMATIONS;
  const overTravel =
    ctx.animationStarts > SCROLL_BURST_MAX_POST_SCRIPT_ANIMATIONS &&
    ctx.travelPx >= SCROLL_BURST_POST_SCRIPT_TRAVEL_PX;
  if (!overAnimations && !overTravel) return null;

  const script = ctx.scriptLabel ? `"${ctx.scriptLabel}"` : "director script";
  const reason = overAnimations
    ? `${ctx.animationStarts} eased scroll(s) within ${ctx.windowMs}ms after ${script} finished`
    : `${Math.round(ctx.travelPx)}px scroll travel within ${ctx.windowMs}ms after ${script} finished`;

  return {
    kind: "scroll-excessive-burst",
    message: `Excessive scroll after ${script}: ${reason}`,
    detail: `animationStarts=${ctx.animationStarts} travelPx=${Math.round(ctx.travelPx)} windowMs=${ctx.windowMs}`,
  };
}

export function easeInOutCubic(progress: number): number {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

export function detectScrollReversals(
  samples: ScrollSample[],
  now = samples.at(-1)?.t ?? 0
): ScrollAnomaly | null {
  const window = samples.filter((s) => now - s.t <= SCROLL_REVERSAL_WINDOW_MS);
  if (window.length < 4) return null;

  let reversals = 0;
  let lastDir = 0;

  for (let i = 1; i < window.length; i++) {
    const delta = window[i].top - window[i - 1].top;
    if (Math.abs(delta) < SCROLL_REVERSAL_MIN_DELTA_PX) continue;
    const dir = delta > 0 ? 1 : -1;
    if (lastDir !== 0 && dir !== lastDir) reversals += 1;
    lastDir = dir;
  }

  if (reversals < SCROLL_REVERSAL_MIN_COUNT) return null;

  return {
    kind: "scroll-reversal",
    message: `Scroll reversed direction ${reversals} times in ${SCROLL_REVERSAL_WINDOW_MS}ms`,
    detail: `samples=${window.length} lastTop=${window.at(-1)?.top ?? "?"}`,
  };
}

/** Passive wheel/trackpad scroll at journey end (transport idle) is user review — not a playback bug. */
export function shouldReportPassiveScrollAnomaly(ctx: {
  isOnAir: boolean;
  isPausingBeforeReveal: boolean;
  journeyAtEnd?: boolean;
}): boolean {
  if (
    ctx.journeyAtEnd &&
    !ctx.isOnAir &&
    !ctx.isPausingBeforeReveal
  ) {
    return false;
  }
  return true;
}

export function detectScrollJump(
  prevTop: number,
  nextTop: number,
  frameMs: number
): ScrollAnomaly | null {
  const delta = Math.abs(nextTop - prevTop);
  if (delta < SCROLL_JUMP_OUTSIDE_ANIM_PX) return null;
  return {
    kind: "scroll-jump",
    message: `Scroll jumped ${Math.round(delta)}px outside eased animation`,
    detail: `frameMs=${Math.round(frameMs)} from=${Math.round(prevTop)} to=${Math.round(nextTop)}`,
  };
}

export function detectScrollStutter(stutterFrames: number): ScrollAnomaly | null {
  if (stutterFrames < SCROLL_STUTTER_MIN_FRAMES) return null;
  return {
    kind: "scroll-stutter",
    message: `Scroll animation stuttered (${stutterFrames} frames > ${SCROLL_STUTTER_FRAME_MS}ms)`,
    detail: `thresholdMs=${SCROLL_STUTTER_FRAME_MS}`,
  };
}

export function detectScrollPathDeviation(options: {
  startTop: number;
  targetTop: number;
  duration: number;
  startTime: number;
  actualTop: number;
  now: number;
}): ScrollAnomaly | null {
  const { startTop, targetTop, duration, startTime, actualTop, now } = options;
  if (duration <= 0) return null;
  const progress = Math.min(1, Math.max(0, (now - startTime) / duration));
  if (progress >= 1) return null;
  const expected =
    startTop + (targetTop - startTop) * easeInOutCubic(progress);
  const deviation = Math.abs(actualTop - expected);
  if (deviation < SCROLL_PATH_DEVIATION_PX) return null;
  return {
    kind: "scroll-path-deviation",
    message: `Eased scroll deviated ${Math.round(deviation)}px from expected path`,
    detail: `progress=${progress.toFixed(2)} expected=${Math.round(expected)} actual=${Math.round(actualTop)}`,
  };
}
