/**
 * Universal full Play prove — one engine for any CJM.
 *
 * ALWAYS: requireFreshQaSession (forceClear + start, no skip) → full Play →
 * peak assert → leave pause (keeps QA overlay for Save Log).
 *
 * Prefer `__studioRunFullPlayProve({ journeyId | experience })`.
 * Agentic / Traditional helpers are thin presets only.
 */

import {
  DEFAULT_PREARM_MS,
  logAgentTestingOverlay,
  pauseForAgentLeave,
  preArmAgentTestingOverlay,
  type AgentLeavePauseResult,
} from "@/app/shell/agent-testing/agentTestingOverlay";
import { requireFreshQaSession } from "@/app/shell/requireFreshQaSession";
import {
  beginQaProveMode,
  endQaProveMode,
} from "@/app/shell/agent-testing/agentTestingPresence";
import {
  beginMcpTestSession,
  endMcpTestSession,
  getMcpTestSession,
  requestMcpTestAbort,
} from "@/app/shell/mcpTestGuard";
import {
  disableCursorQaEyes,
  enableCursorQaEyes,
} from "@/app/shell/playbackCursorDiagnostic";
import type { PlayEndAtEndAssertResult } from "@/app/shell/playbackDiag";
import {
  runPlayJourneyToEndSmoke,
  type PlayJourneySmokeResult,
} from "@/app/shell/playJourneySmoke";
import { getImportedJourneys } from "@/app/journey/journeyRuntimeStore";
import { logAgentTestingStep } from "@/app/shell/agent-testing/agentTestingOverlay";
import {
  setPlaybackTimingMode,
  type PlaybackTimingMode,
} from "@/app/shell/playbackTiming";

export type FullPlayProveExperience = "agentic" | "traditional";

export type FullPlayProvePeak = {
  visible: number;
  total: number;
  counter: string | null;
};

export type FullPlayProveResult = {
  pass: boolean;
  peak: FullPlayProvePeak;
  end: PlayEndAtEndAssertResult | null;
  errors: string[];
  /** Leave result — overlay stays open for Save Log. */
  leave?: AgentLeavePauseResult;
  /** Raw smoke payload (debug; do not invent green from this alone). */
  smoke?: PlayJourneySmokeResult;
  /** Resolved preset / journey id used for this run. */
  journeyId: string;
  experience: FullPlayProveExperience;
};

export type FullPlayProvePeakMode = "exact" | "login-skip-safe";

export type FullPlayProvePreset = {
  experience: FullPlayProveExperience;
  journeyId: string;
  orchestraMode: string;
  startBeatId: string;
  startScreenId: string;
  /** Finale beat after continuous Play (product: stay here — no auto-rewind). */
  endBeatId: string;
  endScreenId: string;
  expectedPeak: number;
  timeoutMs: number;
  peakMode: FullPlayProvePeakMode;
  allowedPeaks?: readonly number[];
  sessionName: string;
  overlayTitle: string;
};

/** Boots reference presets — other CJMs pass explicit start/peak overrides. */
export const FULL_PLAY_PROVE_PRESETS: Record<
  FullPlayProveExperience,
  FullPlayProvePreset
> = {
  agentic: {
    experience: "agentic",
    journeyId: "agentic-cjm",
    orchestraMode: "agentic-cjm",
    startBeatId: "agentic-home",
    startScreenId: "site-pilot",
    endBeatId: "appointment-details",
    endScreenId: "appointment-details",
    expectedPeak: 22,
    timeoutMs: 300_000,
    peakMode: "exact",
    sessionName: "full-play-prove",
    overlayTitle: "AGENT TESTING — full play prove",
  },
  traditional: {
    experience: "traditional",
    journeyId: "traditional-cjm",
    orchestraMode: "traditional-cjm",
    startBeatId: "traditional-plp",
    startScreenId: "plp",
    endBeatId: "appointment-details",
    endScreenId: "appointment-details",
    expectedPeak: 13,
    timeoutMs: 180_000,
    peakMode: "login-skip-safe",
    allowedPeaks: [13, 12, 10],
    sessionName: "full-play-prove",
    overlayTitle: "AGENT TESTING — full play prove",
  },
};

