/**

 * Cursor engine SSoT — park / travel / visibility policy for any CJM / REC /

 * director / chat (same spirit as camera engine in playbackScroll.ts).

 *

 * Implementation of Motion travel + DOM lives in `demoCursor.ts`.

 * This module owns **policy**:

 * - travel-to-rest by default; hard snap only via explicit `force` or first-mount

 * - step vs continuous Play park (park only on stepped playback)

 * - forbidden rest targets (composer submit — never leave cursor on send)

 * - early hand-on-edge (interactive hit during travel)

 *

 * @see docs/shell/PLAYBACK.md § Cursor engine SSoT

 * @see docs/product/MOTION.md § Robo-cursor travel

 */



import { playbackDiagCursor } from "@/app/shell/playbackDiag";



/** Park travel duration — easeInOut via Motion (no bounce). */

export const CURSOR_ENGINE_PARK_TRAVEL_MS = 520;



/** CTA / director travel duration (shared rail). */

export const CURSOR_ENGINE_TRAVEL_MS = 780;



export type CursorParkReason =

  | "journey-park"

  | "type-in-park"

  | "legacy-fade-path"

  | "suppressed-hold-at-last-click"

  | "first-mount"

  | "force-snap"

  | "abrupt-coerced"

  | "park-on-step"

  | "park-from-submit"

  | (string & {});



export type CursorParkDecision = {

  /** True → Motion travel-to-rest; false → intentional seed/snap. */

  animate: boolean;

  /** Caller asked animate:false without force while a start pose existed. */

  abruptAttempt: boolean;

  /** Effective park reason for diag / QA. */

  reason: CursorParkReason;

  /** first-mount | force | travel | abrupt-coerced */

  mode: "first-mount" | "force" | "travel" | "abrupt-coerced";

};



export type ResolveCursorParkOptions = {

  /**

   * Intentional hard snap — first remount / revive / resize / observe teardown /

   * type-in re-seed when already mid-flight. Required to bypass travel-to-rest.

   */

  force?: boolean;

  /**

   * @deprecated Prefer omit (travel) or `force` (snap). `animate: false` without

   * `force` is treated as an abrupt attempt → coerced to travel + QA FAIL row.

   */

  animate?: boolean;

  /** Human/diag reason (journey-park, retreat, jump-to-start, …). */

  reason?: string;

  /** Cursor already has finite left/top. */

  hasStartPos: boolean;

  /** Already wearing parked class at a stable pose — no-op reassert. */

  alreadyParked?: boolean;

};



/**

 * Resolve park policy. Callers must not invent a second snap path.

 */

export function resolveCursorParkDecision(

  options: ResolveCursorParkOptions

): CursorParkDecision {

  const reasonBase = (options.reason?.trim() || "journey-park") as CursorParkReason;



  if (options.alreadyParked && options.hasStartPos && !options.force) {

    return {

      animate: false,

      abruptAttempt: false,

      reason: reasonBase,

      mode: "travel", // no move — hold pose

    };

  }



  // No pose yet → first mount seed (intentional snap).

  if (!options.hasStartPos) {

    return {

      animate: false,

      abruptAttempt: false,

      reason: options.reason?.trim()

        ? reasonBase

        : ("first-mount" as CursorParkReason),

      mode: "first-mount",

    };

  }



  if (options.force === true) {

    return {

      animate: false,

      abruptAttempt: false,

      reason: reasonBase,

      mode: "force",

    };

  }



  // Legacy animate:false without force = abrupt teleport ban → coerce travel.

  if (options.animate === false) {

    return {

      animate: true,

      abruptAttempt: true,

      reason: "abrupt-coerced",

      mode: "abrupt-coerced",

    };

  }



  // Default + animate:true → travel-to-rest.

  return {

    animate: true,

    abruptAttempt: false,

    reason: reasonBase,

    mode: "travel",

  };

}



/* -------------------------------------------------------------------------- */

/* Step vs Play + forbidden rest (composer submit)                            */

/* -------------------------------------------------------------------------- */



