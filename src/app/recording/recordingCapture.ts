import type { JourneyBeatActionId } from "@/app/orchestra/types";
import {
  appendRecordingEventWithSnapshot,
  getActiveRecordingSession,
  isRecordingActive,
  subscribeRecordingSession,
} from "@/app/recording/recordingSession";
import type {
  RecordedEvent,
  RecordingSnapshot,
} from "@/app/recording/recordingTypes";
import { isUsablePlaybackSelectorChain } from "@/app/recording/recordingCompile";
import {
  humanizeRecordingLabel,
  isCoarseMakeModuleName,
  isDegradedClickTarget,
  isWeakScrollAnchorName,
} from "@/app/recording/recordingLabels";
import {
  SCROLL_STOP_DWELL_MS,
  createScrollStopTracker,
  noteScrollIdle,
  noteScrollSample,
  resetScrollStopTracker,
  type ScrollStopTracker,
} from "@/app/recording/scrollStopDetect";
import { getPrototypeScrollRoot } from "@/app/scenario/playbackScroll";
import type {
  ManualTransportAction,
  PlaybackInteractionRecord,
} from "@/app/shell/playbackInteractionContext";
import { playbackDiagRecCapture } from "@/app/shell/playbackDiag";

let snapshotProvider: (() => RecordingSnapshot | undefined) | null = null;
let lastTouchpointKey: string | undefined;
let humanClickCaptureInstalled = false;
let scrollCaptureInstalled = false;
let typedTextCaptureInstalled = false;
let domCaptureUnsubSession: (() => void) | null = null;
let scrollCaptureTimer: ReturnType<typeof setTimeout> | null = null;
let scrollStopTimer: ReturnType<typeof setTimeout> | null = null;
let typedTextCaptureTimer: ReturnType<typeof setTimeout> | null = null;
/** Dedupe key for last emitted scroll **target** (not scrollTop). */
let lastCapturedScrollTargetKey: string | undefined;
/** Rate-limit chrome-reject diag so panel mashing does not spam the ring. */
let lastChromeRejectDiagAtMs = 0;
let scrollStopTracker: ScrollStopTracker = createScrollStopTracker();

const SCROLL_CAPTURE_DEBOUNCE_MS = 120;
const TYPED_TEXT_CAPTURE_DEBOUNCE_MS = 280;

const TYPED_TEXT_FIELD_SELECTOR = [
  'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="file"]):not([type="hidden"]):not([type="password"]):not([type="image"])',
  "textarea",
].join(", ");

export function registerRecordingSnapshotProvider(
  provider: (() => RecordingSnapshot | undefined) | null
): void {
  snapshotProvider = provider;
}

export function getRecordingSnapshot(): RecordingSnapshot | undefined {
  return snapshotProvider?.();
}

