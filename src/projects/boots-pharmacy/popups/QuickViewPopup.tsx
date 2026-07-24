import type { MouseEvent } from "react";
import { CloseIcon } from "@/app/chrome/CloseIcon";
import { useOverlayDismiss } from "@/app/chrome/useOverlayDismiss";
import { PdpRtbCard } from "@/projects/boots-pharmacy/screens/pdp/PdpRtbCard";

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

  if (!mounted) return null;

  const onScrim = (e: MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className={scrimClassName}
      role="presentation"
      data-studio-modal="quick-view"
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
        <div className="proto-avail-body proto-quick-view-body proto-quick-view-popup">
          {open ? (
            <PdpRtbCard
              includeBoosterDose={includeBoosterDose}
              onToggleBooster={onToggleBooster}
              onBookNow={onBookNow}
              loggedIn={loggedIn}
              onOpenLogin={onOpenLogin}
              secondaryLabel="View Details"
              onSecondaryAction={onViewDetails}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
