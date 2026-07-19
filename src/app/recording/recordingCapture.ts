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
import type {
  ManualTransportAction,
  PlaybackInteractionRecord,
} from "@/app/shell/playbackInteractionContext";

let snapshotProvider: (() => RecordingSnapshot | undefined) | null = null;
let lastTouchpointKey: string | undefined;
let humanClickCaptureInstalled = false;
let scrollCaptureInstalled = false;
let typedTextCaptureInstalled = false;
let domCaptureUnsubSession: (() => void) | null = null;
let scrollCaptureTimer: ReturnType<typeof setTimeout> | null = null;
let typedTextCaptureTimer: ReturnType<typeof setTimeout> | null = null;
let lastCapturedScrollTop: number | undefined;

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
  // Prefer a unique studio action on the click target — ignore noisy ancestors
  // (progress "Step N", breadcrumbs) that break nested resolve.
  const selfAction = el.getAttribute("data-studio-action");
  if (selfAction) {
    return [`[data-studio-action="${selfAction}"]`];
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
    if (dataName) chain.unshift(`[data-name="${dataName}"]`);

    if (chain.length === 0 && tag) {
      const id = node.id;
      if (id) chain.unshift(`#${id}`);
    }

    node = node.parentElement;
  }

  return [...new Set(chain)];
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

export function captureScroll(options: {
  scrollTop?: number;
  anchorSelector?: string;
}): void {
  if (!getActiveRecordingSession()) return;
  captureRecordingEvent({
    kind: "scroll",
    scrollTop: options.scrollTop,
    anchorSelector: options.anchorSelector,
  });
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

/** Ordered page/URL transition for replay deep-link restore. */
export function captureScreenChange(options: {
  screenId: string;
  projectId?: string;
  studioUrl?: string;
}): void {
  if (!getActiveRecordingSession()) return;
  const key = `${options.projectId ?? ""}|${options.screenId}|${options.studioUrl ?? ""}`;
  if (lastScreenKey === key) return;
  lastScreenKey = key;

  captureRecordingEvent({
    kind: "screen",
    screenId: options.screenId,
    projectId: options.projectId,
    studioUrl: options.studioUrl,
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
  const snapshot = snapshotProvider?.();

  captureRecordingEvent({
    kind: "demo-click",
    element: elementDescriptor,
    selectorChain: buildPlaybackSelectorChain(target),
    beatId: snapshot?.beatId,
    touchpointKey: snapshot?.touchpointKey,
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

const RECORDING_CLICK_TARGET_SELECTOR = [
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
  "[data-name]",
].join(", ");

/** Studio chrome / overlays — never record as concept clicks. */
export function isRecordingChromeTarget(el: Element | null): boolean {
  if (!el) return true;
  return Boolean(el.closest(RECORDING_CHROME_SELECTOR));
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
  const el = (raw as Element).closest<HTMLElement>(RECORDING_CLICK_TARGET_SELECTOR);
  if (!el || isRecordingChromeTarget(el)) return null;
  return el;
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

function describeRecordingClickTarget(el: HTMLElement): string {
  const action = el.getAttribute("data-studio-action");
  if (action) return `data-studio-action="${action}"`;
  const dataName = el.getAttribute("data-name");
  if (dataName) return `data-name="${dataName}"`;
  const tag = el.tagName.toLowerCase();
  const text = (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 48);
  return text ? `<${tag}> text="${text}"` : `<${tag}>`;
}

function onRecordingHumanClick(event: Event): void {
  if (!shouldCaptureRecordingHumanClick(event)) return;
  const target = resolveRecordingHumanClickTarget(event.target);
  if (!target) return;
  const chain = buildPlaybackSelectorChain(target);
  if (chain.length === 0) return;
  notifyRecordingDemoClick(target, describeRecordingClickTarget(target));
}

function resolvePrototypeScrollRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return (
    document.querySelector<HTMLElement>(
      ".studio-scroll--prototype:not(.hidden)"
    ) ??
    document.querySelector<HTMLElement>(".studio-scroll--prototype")
  );
}

function flushRecordingScrollCapture(): void {
  scrollCaptureTimer = null;
  if (!isRecordingActive()) return;
  const root = resolvePrototypeScrollRoot();
  if (!root) return;
  const scrollTop = Math.round(root.scrollTop);
  if (lastCapturedScrollTop === scrollTop) return;
  lastCapturedScrollTop = scrollTop;
  captureScroll({ scrollTop });
}

function onRecordingScroll(event: Event): void {
  if (!isRecordingActive()) return;
  if (!("isTrusted" in event) || event.isTrusted !== true) return;
  const root = resolvePrototypeScrollRoot();
  if (!root || event.target !== root) return;
  if (scrollCaptureTimer != null) clearTimeout(scrollCaptureTimer);
  scrollCaptureTimer = setTimeout(
    flushRecordingScrollCapture,
    SCROLL_CAPTURE_DEBOUNCE_MS
  );
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
  if (typedTextCaptureTimer != null) {
    clearTimeout(typedTextCaptureTimer);
    typedTextCaptureTimer = null;
  }
}

function syncRecordingDomCaptureListeners(): void {
  if (typeof document === "undefined") return;
  const want = isRecordingActive();

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
    lastCapturedScrollTop = undefined;
  } else if (!want && scrollCaptureInstalled) {
    document.removeEventListener("scroll", onRecordingScroll, true);
    scrollCaptureInstalled = false;
    lastCapturedScrollTop = undefined;
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
    lastCapturedScrollTop = undefined;
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
  lastCapturedScrollTop = undefined;
  domCaptureUnsubSession?.();
  domCaptureUnsubSession = null;
}