/** Build a selector chain from demo-click target for future replay. */
export function buildPlaybackSelectorChain(el: HTMLElement): string[] {
  // Unique calendar cells first — bare data-name / action climb is non-unique.
  // Book Step 2 uses the same data-studio-cal-* attrs as the book director.
  const bookDate = el.closest<HTMLElement>(
    '[data-studio-cal-kind="date"][data-studio-cal-month][data-studio-cal-value]'
  );
  if (bookDate) {
    const month = bookDate.getAttribute("data-studio-cal-month");
    const day = bookDate.getAttribute("data-studio-cal-value");
    if (month && day) {
      return [
        `[data-name="calendar. date. cell"][data-studio-cal-kind="date"][data-studio-cal-month="${month}"][data-studio-cal-value="${day}"]`,
      ];
    }
  }
  const bookTime = el.closest<HTMLElement>(
    '[data-studio-cal-kind="time"][data-studio-cal-value]'
  );
  if (bookTime) {
    const t = bookTime.getAttribute("data-studio-cal-value");
    if (t) {
      return [
        `[data-name="calendar. date. cell"][data-studio-cal-kind="time"][data-studio-cal-value="${t}"]`,
      ];
    }
  }
  const availDate = el.closest<HTMLElement>("[data-studio-avail-date]");
  if (availDate) {
    const day = availDate.getAttribute("data-studio-avail-date");
    if (day) {
      return [
        `[data-studio-action="avail-select-date"][data-studio-avail-date="${day}"]`,
      ];
    }
  }
  const availTime = el.closest<HTMLElement>("[data-studio-avail-time]");
  if (availTime) {
    const t = availTime.getAttribute("data-studio-avail-time");
    if (t) {
      return [
        `[data-studio-action="avail-select-time"][data-studio-avail-time="${t}"]`,
      ];
    }
  }

  // Prefer a unique studio action on the click target — ignore noisy ancestors
  // (progress "Step N", breadcrumbs) that break nested resolve.
  const selfAction = el.getAttribute("data-studio-action");
  if (selfAction) {
    return [`[data-studio-action="${selfAction}"]`];
  }

  // Climb to nearest studio action (glyph clicks inside CTAs).
  const actionHost = el.closest<HTMLElement>("[data-studio-action]");
  if (actionHost) {
    const action = actionHost.getAttribute("data-studio-action");
    if (action) return [`[data-studio-action="${action}"]`];
  }
  const availStore = el.closest<HTMLElement>("[data-studio-avail-store]");
  if (availStore) {
    const storeId = availStore.getAttribute("data-studio-avail-store");
    const choose = availStore.querySelector<HTMLElement>(
      '[data-studio-action="avail-choose-location"]'
    );
    if (storeId && (choose === el || choose?.contains(el) || el === availStore)) {
      return [
        `[data-studio-avail-store="${storeId}"]`,
        `[data-studio-action="avail-choose-location"]`,
      ];
    }
  }

  const chain: string[] = [];
  let node: HTMLElement | null = el;

  while (node && chain.length < 6) {
    const tag = node.tagName.toLowerCase();
    const dataName = node.getAttribute("data-name");
    const protoAvail = node.getAttribute("data-studio-avail-store");
    const protoBeat = node.getAttribute("data-studio-beat");
    const protoAction = node.getAttribute("data-studio-action");

    if (protoAction) chain.unshift(`[data-studio-action="${protoAction}"]`);
    if (protoBeat) chain.unshift(`[data-studio-beat="${protoBeat}"]`);
    if (protoAvail) chain.unshift(`[data-studio-avail-store="${protoAvail}"]`);
    if (dataName) {
      const toggleIndex = node.getAttribute("data-toggle-index");
      chain.unshift(
        toggleIndex != null
          ? `[data-name="${dataName}"][data-toggle-index="${toggleIndex}"]`
          : `[data-name="${dataName}"]`
      );
    }

    if (chain.length === 0 && tag && tag !== "html" && tag !== "body") {
      const id = node.id;
      // Never leave a lone #root — unusable for replay.
      if (id && id !== "root") chain.unshift(`#${id}`);
    }

    node = node.parentElement;
  }

  // Last resort: interactive leaf by aria-label / trimmed text (not #root).
  if (
    chain.length === 0 ||
    (chain.length === 1 && chain[0] === "#root")
  ) {
    const aria = el.getAttribute("aria-label")?.trim();
    const text = (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 48);
    const tag = el.tagName.toLowerCase();
    if (aria) {
      const esc =
        typeof CSS !== "undefined" && typeof CSS.escape === "function"
          ? CSS.escape(aria)
          : aria.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return [`${tag}[aria-label="${esc}"]`];
    }
    if (text && (tag === "button" || tag === "a")) {
      return []; // resolve via element descriptor at replay — avoid fragile text CSS
    }
    return [];
  }

  return [...new Set(chain.filter((s) => s !== "#root"))];
}

type PlaybackSelectorRoot = Pick<ParentNode, "querySelector" | "querySelectorAll">;

/**
 * Resolve a stored demo-click selector chain to a live element.
 * Prefers outer→inner nested matches (how the chain was built), then
 * most-specific unique fallback.
 */
export function resolvePlaybackSelectorChain(
  chain: string[] | undefined,
  root: PlaybackSelectorRoot
): HTMLElement | null {
  if (!chain?.length) return null;

  let scope: PlaybackSelectorRoot = root;
  let nested: HTMLElement | null = null;
  let nestedOk = true;
  for (const sel of chain) {
    let el: HTMLElement | null = null;
    try {
      el = scope.querySelector(sel);
    } catch {
      nestedOk = false;
      break;
    }
    if (!el) {
      nestedOk = false;
      break;
    }
    nested = el;
    scope = el;
  }
  if (nestedOk && nested) return nested;

  for (let i = chain.length - 1; i >= 0; i -= 1) {
    const sel = chain[i];
    let matches: NodeListOf<HTMLElement> | HTMLElement[];
    try {
      matches = root.querySelectorAll(sel);
    } catch {
      continue;
    }
    if (matches.length === 1) return matches[0] ?? null;
  }

  return null;
}

export function captureRecordingEvent(
  event: Omit<RecordedEvent, "atMs" | "snapshot"> & {
    atMs?: number;
    snapshot?: RecordingSnapshot;
  }
): void {
  appendRecordingEventWithSnapshot(event, () => snapshotProvider?.());
}

export function captureTouchpointChange(options: {
  touchpointKey: string;
  beatId?: string;
  label?: string;
  counter?: string | null;
}): void {
  if (!getActiveRecordingSession()) return;
  if (lastTouchpointKey === options.touchpointKey) return;
  lastTouchpointKey = options.touchpointKey;

  captureRecordingEvent({
    kind: "touchpoint",
    touchpointKey: options.touchpointKey,
    beatId: options.beatId,
    label: options.label,
    counter: options.counter,
  });
}

export function captureWireIntent(
  intentId: JourneyBeatActionId | string,
  payload?: Record<string, unknown>
): void {
  captureRecordingEvent({
    kind: "wire-intent",
    intentId,
    payload,
  });
}

/**
 * Capture a scroll **target** only. `scrollTop` is accepted for API compat but
 * never written into the session (targets-only contract).
 */
