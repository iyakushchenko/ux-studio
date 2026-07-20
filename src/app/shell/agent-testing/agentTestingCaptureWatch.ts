/**
 * Lean page-click + screen-nav watch for the QA overlay visible log.
 * Visible rows stay short; dump/ring get selector + surface for forensics.
 */

const OVERLAY_ROOT_ID = "agent-testing-overlay";
const SCREEN_POLL_MS = 400;

export type AgentTestingClickSurface = "product" | "chrome" | "control-room";

export type AgentTestingClickDetail = {
  /** Short visible label (no selector). */
  label: string;
  /** CSS-ish selector / data-studio-action for dump forensics. */
  selector?: string;
  /** Short parent chain (tag#id.class > …). */
  chain?: string;
  surface: AgentTestingClickSurface;
  dataStudioAction?: string;
};

export type AgentTestingCaptureWatchHandlers = {
  /** True when clicks/nav should land in the visible log. */
  isCapturing: () => boolean;
  onClick: (detail: AgentTestingClickDetail) => void;
  onScreen: (screenId: string) => void;
};

function readScreenId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromUrl = new URL(window.location.href).searchParams.get("screen");
    if (fromUrl?.trim()) return fromUrl.trim();
  } catch {
    /* ignore */
  }
  return null;
}

function shortText(raw: string, max = 42): string {
  const t = raw.replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function isControlRoom(el: Element): boolean {
  if (typeof el.closest !== "function") return false;
  return !!el.closest(
    ".studio-nav-panel, .studio-nav-panel-host, .studio-nav-version, [data-studio-nav]"
  );
}

function isStudioChrome(el: Element): boolean {
  if (typeof el.closest !== "function") return false;
  return !!el.closest(
    ".studio-playback-diagnostic, .studio-playback-shield"
  );
}

function isIgnoredTarget(el: Element | null): boolean {
  if (!el || typeof el.closest !== "function") return true;
  if (el.closest(`#${OVERLAY_ROOT_ID}`)) return true;
  // Control room / nav is part of the test surface — log it (manual Save Log).
  if (el.closest("[data-studio-agent-testing-ignore]")) return true;
  return false;
}

function cssEscapeIdent(raw: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(raw);
  }
  return raw.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

/** Prefer stable studio attrs, then id, then short class+tag. */
export function describeClickSelector(el: Element): string {
  const labelled =
    el.closest<HTMLElement>(
      "button, a, [role='button'], [role='link'], label, summary, input, select, textarea, [data-studio-action], [data-studio-screen]"
    ) ?? (el as HTMLElement);

  const action = labelled.getAttribute?.("data-studio-action")?.trim();
  if (action) return `[data-studio-action="${action}"]`;

  const screen = labelled.getAttribute?.("data-studio-screen")?.trim();
  if (screen) return `[data-studio-screen="${screen}"]`;

  const testId =
    labelled.getAttribute?.("data-testid")?.trim() ||
    labelled.getAttribute?.("data-studio-id")?.trim();
  if (testId) return `[data-testid="${testId}"]`;

  if (labelled.id) return `#${cssEscapeIdent(labelled.id)}`;

  const tag = labelled.tagName?.toLowerCase?.() || "el";
  const cls = String(labelled.className || "")
    .trim()
    .split(/\s+/)
    .filter((c) => c && !/^(hover|active|focus|open|selected)/i.test(c))
    .slice(0, 2)
    .map((c) => `.${cssEscapeIdent(c)}`)
    .join("");
  return `${tag}${cls}` || tag;
}

/** Short ancestor chain for dump (max 3 levels). */
export function describeClickChain(el: Element, max = 3): string {
  const parts: string[] = [];
  let cur: Element | null = el;
  for (let i = 0; i < max && cur && cur !== document.body; i++) {
    const tag = cur.tagName?.toLowerCase?.() || "el";
    const id = cur.id ? `#${cssEscapeIdent(cur.id)}` : "";
    const action = cur.getAttribute?.("data-studio-action");
    const hint = action
      ? `[data-studio-action="${action}"]`
      : id ||
        (() => {
          const cls = String(cur.className || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean)[0];
          return cls ? `.${cssEscapeIdent(cls)}` : "";
        })();
    parts.unshift(`${tag}${hint}`);
    cur = cur.parentElement;
  }
  return parts.join(" > ");
}

/** Prefer human affordance text over raw tag names. */
export function describeClickTarget(el: Element): string {
  const labelled =
    el.closest<HTMLElement>(
      "button, a, [role='button'], [role='link'], label, summary, input, select, textarea"
    ) ?? (el as HTMLElement);

  const aria =
    labelled.getAttribute?.("aria-label")?.trim() ||
    labelled.getAttribute?.("title")?.trim() ||
    "";
  if (aria) return shortText(aria);

  if (labelled instanceof HTMLInputElement) {
    const v = labelled.value?.trim();
    if (labelled.type === "submit" || labelled.type === "button") {
      return shortText(v || labelled.name || labelled.type);
    }
    if (labelled.placeholder) return shortText(labelled.placeholder);
  }

  const text = shortText(labelled.textContent || "");
  if (text) return text;

  const studio =
    labelled.getAttribute?.("data-studio-action") ||
    labelled.getAttribute?.("data-studio-screen") ||
    labelled.getAttribute?.("name") ||
    "";
  if (studio) return shortText(studio);

  const tag = labelled.tagName?.toLowerCase?.() || "element";
  return tag;
}

export function buildClickDetail(el: Element): AgentTestingClickDetail | null {
  if (isIgnoredTarget(el)) return null;
  const desc = describeClickTarget(el);
  if (!desc) return null;
  const labelled =
    el.closest<HTMLElement>(
      "button, a, [role='button'], [role='link'], label, summary, input, select, textarea, [data-studio-action]"
    ) ?? (el as HTMLElement);
  const dataStudioAction =
    labelled.getAttribute?.("data-studio-action")?.trim() || undefined;
  const surface: AgentTestingClickSurface = isControlRoom(el)
    ? "control-room"
    : isStudioChrome(el)
      ? "chrome"
      : "product";
  const prefix =
    surface === "control-room"
      ? "Control room"
      : surface === "chrome"
        ? "Chrome click"
        : "Click";
  return {
    label: `${prefix}: ${desc}`,
    selector: describeClickSelector(el),
    chain: describeClickChain(labelled),
    surface,
    dataStudioAction,
  };
}

/**
 * Bind capture-phase pointerdown + click + screen poll. Returns unbind.
 * pointerdown catches targets that preventDefault on click.
 */
export function bindAgentTestingCaptureWatch(
  handlers: AgentTestingCaptureWatchHandlers
): () => void {
  if (
    typeof document === "undefined" ||
    typeof window === "undefined" ||
    typeof document.addEventListener !== "function" ||
    typeof document.removeEventListener !== "function"
  ) {
    return () => undefined;
  }

  let lastScreen = readScreenId();
  let lastEmitKey = "";
  let lastEmitAt = 0;

  const emitClick = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const detail = buildClickDetail(target);
    if (!detail) return;
    // Product/chrome clicks only while CAPTURE on.
    // Control room always — Manual Save Log must include nav/transport (PO A).
    if (!handlers.isCapturing() && detail.surface !== "control-room") return;
    // Dedupe pointerdown→click same target within 40ms (not coalesce across seconds).
    const key = `${detail.surface}|${detail.selector}|${detail.label}`;
    const now = Date.now();
    if (key === lastEmitKey && now - lastEmitAt < 40) return;
    lastEmitKey = key;
    lastEmitAt = now;
    handlers.onClick(detail);
  };

  const pollScreen = () => {
    if (!handlers.isCapturing()) return;
    const next = readScreenId();
    if (!next || next === lastScreen) return;
    lastScreen = next;
    handlers.onScreen(`Screen → ${next}`);
  };

  document.addEventListener("pointerdown", emitClick, true);
  document.addEventListener("click", emitClick, true);
  const timer =
    typeof window.setInterval === "function"
      ? window.setInterval(pollScreen, SCREEN_POLL_MS)
      : null;

  return () => {
    document.removeEventListener("pointerdown", emitClick, true);
    document.removeEventListener("click", emitClick, true);
    if (timer != null && typeof window.clearInterval === "function") {
      window.clearInterval(timer);
    }
  };
}
