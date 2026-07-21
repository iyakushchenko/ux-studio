/**
 * Lean page-click + screen-nav watch for the QA overlay visible log.
 * Visible rows stay short; dump/ring get selector + surface for forensics.
 *
 * One intentional interaction → one log line:
 * prefer completed `click`; coalesce pointerdown→click; stable control-room target.
 */

const OVERLAY_ROOT_ID = "agent-testing-overlay";
const SCREEN_POLL_MS = 400;
/** pointerdown→click often lands 50–120ms apart — 40ms was too tight (PO dump noise). */
const CLICK_DEDUPE_MS = 700;
/** Emit pointerdown only if no click arrives (preventDefault / non-clickable). */
const POINTERDOWN_FALLBACK_MS = 320;

const INTERACTIVE_SEL =
  "button, a, [role='button'], [role='link'], label, summary, input, select, textarea, [data-studio-action], [data-studio-screen], .studio-mode-switch, .studio-nav-tab, .studio-nav-step-btn";

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

/**
 * Canonical interactive for logging — sibling CJM label → switch, tab root, etc.
 * Avoids pointerdown-on-label + click-on-button as two different keys.
 * Returns null for empty-space / non-interactive chrome (PO: interactive only).
 */
export function resolveClickElement(el: Element): HTMLElement | null {
  const modeGroup = el.closest?.(
    ".studio-nav-scenario__cjm-group, .studio-nav-scenario__mode-control"
  );
  if (modeGroup) {
    const sw =
      modeGroup.querySelector<HTMLElement>(
        ".studio-mode-switch, button, [role='switch']"
      ) || modeGroup.querySelector<HTMLElement>("button");
    if (sw) return sw;
  }

  const tab = el.closest?.(".studio-nav-tab");
  if (tab instanceof HTMLElement) return tab;

  const interactive = el.closest?.(INTERACTIVE_SEL);
  if (interactive instanceof HTMLElement) return interactive;

  return null;
}

/** True when the resolved node is a real control (not panel padding). */
export function isInteractiveControl(el: Element | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  if (typeof el.matches === "function" && el.matches(INTERACTIVE_SEL)) {
    return true;
  }
  const role = el.getAttribute?.("role")?.trim();
  if (role === "button" || role === "link" || role === "switch" || role === "tab") {
    return true;
  }
  if (el.classList?.contains("studio-mode-switch")) return true;
  if (el.classList?.contains("studio-nav-tab")) return true;
  if (el.classList?.contains("studio-nav-step-btn")) return true;
  if (el.getAttribute?.("data-studio-action")?.trim()) return true;
  if (el.getAttribute?.("data-studio-screen")?.trim()) return true;
  const tag = el.tagName?.toLowerCase?.() || "";
  return (
    tag === "button" ||
    tag === "a" ||
    tag === "input" ||
    tag === "select" ||
    tag === "textarea" ||
    tag === "summary" ||
    tag === "label"
  );
}

/** Prefer stable studio attrs, then id, then short class+tag. */
export function describeClickSelector(el: Element): string {
  const labelled = resolveClickElement(el) ?? (el as HTMLElement);

  const action = labelled.getAttribute?.("data-studio-action")?.trim();
  if (action) return `[data-studio-action="${action}"]`;

  // Calendar / book cells — stable cal attrs beat hover class soup.
  const calKind = labelled.getAttribute?.("data-studio-cal-kind")?.trim();
  if (calKind) {
    const month = labelled.getAttribute?.("data-studio-cal-month")?.trim();
    const value = labelled.getAttribute?.("data-studio-cal-value")?.trim();
    let sel = `[data-studio-cal-kind="${calKind}"]`;
    if (month) sel += `[data-studio-cal-month="${month}"]`;
    if (value) sel += `[data-studio-cal-value="${value}"]`;
    return sel;
  }

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
    .filter((c) => c && !/^(hover|active|focus|open|selected|px-|py-|bg-|border)/i.test(c))
    .slice(0, 2)
    .map((c) => `.${cssEscapeIdent(c)}`)
    .join("");
  return `${tag}${cls}` || tag;
}