export function captureScroll(options: {
  /** @deprecated Ignored — not persisted. Prefer selectorChain / anchorSelector. */
  scrollTop?: number;
  anchorSelector?: string;
  selectorChain?: string[];
}): void {
  if (!getActiveRecordingSession()) return;
  const selectorChain = options.selectorChain?.filter(Boolean);
  const anchorSelector = options.anchorSelector?.trim() || undefined;
  if (!selectorChain?.length && !anchorSelector) return;
  captureRecordingEvent({
    kind: "scroll",
    selectorChain: selectorChain?.length ? selectorChain : undefined,
    anchorSelector,
  });
}

/**
 * Capture a scroll-host settle (≥ {@link SCROLL_STOP_DWELL_MS}, jiggles ignored).
 * Compile maps this to a first-class `kind: "camera"` dwell / pause wait.
 */
export function captureScrollStop(options: {
  durationMs: number;
  anchorSelector?: string;
  selectorChain?: string[];
}): void {
  if (!getActiveRecordingSession()) return;
  const durationMs = Math.max(0, Math.round(options.durationMs));
  if (durationMs < SCROLL_STOP_DWELL_MS) return;
  const selectorChain = options.selectorChain?.filter(Boolean);
  const anchorSelector = options.anchorSelector?.trim() || undefined;
  captureRecordingEvent({
    kind: "scroll-stop",
    durationMs,
    selectorChain: selectorChain?.length ? selectorChain : undefined,
    anchorSelector,
  });
}

const SCROLL_ANCHOR_CANDIDATE_SELECTOR = [
  "h1",
  "h2",
  "h3",
  "[data-studio-probe-below-fold]",
  '[data-name="component.plp.tile.title"]',
  "[data-studio-action]",
  "[data-studio-avail-store]",
  "[data-studio-beat]",
  "article",
  '[role="article"]',
  "[data-name]",
].join(", ");

function scrollAnchorScore(el: HTMLElement, dist: number): number {
  // Lower is better. Prefer titles/content; bury filters / coarse modules.
  let score = dist;
  const tag = el.tagName.toLowerCase();
  if (tag === "h1" || tag === "h2" || tag === "h3") score -= 80;
  if (el.hasAttribute("data-studio-probe-below-fold")) score -= 70;
  const dataName = el.getAttribute("data-name");
  if (dataName === "component.plp.tile.title") score -= 65;
  if (el.getAttribute("data-studio-action")) score -= 40;
  if (tag === "article" || el.getAttribute("role") === "article") score -= 30;
  if (isWeakScrollAnchorName(dataName)) score += 400;
  if (isCoarseMakeModuleName(dataName)) score += 180;
  if (
    el.matches?.(
      'input[type="checkbox"], input[type="radio"], [role="checkbox"], [role="radio"]'
    )
  ) {
    score += 500;
  }
  // Tiny filter rows near mid-viewport look "close" but are unusable cameras.
  const r = el.getBoundingClientRect();
  if (r.height > 0 && r.height < 28 && r.width < 280) score += 120;
  return score;
}

/**
 * Pick the nearest meaningful element in the prototype scroll viewport
 * (prefer center band) for anchor-based REC scroll capture.
 * Prefers visible titles/content over filter checkboxes / coarse modules.
 */
export function resolveScrollAnchorElement(
  root: HTMLElement
): HTMLElement | null {
  const rootRect = root.getBoundingClientRect();
  if (rootRect.height < 8 || rootRect.width < 8) return null;
  const midY = rootRect.top + rootRect.height * 0.42;
  const nodes = root.querySelectorAll<HTMLElement>(SCROLL_ANCHOR_CANDIDATE_SELECTOR);
  let best: HTMLElement | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const el of nodes) {
    if (isRecordingChromeTarget(el)) continue;
    const dataName = el.getAttribute("data-name");
    if (isWeakScrollAnchorName(dataName)) continue;
    if (isCoarseMakeModuleName(dataName)) continue;
    if (
      el.matches?.(
        'input[type="checkbox"], input[type="radio"], [role="checkbox"], [role="radio"]'
      )
    ) {
      continue;
    }
    const r = el.getBoundingClientRect();
    if (r.height < 8 || r.width < 8) continue;
    if (r.bottom < rootRect.top + 4 || r.top > rootRect.bottom - 4) continue;
    // Skip collapsed / off-layout filter ghosts.
    try {
      if (getComputedStyle(el).display === "none") continue;
      if (getComputedStyle(el).visibility === "hidden") continue;
    } catch {
      /* ignore */
    }
    const cy = r.top + r.height / 2;
    const dist = Math.abs(cy - midY);
    const score = scrollAnchorScore(el, dist);
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }
  return best;
}

/** Build primary selectorChain + leaf anchorSelector for a scroll anchor. */
export function describeScrollAnchor(el: HTMLElement): {
  selectorChain: string[];
  anchorSelector?: string;
} {
  // Prefer title / action leaf over a weak filter checkbox that somehow scored.
  let target = el;
  if (isWeakScrollAnchorName(el.getAttribute("data-name"))) {
    const better =
      el
        .closest("[data-studio-react-screen], .studio-scroll--prototype, body")
        ?.querySelector<HTMLElement>(
          "h1, h2, h3, [data-studio-probe-below-fold], [data-name='component.plp.tile.title'], [data-studio-action]"
        ) ?? null;
    if (better) target = better;
  }
  const selectorChain = buildPlaybackSelectorChain(target).filter((s) => {
    // Drop weak filter leaves from the stored chain.
    const m = /data-name="([^"]+)"/.exec(s);
    return !m || !isWeakScrollAnchorName(m[1]);
  });
  if (selectorChain.length === 0) {
    return { selectorChain: [] };
  }
  let anchorSelector = selectorChain[selectorChain.length - 1];
  if (typeof document !== "undefined") {
    for (let i = selectorChain.length - 1; i >= 0; i -= 1) {
      const sel = selectorChain[i];
      try {
        if (document.querySelectorAll(sel).length === 1) {
          anchorSelector = sel;
          break;
        }
      } catch {
        /* ignore bad selector */
      }
    }
  }
  return { selectorChain, anchorSelector };
}