/** @deprecated Prefer FULL_PLAY_PROVE_PRESETS.agentic.expectedPeak */
export const AGENTIC_FULL_PLAY_EXPECTED_PEAK =
  FULL_PLAY_PROVE_PRESETS.agentic.expectedPeak;
/** @deprecated Prefer FULL_PLAY_PROVE_PRESETS.agentic.timeoutMs */
export const AGENTIC_FULL_PLAY_PROVE_DEFAULT_TIMEOUT_MS =
  FULL_PLAY_PROVE_PRESETS.agentic.timeoutMs;
/** @deprecated Prefer FULL_PLAY_PROVE_PRESETS.traditional.expectedPeak */
export const TRADITIONAL_FULL_PLAY_EXPECTED_PEAK =
  FULL_PLAY_PROVE_PRESETS.traditional.expectedPeak;
/** @deprecated Prefer FULL_PLAY_PROVE_PRESETS.traditional.timeoutMs */
export const TRADITIONAL_FULL_PLAY_PROVE_DEFAULT_TIMEOUT_MS =
  FULL_PLAY_PROVE_PRESETS.traditional.timeoutMs;

export type FullPlayProveOptions = {
  /**
   * Built-in journey id (`agentic-cjm` / `traditional-cjm`) or free recorded id.
   * When omitted, {@link experience} (default agentic) selects the preset.
   */
  journeyId?: string;
  /** Thin experience preset — ignored when journeyId maps to a known preset. */
  experience?: FullPlayProveExperience;
  timeoutMs?: number;
  continueOnPoAlarm?: boolean;
  expectedPeak?: number;
  /**
   * Dynamic prerequisite routes: accept the runtime-filtered total when the
   * journey genuinely reaches its end. Default true for traditional preset.
   */
  allowLoginSkipPeak?: boolean;
  preArmMs?: number;
  delay?: (ms: number) => Promise<void>;
  /** Override preset start (recorded / custom CJMs). */
  startBeatId?: string;
  startScreenId?: string;
  /** Override preset finale (recorded / custom CJMs). */
  endBeatId?: string;
  endScreenId?: string;
  orchestraMode?: string;
  peakMode?: FullPlayProvePeakMode;
  /** Exact route-contract totals allowed after prerequisite filtering. */
  allowedPeaks?: readonly number[];
  /** QA-only presentation timing; functional guards and assertions are unchanged. */
  playbackSpeed?: PlaybackTimingMode;
};

function delayMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function parsePeak(
  counter: string | null | undefined,
  visibleFallback = 0
): FullPlayProvePeak {
  if (!counter) {
    return { visible: visibleFallback, total: 0, counter: null };
  }
  const match = /(\d+)\s*\/\s*(\d+)/.exec(counter);
  if (!match) {
    return { visible: visibleFallback, total: 0, counter };
  }
  return {
    visible: Number(match[1]),
    total: Number(match[2]),
    counter,
  };
}

function isRecordedJourneyId(id: string): boolean {
  return id.startsWith("rec-");
}

function isBuiltInTraditionalId(id: string): boolean {
  return id === "traditional-cjm" || id === "traditional";
}

function isBuiltInAgenticId(id: string): boolean {
  return id === "agentic-cjm" || id === "agentic";
}

type JourneyCatalogHit = {
  id: string;
  label?: string;
  beatCount?: number;
  beatIds?: string[];
};

