/**
 * Concise human labels for REC → STEPS / touchpoints / QA.
 * Scrubs Make-ish `data-name` / dotted paths and quoted attr soup.
 */

const SCREEN_LABELS: Record<string, string> = {
  "site-pilot": "Home",
  chat: "Chat",
  plp: "Vaccinations",
  pdp: "Vaccine details",
  "book-step-1": "Book — location",
  "book-step-2": "Book — date & time",
  "book-step-3": "Book — confirmation",
  "appointment-history": "Appointment history",
  "appointment-details": "Appointment details",
  hub: "Onboarding",
};

const MAKEISH_PATH =
  /^(?:component|module|boots-pharmacy|icon|plp|pdp)\b[\w.\-=\s]*$/i;

/** Strip quoted attribute wrappers: data-name="x" → x */
function stripAttrWrapper(raw: string): string {
  const m = /^(?:data-name|data-studio-action|aria-label)\s*=\s*"([^"]+)"\s*$/i.exec(
    raw.trim()
  );
  return m?.[1]?.trim() || raw.trim();
}

/** `component.plp.tile.title` → `Tile title`; `plp-book-now` → `Book now`. */
function wordsFromSlug(raw: string): string {
  const cleaned = raw
    .replace(/^\[|\]$/g, "")
    .replace(/^data-name\s*=\s*/i, "")
    .replace(/^data-studio-action\s*=\s*/i, "")
    .replace(/^["']|["']$/g, "")
    .trim();
  if (!cleaned) return "";

  // Action slugs: drop leading screen/domain token (plp-book-now → book now).
  if (/^[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(cleaned) && !cleaned.includes(".")) {
    const parts = cleaned.toLowerCase().split("-").filter(Boolean);
    const dropHead = new Set([
      "plp",
      "pdp",
      "avail",
      "book",
      "chat",
      "agentic",
      "home",
      "studio",
    ]);
    // Keep "book" when it IS the verb (book-now) — only drop when ≥3 parts.
    const start =
      parts.length >= 3 && dropHead.has(parts[0]!) ? 1 : 0;
    return parts.slice(start).join(" ");
  }

  // Prefer last 1–2 dotted segments for Make paths.
  const dotted = cleaned.includes(".")
    ? cleaned
        .split(".")
        .map((p) => p.trim())
        .filter(Boolean)
    : [];
  const focus =
    dotted.length >= 2
      ? dotted.slice(-2).join(" ")
      : dotted.length === 1
        ? dotted[0]!
        : cleaned;

  return focus
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCasePhrase(s: string): string {
  const t = s.trim();
  if (!t) return "";
  return t
    .split(/\s+/)
    .map((w, i) => {
      const lower = w.toLowerCase();
      if (
        i > 0 &&
        (lower === "and" ||
          lower === "or" ||
          lower === "of" ||
          lower === "the" ||
          lower === "to" ||
          lower === "for" ||
          lower === "a" ||
          lower === "an")
      ) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

/**
 * Turn a REC element descriptor / beat id / selector crumb into a concise
 * nav label. Never leave raw `data-name="module.plp.tiles"` in STEPS.
 */
export function humanizeRecordingLabel(
  raw: string | undefined | null,
  options?: { max?: number; camera?: boolean }
): string {
  const max = options?.max ?? 40;
  const camera = options?.camera === true;
  let s = (raw ?? "").trim();
  if (!s) return camera ? "Camera — show page" : "";

  s = stripAttrWrapper(s);

  // Selector crumbs: [data-name="module.plp.tiles"] → humanize inner.
  const sel = /^\[([^=\]]+)=["']([^"']+)["']\]$/.exec(s);
  if (sel) {
    s = sel[2]!.trim();
  }

  // Known screen ids (landing beats).
  const screenKey = s.toLowerCase().replace(/\s+/g, "-");
  if (SCREEN_LABELS[screenKey]) {
    const label = SCREEN_LABELS[screenKey]!;
    return camera ? `Camera — ${label}` : label;
  }

  // Action slugs already short: plp-book-now → Book now
  if (/^[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(s) && !s.includes(".")) {
    const words = wordsFromSlug(s);
    const label = titleCasePhrase(words);
    return camera ? `Camera — ${label}` : label;
  }

  // Make-ish dotted paths / module containers.
  if (MAKEISH_PATH.test(s) || s.includes(".")) {
    const words = wordsFromSlug(s);
    const label = titleCasePhrase(words) || "Page";
    return camera ? `Camera — ${label}` : label;
  }

  // Already human prose (product title, "Book now", …).
  let out = s.replace(/\s+/g, " ").trim();
  if (out.length > max) out = `${out.slice(0, Math.max(1, max - 1))}…`;
  return camera ? `Camera — ${out}` : out;
}

/** True when a data-name is a coarse layout module (bad click / camera leaf). */
export function isCoarseMakeModuleName(dataName: string | null | undefined): boolean {
  if (!dataName) return false;
  const n = dataName.trim().toLowerCase();
  if (n.startsWith("module.")) return true;
  if (n === "body" || n === "row") return true;
  if (/^module\.plp\.(tiles|listing|filters|hero)$/i.test(n)) return true;
  return false;
}

/**
 * Click targets that invent success when clicked — listing shells, filter hosts.
 * Agent/REC must refine to a CTA/link or FAIL (never clickOk on these).
 */
export function isDegradedClickTarget(el: Element | null | undefined): boolean {
  if (!el || typeof (el as HTMLElement).getAttribute !== "function") return true;
  const node = el as HTMLElement;
  if (node.getAttribute("data-studio-action")) return false;
  if (node.closest?.("[data-studio-action]") === node) return false;
  const dataName = node.getAttribute("data-name");
  if (isCoarseMakeModuleName(dataName)) return true;
  // Huge listing shell without an action of its own.
  if (
    dataName &&
    /^(boots-pharmacy\.)?module\./i.test(dataName) &&
    !node.matches?.("button, a, [role='button']")
  ) {
    return true;
  }
  return false;
}

/** Filter / checkbox Make nodes — bad scroll-stop camera anchors. */
export function isWeakScrollAnchorName(dataName: string | null | undefined): boolean {
  if (!dataName) return false;
  const n = dataName.trim().toLowerCase();
  if (n.includes("filter.checkbox") || n.includes("filter.radio")) return true;
  if (n.includes("checkbox.item") || n.includes("input.radio")) return true;
  if (n === "module.plp.filters" || n.startsWith("plp.filter")) return true;
  if (n.includes("reset-filters")) return true;
  return false;
}

/** Concise screen landing label for compile (plp → Vaccinations). */
export function humanizeScreenLabel(screenId: string | undefined): string {
  if (!screenId) return "Screen";
  return humanizeRecordingLabel(screenId) || screenId;
}
