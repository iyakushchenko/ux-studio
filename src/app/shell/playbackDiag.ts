/**
 * PLAYBACK_DIAG — console-first CJM playback diagnostics.
 *
 * Contract: every beat (agentic + traditional) logs cursor/scroll/click/type
 * so Quinn can prove regressions without guessing. See docs/shell/PLAYBACK_DIAG.md.
 *
 * Console:
 *   window.__studioPlaybackDiag()
 *   window.__studioAssertTypeIn({ minChars?: number, minSamples?: number })
 *   window.__studioAssertPlayEndedAtStart({ startBeatId, startScreenId? })
 *   window.__studioPlaybackDiagClear()
 */

export type PlaybackDiagKind =
  | "type-in-start"
  | "type-in-progress"
  | "type-in-end"
  | "type-in-skip"
  | "step-forward"
  | "step-back"
  | "retreat-sync"
  | "transport"
  | "play-end"
  | "journey-reset"
  | "hub-nav"
  | "beat"
  | "target"
  | "cursor"
  | "scroll"
  | "click"
  | "skip"
  | "info";

export type PlaybackDiagMode = "agentic" | "traditional" | "browse" | "unknown";

export type PlaybackDiagBBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type PlaybackDiagEvent = {
  t: number;
  kind: PlaybackDiagKind;
  surface?: string;
  detail?: string;
  chars?: number;
  targetChars?: number;
  beatId?: string | null;
  counter?: string | null;
  /** Beat / script kind (tab-landing, screen-frames, homeScript id, …). */
  beatKind?: string | null;
  mode?: PlaybackDiagMode | string | null;
  screenBefore?: string | null;
  screenAfter?: string | null;
  selector?: string | null;
  found?: boolean;
  bbox?: PlaybackDiagBBox | null;
  cursor?: {
    travelStart?: { x: number; y: number } | null;
    travelEnd?: { x: number; y: number } | null;
    onTarget?: boolean;
    hoverApplied?: boolean;
    press?: boolean;
    release?: boolean;
    graphicState?: string | null;
    samples?: number;
    parked?: boolean;
    parkReason?: string | null;
  };
  scroll?: {
    host?: string | null;
    beforeTop?: number | null;
    afterTop?: number | null;
    intoViewRequested?: boolean;
    intoViewDone?: boolean;
    retreat?: boolean;
  };
  clickOk?: boolean;
  typeOk?: boolean;
  skipReason?: string | null;
  startBeatId?: string | null;
  startScreenId?: string | null;
  /** Hub navigation reason + stack (PO leak forensics). */
  hubReason?: string | null;
  hubStack?: string | null;
};

const MAX_EVENTS = 400;
const events: PlaybackDiagEvent[] = [];
let typeInActive: {
  surface: string;
  startedAt: number;
  targetChars: number;
  samples: number[];
} | null = null;

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function readScreenId(): string | null {
  if (typeof location === "undefined") return null;
  return new URLSearchParams(location.search).get("screen");
}

function consolePayload(full: PlaybackDiagEvent): Record<string, unknown> {
  return {
    surface: full.surface,
    detail: full.detail,
    beatId: full.beatId,
    beatKind: full.beatKind,
    mode: full.mode,
    screenBefore: full.screenBefore,
    screenAfter: full.screenAfter,
    selector: full.selector,
    found: full.found,
    bbox: full.bbox,
    cursor: full.cursor,
    scroll: full.scroll,
    clickOk: full.clickOk,
    typeOk: full.typeOk,
    skipReason: full.skipReason,
    chars: full.chars,
    targetChars: full.targetChars,
    counter: full.counter,
    startBeatId: full.startBeatId,
    startScreenId: full.startScreenId,
    hubReason: full.hubReason,
    hubStack: full.hubStack,
  };
}

function push(event: Omit<PlaybackDiagEvent, "t">): PlaybackDiagEvent {
  const full: PlaybackDiagEvent = { t: now(), ...event };
  events.push(full);
  if (events.length > MAX_EVENTS) events.shift();
  // Always mirror to console — PO: "all diagnostics in console".
  console.info("[PLAYBACK_DIAG]", full.kind, consolePayload(full));
  return full;
}