export function captureTypedText(options: {
  value: string;
  selectorChain?: string[];
  element?: string;
  inputType?: string;
}): void {
  if (!getActiveRecordingSession()) return;
  captureRecordingEvent({
    kind: "typed-text",
    value: options.value,
    selectorChain: options.selectorChain,
    element: options.element,
    inputType: options.inputType,
  });
}

export function captureStudioChange(
  field: "journey-mode" | "orchestra-mode" | "project" | "persona",
  value: string | boolean
): void {
  captureRecordingEvent({
    kind: "studio",
    field,
    value,
  });
}

export function captureDwell(durationMs?: number): void {
  captureRecordingEvent({
    kind: "dwell",
    durationMs,
  });
}

let lastScreenKey: string | undefined;
/** Session id that already received a start-screen seed (avoid re-seed on pause/resume). */
let seededStartScreenSessionId: string | undefined;

/** Ordered page/URL transition for replay deep-link restore. */
export function captureScreenChange(options: {
  screenId: string;
  projectId?: string;
  studioUrl?: string;
}): void {
  if (!getActiveRecordingSession()) return;
  // Dedupe on project + screen only — URL param churn (cjm/modal/journey/
  // experience) must NOT re-emit the same screen (inflates STEPS + chat-2/3).
  const key = `${options.projectId ?? ""}|${options.screenId}`;
  if (lastScreenKey === key) return;
  lastScreenKey = key;

  captureRecordingEvent({
    kind: "screen",
    screenId: options.screenId,
    projectId: options.projectId,
    studioUrl: options.studioUrl,
  });
}

/**
 * Product model: REC ● start = current tab/screen as journey step 1.
 * URL sync only appends `screen` on later navigations — seed once per session.
 */
export function seedRecordingStartScreen(options?: {
  screenId?: string;
  projectId?: string;
  studioUrl?: string;
}): void {
  const session = getActiveRecordingSession();
  if (!session) return;
  if (seededStartScreenSessionId === session.id) return;

  const snap = snapshotProvider?.();
  const screenId = options?.screenId ?? snap?.screenId;
  if (!screenId) return;

  seededStartScreenSessionId = session.id;
  // Allow same screen as a prior session's last key.
  lastScreenKey = undefined;
  captureScreenChange({
    screenId,
    projectId: options?.projectId ?? snap?.projectId,
    studioUrl: options?.studioUrl ?? snap?.studioUrl,
  });
}

/** Bridge from playbackInteractionContext — maps diagnostic records to recording events. */
export function notifyRecordingFromInteraction(
  interaction: PlaybackInteractionRecord
): void {
  if (!getActiveRecordingSession()) return;
  if (interaction.kind === "demo-click") return;

  const snapshot = snapshotProvider?.();
  const base = { atMs: interaction.atMs, snapshot };

  switch (interaction.kind) {
    case "transport": {
      const action = parseTransportAction(interaction.label);
      if (action) {
        captureRecordingEvent({ kind: "transport", action, ...base });
      }
      break;
    }
    case "director-manual":
    case "director-auto":
      if (interaction.scriptId) {
        captureRecordingEvent({
          kind: "director-script",
          scriptId: interaction.scriptId,
          scriptKind: interaction.scriptKind,
          beatId: interaction.beatId,
          manual: interaction.kind === "director-manual",
          ...base,
        });
      }
      break;
    case "beat-enter":
      captureRecordingEvent({
        kind: "beat-enter",
        actionId: interaction.scriptId ?? interaction.label,
        beatId: interaction.beatId,
        ...base,
      });
      break;
    case "retreat-sync":
      captureRecordingEvent({
        kind: "wire-intent",
        intentId: "retreat-sync",
        payload: {
          beatId: interaction.beatId,
          scriptId: interaction.scriptId,
          scriptKind: interaction.scriptKind,
        },
        ...base,
      });
      break;
    default:
      break;
  }
}

