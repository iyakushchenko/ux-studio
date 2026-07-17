import { useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";
import { ProtoNavLogo } from "@/app/nav/ProtoNavLogo";
import {
  PROTO_HUB_LABEL,
  PROTO_SCREENS,
  protoNavIndex,
  type ProtoScreen,
} from "@/app/proto/protoScreens";
import { useProtoNavZoom } from "@/app/nav/protoNavZoom";
import "./protoNavPanel.css";

type Props = {
  current: number;
  hubOpen: boolean;
  navLabel: string;
  isProtoPristine: boolean;
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
  current,
  hubOpen,
  navLabel,
  isProtoPristine,
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

  const screenCount = PROTO_SCREENS.length;
  const navIndex = protoNavIndex(hubOpen, current);

  const onPrevious = () => {
    if (hubOpen) return;
    if (current === 0) onOpenHub();
    else onGo(current - 1);
  };

  const onNext = () => {
    if (hubOpen) onGo(0);
    else if (current < screenCount - 1) onGo(current + 1);
  };

  return (
    <div ref={hostRef} className="proto-nav-panel-host">
      <div ref={shellRef} className="proto-nav-panel">
        <div className="proto-nav-chrome">
          <div ref={tabsScrollRef} className="proto-nav-tabs">
            <button
              type="button"
              onClick={onOpenHub}
              title={PROTO_HUB_LABEL}
              aria-label={`Open ${PROTO_HUB_LABEL}`}
              aria-current={hubOpen ? "page" : undefined}
              className={
                hubOpen
                  ? "proto-nav-logo-btn proto-nav-logo-btn--active"
                  : "proto-nav-logo-btn"
              }
            >
              <ProtoNavLogo />
            </button>
            {PROTO_SCREENS.map((screen: ProtoScreen, i) => (
              <button
                key={screen.childIndex}
                ref={(node) => {
                  if (tabBtnRefs.current) tabBtnRefs.current[i] = node;
                }}
                onClick={() => onGo(i)}
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
                  aria-label={PROTO_HUB_LABEL}
                  aria-current={hubOpen ? "true" : undefined}
                  className={
                    hubOpen
                      ? "proto-nav-dot proto-nav-dot--active"
                      : "proto-nav-dot"
                  }
                />
                {PROTO_SCREENS.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onGo(i)}
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
                disabled={hubOpen}
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
                disabled={!hubOpen && current === screenCount - 1}
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
