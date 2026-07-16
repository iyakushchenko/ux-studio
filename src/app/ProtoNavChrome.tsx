import type { RefObject } from "react";
import { ProtoNavLogo } from "@/app/ProtoNavLogo";
import {
  PROTO_HUB_LABEL,
  PROTO_SCREENS,
  protoNavIndex,
  type ProtoScreen,
} from "@/app/protoScreens";

type Props = {
  current: number;
  hubOpen: boolean;
  navLabel: string;
  isProtoPristine: boolean;
  tabsScrollRef: RefObject<HTMLDivElement | null>;
  tabBtnRefs: RefObject<(HTMLButtonElement | null)[]>;
  onOpenHub: () => void;
  onGo: (index: number) => void;
  onReset: () => void;
};

export default function ProtoNavChrome({
  current,
  hubOpen,
  navLabel,
  isProtoPristine,
  tabsScrollRef,
  tabBtnRefs,
  onOpenHub,
  onGo,
  onReset,
}: Props) {
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
    <div className="shrink-0 bg-[#2e2e2e] shadow-lg" style={{ zIndex: 100 }}>
      <div
        ref={tabsScrollRef}
        className="proto-nav-tabs flex items-center overflow-x-auto overflow-y-hidden px-2 pt-2 gap-1"
        style={{
          scrollbarWidth: "none",
          overscrollBehaviorX: "contain",
        }}
      >
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
            className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold whitespace-nowrap rounded-t transition-all select-none shrink-0 ${
              !hubOpen && i === current
                ? "bg-[#467672] text-white"
                : "text-white/55 hover:text-white hover:bg-white/10"
            }`}
          >
            <span
              className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold shrink-0 ${
                !hubOpen && i === current
                  ? "bg-white/25 text-white"
                  : "bg-white/15 text-white/80"
              }`}
            >
              {i + 1}
            </span>
            {screen.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between px-4 py-2 bg-black/20 border-t border-white/10">
        <button
          type="button"
          onClick={onPrevious}
          disabled={hubOpen}
          className="flex items-center gap-1 text-[11px] text-white/75 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1 rounded hover:bg-white/10 transition-colors"
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

        <div className="flex items-center gap-3">
          <span className="text-white/45 text-[10px]">
            {navIndex} / {screenCount}
          </span>
          {!isProtoPristine && (
            <button
              type="button"
              onClick={onReset}
              title="Reset page states (stay on this screen)"
              className="text-[10px] font-semibold uppercase tracking-wide text-white/70 hover:text-white border border-white/25 hover:border-white/50 px-2 py-0.5 rounded transition-colors"
            >
              Reset
            </button>
          )}
          <span className="text-white text-[11px] font-semibold">{navLabel}</span>
          <div className="flex gap-1" role="group" aria-label="Screen position">
            <button
              type="button"
              onClick={onOpenHub}
              aria-label={PROTO_HUB_LABEL}
              aria-current={hubOpen ? "true" : undefined}
              className={`rounded-full transition-all ${
                hubOpen
                  ? "w-4 h-2 bg-[#467672]"
                  : "w-2 h-2 bg-white/30 hover:bg-white/60"
              }`}
            />
            {PROTO_SCREENS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onGo(i)}
                aria-label={`Screen ${i + 1}`}
                aria-current={!hubOpen && i === current ? "true" : undefined}
                className={`rounded-full transition-all ${
                  !hubOpen && i === current
                    ? "w-4 h-2 bg-[#467672]"
                    : "w-2 h-2 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={!hubOpen && current === screenCount - 1}
          className="flex items-center gap-1 text-[11px] text-white/75 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1 rounded hover:bg-white/10 transition-colors"
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
  );
}
