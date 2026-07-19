import { useEffect, useLayoutEffect, useRef, type MouseEvent } from "react";
import { CloseIcon } from "@/app/chrome/CloseIcon";
import { useOverlayDismiss } from "@/app/chrome/useOverlayDismiss";
import {
  clonePdpRtbStack,
  syncQuickViewBoosterState,
  wireQuickViewRtb,
} from "@/projects/boots-pharmacy/dom/pdpRtb";

type Props = {
  open: boolean;
  includeBoosterDose: boolean;
  loggedIn: boolean;
  onClose: () => void;
  onBookNow: () => void;
  onViewDetails: () => void;
  onToggleBooster: () => void;
  onOpenLogin: (tab: "signin" | "create") => void;
};

export default function QuickViewPopup({
  open,
  includeBoosterDose,
  loggedIn,
  onClose,
  onBookNow,
  onViewDetails,
  onToggleBooster,
  onOpenLogin,
}: Props) {
  const { mounted, scrimClassName, onScrimAnimationEnd } = useOverlayDismiss(open);
  const mountRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const onBookNowRef = useRef(onBookNow);
  const onViewDetailsRef = useRef(onViewDetails);
  const onToggleBoosterRef = useRef(onToggleBooster);
  const onOpenLoginRef = useRef(onOpenLogin);
  const loggedInRef = useRef(loggedIn);

  onBookNowRef.current = onBookNow;
  onViewDetailsRef.current = onViewDetails;
  onToggleBoosterRef.current = onToggleBooster;
  onOpenLoginRef.current = onOpenLogin;
  loggedInRef.current = loggedIn;

  useLayoutEffect(() => {
    if (!mounted) {
      cleanupRef.current?.();
      cleanupRef.current = null;
      mountRef.current?.replaceChildren();
      return;
    }
    if (!open) return;

    cleanupRef.current?.();
    cleanupRef.current = null;

    const mount = mountRef.current;
    if (!mount) return;

    mount.replaceChildren();
    const clone = clonePdpRtbStack();
    if (!clone) return;

    mount.appendChild(clone);
    syncQuickViewBoosterState(clone, includeBoosterDose);
    cleanupRef.current = wireQuickViewRtb(clone, {
      onBookNow: () => onBookNowRef.current(),
      onViewDetails: () => onViewDetailsRef.current(),
      onToggleBooster: () => onToggleBoosterRef.current(),
      onOpenLogin: (tab) => onOpenLoginRef.current(tab),
      loggedIn: loggedInRef.current,
    });

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [mounted, open, includeBoosterDose]);

  useEffect(() => {
    if (!open) return;
    const clone = mountRef.current?.querySelector<HTMLElement>(
      '[data-studio-quick-view-clone="true"]'
    );
    if (!clone) return;
    syncQuickViewBoosterState(clone, includeBoosterDose);

    const reqText = Array.from(clone.querySelectorAll<HTMLParagraphElement>("p")).find((p) =>
      p.textContent?.includes("Boots Account will be required")
    );
    const loginBlock = reqText?.parentElement;
    if (loginBlock) {
      loginBlock.style.display = loggedIn ? "none" : "";
    }
  }, [open, includeBoosterDose, loggedIn]);

  if (!mounted) return null;

  const onScrim = (e: MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className={scrimClassName}
      role="presentation"
      onClick={onScrim}
      onAnimationEnd={onScrimAnimationEnd}
    >
      <div
        className="proto-avail-card proto-quick-view-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="proto-quick-view-title"
      >
        <div className="proto-avail-header">
          <h2 id="proto-quick-view-title" className="proto-avail-title">
            Quick view
          </h2>
          <button
            type="button"
            className="proto-popup-close"
            aria-label="Close quick view"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>
        <div
          ref={mountRef}
          className="proto-avail-body proto-quick-view-body proto-quick-view-popup"
        />
      </div>
    </div>
  );
}
