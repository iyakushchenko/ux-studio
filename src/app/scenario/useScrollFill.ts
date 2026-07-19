import { useLayoutEffect, type RefObject } from "react";
import {
  STUDIO_SCROLL_OVERFLOW_ATTR,
  STUDIO_SCROLL_OVERFLOW_CLASS,
  syncStudioScrollOverflowGutter,
} from "./studioScrollOverflow";

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
      // Reserve classic scrollbar track only when Y actually overflows (no empty white strip).
      syncStudioScrollOverflowGutter(el);
    };

    apply();

    const ro = new ResizeObserver(apply);
    ro.observe(el);
    const viewport = el.querySelector<HTMLElement>(":scope > .studio-viewport");
    if (viewport) ro.observe(viewport);

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
      el.classList.remove(STUDIO_SCROLL_OVERFLOW_CLASS);
      el.removeAttribute(STUDIO_SCROLL_OVERFLOW_ATTR);
    };
  }, [scrollRef, enabled]);
}
