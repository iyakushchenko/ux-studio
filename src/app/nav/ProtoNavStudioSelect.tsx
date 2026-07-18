import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { StudioSelectOption } from "@/projects/types";

type Props<T extends string> = {
  options: StudioSelectOption<T>[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel: string;
  /** Overrides selected label while transport is on-air (journey mode only). */
  liveLabel?: string;
  isPlaying?: boolean;
  controlsLocked?: boolean;
};

/** Compact studio dropdown — project, persona, or journey mode. */
export function ProtoNavStudioSelect<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  liveLabel,
  isPlaying = false,
  controlsLocked = false,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected =
    options.find((option) => option.id === value) ??
    options[0] ??
    ({ id: value, label: value } as StudioSelectOption<T>);

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
      const idx = options.findIndex((option) => option.id === value);
      setActiveIndex(idx >= 0 ? idx : 0);
    }
  }, [open, options, value]);

  const selectOption = (id: T) => {
    onChange(id);
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
      setActiveIndex((i) => (i + 1) % options.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + options.length) % options.length);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = options[activeIndex];
      if (option) selectOption(option.id);
    }
  };

  const displayLabel = isPlaying && liveLabel ? liveLabel : selected.label;

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
        <span className="proto-nav-journey-menu__label">{displayLabel}</span>
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
          aria-label={ariaLabel}
          className="proto-nav-journey-menu__panel"
          tabIndex={-1}
          onKeyDown={onListKeyDown}
        >
          {options.map((option, index) => (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={option.id === value}
              className={
                option.id === value
                  ? "proto-nav-journey-menu__option proto-nav-journey-menu__option--active"
                  : "proto-nav-journey-menu__option"
              }
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectOption(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