/** Extended demo-click capture with DOM selector chain. */
export function notifyRecordingDemoClick(
  target: HTMLElement,
  elementDescriptor: string
): void {
  if (!getActiveRecordingSession()) return;
  const usable = resolveUsableDemoClickTarget(target);
  if (!usable) {
    playbackDiagRecCapture({
      detail: `demo-click FAIL degraded ${elementDescriptor}`,
      eventKind: "demo-click",
      found: true,
      usable: false,
      clickOk: false,
    });
    return;
  }
  const snapshot = snapshotProvider?.();
  const selectorChain = buildPlaybackSelectorChain(usable);
  // Browse REC must not inherit parked CJM beatId — that lies on STEPS / compile.
  const journeyMode = snapshot?.journeyMode === true;
  const beatId = journeyMode ? snapshot?.beatId : undefined;
  const touchpointKey = journeyMode ? snapshot?.touchpointKey : undefined;
  const label =
    elementDescriptor.trim() || describeRecordingClickTarget(usable);

  captureRecordingEvent({
    kind: "demo-click",
    element: label,
    selectorChain,
    beatId,
    touchpointKey,
  });

  const chainOk = isUsablePlaybackSelectorChain(selectorChain);
  playbackDiagRecCapture({
    detail: chainOk ? `demo-click ${label}` : `demo-click WEAK ${label}`,
    eventKind: "demo-click",
    selector: selectorChain[0] ?? null,
    found: true,
    usable: chainOk,
    clickOk: chainOk,
    beatId: beatId ?? null,
    screenId: snapshot?.screenId ?? null,
  });
}

const RECORDING_CHROME_SELECTOR = [
  ".studio-nav-panel-host",
  ".studio-agent-testing-overlay",
  /* Overlay root still uses legacy class + id (children are studio-*). */
  ".agent-testing-overlay",
  "#agent-testing-overlay",
  ".studio-playback-diagnostic",
  ".studio-playback-shield",
].join(", ");

/** Prefer CTAs / links / actions — not coarse Make modules. */
const RECORDING_CLICK_FIDELITY_SELECTOR = [
  "button",
  "a",
  '[role="button"]',
  '[role="option"]',
  '[role="switch"]',
  "input",
  "select",
  "textarea",
  "label",
  "[data-studio-action]",
  "[data-studio-avail-store]",
  "[data-studio-beat]",
  "[data-studio-plp-tile-id]",
  '[data-name="component.plp.tile.title"]',
  '[data-name="boots-pharmacy.service.tile"]',
].join(", ");

const RECORDING_CLICK_TARGET_SELECTOR = [
  RECORDING_CLICK_FIDELITY_SELECTOR,
  "[data-name]",
].join(", ");

/** Studio chrome / overlays — never record as concept clicks. */
export function isRecordingChromeTarget(el: Element | null): boolean {
  if (!el) return true;
  return Boolean(el.closest(RECORDING_CHROME_SELECTOR));
}

/**
 * Prefer tile CTA / product link / data-studio-action over coarse
 * `module.plp.tiles` containers when the click lands on padding/gap.
 */
export function refineRecordingClickTarget(el: HTMLElement): HTMLElement {
  const tile = el.closest<HTMLElement>("[data-studio-plp-tile-id]");
  if (tile) {
    const book = tile.querySelector<HTMLElement>(
      '[data-studio-action="plp-book-now"]'
    );
    const title = tile.querySelector<HTMLElement>(
      '[data-name="component.plp.tile.title"], a.plp__tile-title-link, a'
    );
    // Click on the Book button / title itself — keep that leaf.
    if (el.closest("[data-studio-action]")) {
      return el.closest<HTMLElement>("[data-studio-action]") ?? el;
    }
    if (
      el.closest("a") ||
      el.closest('[data-name="component.plp.tile.title"]')
    ) {
      return (
        el.closest<HTMLElement>("a, [data-name='component.plp.tile.title']") ??
        el
      );
    }
    // Padding / copy / price → prefer Book now, else title link.
    if (book && (book === el || book.contains(el) || tile.contains(el))) {
      // Heart / Quick View stay on their buttons.
      if (
        el.closest("[data-studio-wishlist-id], [data-studio-quick-view]")
      ) {
        return el.closest<HTMLElement>("button, [role='button']") ?? el;
      }
      return book;
    }
    if (title) return title;
    return tile;
  }

  const action = el.closest<HTMLElement>("[data-studio-action]");
  if (action) return action;

  // Do NOT invent a click by picking the first CTA under a coarse module shell
  // (module.plp.tiles). Padding-inside-tile is handled above via tile closest.
  return el;
}

/** Resolve + refine; null when still a degraded container (must FAIL, not click). */
export function resolveUsableDemoClickTarget(
  raw: HTMLElement | null
): HTMLElement | null {
  if (!raw) return null;
  // Explicit coarse shell (tiles/filters listing) → FAIL. Never invent child CTA.
  if (isDegradedClickTarget(raw)) return null;
  const refined = refineRecordingClickTarget(raw);
  if (isDegradedClickTarget(refined)) return null;
  return refined;
}

/** Nearest interactive / named target for human REC click capture. */
export function resolveRecordingHumanClickTarget(
  raw: EventTarget | null
): HTMLElement | null {
  if (
    !raw ||
    typeof (raw as Element).closest !== "function"
  ) {
    return null;
  }
  const el = raw as Element;
  // Prefer fidelity targets before bare [data-name] module climb.
  const preferred =
    el.closest<HTMLElement>(RECORDING_CLICK_FIDELITY_SELECTOR) ??
    el.closest<HTMLElement>(RECORDING_CLICK_TARGET_SELECTOR);
  if (!preferred || isRecordingChromeTarget(preferred)) return null;
  const refined = refineRecordingClickTarget(preferred);
  if (isRecordingChromeTarget(refined)) return null;
  // Still reject coarse module leaves with no better child.
  if (isDegradedClickTarget(refined)) {
    return null;
  }
  return refined;
}