/**

 * Transport mode for post-interaction settle.

 * - `step` — manual Step forward/back / stepped call → park after interaction

 * - `play` — continuous Play → stay at last interaction (unless forbidden rest)

 */

export type CursorTransportMode = "step" | "play";



/**

 * Registered forbidden rest targets — never leave the robo-cursor resting here

 * (demo UX: composer send/submit looks stuck). Engine-agnostic registration.

 */

export const FORBIDDEN_REST_TARGET_SELECTORS: readonly string[] = [

  'button[data-studio-action="agentic-chat-send"]',

  'button[data-studio-action="agentic-home-send"]',

  ".proto-agentic-send",

  ".site-pilot-composer__send",

  'button[type="submit"].proto-agentic-send',

  'button[type="submit"].site-pilot-composer__send',

];



export type PostInteractionParkReason =

  | "park-on-step"

  | "stay-on-play"

  | "park-from-submit";



export type PostInteractionParkDecision = {

  /** True → travel-to-rest; false → hold at last click. */

  park: boolean;

  reason: PostInteractionParkReason;

  /** True when target matched a forbidden rest selector. */

  forbiddenRest: boolean;

};



export type ResolvePostInteractionParkOptions = {

  /**

   * Stepped playback parks; continuous Play stays — unless forbidden rest.

   * When omitted, treat as step (safer park default for idle/manual).

   */

  transportMode: CursorTransportMode;

  /** Last interaction / hover root (submit detection). */

  target?: Element | null;

};



/**

 * Whether `el` (or an ancestor) matches a registered forbidden rest selector.

 */

export function isForbiddenRestTarget(el: Element | null | undefined): boolean {

  if (!el || !(el instanceof Element)) return false;

  let node: Element | null = el;

  while (node) {

    for (const sel of FORBIDDEN_REST_TARGET_SELECTORS) {

      try {

        if (node.matches(sel)) return true;

      } catch {

        /* invalid selector — skip */

      }

    }

    node = node.parentElement;

  }

  return false;

}



/**

 * Core post-click / post-script settle policy.

 * Park ONLY on stepped playback; continuous Play stays — except composer

 * submit / send which ALWAYS parks (even during Play).

 */

export function resolvePostInteractionPark(

  options: ResolvePostInteractionParkOptions

): PostInteractionParkDecision {

  const forbidden = isForbiddenRestTarget(options.target ?? null);

  if (forbidden) {

    return {

      park: true,

      reason: "park-from-submit",

      forbiddenRest: true,

    };

  }

  if (options.transportMode === "play") {

    return {

      park: false,

      reason: "stay-on-play",

      forbiddenRest: false,

    };

  }

  return {

    park: true,

    reason: "park-on-step",

    forbiddenRest: false,

  };

}



/* -------------------------------------------------------------------------- */

/* Early hand-on-edge (interactive hit during travel)                         */

/* -------------------------------------------------------------------------- */



/**

 * Selectors for snappy hand graphic — edge hit (not center-only).

 * Keep aligned with demoCursor interaction roots (buttons / links / fields).

 */

export const EARLY_HAND_INTERACTIVE_SELECTORS: readonly string[] = [

  "button",

  "a[href]",

  'a[role="button"]',

  '[role="button"]',

  'input:not([type="hidden"])',

  "textarea",

  "select",

  '[data-name="component.input.button"]',

  '[data-name="component.input.field"]',

  ".proto-search-field",

  ".proto-avail-field",

  ".studio-tertiary-cta",

  ".proto-avail-tertiary",

  ".proto-avail-btn-primary",

  ".proto-avail-btn-secondary",

  ".proto-header-avatar",

  "a.proto-link",

  ".proto-link",

  ".proto-agentic-send",

  ".site-pilot-composer__send",

];



/**

 * True when `el` (or ancestor) is an interactive control for early hand.

 */

export function isEarlyHandInteractiveTarget(

  el: Element | null | undefined

): boolean {

  if (!el || !(el instanceof Element)) return false;

  let node: Element | null = el;

  while (node) {

    // Ignore studio chrome / cursor itself.

    if (

      node.classList?.contains("proto-chat-demo-cursor") ||

      node.hasAttribute?.("data-studio-playback-shield") ||

      node.classList?.contains("studio-agent-testing-overlay")

    ) {

      return false;

    }

    for (const sel of EARLY_HAND_INTERACTIVE_SELECTORS) {

      try {

        if (node.matches(sel)) return true;

      } catch {

        /* skip */

      }

    }

    node = node.parentElement;

  }

  return false;

}