/** Look up a rec-* / runtime journey for prove asserts (playlist length + start). */
function lookupJourneyCatalog(journeyId: string): JourneyCatalogHit | null {
  // Prefer imported store (sync after Add as CJM) over React-bound list helper.
  try {
    const imported = getImportedJourneys().find((j) => j.id === journeyId);
    if (imported) {
      return {
        id: imported.id,
        label: imported.label,
        beatCount: imported.beats.length,
        beatIds: imported.beats.map((b) => b.id),
      };
    }
  } catch {
    /* ignore */
  }
  if (typeof window === "undefined") return null;
  try {
    const w = window as Window & {
      __studioListJourneys?: () => JourneyCatalogHit[];
      __protoListJourneys?: () => JourneyCatalogHit[];
    };
    const list = w.__studioListJourneys?.() ?? w.__protoListJourneys?.();
    const hit = list?.find((j) => j.id === journeyId);
    return hit ?? null;
  } catch {
    return null;
  }
}

/**
 * Screen-identifying substrings only — no fallback. Returns null for generic
 * non-screen beat ids (camera/scroll-settle markers etc.) so callers can
 * distinguish "unresolvable" from a real screen match, instead of silently
 * inheriting a wrong default (see PP-48: a recorded journey's *last* beat is
 * routinely a trailing `scroll-stop-camera-N` marker with no screen name).
 */
function tryInferScreenId(beatId: string): string | null {
  const id = beatId.toLowerCase();
  if (id.includes("appointment-details") || id.includes("details")) {
    return "appointment-details";
  }
  if (id.includes("appointment-history") || id.includes("history")) {
    return "appointment-history";
  }
  if (id.includes("confirmation") || id.includes("book-step-3")) {
    return "book-step-3";
  }
  if (id.includes("book-step-2")) return "book-step-2";
  if (id.includes("book-step-1") || id.includes("location")) {
    return "book-step-1";
  }
  if (id.includes("chat")) return "chat";
  if (id.includes("pdp")) return "pdp";
  if (id.includes("plp") || id.includes("vaccination")) return "plp";
  if (id.includes("site-pilot") || id.includes("home")) return "site-pilot";
  return null;
}

function inferStartScreenId(startBeatId: string): string {
  // Traditional short REC usually starts on PLP.
  return tryInferScreenId(startBeatId) ?? "plp";
}

function resolveExperience(
  options?: FullPlayProveOptions
): FullPlayProveExperience {
  if (options?.experience === "traditional" || options?.experience === "agentic") {
    return options.experience;
  }
  const id = options?.journeyId ?? options?.orchestraMode ?? "";
  if (isRecordedJourneyId(id)) {
    // Path flavor only — never treat rec-trad-* as built-in traditional-cjm.
    if (/-trad(?:itional)?-|^rec-trad/i.test(id)) return "traditional";
    return "agentic";
  }
  if (isBuiltInTraditionalId(id)) return "traditional";
  if (isBuiltInAgenticId(id)) return "agentic";
  return "agentic";
}