/**
 * Trusted (human) clicks only — scripted `el.click()` / demo cursor are ignored
 * so they stay on the `notePlaybackDemoClick` path without double-capture.
 */
export function shouldCaptureRecordingHumanClick(event: Event): boolean {
  if (!isRecordingActive()) return false;
  if (!("isTrusted" in event) || event.isTrusted !== true) return false;
  return resolveRecordingHumanClickTarget(event.target) != null;
}

/** Concise human labels for STEPS / nav — scrub Make-ish attr soup. */
export function describeRecordingClickTarget(el: HTMLElement): string {
  // Prefer action slug first (Book now CTA) over noisy button chrome text.
  const action = el.getAttribute("data-studio-action");
  if (action) {
    return humanizeRecordingLabel(action) || action;
  }

  // Prefer a short leaf title over the whole tile/module text dump.
  const titleEl =
    el.matches?.('[data-name="component.plp.tile.title"], a.plp__tile-title-link')
      ? el
      : el.querySelector?.<HTMLElement>(
          '[data-name="component.plp.tile.title"] p, [data-name="component.plp.tile.title"], a.plp__tile-title-link'
        );
  const titleText = (titleEl?.textContent ?? "").replace(/\s+/g, " ").trim();
  if (titleText && titleText.length <= 48) {
    return humanizeRecordingLabel(titleText) || titleText;
  }

  const aria = el.getAttribute("aria-label")?.trim();
  if (aria) return humanizeRecordingLabel(aria) || aria;

  // Avoid concatenating every tile in module.plp.tiles.
  if (!isCoarseMakeModuleName(el.getAttribute("data-name"))) {
    const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
    if (text && text.length <= 40) return text;
    if (text && text.length <= 80) return `${text.slice(0, 37)}…`;
  }

  const dataName = el.getAttribute("data-name");
  if (dataName) return humanizeRecordingLabel(dataName) || dataName;
  return el.tagName.toLowerCase();
}

function onRecordingHumanClick(event: Event): void {
  if (!isRecordingActive()) return;
  if (!("isTrusted" in event) || event.isTrusted !== true) return;
  const raw = event.target;
  if (raw && typeof (raw as Element).closest === "function") {
    const el = raw as Element;
    if (isRecordingChromeTarget(el)) {
      const now = performance.now();
      if (now - lastChromeRejectDiagAtMs >= 800) {
        lastChromeRejectDiagAtMs = now;
        playbackDiagRecCapture({
          detail: "chrome-reject (hub/panel/overlay)",
          eventKind: "demo-click",
          chromeRejected: true,
          found: false,
          usable: false,
        });
      }
      return;
    }
  }
  if (!shouldCaptureRecordingHumanClick(event)) return;
  const target = resolveRecordingHumanClickTarget(event.target);
  if (!target) return;
  const chain = buildPlaybackSelectorChain(target);
  if (chain.length === 0) {
    playbackDiagRecCapture({
      detail: "demo-click no-selector",
      eventKind: "demo-click",
      found: true,
      usable: false,
    });
    return;
  }
  notifyRecordingDemoClick(target, describeRecordingClickTarget(target));
}

function resolvePrototypeScrollRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  // Prefer React Chat `.chat__column` when it owns overflow (same as playback).
  return getPrototypeScrollRoot();
}

function describeCurrentScrollAnchor(): {
  selectorChain?: string[];
  anchorSelector?: string;
} | null {
  const root = resolvePrototypeScrollRoot();
  if (!root) return null;
  const anchorEl = resolveScrollAnchorElement(root);
  if (!anchorEl) return null;
  return describeScrollAnchor(anchorEl);
}

function flushRecordingScrollCapture(): void {
  scrollCaptureTimer = null;
  if (!isRecordingActive()) return;
  const described = describeCurrentScrollAnchor();
  // Targets only — skip position-only scrolls with no resolvable anchor.
  if (!described?.selectorChain?.length && !described?.anchorSelector) return;
  const targetKey = `${described.anchorSelector ?? ""}|${(described.selectorChain ?? []).join(">")}`;
  if (lastCapturedScrollTargetKey === targetKey) return;
  lastCapturedScrollTargetKey = targetKey;
  captureScroll({
    selectorChain: described.selectorChain,
    anchorSelector: described.anchorSelector,
  });
  playbackDiagRecCapture({
    detail: `scroll → ${humanizeRecordingLabel(
      described.anchorSelector ?? described.selectorChain?.[0] ?? "?"
    ) || described.anchorSelector || "?"}`,
    eventKind: "scroll",
    selector: described.anchorSelector ?? described.selectorChain?.[0] ?? null,
    found: true,
    usable: isUsablePlaybackSelectorChain(described.selectorChain),
  });
}

function scheduleScrollStopWatch(): void {
  if (scrollStopTimer != null) clearTimeout(scrollStopTimer);
  scrollStopTimer = setTimeout(() => {
    scrollStopTimer = null;
    flushRecordingScrollStop();
  }, SCROLL_STOP_DWELL_MS);
}