/**

 * Hotspot over the **edge** (or interior) of a target rect — not center-gated.

 * Inflate slightly so travel near the border flips hand early.

 */

/**
 * Text / search / contenteditable — carriage (I-beam) when focused.
 * Excludes button-like input types.
 */
export function isTextEntryFocusTarget(
  el: Element | null | undefined
): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  if (el.isContentEditable || el.getAttribute("contenteditable") === "true") {
    return true;
  }
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) {
    const t = (el.type || "text").toLowerCase();
    if (
      t === "button" ||
      t === "submit" ||
      t === "reset" ||
      t === "checkbox" ||
      t === "radio" ||
      t === "file" ||
      t === "color" ||
      t === "range" ||
      t === "hidden" ||
      t === "image"
    ) {
      return false;
    }
    return true;
  }
  return false;
}

export function isHotspotOverInteractiveEdge(

  hotspotX: number,

  hotspotY: number,

  target: Element | null | undefined,

  options?: { inflatePx?: number }

): boolean {

  if (!target || !(target instanceof Element)) return false;

  if (!isEarlyHandInteractiveTarget(target)) return false;

  const inflate = options?.inflatePx ?? 2;

  const rect = target.getBoundingClientRect();

  if (rect.width < 1 || rect.height < 1) return false;

  return (

    hotspotX >= rect.left - inflate &&

    hotspotX <= rect.right + inflate &&

    hotspotY >= rect.top - inflate &&

    hotspotY <= rect.bottom + inflate

  );

}



/**
 * Hit-test under hotspot for early hand during CTA travel.
 * When `destination` is set, prefer destination-edge only (steady binary —
 * do not flip hand over mid-path links via elementFromPoint).
 * `destinationOnly` defaults true when destination is provided.
 */