export function playbackDiagClear(): void {
  events.length = 0;
  typeInActive = null;
  console.info("[PLAYBACK_DIAG]", "clear");
}

export function playbackDiagLog(
  kind: PlaybackDiagKind,
  detail?: string,
  extra?: Partial<PlaybackDiagEvent>
): void {
  push({ kind, detail, ...extra });
}

/** Resolve mode from URL / studio state when callers omit it. */
export function resolvePlaybackDiagMode(): PlaybackDiagMode {
  if (typeof location === "undefined") return "unknown";
  const params = new URLSearchParams(location.search);
  const exp = params.get("experience");
  if (exp === "agentic") return "agentic";
  if (exp === "traditional") return "traditional";
  const cjm = params.get("cjm");
  if (cjm === "off") return "browse";
  return "unknown";
}

export function playbackDiagBeat(options: {
  detail?: string;
  beatId?: string | null;
  beatKind?: string | null;
  mode?: PlaybackDiagMode | string | null;
  screenBefore?: string | null;
  screenAfter?: string | null;
  phase?: "enter" | "exit" | "advance" | "retreat";
}): void {
  const screen = readScreenId();
  push({
    kind: "beat",
    detail:
      options.detail ??
      `${options.phase ?? "enter"} ${options.beatId ?? "?"} (${options.beatKind ?? "?"})`,
    beatId: options.beatId,
    beatKind: options.beatKind,
    mode: options.mode ?? resolvePlaybackDiagMode(),
    screenBefore: options.screenBefore ?? screen,
    screenAfter: options.screenAfter ?? screen,
  });
}

