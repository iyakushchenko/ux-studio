import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { StudioNavLogo } from "@/app/nav/StudioNavLogo";
import { getStudioRelease } from "@/app/shell/studioRelease";
import { useSuppressDialogAutoFocusRing } from "@/app/shell/useSuppressDialogAutoFocusRing";

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      <path d="m3 3 10 10M13 3 3 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function StudioNavProductAbout({ disabled = false }: { disabled?: boolean }) {
  const release = getStudioRelease();
  const [open, setOpen] = useState(false);
  const { panelRef } = useSuppressDialogAutoFocusRing<HTMLDivElement>();
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerInsideRef = useRef(false);
  const closedWhileHoveredRef = useRef(false);
  const lastClosedAtRef = useRef(0);

  const clearHoverTimer = () => {
    if (hoverTimerRef.current != null) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
  };

  useEffect(() => clearHoverTimer, []);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      handleOpenChange(false);
    };
    document.addEventListener("keydown", closeOnEscape, true);
    return () => document.removeEventListener("keydown", closeOnEscape, true);
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    clearHoverTimer();
    if (!next) {
      lastClosedAtRef.current = Date.now();
      closedWhileHoveredRef.current = true;
    }
    setOpen(next);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="studio-nav-product-mark"
          disabled={disabled}
          aria-label="About UXML"
          data-studio-action="open-uxml-about"
          onPointerEnter={() => {
            pointerInsideRef.current = true;
            if (disabled || open || closedWhileHoveredRef.current) return;
            clearHoverTimer();
            hoverTimerRef.current = setTimeout(() => setOpen(true), 180);
          }}
          onPointerLeave={() => {
            pointerInsideRef.current = false;
            closedWhileHoveredRef.current = false;
            clearHoverTimer();
          }}
          onFocus={() => {
            if (!disabled && Date.now() - lastClosedAtRef.current > 250) setOpen(true);
          }}
        >
          UXML
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="studio-nav-product-about__overlay" />
        <Dialog.Content
          ref={panelRef}
          className="studio-nav-product-about__panel"
          data-studio-modal="uxml-about"
          onEscapeKeyDown={(event) => {
            event.preventDefault();
            handleOpenChange(false);
          }}
        >
          <div className="studio-nav-product-about__head">
            <Dialog.Close asChild>
              <button
                type="button"
                className="studio-nav-product-about__close"
                aria-label="Close UXML information"
                data-studio-action="close-uxml-about"
              >
                <CloseIcon />
              </button>
            </Dialog.Close>
          </div>
          <div className="studio-nav-product-about__identity">
            <StudioNavLogo size={38} className="studio-nav-product-about__logo" />
            <Dialog.Title>UXML</Dialog.Title>
            <p className="studio-nav-product-about__name">User Experience Modeling Lab</p>
            <p className="studio-nav-product-about__version">
              Version {release.label} · {release.channel}
            </p>
          </div>
          <Dialog.Description className="studio-nav-product-about__intro">
            UXML is an internal R&amp;D environment for turning early UX direction into interactive product models that teams can explore, test and evolve.
          </Dialog.Description>
          <p className="studio-nav-product-about__body">
            It keeps pages, customer journeys, recording, playback and automated quality checks connected, helping preserve design intent and expose regressions as products grow.
          </p>
          <p className="studio-nav-product-about__body">
            It does not phase out the UX designer. It keeps them exactly where UX expertise is genuinely useful — directing intent as a CX Director — while automation clears the mechanical floor: drafting pages, wiring interactions, and catching regressions before they'd otherwise need a person to find them by hand.
          </p>
          <p className="studio-nav-product-about__maintainer">
            This lab is developed and maintained internally by the UX Department R&amp;D division.
          </p>
          <p className="studio-nav-product-about__alpha">
            UXML is currently in alpha and under active R&amp;D. Bugs and incomplete behavior may be expected.
          </p>
          <p className="studio-nav-product-about__copyright">
            Made in UA with <span aria-label="love">♥</span> by <a href="https://www.linkedin.com/in/iyakushchenko/" target="_blank" rel="noopener noreferrer">Igor Yakushchenko</a> ©
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