/** Short ancestor chain for dump (max 3 levels). */
export function describeClickChain(el: Element, max = 3): string {
  const parts: string[] = [];
  let cur: Element | null = resolveClickElement(el) ?? el;
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

/** Prefer human affordance text over raw tag names / glued status-bar soup. */
export function describeClickTarget(el: Element): string {
  const labelled = resolveClickElement(el);
  if (!labelled) return "";

  // CJM / REC mode group — visible mode word beats aria "Toggle CJM".
  const modeGroup = labelled.closest?.(
    ".studio-nav-scenario__cjm-group, .studio-nav-scenario__mode-control"
  );
  if (modeGroup) {
    const modeLabel = modeGroup.querySelector(
      ".studio-nav-scenario__mode-label"
    );
    const modeText = shortText(modeLabel?.textContent || "");
    if (modeText) return modeText;
  }

  const aria =
    labelled.getAttribute?.("aria-label")?.trim() ||
    labelled.getAttribute?.("title")?.trim() ||
    "";
  if (aria) return shortText(aria);

  // Nav tab — badge + title without glued siblings.
  if (labelled.classList?.contains("studio-nav-tab")) {
    const badge = shortText(
      labelled.querySelector(".studio-nav-tab__badge")?.textContent || "",
      8
    );
    const title = shortText(
      labelled.querySelector(".studio-nav-tab__label, .studio-nav-tab__title")
        ?.textContent ||
        [...labelled.childNodes]
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent || "")
          .join(" ") ||
        labelled.textContent ||
        "",
      36
    );
    if (badge && title) return shortText(`${badge} · ${title}`, 42);
    if (title) return title;
  }

  if (labelled instanceof HTMLInputElement) {
    const v = labelled.value?.trim();
    if (labelled.type === "submit" || labelled.type === "button") {
      return shortText(v || labelled.name || labelled.type);
    }
    if (labelled.placeholder) return shortText(labelled.placeholder);
  }

  // Prefer a single text child over deep concatenated soup.
  const ownText = shortText(
    [...labelled.childNodes]
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent || "")
      .join(" ")
  );
  if (ownText) return ownText;

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
  const resolved = resolveClickElement(el);
  if (!resolved || !isInteractiveControl(resolved)) return null;
  const desc = describeClickTarget(el);
  if (!desc) return null;
  // Bare tag fallbacks ("a", "button") are noise — skip.
  if (/^(a|button|div|span|p|li|input|img|svg|path)$/i.test(desc)) return null;
  const dataStudioAction =
    resolved.getAttribute?.("data-studio-action")?.trim() || undefined;
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
    chain: describeClickChain(resolved),
    surface,
    dataStudioAction,
  };
}

function emitKey(detail: AgentTestingClickDetail): string {
  // Stable across label/span vs button — selector is canonical control.
  return `${detail.surface}|${detail.selector || detail.label}`;
}

/**
 * Bind capture-phase pointerdown + click + screen poll. Returns unbind.
 * Click is canonical; pointerdown only falls back when click never fires.
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
  let pendingTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingDetail: AgentTestingClickDetail | null = null;

  const clearPending = () => {
    if (pendingTimer != null) {
      clearTimeout(pendingTimer);
      pendingTimer = null;
    }
    pendingDetail = null;
  };

  const commit = (detail: AgentTestingClickDetail) => {
    // Pause / CAPTURE off stops ALL surfaces (Control Room included).
    if (!handlers.isCapturing()) return;
    const key = emitKey(detail);
    const now = Date.now();
    if (key === lastEmitKey && now - lastEmitAt < CLICK_DEDUPE_MS) return;
    lastEmitKey = key;
    lastEmitAt = now;
    handlers.onClick(detail);
  };

  const onPointerDown = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!handlers.isCapturing()) return;
    const detail = buildClickDetail(target);
    if (!detail) return;
    clearPending();
    pendingDetail = detail;
    pendingTimer = setTimeout(() => {
      const d = pendingDetail;
      pendingTimer = null;
      pendingDetail = null;
      if (d) commit(d);
    }, POINTERDOWN_FALLBACK_MS);
  };

  const onClick = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const detail = buildClickDetail(target);
    clearPending();
    if (!detail) return;
    commit(detail);
  };

  const pollScreen = () => {
    if (!handlers.isCapturing()) return;
    const next = readScreenId();
    if (!next || next === lastScreen) return;
    lastScreen = next;
    handlers.onScreen(`Screen → ${next}`);
  };

  document.addEventListener("pointerdown", onPointerDown, true);
  document.addEventListener("click", onClick, true);
  const timer =
    typeof window.setInterval === "function"
      ? window.setInterval(pollScreen, SCREEN_POLL_MS)
      : null;

  return () => {
    clearPending();
    document.removeEventListener("pointerdown", onPointerDown, true);
    document.removeEventListener("click", onClick, true);
    if (timer != null && typeof window.clearInterval === "function") {
      window.clearInterval(timer);
    }
  };
}
