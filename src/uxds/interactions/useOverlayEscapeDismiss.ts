import { useEffect } from "react";

export type UseOverlayEscapeDismissOptions = {
  /** Only listens while the overlay is actually open. */
  open: boolean;
  onDismiss?: () => void;
};

/**
 * Escape-key dismiss for any open overlay that owns a scrim (mega-menu
 * flyout, full-screen search, future lightboxes) — shared so every overlay
 * kit gets the same dismiss contract instead of each hand-rolling its own
 * `keydown` listener. Pair with a plain `onClick={onDismiss}` on the kit's
 * own scrim element (kept as a normal prop, not part of this hook, since
 * the scrim DOM node differs per kit).
 */
export function useOverlayEscapeDismiss({
  open,
  onDismiss,
}: UseOverlayEscapeDismissOptions): void {
  useEffect(() => {
    if (!open || !onDismiss) return;
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") onDismiss();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onDismiss]);
}
