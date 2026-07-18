import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { OrchestraModeOption, ProtoOrchestraModeId } from "@/app/orchestra/types";

type Props = {
  modes: OrchestraModeOption[];
  value: ProtoOrchestraModeId;
  onChange: (modeId: ProtoOrchestraModeId) => void;
  isPlaying?: boolean;
  /** Locks mode switch during cursor / type-in animations. */
  controlsLocked?: boolean;
};

export function ProtoNavJourneyMenu({
  modes,
  value,
  onChange,
  isPlaying,
  controlsLocked = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected =
    modes.find((mode) => mode.id === value) ?? modes[0] ?? { id: value, label: "Agentic CJM" };

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (isPlaying || controlsLocked) close();
  }, [close, controlsLocked, isPlaying]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [close, open]);

  useEffect(() => {
    if (open) {
      const idx = modes.findIndex((mode) => mode.id === value);
      setActiveIndex(idx >= 0 ? idx : 0);
    }
  }, [modes, open, value]);

  const selectMode = (modeId: ProtoOrchestraModeId) => {
    onChange(modeId);
    close();
  };

  const onTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  };

  const onListKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % modes.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + modes.length) % modes.length);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const mode = modes[activeIndex];
      if (mode) selectMode(mode.id);
    }
  };

  return (
    <div className="proto-nav-journey-menu" ref={rootRef}>
      <button
        type="button"
        className="proto-nav-journey-menu__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={isPlaying || controlsLocked}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="proto-nav-journey-menu__label">
          {isPlaying ? "Live" : selected.label}
        </span>
        <svg
          className="proto-nav-journey-menu__chevron"
          width="8"
          height="8"
          viewBox="0 0 8 8"
          fill="none"
          aria-hidden
        >
          <path
            d="M1.5 2.5L4 5L6.5 2.5"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-label="Journey mode"
          className="proto-nav-journey-menu__panel"
          tabIndex={-1}
          onKeyDown={onListKeyDown}
        >
          {modes.map((mode, index) => (
            <button
              key={mode.id}
              type="button"
              role="option"
              aria-selected={mode.id === value}
              className={
                mode.id === value
                  ? "proto-nav-journey-menu__option proto-nav-journey-menu__option--active"
                  : "proto-nav-journey-menu__option"
              }
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectMode(mode.id)}
            >
              {mode.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
