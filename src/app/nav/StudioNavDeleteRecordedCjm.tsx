import { useEffect, useRef, useState } from "react";
import { flashControlRoomButton } from "@/app/nav/controlRoomTap";
import { logControlPanel } from "@/app/shell/controlPanelLog";

export type StudioNavDeleteRecordedCjmProps = {
  journeyId: string;
  label: string;
  onConfirmDelete: () => void;
};

/** PLP Reset Filters trash glyph — sized for Studio nav step buttons. */
function TrashGlyph() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      aria-hidden
    >
      <path d="M2.5 4h11" strokeLinecap="round" />
      <path
        d="M5.25 4V3.25a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75V4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.25 4l.65 8.25a1.25 1.25 0 0 0 1.25 1.25h3.7a1.25 1.25 0 0 0 1.25-1.25L11.75 4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6.5 6.75v4.5M9.5 6.75v4.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * REC-mode control: delete the selected recorded CJM (not built-in slots).
 * Confirm popup matches Add-as-CJM graphite chrome.
 */
export function StudioNavDeleteRecordedCjm({
  journeyId,
  label,
  onConfirmDelete,
}: StudioNavDeleteRecordedCjmProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [journeyId]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root || root.contains(event.target as Node)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const openConfirm = (event: React.MouseEvent<HTMLButtonElement>) => {
    flashControlRoomButton(event.currentTarget, "studio-nav-scenario__btn--tap");
    logControlPanel("recording:delete-cjm-open", {
      journeyId,
      label,
    });
    setOpen(true);
  };

  const cancel = () => {
    logControlPanel("recording:delete-cjm-cancel", { journeyId, label });
    setOpen(false);
  };

  const confirm = () => {
    logControlPanel("recording:delete-cjm", { journeyId, label });
    setOpen(false);
    onConfirmDelete();
  };

  return (
    <span
      ref={rootRef}
      className="studio-nav-delete-cjm"
      data-studio-delete-recorded-cjm=""
    >
      <button
        type="button"
        className="studio-nav-step-btn studio-nav-scenario__btn"
        aria-label={`Delete CJM ${label}`}
        title={`Delete recorded CJM: ${label}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={openConfirm}
      >
        <TrashGlyph />
      </button>
      {open ? (
        <div
          className="studio-nav-delete-cjm__panel"
          role="dialog"
          aria-label="Delete recorded CJM"
        >
          <p className="studio-nav-delete-cjm__copy">
            Delete{" "}
            <span className="studio-nav-delete-cjm__title">{label}</span>?
            This removes it from the picker for this project and persona.
          </p>
          <div className="studio-nav-delete-cjm__actions">
            <button
              type="button"
              className="studio-nav-delete-cjm__action"
              onClick={cancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="studio-nav-delete-cjm__action studio-nav-delete-cjm__action--danger"
              onClick={confirm}
            >
              DELETE
            </button>
          </div>
        </div>
      ) : null}
    </span>
  );
}
