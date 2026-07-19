import { useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";
import { StudioNavLogo } from "@/app/nav/StudioNavLogo";
import { studioNavIndex } from "@/projects/boots-pharmacy/screens/screens";
import { useStudioNavZoom } from "@/app/nav/studioNavZoom";
import { logControlPanel } from "@/app/shell/controlPanelLog";
/* PANEL CSS: imported via src/styles/index.css (BASE → THEME → PANEL → LEGACY). */

export type StudioNavScreen = {
  label: string;
  childIndex: number;
};

type Props = {
  screens: readonly StudioNavScreen[];
  hubLabel: string;
  current: number;
  hubOpen: boolean;
  navLabel: string;
  isStudioPristine: boolean;
  /** Locks tabs, dots, hub, and prev/next (journey mode or on-air). */
  navBrowseLocked?: boolean;
  /** Locks reset during live transport scripts. */
  navResetLocked?: boolean;
  /** Visual hint when journey mode switch is on (browse nav locked). */
  journeyMode?: boolean;
  contentRef: RefObject<HTMLElement | null>;
  tabsScrollRef: RefObject<HTMLDivElement | null>;
  tabBtnRefs: RefObject<(HTMLButtonElement | null)[]>;
  onOpenHub: () => void;
  onGo: (index: number) => void;
  onReset: () => void;
  scenarioControls?: ReactNode;
};

/**
 * Prototype nav in document flow — counter-zoom via useStudioNavZoom (see studioNavZoom.ts).
 *
 * ⚠️ Do not add height sync, fixed positioning, or layout hacks here — they break zoom.
 */
export default function StudioNavPanel({
  screens,
  hubLabel,
  current,
  hubOpen,
  navLabel,
  isStudioPristine,
  navBrowseLocked = false,
  navResetLocked = false,
  journeyMode = false,
  contentRef,
  tabsScrollRef,
  tabBtnRefs,
  onOpenHub,
  onGo,
  onReset,
  scenarioControls,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const zoomLabelRef = useRef<HTMLSpanElement>(null);

  useStudioNavZoom(hostRef, shellRef, contentRef, zoomLabelRef);

  useLayoutEffect(() => {
    document.getElementById("studio-nav-panel-root")?.remove();
  }, []);

  const screenCount = screens.length;
  const navIndex = studioNavIndex(hubOpen, current);

  const onPrevious = () => {
    if (navBrowseLocked || hubOpen) {
      logControlPanel("nav:prev-screen", {
        blocked: true,
        blockReason: navBrowseLocked ? "navBrowseLocked" : "hubOpen",
        current,
        hubOpen,
      });
      return;
    }
    logControlPanel("nav:prev-screen", { current, hubOpen });
    if (current === 0) onOpenHub();
    else onGo(current - 1);
  };

  const onNext = () => {
    if (navBrowseLocked) {
      logControlPanel("nav:next-screen", {
        blocked: true,
        blockReason: "navBrowseLocked",
        current,
        hubOpen,
      });
      return;
    }
    if (hubOpen) {
      logControlPanel("nav:next-screen", { from: "hub", to: 0 });
      onGo(0);
      return;
    }
    if (current < screenCount - 1) {
      logControlPanel("nav:next-screen", { from: current, to: current + 1 });
      onGo(current + 1);
      return;
    }
    logControlPanel("nav:next-screen", {
      blocked: true,
      blockReason: "at-last-screen",
      current,
    });
  };

  const handleOpenHub = () => {
    logControlPanel("nav:hub", { hubOpen, togglingTo: !hubOpen });
    onOpenHub();
  };

  const handleGoTab = (index: number) => {
    if (navBrowseLocked) {
      logControlPanel("nav:tab", {
        blocked: true,
        blockReason: "navBrowseLocked",
        targetIndex: index,
        targetLabel: screens[index]?.label,
      });
      return;
    }
    logControlPanel("nav:tab", {
      from: current,
      to: index,
      label: screens[index]?.label,
      childIndex: screens[index]?.childIndex,
    });
    onGo(index);
  };

  const handleGoDot = (index: number) => {
    if (navBrowseLocked) {
      logControlPanel("nav:dot", {
        blocked: true,
        blockReason: "navBrowseLocked",
        targetIndex: index,
      });
      return;
    }
    logControlPanel("nav:dot", { from: current, to: index });
    onGo(index);
  };

  const handleReset = () => {
    if (navResetLocked) {
      logControlPanel("nav:reset-page", {
        blocked: true,
        blockReason: "navResetLocked",
        current,
        label: screens[current]?.label,
      });
      return;
    }
    logControlPanel("nav:reset-page", {
      current,
      label: screens[current]?.label,
      childIndex: screens[current]?.childIndex,
    });
    onReset();
  };

  return (
    <div
      ref={hostRef}
      className={`studio-nav-panel-host${
        navBrowseLocked ? " studio-nav-panel-host--playback-locked" : ""
      }${journeyMode ? " studio-nav-panel-host--journey-mode" : ""}`}
    >
      <div ref={shellRef} className="studio-nav-panel">
        <div className="studio-nav-chrome">
          <div ref={tabsScrollRef} className="studio-nav-tabs">
            <button
              type="button"
              onClick={handleOpenHub}
              title={hubLabel}
              aria-label={`Open ${hubLabel}`}
              aria-current={hubOpen ? "page" : undefined}
              className={
                hubOpen
                  ? "studio-nav-logo-btn studio-nav-logo-btn--active"
                  : "studio-nav-logo-btn"
              }
            >
              <StudioNavLogo />
            </button>
            {screens.map((screen: StudioNavScreen, i) => (
              <button
                key={screen.childIndex}
                ref={(node) => {
                  if (tabBtnRefs.current) tabBtnRefs.current[i] = node;
                }}
                onClick={() => handleGoTab(i)}
                disabled={navBrowseLocked}
                className={
                  !hubOpen && i === current
                    ? "studio-nav-tab studio-nav-tab--active"
                    : "studio-nav-tab"
                }
              >
                <span className="studio-nav-tab__badge">{i + 1}</span>
                {screen.label}
              </button>
            ))}
          </div>

          <div className="studio-nav-status-bar px-4 py-2 bg-black/20 border-t border-white/10">
            <div className="studio-nav-status-bar__start">
              <div
                className="studio-nav-dots flex gap-1"
                role="group"
                aria-label="Screen position"
              >
                <button
                  type="button"
                  onClick={onOpenHub}
                  aria-label={hubLabel}
                  aria-current={hubOpen ? "true" : undefined}
                  className={
                    hubOpen
                      ? "studio-nav-dot studio-nav-dot--hub studio-nav-dot--active"
                      : "studio-nav-dot studio-nav-dot--hub"
                  }
                />
                {screens.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleGoDot(i)}
                    disabled={navBrowseLocked}
                    aria-label={`Screen ${i + 1}`}
                    aria-current={!hubOpen && i === current ? "true" : undefined}
                    className={
                      !hubOpen && i === current
                        ? "studio-nav-dot studio-nav-dot--active"
                        : "studio-nav-dot"
                    }
                  />
                ))}
              </div>
              <span className="text-white/45 text-[10px] shrink-0">
                {navIndex} / {screenCount}
              </span>
              {!isStudioPristine ? (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={navResetLocked}
                  title="Reset prototype to defaults"
                  className="studio-nav-reset-state"
                >
                  Reset
                </button>
              ) : null}
            </div>

            <p className="studio-nav-status-bar__title">{navLabel}</p>

            <div className="studio-nav-stepper">
              <div
                className="studio-nav-stepper__scenario-slot"
                aria-hidden={!scenarioControls}
              >
                {scenarioControls}
              </div>
              <span
                ref={zoomLabelRef}
                className="studio-nav-zoom-label"
                title="Current Page Zoom"
              >
                100%
              </span>
              <button
                type="button"
                onClick={onPrevious}
                disabled={navBrowseLocked || hubOpen}
                className="studio-nav-step-btn studio-nav-step-btn--icon-only"
                aria-label="Previous screen"
                title="Previous screen"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path
                    d="M7.5 2L3.5 6L7.5 10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={onNext}
                disabled={
                  navBrowseLocked || (!hubOpen && current === screenCount - 1)
                }
                className="studio-nav-step-btn studio-nav-step-btn--icon-only"
                aria-label="Next screen"
                title="Next screen"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path
                    d="M4.5 2L8.5 6L4.5 10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
