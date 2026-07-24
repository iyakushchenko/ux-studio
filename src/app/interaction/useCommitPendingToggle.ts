import { useEffect, useRef, useState } from "react";
import { playbackMs } from "@/app/shell/playbackTiming";

export type CommitPendingToggle = {
  active: boolean;
  pending: boolean;
  pulsing: boolean;
  /** Bumps once per real commit landing — for consumers that replay a keyed animation (e.g. `CommitPulseIcon`). */
  pulseKey: number;
  onPointerDown: () => void;
  onClick: () => void;
};

/**
 * One shared "toggle now, commit after a delay" affordance — a control
 * flips instantly on press, then holds a real pending/loading state open
 * for `addDelayMs` (compressed by `playbackMs` in fast mode) before the
 * commit lands, so the spinner/pulse IxD has an actual window to show.
 *
 * `pending` is set synchronously inside the same click handler that
 * schedules the commit — not derived from a separate pointerdown-set flag
 * — so it can never be skipped by event-dispatch/render-batching timing,
 * including scripted/fast-mode playback (found live 2026-07-24: PLP and
 * PDP each hand-rolled `pending = optimisticFlip && !committed`, and under
 * scripted clicks the optimistic flip's own render could be swallowed,
 * silently skipping straight to committed with no visible pending state
 * at all — not a speed problem, a derived-state race). One engine-owned
 * hook so any future commit-pending control reuses this guarantee instead
 * of re-deriving it.
 */
export function useCommitPendingToggle(
  id: string,
  isOn: (id: string) => boolean,
  toggle: (id: string) => void,
  addDelayMs: number
): CommitPendingToggle {
  const [tick, setTick] = useState(0);
  const committed = tick >= 0 && isOn(id);

  const [optimisticOn, setOptimisticOn] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasOnRef = useRef(committed);

  const active = optimisticOn ?? committed;

  useEffect(() => {
    setOptimisticOn(null);
    if (!wasOnRef.current && committed) {
      setPulsing(true);
      setPulseKey((k) => k + 1);
      wasOnRef.current = committed;
      const t = setTimeout(() => setPulsing(false), 320);
      return () => clearTimeout(t);
    }
    wasOnRef.current = committed;
  }, [committed]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  function onPointerDown(): void {
    setOptimisticOn(!active);
  }

  function onClick(): void {
    const pendingTimer = timerRef.current;
    if (committed || pendingTimer != null) {
      if (pendingTimer != null) {
        // Still pending — cancel; nothing was ever committed.
        clearTimeout(pendingTimer);
        timerRef.current = null;
        setPending(false);
        setOptimisticOn(null);
        return;
      }
      toggle(id);
      setTick((t) => t + 1);
      return;
    }
    setPending(true);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setPending(false);
      toggle(id);
      setTick((t) => t + 1);
    }, playbackMs(addDelayMs));
  }

  return { active, pending, pulsing, pulseKey, onPointerDown, onClick };
}
