import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
import {
  motion,
  MOTION_EASE_IN_OUT,
  useReducedMotion,
} from "@/uxds/motion";
import {
  SITE_PILOT_QUERY_LINE_PX,
  SITE_PILOT_QUERY_MAX_LINES,
  sitePilotMicAction,
  sitePilotQueryAction,
  sitePilotQueryAriaLabel,
  sitePilotQueryPlaceholder,
  sitePilotSendAction,
  type SitePilotComposerSurface,
} from "./sitePilotComposerContract";
import { SITE_PILOT_MIC_D, SITE_PILOT_SEND_D } from "./sitePilotComposerGlyphs";
import "./site-pilot-composer.css";

export type SitePilotSuggestedChip = {
  label: string;
  slug: string;
  actionId: string;
};

export type SitePilotComposerProps = {
  surface: SitePilotComposerSurface;
  query: string;
  onQueryChange: (value: string) => void;
  onSend: () => void;
  /** Home-only suggested chips — omit on Chat until register says otherwise. */
  suggestedLabel?: string;
  suggestedLabelId?: string;
  chips?: readonly SitePilotSuggestedChip[];
  onChip?: (label: string) => void;
  className?: string;
  showSuggested?: boolean;
  /** Chat send→stop while thinking (Make `proto-agentic-send--stop`). */
  sendThinking?: boolean;
};

const QUERY_MAX_PX = SITE_PILOT_QUERY_LINE_PX * SITE_PILOT_QUERY_MAX_LINES;

/** Make-like grow/shrink — short ease-in-out; reduced-motion snaps. */
const QUERY_HEIGHT_TRANSITION = {
  duration: 0.2,
  ease: MOTION_EASE_IN_OUT,
} as const;

function MicGlyph() {
  return (
    <svg width="10.286" height="16" viewBox="0 0 10.2859 16" fill="none" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d={SITE_PILOT_MIC_D}
        fill="#3A3A3A"
      />
    </svg>
  );
}

function SendGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 10.6664 11.7433" fill="none" aria-hidden>
      <path d={SITE_PILOT_SEND_D} fill="white" />
    </svg>
  );
}

function StopGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="3" y="3" width="10" height="10" rx="1.5" fill="#ffffff" />
    </svg>
  );
}

function measureQueryHeight(ta: HTMLTextAreaElement): number {
  // Collapse before measure so delete/wrap shrinks (Make syncAgenticQueryHeight).
  // Must use !important — kit CSS sets height:100% !important vs Make LEGACY.
  ta.style.setProperty("height", "0px", "important");
  const next = Math.min(
    Math.max(ta.scrollHeight, SITE_PILOT_QUERY_LINE_PX),
    QUERY_MAX_PX
  );
  ta.style.setProperty("height", "100%", "important");
  return next;
}

export function SitePilotComposer({
  surface,
  query,
  onQueryChange,
  onSend,
  suggestedLabel,
  suggestedLabelId,
  chips,
  onChip,
  className,
  showSuggested = false,
  sendThinking = false,
}: SitePilotComposerProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const reduceMotion = useReducedMotion();
  const [shellHeight, setShellHeight] = useState(SITE_PILOT_QUERY_LINE_PX);
  const [atMax, setAtMax] = useState(false);

  useLayoutEffect(() => {
    const ta = taRef.current;
    if (!ta) return;

    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      const next = measureQueryHeight(ta);
      setShellHeight((prev) => (prev === next ? prev : next));
      setAtMax(next >= QUERY_MAX_PX);
      ta.style.overflowY = next >= QUERY_MAX_PX ? "auto" : "hidden";
    };

    run();

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => run())
        : null;
    ro?.observe(ta);
    const wrap = ta.parentElement;
    if (wrap) ro?.observe(wrap);

    void document.fonts?.ready.then(() => {
      if (!cancelled) run();
    });

    return () => {
      cancelled = true;
      ro?.disconnect();
    };
  }, [query]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSend();
  };

  const row = (
    <form
      className={`site-pilot-composer__query-row ${className ?? ""}`.trim()}
      data-name="Subtotal"
      onSubmit={handleSubmit}
    >
      <motion.div
        className="site-pilot-composer__query-shell"
        data-studio-composer-motion="height"
        initial={false}
        animate={{ height: shellHeight }}
        transition={
          reduceMotion ? { duration: 0 } : QUERY_HEIGHT_TRANSITION
        }
      >
        <textarea
          ref={taRef}
          className="site-pilot-composer__query proto-agentic-query"
          name={`${surface}-query`}
          rows={1}
          spellCheck
          aria-label={sitePilotQueryAriaLabel(surface)}
          placeholder={sitePilotQueryPlaceholder(surface)}
          data-studio-action={sitePilotQueryAction(surface)}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          style={{ overflowY: atMax ? "auto" : "hidden" }}
        />
      </motion.div>
      <button
        type="button"
        className="site-pilot-composer__mic"
        data-name="component.input.button"
        data-studio-action={sitePilotMicAction(surface)}
        aria-label="Voice input"
      >
        <MicGlyph />
      </button>
      <button
        type="submit"
        className={`site-pilot-composer__send proto-agentic-send${
          sendThinking ? " proto-agentic-send--stop site-pilot-composer__send--stop" : ""
        }`}
        data-name="component.input.button"
        aria-label={sendThinking ? "Stop" : "Send message"}
        data-studio-action={sitePilotSendAction(surface)}
      >
        <span data-name="glyph" className="site-pilot-composer__send-glyph">
          {/* Keep both mounted — swapping SVG trees races Motion/playback removeChild. */}
          <span hidden={!sendThinking} aria-hidden={!sendThinking}>
            <StopGlyph />
          </span>
          <span hidden={sendThinking} aria-hidden={sendThinking}>
            <SendGlyph />
          </span>
        </span>
      </button>
    </form>
  );

  if (!showSuggested || !chips?.length || !suggestedLabel || !suggestedLabelId) {
    return row;
  }

  return (
    <>
      {row}
      <section
        className="site-pilot-composer__suggested"
        aria-labelledby={suggestedLabelId}
      >
        <p id={suggestedLabelId} className="site-pilot-composer__suggested-label">
          {suggestedLabel}
        </p>
        <div
          className="site-pilot-composer__chips"
          role="group"
          aria-label={suggestedLabel}
        >
          {chips.map((chip) => (
            <button
              key={chip.slug}
              type="button"
              className="site-pilot-composer__chip"
              data-name="component.gse.system.message"
              data-studio-home-chip={chip.slug}
              data-studio-action={chip.actionId}
              onClick={() => onChip?.(chip.label)}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