function resolvePreset(options?: FullPlayProveOptions): FullPlayProvePreset {
  const experience = resolveExperience(options);
  const base = FULL_PLAY_PROVE_PRESETS[experience];
  const journeyId = options?.journeyId ?? base.journeyId;

  // Recorded CJMs must assert THAT journey's playlist — not traditional 13 / agentic 22.
  if (
    isRecordedJourneyId(journeyId) ||
    (!isBuiltInTraditionalId(journeyId) &&
      !isBuiltInAgenticId(journeyId) &&
      lookupJourneyCatalog(journeyId) != null)
  ) {
    const catalog = lookupJourneyCatalog(journeyId);
    const beatIds = catalog?.beatIds?.filter(Boolean) ?? [];
    const catalogPeak =
      typeof catalog?.beatCount === "number" && catalog.beatCount > 0
        ? catalog.beatCount
        : beatIds.length > 0
          ? beatIds.length
          : 0;
    // NEVER fall back to built-in traditional-plp / peak 13 for rec-*.
    const startBeatId =
      options?.startBeatId ?? beatIds[0] ?? "rec-start-unknown";
    const endBeatId =
      options?.endBeatId ??
      (beatIds.length > 0 ? beatIds[beatIds.length - 1] : startBeatId);
    const expectedPeak = options?.expectedPeak ?? catalogPeak;
    return {
      ...base,
      experience,
      journeyId,
      orchestraMode: options?.orchestraMode ?? journeyId,
      startBeatId,
      startScreenId:
        options?.startScreenId ?? inferStartScreenId(startBeatId),
      endBeatId,
      // Recorded journeys routinely auto-advance past their last *recorded*
      // beat (e.g. Reserve → Confirmation is an automatic transition REC
      // never captures as its own beat) — no static beat-name inference can
      // reliably predict that. Only assert an end screen when the caller
      // explicitly knows it; empty string is a no-op for
      // assertPlaybackPlayEndedAtEnd's `if (options.endScreenId && ...)`
      // guard, so peak-count stays the real correctness signal here.
      endScreenId: options?.endScreenId ?? "",
      expectedPeak,
      timeoutMs: options?.timeoutMs ?? base.timeoutMs,
      // Recorded journey contracts use their own catalog total, never built-in totals.
      peakMode: options?.peakMode ?? "login-skip-safe",
      allowedPeaks: options?.allowedPeaks ?? [expectedPeak],
      overlayTitle: `AGENT TESTING — Play journey prove (${journeyId})`,
      sessionName: "play-journey-prove",
    };
  }

  return {
    ...base,
    experience,
    journeyId,
    orchestraMode: options?.orchestraMode ?? journeyId ?? base.orchestraMode,
    startBeatId: options?.startBeatId ?? base.startBeatId,
    startScreenId: options?.startScreenId ?? base.startScreenId,
    endBeatId: options?.endBeatId ?? base.endBeatId,
    endScreenId: options?.endScreenId ?? base.endScreenId,
    expectedPeak: options?.expectedPeak ?? base.expectedPeak,
    timeoutMs: options?.timeoutMs ?? base.timeoutMs,
    peakMode: options?.peakMode ?? base.peakMode,
    allowedPeaks: options?.allowedPeaks ?? base.allowedPeaks,
  };
}

function assertPeak(
  peak: FullPlayProvePeak,
  expectedPeak: number,
  peakMode: FullPlayProvePeakMode,
  allowLoginSkip: boolean,
  allowedPeaks?: readonly number[]
): string | null {
  // Recorded journey with unknown catalog — assert reached end only.
  if (expectedPeak <= 0) {
    const reachedEnd = peak.visible >= peak.total && peak.total > 0;
    if (!reachedEnd) {
      return (
        `peak-not-end: got ${peak.visible}/${peak.total}` +
        (peak.counter ? ` (${peak.counter})` : "")
      );
    }
    return null;
  }
  if (peakMode === "login-skip-safe" && allowLoginSkip) {
    const reachedEnd = peak.visible >= peak.total && peak.total > 0;
    const peakOk =
      reachedEnd &&
      (allowedPeaks?.length
        ? allowedPeaks.includes(peak.total)
        : peak.total === expectedPeak);
    if (!peakOk) {
      return (
        `peak-not-${expectedPeak}: got ${peak.visible}/${peak.total}` +
        (peak.counter ? ` (${peak.counter})` : "")
      );
    }
    return null;
  }
  if (peak.visible < expectedPeak || peak.total !== expectedPeak) {
    return (
      `peak-not-${expectedPeak}/${expectedPeak}: got ${peak.visible}/${peak.total}` +
      (peak.counter ? ` (${peak.counter})` : "")
    );
  }
  return null;
}

/**
 * Universal full continuous Play prove.
 *
 * Window: `__studioRunFullPlayProve` / `__protoRunFullPlayProve`.
 */
