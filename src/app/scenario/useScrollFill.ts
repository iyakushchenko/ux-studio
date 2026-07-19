import { useLayoutEffect, type RefObject } from "react";

const MIN_H_VAR = "--studio-scroll-min-px";

/** Keep prototype scroll content at least as tall as the visible scroll pane (zoom-safe). */
export function useScrollFill(
  scrollRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): void {
  useLayoutEffect(() => {
    if (!enabled) return;

    const el = scrollRef.current;
    if (!el) return;

    const apply = () => {
      const h = el.clientHeight;
      if (h > 0) {
        el.style.setProperty(MIN_H_VAR, `${h}px`);
      }
    };

    apply();

    const ro = new ResizeObserver(apply);
    ro.observe(el);

    const vv = window.visualViewport;
    vv?.addEventListener("resize", apply);
    window.addEventListener("resize", apply);

    const pollId = window.setInterval(apply, 250);

    return () => {
      ro.disconnect();
      vv?.removeEventListener("resize", apply);
      window.removeEventListener("resize", apply);
      window.clearInterval(pollId);
      el.style.removeProperty(MIN_H_VAR);
    };
  }, [scrollRef, enabled]);
}