export function playbackDiagTarget(options: {
  selector?: string | null;
  found: boolean;
  element?: HTMLElement | null;
  beatId?: string | null;
  detail?: string;
}): void {
  let bbox: PlaybackDiagBBox | null = null;
  if (options.element && typeof options.element.getBoundingClientRect === "function") {
    const r = options.element.getBoundingClientRect();
    bbox = {
      x: Math.round(r.x),
      y: Math.round(r.y),
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
  }
  push({
    kind: "target",
    detail:
      options.detail ??
      (options.found
        ? `target found ${options.selector ?? ""}`
        : `target MISSING ${options.selector ?? ""}`),
    selector: options.selector,
    found: options.found,
    bbox,
    beatId: options.beatId,
  });
}

export function playbackDiagCursor(options: {
  detail?: string;
  beatId?: string | null;
  action?: string;
  travelStart?: { x: number; y: number } | null;
  travelEnd?: { x: number; y: number } | null;
  onTarget?: boolean;
  hoverApplied?: boolean;
  press?: boolean;
  release?: boolean;
  graphicState?: string | null;
  samples?: number;
  parked?: boolean;
  parkReason?: string | null;
  selector?: string | null;
}): void {
  const parked = options.parked === true || options.action === "park";
  push({
    kind: "cursor",
    detail:
      options.detail ??
      (parked
        ? `PARKED — ${options.parkReason ?? options.action ?? "rest"}`
        : `cursor ${options.action ?? "event"}`),
    beatId: options.beatId,
    selector: options.selector,
    cursor: {
      travelStart: options.travelStart,
      travelEnd: options.travelEnd,
      onTarget: options.onTarget,
      hoverApplied: options.hoverApplied,
      press: options.press,
      release: options.release,
      graphicState: options.graphicState,
      samples: options.samples,
      parked,
      parkReason: options.parkReason ?? (parked ? options.detail ?? null : null),
    },
  });
}

export function playbackDiagScroll(options: {
  detail?: string;
  beatId?: string | null;
  host?: string | null;
  beforeTop?: number | null;
  afterTop?: number | null;
  intoViewRequested?: boolean;
  intoViewDone?: boolean;
  retreat?: boolean;
  selector?: string | null;
}): void {
  push({
    kind: "scroll",
    detail:
      options.detail ??
      `scroll ${options.host ?? "?"} ${options.beforeTop ?? "?"}→${options.afterTop ?? "?"}${
        options.retreat ? " (retreat)" : ""
      }`,
    beatId: options.beatId,
    selector: options.selector,
    scroll: {
      host: options.host,
      beforeTop: options.beforeTop,
      afterTop: options.afterTop,
      intoViewRequested: options.intoViewRequested,
      intoViewDone: options.intoViewDone,
      retreat: options.retreat,
    },
  });
}

export function playbackDiagClick(options: {
  ok: boolean;
  selector?: string | null;
  beatId?: string | null;
  detail?: string;
  found?: boolean;
  bbox?: PlaybackDiagBBox | null;
}): void {
  push({
    kind: "click",
    detail:
      options.detail ??
      (options.ok ? `click ok ${options.selector ?? ""}` : `click FAIL ${options.selector ?? ""}`),
    selector: options.selector,
    found: options.found ?? Boolean(options.selector),
    bbox: options.bbox,
    beatId: options.beatId,
    clickOk: options.ok,
  });
}

export function playbackDiagSkip(options: {
  reason: string;
  beatId?: string | null;
  detail?: string;
}): void {
  push({
    kind: "skip",
    detail: options.detail ?? `skipped — ${options.reason}`,
    beatId: options.beatId,
    skipReason: options.reason,
  });
}

export function playbackDiagJourneyReset(options: {
  startBeatId?: string | null;
  startScreenId?: string | null;
  fromBeatId?: string | null;
  detail?: string;
  mode?: PlaybackDiagMode | string | null;
}): void {
  const screen = readScreenId();
  push({
    kind: "journey-reset",
    detail:
      options.detail ??
      `reset → start beat ${options.startBeatId ?? "?"} screen ${options.startScreenId ?? screen ?? "?"}`,
    beatId: options.startBeatId,
    startBeatId: options.startBeatId,
    startScreenId: options.startScreenId ?? screen,
    screenBefore: screen,
    screenAfter: options.startScreenId ?? screen,
    mode: options.mode ?? resolvePlaybackDiagMode(),
    surface: options.fromBeatId
      ? `${options.fromBeatId}→${options.startBeatId ?? "start"}`
      : undefined,
  });
}

/** Mark CJM type-in start (Home / Chat composer). */
export function playbackDiagTypeInStart(
  surface: string,
  targetChars: number,
  detail?: string
): void {
  typeInActive = {
    surface,
    startedAt: now(),
    targetChars,
    samples: [0],
  };
  push({
    kind: "type-in-start",
    surface,
    targetChars,
    chars: 0,
    detail: detail ?? `type-in start → ${targetChars} chars`,
  });
}

/** Sample current typed length during animation. */
export function playbackDiagTypeInProgress(chars: number): void {
  if (!typeInActive) return;
  typeInActive.samples.push(chars);
  // Throttle console noise — log every 16 chars or completion-ish.
  if (chars % 16 === 0 || chars === typeInActive.targetChars) {
    push({
      kind: "type-in-progress",
      surface: typeInActive.surface,
      chars,
      targetChars: typeInActive.targetChars,
    });
  }
}

export function playbackDiagTypeInEnd(ok: boolean, detail?: string): void {
  const active = typeInActive;
  typeInActive = null;
  push({
    kind: "type-in-end",
    surface: active?.surface,
    chars: active?.samples[active.samples.length - 1],
    targetChars: active?.targetChars,
    typeOk: ok,
    detail:
      detail ??
      (ok
        ? `type-in ok (${active?.samples.length ?? 0} samples, ${Math.round(
            now() - (active?.startedAt ?? now())
          )}ms)`
        : "type-in failed / aborted"),
  });
}

/** Forbidden skip path — logged so regressions are obvious. */
export function playbackDiagTypeInSkip(surface: string, reason: string): void {
  push({
    kind: "type-in-skip",
    surface,
    detail: reason,
    skipReason: reason,
  });
}

export type PlaybackDiagBundle = {
  events: PlaybackDiagEvent[];
  typeInActive: typeof typeInActive;
  typeIn: {
    starts: number;
    ends: number;
    skips: number;
    lastStart?: PlaybackDiagEvent;
    lastEnd?: PlaybackDiagEvent;
    progressSamples: number[];
  };
  step: {
    forwards: number;
    backs: number;
    retreatSyncs: number;
  };
  cursor: {
    events: number;
    parks: number;
    lastParkReason?: string | null;
  };
  scroll: {
    events: number;
    retreatIntoView: number;
  };
  click: {
    ok: number;
    fail: number;
  };
  skip: {
    count: number;
    reasons: string[];
  };
  playEnd: {
    count: number;
    last?: PlaybackDiagEvent;
  };
  journeyReset: {
    count: number;
    last?: PlaybackDiagEvent;
  };
  hubNav: {
    count: number;
    last?: PlaybackDiagEvent;
  };
};

export function getPlaybackDiagBundle(): PlaybackDiagBundle {
  const typeStarts = events.filter((e) => e.kind === "type-in-start");
  const typeEnds = events.filter((e) => e.kind === "type-in-end");
  const typeSkips = events.filter((e) => e.kind === "type-in-skip");
  const playEnds = events.filter((e) => e.kind === "play-end");
  const resets = events.filter((e) => e.kind === "journey-reset");
  const hubNavs = events.filter((e) => e.kind === "hub-nav");
  const cursorEvents = events.filter((e) => e.kind === "cursor");
  const parks = cursorEvents.filter((e) => e.cursor?.parked);
  const scrollEvents = events.filter((e) => e.kind === "scroll");
  const clickEvents = events.filter((e) => e.kind === "click");
  const skipEvents = events.filter((e) => e.kind === "skip");
  const progressSamples = events
    .filter((e) => e.kind === "type-in-progress" && typeof e.chars === "number")
    .map((e) => e.chars as number);

  return {
    events: [...events],
    typeInActive,
    typeIn: {
      starts: typeStarts.length,
      ends: typeEnds.length,
      skips: typeSkips.length,
      lastStart: typeStarts[typeStarts.length - 1],
      lastEnd: typeEnds[typeEnds.length - 1],
      progressSamples,
    },
    step: {
      forwards: events.filter((e) => e.kind === "step-forward").length,
      backs: events.filter((e) => e.kind === "step-back").length,
      retreatSyncs: events.filter((e) => e.kind === "retreat-sync").length,
    },
    cursor: {
      events: cursorEvents.length,
      parks: parks.length,
      lastParkReason: parks[parks.length - 1]?.cursor?.parkReason ?? null,
    },
    scroll: {
      events: scrollEvents.length,
      retreatIntoView: scrollEvents.filter(
        (e) => e.scroll?.retreat && e.scroll?.intoViewDone
      ).length,
    },
    click: {
      ok: clickEvents.filter((e) => e.clickOk).length,
      fail: clickEvents.filter((e) => e.clickOk === false).length,
    },
    skip: {
      count: skipEvents.length,
      reasons: skipEvents
        .map((e) => e.skipReason)
        .filter((r): r is string => Boolean(r)),
    },
    playEnd: {
      count: playEnds.length,
      last: playEnds[playEnds.length - 1],
    },
    journeyReset: {
      count: resets.length,
      last: resets[resets.length - 1],
    },
    hubNav: {
      count: hubNavs.length,
      last: hubNavs[hubNavs.length - 1],
    },
  };
}

/** Play finished → CJM start (not hub / not stuck on last beat). */
/**
 * Every navigation to hub must log reason + stack so the next PO leak is obvious.
 * Product paths must never call this except user Hub nav.
 */
export function playbackDiagHubNav(options: {
  reason: string;
  source?: string;
}): void {
  let stack: string | null = null;
  try {
    stack =
      new Error(`hub-nav:${options.reason}`).stack
        ?.split("\n")
        .slice(0, 14)
        .join("\n") ?? null;
  } catch {
    stack = null;
  }
  const screenBefore = readScreenId();
  push({
    kind: "hub-nav",
    detail: options.reason,
    hubReason: options.reason,
    hubStack: stack,
    screenBefore,
    screenAfter: "hub",
    surface: options.source,
    mode: resolvePlaybackDiagMode(),
  });
  try {
    console.warn(
      "[PLAYBACK_DIAG] hub-nav",
      options.reason,
      {
        source: options.source,
        screenBefore,
        stack,
      }
    );
  } catch {
    /* hang-safe */
  }
}

export function playbackDiagPlayEnd(options: {
  fromBeatId?: string | null;
  toBeatId?: string | null;
  counter?: string | null;
  detail?: string;
  startScreenId?: string | null;
}): void {
  const screen = readScreenId();
  push({
    kind: "play-end",
    detail: options.detail ?? "play-end → journey-start",
    beatId: options.toBeatId ?? options.fromBeatId,
    startBeatId: options.toBeatId,
    startScreenId: options.startScreenId ?? screen,
    counter: options.counter,
    screenBefore: screen,
    screenAfter: options.startScreenId ?? screen,
    mode: resolvePlaybackDiagMode(),
    surface: options.fromBeatId
      ? `${options.fromBeatId}→${options.toBeatId ?? "start"}`
      : undefined,
  });
}

export type PlayEndAtStartAssertOptions = {
  /** Expected first playable beat id (e.g. traditional-plp / agentic-home). */
  startBeatId: string;
  /** URL screen id that must match start (e.g. plp / site-pilot). */
  startScreenId?: string;
};

export type PlayEndAtStartAssertResult = {
  pass: boolean;
  reason?: string;
  bundle: PlaybackDiagBundle;
  beatId?: string | null;
  screenId?: string | null;
};

export function assertPlaybackPlayEndedAtStart(
  options: PlayEndAtStartAssertOptions
): PlayEndAtStartAssertResult {
  const bundle = getPlaybackDiagBundle();
  const state = (
    window as Window & {
      __protoStudioState?: () => {
        beatId?: string | null;
        isPlaying?: boolean;
        isOnAir?: boolean;
      };
    }
  ).__protoStudioState?.();
  const beatId = state?.beatId ?? null;
  const screenId =
    typeof location !== "undefined"
      ? new URLSearchParams(location.search).get("screen")
      : null;

  if (bundle.playEnd.count < 1) {
    const result = {
      pass: false,
      reason: "no play-end diag — Play did not return to CJM start",
      bundle,
      beatId,
      screenId,
    };
    console.info("[PLAYBACK_DIAG]", "assertPlayEndAtStart FAIL", result.reason);
    return result;
  }

  if (state?.isPlaying || state?.isOnAir) {
    const result = {
      pass: false,
      reason: "transport still on-air/playing after play-end",
      bundle,
      beatId,
      screenId,
    };
    console.info("[PLAYBACK_DIAG]", "assertPlayEndAtStart FAIL", result.reason);
    return result;
  }

  if (beatId !== options.startBeatId) {
    const result = {
      pass: false,
      reason: `beatId=${beatId ?? "null"} expected start ${options.startBeatId}`,
      bundle,
      beatId,
      screenId,
    };
    console.info("[PLAYBACK_DIAG]", "assertPlayEndAtStart FAIL", result.reason);
    return result;
  }

  if (screenId === "hub") {
    const result = {
      pass: false,
      reason: "screen=hub after play-end — must stay on CJM start, not hub",
      bundle,
      beatId,
      screenId,
    };
    console.info("[PLAYBACK_DIAG]", "assertPlayEndAtStart FAIL", result.reason);
    return result;
  }

  if (options.startScreenId && screenId !== options.startScreenId) {
    const result = {
      pass: false,
      reason: `screen=${screenId ?? "null"} expected ${options.startScreenId}`,
      bundle,
      beatId,
      screenId,
    };
    console.info("[PLAYBACK_DIAG]", "assertPlayEndAtStart FAIL", result.reason);
    return result;
  }

  const result = { pass: true, bundle, beatId, screenId };
  console.info("[PLAYBACK_DIAG]", "assertPlayEndAtStart PASS", {
    beatId,
    screenId,
    playEndCount: bundle.playEnd.count,
  });
  return result;
}

export type TypeInAssertOptions = {
  /** Minimum unique char lengths observed during type-in (default 3). */
  minSamples?: number;
  /** Minimum final chars (default 8). */
  minChars?: number;
  /** Fail if any type-in-skip was logged since clear (default true). */
  failOnSkip?: boolean;
};

export type TypeInAssertResult = {
  pass: boolean;
  reason?: string;
  bundle: PlaybackDiagBundle;
};

export function assertPlaybackTypeIn(
  options?: TypeInAssertOptions
): TypeInAssertResult {
  const minSamples = options?.minSamples ?? 3;
  const minChars = options?.minChars ?? 8;
  const failOnSkip = options?.failOnSkip ?? true;
  const bundle = getPlaybackDiagBundle();

  if (failOnSkip && bundle.typeIn.skips > 0) {
    const result = {
      pass: false,
      reason: `type-in-skip logged (${bundle.typeIn.skips}) — prefilled skip is forbidden in CJM`,
      bundle,
    };
    console.info("[PLAYBACK_DIAG]", "assertTypeIn FAIL", result.reason);
    return result;
  }

  if (bundle.typeIn.starts < 1) {
    const result = {
      pass: false,
      reason: "no type-in-start events",
      bundle,
    };
    console.info("[PLAYBACK_DIAG]", "assertTypeIn FAIL", result.reason);
    return result;
  }

  const unique = [...new Set(bundle.typeIn.progressSamples)];
  if (unique.length < minSamples) {
    const result = {
      pass: false,
      reason: `type-in progress samples ${unique.length} < minSamples ${minSamples} (unique=${JSON.stringify(unique)})`,
      bundle,
    };
    console.info("[PLAYBACK_DIAG]", "assertTypeIn FAIL", result.reason);
    return result;
  }

  const maxChars = Math.max(0, ...unique);
  if (maxChars < minChars) {
    const result = {
      pass: false,
      reason: `type-in max chars ${maxChars} < minChars ${minChars}`,
      bundle,
    };
    console.info("[PLAYBACK_DIAG]", "assertTypeIn FAIL", result.reason);
    return result;
  }

  const result = { pass: true, bundle };
  console.info("[PLAYBACK_DIAG]", "assertTypeIn PASS", {
    starts: bundle.typeIn.starts,
    uniqueSamples: unique.length,
    maxChars,
  });
  return result;
}

export function installPlaybackDiagWindowApis(): void {
  const w = window as Window & {
    __studioPlaybackDiag?: () => PlaybackDiagBundle;
    __studioPlaybackDiagClear?: () => void;
    __studioAssertTypeIn?: (options?: TypeInAssertOptions) => TypeInAssertResult;
    __studioAssertPlayEndedAtStart?: (
      options: PlayEndAtStartAssertOptions
    ) => PlayEndAtStartAssertResult;
    __protoPlaybackDiag?: () => PlaybackDiagBundle;
    __protoPlaybackDiagClear?: () => void;
    __protoAssertTypeIn?: (options?: TypeInAssertOptions) => TypeInAssertResult;
    __protoAssertPlayEndedAtStart?: (
      options: PlayEndAtStartAssertOptions
    ) => PlayEndAtStartAssertResult;
  };
  w.__studioPlaybackDiag = getPlaybackDiagBundle;
  w.__studioPlaybackDiagClear = playbackDiagClear;
  w.__studioAssertTypeIn = assertPlaybackTypeIn;
  w.__studioAssertPlayEndedAtStart = assertPlaybackPlayEndedAtStart;
  w.__protoPlaybackDiag = getPlaybackDiagBundle;
  w.__protoPlaybackDiagClear = playbackDiagClear;
  w.__protoAssertTypeIn = assertPlaybackTypeIn;
  w.__protoAssertPlayEndedAtStart = assertPlaybackPlayEndedAtStart;
}

export function uninstallPlaybackDiagWindowApis(): void {
  const w = window as Window & {
    __studioPlaybackDiag?: unknown;
    __studioAssertPlayEndedAtStart?: unknown;
    __protoAssertPlayEndedAtStart?: unknown;
    __studioPlaybackDiagClear?: unknown;
    __studioAssertTypeIn?: unknown;
    __protoPlaybackDiag?: unknown;
    __protoPlaybackDiagClear?: unknown;
    __protoAssertTypeIn?: unknown;
  };
  delete w.__studioPlaybackDiag;
  delete w.__studioPlaybackDiagClear;
  delete w.__studioAssertTypeIn;
  delete w.__studioAssertPlayEndedAtStart;
  delete w.__protoPlaybackDiag;
  delete w.__protoPlaybackDiagClear;
  delete w.__protoAssertTypeIn;
  delete w.__protoAssertPlayEndedAtStart;
}