export async function runFullPlayProve(
  options?: FullPlayProveOptions
): Promise<FullPlayProveResult> {
  const preset = resolvePreset(options);
  const allowLoginSkip = options?.allowLoginSkipPeak !== false;
  const delay = options?.delay ?? delayMs;
  const errors: string[] = [];

  // 1) UNSKIPPABLE ALWAYS CLEAR QA (code law — no skip flag).
  const qa = requireFreshQaSession(preset.overlayTitle);
  if (!qa.ok) {
    return {
      pass: false,
      peak: { visible: 0, total: 0, counter: null },
      end: null,
      errors: [qa.reason ?? "QA ALWAYS CLEAR failed"],
      journeyId: preset.journeyId,
      experience: preset.experience,
    };
  }

  const prior = getMcpTestSession();
  if (prior) {
    requestMcpTestAbort("superseded");
    endMcpTestSession(prior.id);
  }
  const sessionId = beginMcpTestSession(preset.sessionName);
  const previousTimingMode = setPlaybackTimingMode(options?.playbackSpeed ?? "normal");
  enableCursorQaEyes();
  beginQaProveMode("full-play-prove");

  let smoke: PlayJourneySmokeResult | undefined;
  let leave: AgentLeavePauseResult | undefined;
  let peak: FullPlayProvePeak = {
    visible: 0,
    total: 0,
    counter: null,
  };
  let end: PlayEndAtEndAssertResult | null = null;

  try {
    // requireFreshQaSession already starts and touches the overlay. Do not
    // re-touch here: an autonomous prove must never confirm its own handoff.
    await preArmAgentTestingOverlay({
      preArmMs: options?.preArmMs ?? DEFAULT_PREARM_MS,
      title: "AGENT TESTING — preparing…",
    });
    try {
      logAgentTestingStep({
        kind: "helper",
        action: "RunFullPlayProve",
        label: `Play journey prove · ${preset.journeyId} · peak ${preset.expectedPeak} (NOT REC)`,
        outcome: "ok",
      });
    } catch {
      /* hang-safe */
    }
    logAgentTestingOverlay(
      `prove: Play journey ${preset.journeyId} (NOT REC · keep overlay · prove-mode latch)`
    );

    // 3–5) Jump start + continuous Play + play-end-at-end assert (shared smoke core).
    smoke = await runPlayJourneyToEndSmoke({
      orchestraMode: preset.orchestraMode,
      startBeatId: preset.startBeatId,
      startScreenId: preset.startScreenId,
      endBeatId: preset.endBeatId,
      endScreenId: preset.endScreenId,
      timeoutMs: preset.timeoutMs,
      continueOnPoAlarm: options?.continueOnPoAlarm,
      delay,
      ensureClean: () => {
        (
          window as Window & { __protoEnsureCleanStudio?: () => void }
        ).__protoEnsureCleanStudio?.();
      },
      setOrchestraMode: (mode) => {
        (
          window as Window & {
            __protoSetOrchestraMode?: (m: string) => void;
          }
        ).__protoSetOrchestraMode?.(mode);
      },
      setJourneyMode: (enabled) =>
        Boolean(
          (
            window as Window & {
              __protoSetJourneyMode?: (on: boolean) => boolean;
            }
          ).__protoSetJourneyMode?.(enabled)
        ),
      triggerTransport: (action) =>
        Boolean(
          (
            window as Window & {
              __protoTriggerTransport?: (a: string) => boolean;
            }
          ).__protoTriggerTransport?.(action)
        ),
      getState: () =>
        (
          window as Window & {
            __protoStudioState?: () => PlayJourneySmokeResult["state"];
          }
        ).__protoStudioState?.(),
    });

    const fromCounter = parsePeak(smoke.peakCounter, smoke.peakVisible ?? 0);
    peak = {
      visible: smoke.peakVisible ?? fromCounter.visible,
      total: fromCounter.total || preset.expectedPeak,
      counter:
        smoke.peakCounter ??
        (smoke.peakVisible != null
          ? `${smoke.peakVisible} / ${fromCounter.total || preset.expectedPeak}`
          : null),
    };
    end = smoke.assert ?? null;

    if (!smoke.pass) {
      errors.push(smoke.reason ?? "play-smoke-failed");
    }
    const peakErr = assertPeak(
      peak,
      preset.expectedPeak,
      preset.peakMode,
      allowLoginSkip,
      preset.allowedPeaks
    );
    if (peakErr) errors.push(peakErr);
    if (!end?.pass) {
      // smoke.reason already covers this when the *only* failure is the
      // end-screen check (same underlying assert) — don't double-report it.
      const endReason = end?.reason ?? "play-end-at-end-failed";
      if (!errors.includes(endReason)) errors.push(endReason);
    }

    // Verdict MUST land before leave-pause: capturePaused drops kind "info"
    // overlay lines, which would swallow prove PASS/FAIL from Save Log.
    // (prove lines also use kind "system" as belt-and-suspenders.)
    let pass = errors.length === 0;
    logAgentTestingOverlay(
      pass
        ? `prove PASS · ${preset.journeyId} · peak ${peak.visible}/${peak.total} · play-end at end`
        : `prove FAIL · ${preset.journeyId} · ${errors.join("; ")}`
    );

    // 6) Pause for agent leave — overlay stays open (Save Log usable).
    leave = pauseForAgentLeave();
    if (!leave.ok) {
      errors.push(`leave-failed:${leave.reason ?? "unknown"}`);
      pass = false;
      logAgentTestingOverlay(
        `prove FAIL · ${preset.journeyId} · ${errors.join("; ")}`
      );
    }

    return {
      pass,
      peak,
      end,
      errors,
      leave,
      smoke,
      journeyId: preset.journeyId,
      experience: preset.experience,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`exception:${msg}`);
    try {
      logAgentTestingOverlay(
        `prove FAIL · ${preset.journeyId} · ${errors.join("; ")}`
      );
    } catch {
      /* hang-safe */
    }
    try {
      leave = pauseForAgentLeave();
    } catch {
      /* hang-safe */
    }
    return {
      pass: false,
      peak,
      end,
      errors,
      leave,
      smoke,
      journeyId: preset.journeyId,
      experience: preset.experience,
    };
  } finally {
    // Keep overlay — no stop() / forceClear / ensure-clear (unlike withMcpTestSession).
    try {
      endQaProveMode();
    } catch {
      /* hang-safe */
    }
    try {
      disableCursorQaEyes();
    } catch {
      /* hang-safe */
    }
    endMcpTestSession(sessionId);
    setPlaybackTimingMode(previousTimingMode);
  }
}

