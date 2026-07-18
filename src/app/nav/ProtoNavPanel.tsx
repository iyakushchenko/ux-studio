import { useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";
import { ProtoNavLogo } from "@/app/nav/ProtoNavLogo";
import { protoNavIndex } from "@/projects/boots-pharmacy/screens/protoScreens";
import { useProtoNavZoom } from "@/app/nav/protoNavZoom";
import "./protoNavPanel.css";

export type ProtoNavScreen = {
  label: string;
  childIndex: number;
};

type Props = {
  screens: readonly ProtoNavScreen[];
  hubLabel: string;
  current: number;
  hubOpen: boolean;
  navLabel: string;
  isProtoPristine: boolean;
  /** Locks tab strip / dots / prev-next while journey playback is on-air. */
  navPlaybackLocked?: boolean;
  contentRef: RefObject<HTMLElement | null>;
  tabsScrollRef: RefObject<HTMLDivElement | null>;
  tabBtnRefs: RefObject<(HTMLButtonElement | null)[]>;
  onOpenHub: () => void;
  onGo: (index: number) => void;
  onReset: () => void;
  scenarioControls?: ReactNode;
};

/**
 * Prototype nav in document flow — counter-zoom via useProtoNavZoom (see protoNavZoom.ts).
 *
 * ⚠️ Do not add height sync, fixed positioning, or layout hacks here — they break zoom.
 */
export default function ProtoNavPanel({
  screens,
  hubLabel,
  current,
  hubOpen,
  navLabel,
  isProtoPristine,
  navPlaybackLocked = false,
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

  useProtoNavZoom(hostRef, shellRef, contentRef, zoomLabelRef);

  useLayoutEffect(() => {
    document.getElementById("proto-nav-panel-root")?.remove();
  }, []);

  const screenCount = screens.length;
  const navIndex = protoNavIndex(hubOpen, current);

  const onPrevious = () => {
    if (navPlaybackLocked || hubOpen) return;
    if (current === 0) onOpenHub();
    else onGo(current - 1);
  };

  const onNext = () => {
    if (navPlaybackLocked) return;
    if (hubOpen) onGo(0);
    else if (current < screenCount - 1) onGo(current + 1);
  };

  return (
    <div
      ref={hostRef}
      className={`proto-nav-panel-host${
        navPlaybackLocked ? " proto-nav-panel-host--playback-locked" : ""
      }`}
    >
      <div ref={shellRef} className="proto-nav-panel">
        <div className="proto-nav-chrome">
          <div ref={tabsScrollRef} className="proto-nav-tabs">
            <button
              type="button"
              onClick={onOpenHub}
              disabled={navPlaybackLocked}
              title={hubLabel}
              aria-label={`Open ${hubLabel}`}
              aria-current={hubOpen ? "page" : undefined}
              className={
                hubOpen
                  ? "proto-nav-logo-btn proto-nav-logo-btn--active"
                  : "proto-nav-logo-btn"
              }
            >
              <ProtoNavLogo />
            </button>
            {screens.map((screen: ProtoNavScreen, i) => (
              <button
                key={screen.childIndex}
                ref={(node) => {
                  if (tabBtnRefs.current) tabBtnRefs.current[i] = node;
                }}
                onClick={() => onGo(i)}
                disabled={navPlaybackLocked}
                className={
                  !hubOpen && i === current
                    ? "proto-nav-tab proto-nav-tab--active"
                    : "proto-nav-tab"
                }
              >
                <span className="proto-nav-tab__badge">{i + 1}</span>
                {screen.label}
              </button>
            ))}
          </div>

          <div className="proto-nav-status-bar px-4 py-2 bg-black/20 border-t border-white/10">
            <div className="proto-nav-status-bar__start">
              <div
                className="proto-nav-dots flex gap-1"
                role="group"
                aria-label="Screen position"
              >
                <button
                  type="button"
                  onClick={onOpenHub}
                  disabled={navPlaybackLocked}
                  aria-label={hubLabel}
                  aria-current={hubOpen ? "true" : undefined}
                  className={
                    hubOpen
                      ? "proto-nav-dot proto-nav-dot--active"
                      : "proto-nav-dot"
                  }
                />
                {screens.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onGo(i)}
                    disabled={navPlaybackLocked}
                    aria-label={`Screen ${i + 1}`}
                    aria-current={!hubOpen && i === current ? "true" : undefined}
                    className={
                      !hubOpen && i === current
                        ? "proto-nav-dot proto-nav-dot--active"
                        : "proto-nav-dot"
                    }
                  />
                ))}
              </div>
              <span className="text-white/45 text-[10px] shrink-0">
                {navIndex} / {screenCount}
              </span>
              {!isProtoPristine ? (
                <button
                  type="button"
                  onClick={onReset}
                  disabled={navPlaybackLocked}
                  title="Reset page states (stay on this screen)"
                  className="proto-nav-reset-state"
                >
                  Reset
                </button>
              ) : null}
            </div>

            <p className="proto-nav-status-bar__title">{navLabel}</p>

            <div className="proto-nav-stepper">
              <div
                className="proto-nav-stepper__scenario-slot"
                aria-hidden={!scenarioControls}
              >
                {scenarioControls}
              </div>
              <span
                ref={zoomLabelRef}
                className="proto-nav-zoom-label"
                title="Current Page Zoom"
              >
                100%
              </span>
              <button
                type="button"
                onClick={onPrevious}
                disabled={navPlaybackLocked || hubOpen}
                className="proto-nav-step-btn"
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
                Previous
              </button>
              <button
                type="button"
                onClick={onNext}
                disabled={
                  navPlaybackLocked || (!hubOpen && current === screenCount - 1)
                }
                className="proto-nav-step-btn"
              >
                Next
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
