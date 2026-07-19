import { useLayoutEffect, useRef, type FormEvent } from "react";
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
};

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
}: SitePilotComposerProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    const max = SITE_PILOT_QUERY_LINE_PX * SITE_PILOT_QUERY_MAX_LINES;
    ta.style.height = "0px";
    const next = Math.min(
      Math.max(ta.scrollHeight, SITE_PILOT_QUERY_LINE_PX),
      max
    );
    ta.style.height = `${next}px`;
    ta.style.overflowY = next >= max ? "auto" : "hidden";
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
      <textarea
        ref={taRef}
        className="site-pilot-composer__query"
        name={`${surface}-query`}
        rows={surface === "chat" ? 5 : 1}
        spellCheck
        aria-label={sitePilotQueryAriaLabel(surface)}
        placeholder={sitePilotQueryPlaceholder(surface)}
        data-studio-action={sitePilotQueryAction(surface)}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
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
        className="site-pilot-composer__send"
        data-name="component.input.button"
        aria-label="Send message"
        data-studio-action={sitePilotSendAction(surface)}
      >
        <SendGlyph />
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