/** Thin agentic preset — delegates to {@link runFullPlayProve}. */
export async function runAgenticFullPlayProve(
  options?: Omit<FullPlayProveOptions, "experience" | "journeyId"> & {
    experience?: never;
    journeyId?: never;
  }
): Promise<FullPlayProveResult> {
  return runFullPlayProve({ ...options, experience: "agentic" });
}

/** Thin traditional preset — delegates to {@link runFullPlayProve}. */
export async function runTraditionalFullPlayProve(
  options?: Omit<FullPlayProveOptions, "experience"> & {
    experience?: never;
  }
): Promise<FullPlayProveResult> {
  return runFullPlayProve({
    ...options,
    experience: "traditional",
    journeyId: options?.journeyId ?? "traditional-cjm",
  });
}

/** @deprecated Alias — use FullPlayProveResult */
export type AgenticFullPlayProveResult = FullPlayProveResult;
/** @deprecated Alias — use FullPlayProveOptions */
export type AgenticFullPlayProveOptions = FullPlayProveOptions;
/** @deprecated Alias — use FullPlayProvePeak */
export type AgenticFullPlayProvePeak = FullPlayProvePeak;
/** @deprecated Alias — use FullPlayProveResult */
export type TraditionalFullPlayProveResult = FullPlayProveResult;
/** @deprecated Alias — use FullPlayProveOptions */
export type TraditionalFullPlayProveOptions = FullPlayProveOptions;
/** @deprecated Alias — use FullPlayProvePeak */
export type TraditionalFullPlayProvePeak = FullPlayProvePeak;
