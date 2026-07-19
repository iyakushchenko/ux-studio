import { useCallback, useEffect, useRef, useState } from "react";

const CROSSFADE_MS = 280;
const SWAP_AT_MS = Math.round(CROSSFADE_MS * 0.48);

export function prefersReducedNavMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Crossfade on `.studio-wire-mount` — fade out, swap screen at midpoint, fade in.
 * Uses a monotonic token so consecutive panel navigations always restart the animation.
 */
export function useNavTransition() {
  const [crossToken, setCrossToken] = useState(0);
  const swapTimerRef = useRef<number | null>(null);
  const endTimerRef = useRef<number | null>(null);
  const crossIdRef = useRef(0);

  const clearTimers = useCallback(() => {
    if (swapTimerRef.current != null) {
      window.clearTimeout(swapTimerRef.current);
      swapTimerRef.current = null;
    }
    if (endTimerRef.current != null) {
      window.clearTimeout(endTimerRef.current);
      endTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const runNavTransition = useCallback(
    (apply: () => void, options?: { instant?: boolean }) => {
      clearTimers();
      if (options?.instant || prefersReducedNavMotion()) {
        setCrossToken(0);
        apply();
        return;
      }

      const crossId = ++crossIdRef.current;
      setCrossToken(crossId);

      swapTimerRef.current = window.setTimeout(() => {
        swapTimerRef.current = null;
        if (crossIdRef.current !== crossId) return;
        apply();
      }, SWAP_AT_MS);

      endTimerRef.current = window.setTimeout(() => {
        endTimerRef.current = null;
        if (crossIdRef.current !== crossId) return;
        setCrossToken(0);
      }, CROSSFADE_MS);
    },
    [clearTimers]
  );

  const navTransitionClass =
    crossToken > 0
      ? ` studio-wire-mount--nav-cross studio-wire-mount--nav-cross-${crossToken}`
      : "";

  return { runNavTransition, navTransitionClass };
}