function flushRecordingScrollStop(): void {
  if (!isRecordingActive()) return;
  const root = resolvePrototypeScrollRoot();
  if (!root) return;
  const atMs = performance.now();
  // Seed lastTop for quiet stretches. noteScrollSample may already emit when
  // quiet ≥ dwell (same-top / jiggle path) — must keep that signal. Calling
  // noteScrollIdle alone after a successful sample emit always returns null
  // (armed was cleared), which dropped every timer-based scroll-stop.
  const fromSample = noteScrollSample(
    scrollStopTracker,
    root.scrollTop,
    atMs
  );
  const signal = fromSample ?? noteScrollIdle(scrollStopTracker, atMs);
  if (!signal) return;
  const described = describeCurrentScrollAnchor();
  captureScrollStop({
    durationMs: signal.dwellMs,
    selectorChain: described?.selectorChain,
    anchorSelector: described?.anchorSelector,
  });
  playbackDiagRecCapture({
    detail: `scroll-stop ${signal.dwellMs}ms → ${
      humanizeRecordingLabel(
        described?.anchorSelector ?? described?.selectorChain?.[0] ?? "host"
      ) ||
      described?.anchorSelector ||
      "host"
    }`,
    eventKind: "scroll-stop",
    selector: described?.anchorSelector ?? described?.selectorChain?.[0] ?? null,
    found: true,
    usable: isUsablePlaybackSelectorChain(described?.selectorChain),
  });
}

function onRecordingScroll(event: Event): void {
  if (!isRecordingActive()) return;
  if (!("isTrusted" in event) || event.isTrusted !== true) return;
  const root = resolvePrototypeScrollRoot();
  if (!root || event.target !== root) return;
  const atMs = performance.now();
  const signal = noteScrollSample(scrollStopTracker, root.scrollTop, atMs);
  if (scrollCaptureTimer != null) clearTimeout(scrollCaptureTimer);
  scrollCaptureTimer = setTimeout(
    flushRecordingScrollCapture,
    SCROLL_CAPTURE_DEBOUNCE_MS
  );
  // Meaningful activity arms a ≥2s settle watch; jiggles do not reset via tracker.
  scheduleScrollStopWatch();
  if (signal) {
    const described = describeCurrentScrollAnchor();
    captureScrollStop({
      durationMs: signal.dwellMs,
      selectorChain: described?.selectorChain,
      anchorSelector: described?.anchorSelector,
    });
  }
}

function isTypedTextField(el: Element | null): el is HTMLInputElement | HTMLTextAreaElement {
  if (!el || typeof (el as Element).matches !== "function") return false;
  if (isRecordingChromeTarget(el)) return false;
  try {
    return el.matches(TYPED_TEXT_FIELD_SELECTOR);
  } catch {
    return false;
  }
}

function describeTypedTextTarget(el: HTMLElement): string {
  const action = el.getAttribute("data-studio-action");
  if (action) return `data-studio-action="${action}"`;
  const dataName = el.getAttribute("data-name");
  if (dataName) return `data-name="${dataName}"`;
  const tag = el.tagName.toLowerCase();
  const type =
    el instanceof HTMLInputElement ? el.type || "text" : "textarea";
  return `<${tag} type="${type}">`;
}

function flushTypedTextCapture(el: HTMLInputElement | HTMLTextAreaElement): void {
  typedTextCaptureTimer = null;
  if (!isRecordingActive()) return;
  if (!isTypedTextField(el)) return;
  const chain = buildPlaybackSelectorChain(el);
  if (chain.length === 0) return;
  captureTypedText({
    value: el.value,
    selectorChain: chain,
    element: describeTypedTextTarget(el),
    inputType:
      el instanceof HTMLInputElement ? el.type || "text" : "textarea",
  });
}

function scheduleTypedTextCapture(el: HTMLInputElement | HTMLTextAreaElement): void {
  if (typedTextCaptureTimer != null) clearTimeout(typedTextCaptureTimer);
  typedTextCaptureTimer = setTimeout(
    () => flushTypedTextCapture(el),
    TYPED_TEXT_CAPTURE_DEBOUNCE_MS
  );
}

function onRecordingTypedTextInput(event: Event): void {
  if (!isRecordingActive()) return;
  if (!("isTrusted" in event) || event.isTrusted !== true) return;
  const el = event.target;
  if (!isTypedTextField(el as Element)) return;
  scheduleTypedTextCapture(el as HTMLInputElement | HTMLTextAreaElement);
}

function onRecordingTypedTextChange(event: Event): void {
  if (!isRecordingActive()) return;
  if (!("isTrusted" in event) || event.isTrusted !== true) return;
  const el = event.target;
  if (!isTypedTextField(el as Element)) return;
  if (typedTextCaptureTimer != null) {
    clearTimeout(typedTextCaptureTimer);
    typedTextCaptureTimer = null;
  }
  flushTypedTextCapture(el as HTMLInputElement | HTMLTextAreaElement);
}