export function resolveEarlyHandAtHotspot(
  hotspotX: number,
  hotspotY: number,
  options?: { destination?: Element | null; destinationOnly?: boolean }
): boolean {
  const destination = options?.destination ?? null;
  if (
    destination &&
    isHotspotOverInteractiveEdge(hotspotX, hotspotY, destination)
  ) {
    return true;
  }
  const destinationOnly =
    options?.destinationOnly !== undefined
      ? options.destinationOnly
      : !!destination;
  if (destinationOnly) {
    return false;
  }
  if (
    typeof document === "undefined" ||
    typeof document.elementFromPoint !== "function"
  ) {
    return false;
  }
  try {
    const hit = document.elementFromPoint(hotspotX, hotspotY);
    return isEarlyHandInteractiveTarget(hit);
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------------------- */

/* Lean QA trackers                                                           */

/* -------------------------------------------------------------------------- */



/** Lean QA trackers for cursor engine (deduped — not park-spam flood). */

export type CursorEngineTracker =

  | "park-rest"

  | "park-force"

  | "abrupt-park"

  | "type-in-hold"

  | "cancel-settle"

  | "park-on-step"

  | "stay-on-play"

  | "park-from-submit"

  /** FAIL — cursor left resting on composer submit / send. */

  | "rest-on-submit"

  /** Graphic mode: arrow (default). */

  | "graphic-arrow"

  /** Graphic mode: hand (CTA hover). */

  | "graphic-hand"

  /** Graphic mode: carriage / I-beam (text + composer focus). */

  | "graphic-carriage";



export const CURSOR_GRAPHIC_THRASH_WINDOW_MS = 200;

type GraphicModeSample = { mode: "arrow" | "pointer" | "carriage"; at: number };
let recentGraphicModes: GraphicModeSample[] = [];
/** Only arm during CTA travel — post-click arrow + next travel hand is intentional. */
let graphicThrashWatchArmed = false;

/** Start of animateCursorTravel — arm thrash watch + clear window. */
export function beginCursorGraphicThrashWatch(): void {
  recentGraphicModes = [];
  graphicThrashWatchArmed = true;
}

/** End of travel (settle / abort) — disarm so leave→next-travel is not thrash. */
export function endCursorGraphicThrashWatch(): void {
  graphicThrashWatchArmed = false;
  recentGraphicModes = [];
}

/**
 * Note a graphic mode change; emit graphic-thrash FAIL on arrow↔hand A→B→A
 * within CURSOR_GRAPHIC_THRASH_WINDOW_MS while travel watch is armed.
 */
export function noteCursorGraphicModeChange(
  mode: "arrow" | "pointer" | "carriage"
): void {
  if (!graphicThrashWatchArmed) return;
  const at =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  recentGraphicModes.push({ mode, at });
  recentGraphicModes = recentGraphicModes.filter(
    (e) => at - e.at <= CURSOR_GRAPHIC_THRASH_WINDOW_MS
  );
  if (recentGraphicModes.length < 3) return;
  const a = recentGraphicModes[recentGraphicModes.length - 3]!;
  const b = recentGraphicModes[recentGraphicModes.length - 2]!;
  const c = recentGraphicModes[recentGraphicModes.length - 1]!;
  const binary =
    (a.mode === "arrow" || a.mode === "pointer") &&
    (b.mode === "arrow" || b.mode === "pointer") &&
    (c.mode === "arrow" || c.mode === "pointer");
  if (!binary) return;
  if (a.mode === c.mode && a.mode !== b.mode) {
    logCursorEngineTracker("graphic-thrash", {
      reason: "steady-binary",
      detail:
        "cursor-engine:graphic-thrash — " +
        a.mode +
        "→" +
        b.mode +
        "→" +
        c.mode +
        " <" +
        CURSOR_GRAPHIC_THRASH_WINDOW_MS +
        "ms",
    });
  }
}

/** Test / prove reset — clear thrash sliding window. */
export function resetCursorGraphicThrashWindow(): void {
  recentGraphicModes = [];
  graphicThrashWatchArmed = false;
}

let lastCursorEngineTrackerKey: string | null = null;

let lastCursorEngineTrackerAt = 0;

const CURSOR_ENGINE_TRACKER_DEDUPE_MS = 480;



/**

 * Lean cursor-engine diag rows. Abrupt / rest-on-submit = always emit (FAIL).

 * Park milestones = deduped.

 */

export function logCursorEngineTracker(

  tag: CursorEngineTracker,

  options?: { reason?: string; beatId?: string | null; detail?: string }

): void {

  const detail =

    options?.detail ??

    `cursor-engine:${tag}${options?.reason ? ` — ${options.reason}` : ""}`;

  const now =

    typeof performance !== "undefined" ? performance.now() : Date.now();

  const isFail =
    tag === "abrupt-park" ||
    tag === "rest-on-submit" ||
    tag === "graphic-thrash";

  const dedupeMs = isFail ? 120 : CURSOR_ENGINE_TRACKER_DEDUPE_MS;

  if (

    detail === lastCursorEngineTrackerKey &&

    now - lastCursorEngineTrackerAt < dedupeMs

  ) {

    return;

  }

  lastCursorEngineTrackerKey = detail;

  lastCursorEngineTrackerAt = now;

  try {

    playbackDiagCursor({

      detail: isFail
        ? tag === "rest-on-submit"
          ? `REST-ON-SUBMIT FAIL — ${detail}`
          : tag === "graphic-thrash"
            ? `GRAPHIC-THRASH FAIL — ${detail}`
            : `ABRUPT-PARK FAIL — ${detail}`
        : detail,

      parked:

        tag === "park-rest" ||

        tag === "park-force" ||

        tag === "type-in-hold" ||

        tag === "park-on-step" ||

        tag === "park-from-submit",

      parkReason: options?.reason ?? tag,

      beatId: options?.beatId,

      action: "park",

    });

  } catch {

    /* hang-safe */

  }

}



export function resetCursorEngineTrackerForTests(): void {

  lastCursorEngineTrackerKey = null;

  lastCursorEngineTrackerAt = 0;

}


