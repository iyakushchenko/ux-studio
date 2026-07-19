import { useCallback, useEffect, useRef, useState, type AnimationEvent } from "react";

/** Exit duration — keep in sync with `.studio-avail-scrim--closing` in globals-screens.css */
export const OVERLAY_EXIT_MS = 280;

/**
 * Keeps overlay DOM mounted while close animations run (fade + slide).
 * Parent sets `open={false}` immediately; unmount happens after exit completes.
 */
export function useOverlayDismiss(open: boolean) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      if (closeTimerRef.current != null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setMounted(true);
      setClosing(false);
      return;
    }
    if (!mounted) return;
    setClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      setMounted(false);
      setClosing(false);
    }, OVERLAY_EXIT_MS);
  }, [open, mounted]);

  useEffect(
    () => () => {
      if (closeTimerRef.current != null) {
        window.clearTimeout(closeTimerRef.current);
      }
    },
    []
  );

  const scrimClassName = closing
    ? "studio-avail-scrim studio-avail-scrim--closing"
    : "studio-avail-scrim";

  const onScrimAnimationEnd = useCallback(
    (event: AnimationEvent<HTMLElement>) => {
      if (!closing || event.target !== event.currentTarget) return;
      if (event.animationName !== "proto-avail-fade-out") return;
      if (closeTimerRef.current != null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setMounted(false);
      setClosing(false);
    },
    [closing]
  );

  return { mounted, closing, scrimClassName, onScrimAnimationEnd };
}