function clearDomCaptureTimers(): void {
  if (scrollCaptureTimer != null) {
    clearTimeout(scrollCaptureTimer);
    scrollCaptureTimer = null;
  }
  if (scrollStopTimer != null) {
    clearTimeout(scrollStopTimer);
    scrollStopTimer = null;
  }
  if (typedTextCaptureTimer != null) {
    clearTimeout(typedTextCaptureTimer);
    typedTextCaptureTimer = null;
  }
}

function syncRecordingDomCaptureListeners(): void {
  if (typeof document === "undefined") return;
  const want = isRecordingActive();
  // Seed current screen as step 1 when a new live session arms listeners.
  seedRecordingStartScreen();

  if (want && !humanClickCaptureInstalled) {
    document.addEventListener("click", onRecordingHumanClick, true);
    humanClickCaptureInstalled = true;
  } else if (!want && humanClickCaptureInstalled) {
    document.removeEventListener("click", onRecordingHumanClick, true);
    humanClickCaptureInstalled = false;
  }

  if (want && !scrollCaptureInstalled) {
    document.addEventListener("scroll", onRecordingScroll, true);
    scrollCaptureInstalled = true;
    lastCapturedScrollTargetKey = undefined;
    resetScrollStopTracker(scrollStopTracker);
    // Baseline lastTop so the first real scroll Δ can arm (a lone jump after
    // null lastTop only seeded and never armed → no scroll-stop / camera wait).
    const root = resolvePrototypeScrollRoot();
    if (root) scrollStopTracker.lastTop = root.scrollTop;
  } else if (!want && scrollCaptureInstalled) {
    document.removeEventListener("scroll", onRecordingScroll, true);
    scrollCaptureInstalled = false;
    lastCapturedScrollTargetKey = undefined;
    resetScrollStopTracker(scrollStopTracker);
  }

  if (want && !typedTextCaptureInstalled) {
    document.addEventListener("input", onRecordingTypedTextInput, true);
    document.addEventListener("change", onRecordingTypedTextChange, true);
    typedTextCaptureInstalled = true;
  } else if (!want && typedTextCaptureInstalled) {
    document.removeEventListener("input", onRecordingTypedTextInput, true);
    document.removeEventListener("change", onRecordingTypedTextChange, true);
    typedTextCaptureInstalled = false;
  }

  if (!want) clearDomCaptureTimers();
}

/**
 * Install document capture for human REC clicks, prototype scroll, and typed text.
 * Listeners are live only while `isRecordingActive()` (paused/stopped = off).
 */
export function ensureRecordingDomCapture(): () => void {
  if (typeof document === "undefined") return () => {};
  if (!domCaptureUnsubSession) {
    domCaptureUnsubSession = subscribeRecordingSession(
      syncRecordingDomCaptureListeners
    );
  }
  syncRecordingDomCaptureListeners();
  return () => {
    domCaptureUnsubSession?.();
    domCaptureUnsubSession = null;
    clearDomCaptureTimers();
    if (humanClickCaptureInstalled) {
      document.removeEventListener("click", onRecordingHumanClick, true);
      humanClickCaptureInstalled = false;
    }
    if (scrollCaptureInstalled) {
      document.removeEventListener("scroll", onRecordingScroll, true);
      scrollCaptureInstalled = false;
    }
    if (typedTextCaptureInstalled) {
      document.removeEventListener("input", onRecordingTypedTextInput, true);
      document.removeEventListener("change", onRecordingTypedTextChange, true);
      typedTextCaptureInstalled = false;
    }
    lastCapturedScrollTargetKey = undefined;
  };
}

/** @deprecated alias — use `ensureRecordingDomCapture`. */
export const ensureRecordingHumanClickCapture = ensureRecordingDomCapture;

/** Whether a field is eligible for typed-text capture (tests + guards). */
export function shouldCaptureRecordingTypedText(el: Element | null): boolean {
  return isTypedTextField(el);
}

function parseTransportAction(label: string): ManualTransportAction | null {
  if (label.includes("Step forward")) return "step-forward";
  if (label.includes("Step back")) return "step-back";
  if (label.includes("Jump to start")) return "jump-to-start";
  if (label.includes("Jump to end")) return "jump-to-end";
  if (label.includes("Play")) return "play";
  return null;
}

/** Test-only — resets capture-side state. */
export function resetRecordingCaptureForTests(): void {
  snapshotProvider = null;
  lastTouchpointKey = undefined;
  lastScreenKey = undefined;
  seededStartScreenSessionId = undefined;
  clearDomCaptureTimers();
  if (typeof document !== "undefined") {
    if (humanClickCaptureInstalled) {
      document.removeEventListener("click", onRecordingHumanClick, true);
    }
    if (scrollCaptureInstalled) {
      document.removeEventListener("scroll", onRecordingScroll, true);
    }
    if (typedTextCaptureInstalled) {
      document.removeEventListener("input", onRecordingTypedTextInput, true);
      document.removeEventListener("change", onRecordingTypedTextChange, true);
    }
  }
  humanClickCaptureInstalled = false;
  scrollCaptureInstalled = false;
  typedTextCaptureInstalled = false;
  lastCapturedScrollTargetKey = undefined;
  lastChromeRejectDiagAtMs = 0;
  domCaptureUnsubSession?.();
  domCaptureUnsubSession = null;
}
