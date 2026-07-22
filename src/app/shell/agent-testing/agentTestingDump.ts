/**
 * Console dump policy (Arch — PP-10):
 * Save last-N dumps to sessionStorage + downloadable JSON on FAIL or PO alarm.
 * Never dump every step (noise / hang risk). Prefer overlay rows + PLAYBACK_DIAG.
 *
 * Lean-rich: structured fields agents need; compact events; no megabyte spam.
 *
 * PO signal latch (`__studioAgentTestingTakeover` / `__studioConsumePoSignal`)
 * is the **primary** mid-flight path — dumps are secondary persistence/postmortem.
 */

import type { AgentTestingLogEntry } from "@/app/shell/agent-testing/agentTestingTypes";
import type { AgentTestingPoSignal } from "@/app/shell/agent-testing/agentTestingPoSignal";
import { getControlPanelLogEntries } from "@/app/shell/controlPanelLog";
import { getPlaybackDiagBundle } from "@/app/shell/playbackDiag";
import { getRecentDiagnosticFlashes, getOpenDiagnosticFlash } from "@/app/shell/playbackDiagnosticFlash";
import { peekPlaybackDiagnostic } from "@/app/shell/playbackDiagQaBridge";
import { readAgentTestingSitrep } from "@/app/shell/agent-testing/agentTestingSitrep";
import { getQaDiagRing } from "@/app/shell/qaDiagGate";
import { buildQaPriorityHints } from "@/app/shell/agent-testing/agentTestingListen";
import { humanizeQaLogLabel } from "@/app/shell/agent-testing/agentTestingFormat";

export const AGENT_TESTING_DUMP_KEY = "studioAgentTestingDumps";
export const AGENT_TESTING_DUMP_MAX = 20;
/** Last-N PLAYBACK_DIAG events embedded in dump / alarm payload. */
export const AGENT_TESTING_DUMP_DIAG_EVENTS = 40;
const QA_GREEN_BASELINE_KEY = "studioQaGreenBaselineV1";
const CONTROL_PANEL_CAP = 30;
const RING_CAP = 80;
const LABEL_CAP = 160;

export type AgentTestingDumpReason =
  | "fail"
  | "alarm"
  | "cursor"
  | "scroll"
  | "manual";

import type { AgentTestingSessionKind } from "@/app/shell/agent-testing/agentTestingSession";

export type AgentTestingDumpGateMode = AgentTestingSessionKind;

export type AgentTestingDump = {
  atIso: string;
  reason: AgentTestingDumpReason;
  /** Explicit machine code — Alarm = ALARM_SEQUENCE_MISMATCH. */
  code?: string;
  /** Agent-facing instruction (Alarm / investigate). */
  agentPrompt?: string;
  title: string;
  /** Who owns the overlay — manual | agent | observe. */
  gateMode: AgentTestingDumpGateMode;
  /** Alias of gateMode — preferred field name for agents. */
  sessionKind: AgentTestingSessionKind;
  capturePaused?: boolean;
  elapsedMs: number;
  sitrepLine?: string;
  mode?: string | null;
  experience?: string | null;
  cjm?: string | null;
  currentBeat?: {
    beatId?: string | null;
    counter?: string | null;
    screenId?: string | null;
    touchpointKey?: string | null;
  };
  timeline?: Array<{ key: string; outcome: string }>;
  /** Compact PLAYBACK_DIAG tail — kind/detail/beat/screen/t only. */
  recentPlaybackDiagEvents?: Array<Record<string, unknown>>;
  /** PlaybackDiagnostic popup flashes — agents prefer this over the modal. */
  diagnosticFlashes?: Array<Record<string, unknown>>;
  /** Last ingested diagnostic (peek) — consume via `__studioConsumePlaybackDiagnostic`. */
  lastPlaybackDiagnostic?: Record<string, unknown> | null;
  /** Lean cause-before-symptom hints for agents (not spam). */
  priorityHints?: string[];
  /** Autonomous suite proof, including test timing and CJM-level outcomes. */
  suite?: {
    suiteId: string;
    phase: string;
    playbackProfile?: "normal" | "fast";
    startedAtIso?: string;
    finishedAtIso?: string;
    elapsedMs?: number;
    index: number;
    total: number;
    current: string | null;
    completed: Array<Record<string, unknown>>;
    failure: Record<string, unknown> | null;
  };
  /** Explicit outcome, so an intentional post-proof pause is never presented as an issue. */
  verdict?: {
    status: "pass" | "fail" | "incomplete";
    summary: string;
    nextAction: string;
  };
  /** Full chat-bubble-motion frame series (gate-open) + jump/chop summary. */
  chatBubbleMotion?: {
    samples: Array<Record<string, unknown>>;
    count: number;
    jumps: number;
    chops?: number;
    maxAbsDeltaY: number;
    maxAbsDeltaTransformY: number;
    skippedPhaseNotes: string[];
    ids: string[];
  };
  summaries?: {
    typeIn?: {
      starts: number;
      ends: number;
      skips: number;
      samples: number;
    };
    scroll?: { events: number; retreatIntoView: number };
    cursor?: {
      events: number;
      parks: number;
      hidden: number;
      lastParkReason: string | null;
    };
    click?: { ok: number; fail: number };
    chatBubbleMotion?: {
      count: number;
      jumps: number;
      chops?: number;
      maxAbsDeltaY: number;
      maxAbsDeltaTransformY: number;
    };
  };
  /** Copy of live latch at dump time (if any). */
  poSignal?: AgentTestingPoSignal | null;
  log: Array<{
    t: string;
    kind: string;
    label: string;
    outcome: string;
    count?: number;
    durationMs?: number;
    durationKind?: "operation" | "since-previous";
    /** Human-facing presentation; label remains the separate, safety-clipped raw evidence. */
    displayLabel?: string;
    beatId?: string;
    action?: string;
    selector?: string;
    chain?: string;
    surface?: string;
    dataStudioAction?: string;
  }>;
  /** Capped QA ring echo (includes user-message). */
  ring?: Array<Record<string, unknown>>;
  /** Last-N control-panel rows (lean). */
  controlPanel?: unknown[];
  /** MCP connection phase at dump time — agents need this without console. */
  mcp?: {
    phase: string;
    label: string;
    pendingMsLeft?: number | null;
  };
};

function safeJsonParse(raw: string | null): AgentTestingDump[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (d): d is AgentTestingDump =>
        !!d &&
        typeof d === "object" &&
        typeof (d as AgentTestingDump).atIso === "string"
    );
  } catch {
    return [];
  }
}

export function readAgentTestingDumps(): AgentTestingDump[] {
  try {
    return safeJsonParse(sessionStorage.getItem(AGENT_TESTING_DUMP_KEY));
  } catch {
    return [];
  }
}

export function pushAgentTestingDump(dump: AgentTestingDump): AgentTestingDump[] {
  const next = [dump, ...readAgentTestingDumps()].slice(0, AGENT_TESTING_DUMP_MAX);
  try {
    sessionStorage.setItem(AGENT_TESTING_DUMP_KEY, JSON.stringify(next));
  } catch {
    /* private mode / quota */
  }
  return next;
}

function reasonDefaultCode(reason: AgentTestingDumpReason): string | undefined {
  if (reason === "alarm") return "ALARM_SEQUENCE_MISMATCH";
  if (reason === "cursor") return "CURSOR_WEIRD_FLAG";
  if (reason === "scroll") return "SCROLL_ISSUE_REPORTED";
  return undefined;
}

function clip(s: string, max = LABEL_CAP): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function compactDiagEvent(ev: unknown): Record<string, unknown> | null {
  if (!ev || typeof ev !== "object") return null;
  const e = ev as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  if (typeof e.t === "number") out.t = e.t;
  if (typeof e.kind === "string") out.kind = e.kind;
  if (typeof e.detail === "string") out.detail = clip(e.detail, 120);
  if (e.beatId != null) out.beatId = e.beatId;
  if (e.screenId != null) out.screenId = e.screenId;
  if (e.screenAfter != null) out.screenId = e.screenAfter;
  if (typeof e.ok === "boolean") out.ok = e.ok;
  if (typeof e.clickOk === "boolean") out.clickOk = e.clickOk;
  if (typeof e.selector === "string") out.selector = clip(e.selector, 80);
  if (e.bubble && typeof e.bubble === "object") {
    const b = e.bubble as Record<string, unknown>;
    out.bubble = {
      id: b.id,
      phase: b.phase,
      y: b.y ?? null,
      opacity: b.opacity ?? null,
      layoutY: b.layoutY ?? null,
      deltaY: b.deltaY ?? null,
      deltaTransformY: b.deltaTransformY ?? null,
      scrollTop: b.scrollTop ?? null,
      shouldAnimate: b.shouldAnimate ?? null,
      visibleCount: b.visibleCount ?? null,
      jump: b.jump === true,
      jumpReason: b.jumpReason ?? null,
      chop: b.chop === true,
      chopReason: b.chopReason ?? null,
      note: typeof b.note === "string" ? clip(b.note, 80) : null,
      trace: b.trace && typeof b.trace === "object" ? b.trace : null,
    };
  }
  return out;
}

function compactBubbleSample(ev: unknown): Record<string, unknown> | null {
  const base = compactDiagEvent(ev);
  if (!base || base.kind !== "chat-bubble-motion") return null;
  return base;
}

export function buildAgentTestingDump(options: {
  reason: AgentTestingDumpReason;
  title: string;
  elapsedMs: number;
  sitrepLine?: string;
  log: AgentTestingLogEntry[];
  code?: string;
  timeline?: Array<{ key: string; outcome: string }>;
  poSignal?: AgentTestingPoSignal | null;
  gateMode?: AgentTestingDumpGateMode;
  capturePaused?: boolean;
  agentPrompt?: string;
  suite?: AgentTestingDump["suite"];
  /** Live MCP status — omit only in unit tests without overlay. */
  mcp?: AgentTestingDump["mcp"];
}): AgentTestingDump {
  let recentPlaybackDiagEvents: AgentTestingDump["recentPlaybackDiagEvents"];
  let diagnosticFlashes: AgentTestingDump["diagnosticFlashes"];
  let lastPlaybackDiagnostic: AgentTestingDump["lastPlaybackDiagnostic"];
  let chatBubbleMotion: AgentTestingDump["chatBubbleMotion"];
  let summaries: AgentTestingDump["summaries"];
  let controlPanel: unknown[] | undefined;
  let ring: Array<Record<string, unknown>> | undefined;

  try {
    const bundle = getPlaybackDiagBundle();
    recentPlaybackDiagEvents = bundle.events
      .slice(-AGENT_TESTING_DUMP_DIAG_EVENTS)
      .map(compactDiagEvent)
      .filter((e): e is Record<string, unknown> => !!e);
    const bubble = bundle.chatBubbleMotion;
    chatBubbleMotion = {
      samples: bubble.samples
        .map(compactBubbleSample)
        .filter((e): e is Record<string, unknown> => !!e),
      count: bubble.count,
      jumps: bubble.jumps,
      chops: bubble.chops,
      maxAbsDeltaY: bubble.maxAbsDeltaY,
      maxAbsDeltaTransformY: bubble.maxAbsDeltaTransformY,
      skippedPhaseNotes: bubble.skippedPhaseNotes,
      ids: bubble.ids,
    };
    summaries = {
      typeIn: {
        starts: bundle.typeIn.starts,
        ends: bundle.typeIn.ends,
        skips: bundle.typeIn.skips,
        samples: bundle.typeIn.progressSamples.length,
      },
      scroll: {
        events: bundle.scroll.events,
        retreatIntoView: bundle.scroll.retreatIntoView,
      },
      cursor: {
        events: bundle.cursor.events,
        parks: bundle.cursor.parks,
        hidden: bundle.cursor.hidden,
        lastParkReason: bundle.cursor.lastParkReason,
      },
      click: {
        ok: bundle.click.ok,
        fail: bundle.click.fail,
      },
      chatBubbleMotion: {
        count: bubble.count,
        jumps: bubble.jumps,
        chops: bubble.chops,
        maxAbsDeltaY: bubble.maxAbsDeltaY,
        maxAbsDeltaTransformY: bubble.maxAbsDeltaTransformY,
      },
    };
  } catch {
    recentPlaybackDiagEvents = undefined;
    chatBubbleMotion = undefined;
    summaries = undefined;
  }

  try {
    diagnosticFlashes = getRecentDiagnosticFlashes(8).map((f) => ({
      id: f.id,
      kind: f.kind,
      message: clip(f.message),
      beatId: f.beatId,
      failureStep: f.failureStep,
      durationMs: f.durationMs,
      dismissedBy: f.dismissedBy,
    }));
    lastPlaybackDiagnostic = peekPlaybackDiagnostic();
  } catch {
    diagnosticFlashes = undefined;
    lastPlaybackDiagnostic = undefined;
  }

  try {
    const entries = getControlPanelLogEntries();
    controlPanel = entries.slice(-CONTROL_PANEL_CAP).map((row) => ({
      t: row.atIso,
      action: row.action,
      blocked: row.blocked,
      beatId: row.snapshot?.beatId,
      screenId: row.snapshot?.screenId,
      touchpointKey: row.snapshot?.touchpointKey,
    }));
  } catch {
    controlPanel = undefined;
  }

  try {
    ring = getQaDiagRing()
      .slice(-RING_CAP)
      .map((e) => ({
        kind: e.kind,
        label: e.label ? clip(e.label) : undefined,
        text: e.text ? clip(e.text) : undefined,
        atMs: e.atMs,
        atIso: e.atIso,
        beatId: e.beatId,
        screenId: e.screenId,
        action: e.action,
        detail: e.detail,
      }));
  } catch {
    ring = undefined;
  }

  const sitrep = readAgentTestingSitrep();

  const gateMode = options.gateMode ?? "agent";
  const diagOpen =
    Boolean(getOpenDiagnosticFlash()) || Boolean(lastPlaybackDiagnostic);
  const suitePassed = options.suite?.phase === "passed";
  const priorityHints = buildQaPriorityHints({
    capturePaused: suitePassed ? false : options.capturePaused,
    awaitingReply: options.mcp?.phase === "pending",
    poSignalCode: options.poSignal?.code ?? options.code ?? null,
    diagnosticOpen: diagOpen,
    diagnosticMessage:
      (lastPlaybackDiagnostic as { message?: string } | null | undefined)
        ?.message ?? null,
    mcpPhase: options.mcp?.phase ?? null,
  });
  const finalFail = options.log.find((entry) => entry.outcome === "fail");
  const verdict = suitePassed
    ? {
        status: "pass" as const,
        summary: `QA suite ${options.suite?.suiteId ?? ""} passed${options.suite?.elapsedMs != null ? ` in ${(options.suite.elapsedMs / 1000).toFixed(1)}s` : ""}.`,
        nextAction: "Retain this dump as the green compatibility baseline.",
      }
    : finalFail
      ? {
          status: "fail" as const,
          summary: humanizeQaLogLabel(finalFail.label),
          nextAction: "Inspect priorityHints and the failed suite row; re-run only the affected route after repair.",
        }
      : {
          status: "incomplete" as const,
          summary: "QA session was saved before a final verdict.",
          nextAction: "Use the suite status and diagnostic tail to decide whether to resume or rerun.",
        };

  return {
    atIso: new Date().toISOString(),
    reason: options.reason,
    code: options.code ?? reasonDefaultCode(options.reason),
    agentPrompt: options.agentPrompt,
    title: options.title,
    gateMode,
    sessionKind: gateMode,
    capturePaused: options.capturePaused ?? false,
    elapsedMs: options.elapsedMs,
    sitrepLine: options.sitrepLine ?? sitrep.line,
    mode: sitrep.mode ?? null,
    experience: sitrep.experience ?? null,
    cjm: sitrep.cjm ?? null,
    currentBeat: {
      beatId: sitrep.beat ?? null,
      counter: sitrep.counter ?? null,
      screenId: sitrep.screenId ?? null,
      touchpointKey: sitrep.touchpointKey ?? null,
    },
    timeline: options.timeline,
    recentPlaybackDiagEvents,
    diagnosticFlashes,
    lastPlaybackDiagnostic,
    priorityHints,
    suite: options.suite,
    verdict,
    chatBubbleMotion,
    summaries,
    poSignal: options.poSignal ?? null,
    log: options.log.map((e) => ({
      t: e.timeLabel,
      kind: e.kind,
      label: clip(e.label),
      outcome: e.outcome,
      count: e.count,
      durationMs: e.durationMs,
      durationKind: e.durationKind,
      displayLabel: humanizeQaLogLabel(e.label),
      beatId: e.beatId,
      action: e.action,
      selector: e.selector ? clip(e.selector, 120) : undefined,
      chain: e.chain ? clip(e.chain, 160) : undefined,
      surface: e.surface,
      dataStudioAction: e.dataStudioAction
        ? clip(e.dataStudioAction, 80)
        : undefined,
    })),
    ring,
    controlPanel,
    mcp: options.mcp,
  };
}

/** Download filename — session kind first (not dump reason). Save Log ≠ “agent” dump. */
export function buildAgentTestingDumpFilename(dump: {
  reason: string;
  sessionKind?: string;
  gateMode?: string;
  atIso: string;
}): string {
  const kind = (dump.sessionKind || dump.gateMode || "qa").replace(
    /[^a-z0-9_-]+/gi,
    "-"
  );
  const stamp = dump.atIso.replace(/[:.]/g, "-");
  // Save Log reason is always "manual" — do not put that in the filename.
  if (dump.reason === "manual") {
    return `qa-${kind}-${stamp}.json`;
  }
  const reason = String(dump.reason || "dump").replace(/[^a-z0-9_-]+/gi, "-");
  return `qa-${kind}-${reason}-${stamp}.json`;
}

/** Download latest (or provided) dump as compact JSON — hang-safe. Secondary to live latch. */
export function downloadAgentTestingDump(dump?: AgentTestingDump): boolean {
  if (typeof document === "undefined") return false;
  const payload = dump ?? readAgentTestingDumps()[0];
  if (!payload) return false;
  try {
    // Compact (no pretty indent) — smaller tokens for agent analysis.
    const blob = new Blob([JSON.stringify(payload)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildAgentTestingDumpFilename(payload);
    a.rel = "noopener";
    // Ephemeral download anchor — never appear as "Click: a" in QA capture.
    a.setAttribute("data-studio-agent-testing-ignore", "true");
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}

export function buildAgentTestingEvidencePack(dumps = readAgentTestingDumps()) {
  const sessions = dumps.map((dump) => {
    const qaDiagRows = dump.log.filter((row) => row.kind === "playback-diag").length;
    const ringDiagRows = dump.ring.filter((row) => row.kind === "playback-diag").length;
    const rawDiagRows = dump.recentPlaybackDiagEvents?.length ?? 0;
    const issues: string[] = [];
    if (rawDiagRows > 0 && qaDiagRows === 0 && ringDiagRows === 0) {
      issues.push("Raw playback diagnostics exist but no human QA diagnostic row was preserved.");
    }
    if (dump.reason === "fail" && !dump.code && !(dump.priorityHints?.length)) {
      issues.push("Failed session has no machine code or cause-first priority hint.");
    }
    return {
      atIso: dump.atIso,
      title: dump.title,
      reason: dump.reason,
      code: dump.code ?? null,
      verdict: issues.length ? "review" : "pass",
      counts: { qaRows: dump.log.length, qaDiagRows, ringDiagRows, rawDiagRows },
      issues,
      priorityHints: dump.priorityHints ?? [],
      dump,
    };
  });
  const clusterMap = new Map<string, { code: string; count: number; sessions: string[]; cue: string }>();
  for (const session of sessions) {
    const dump = session.dump;
    const failRow = dump.log.find((row) => row.outcome === "fail" || row.outcome === "notice");
    const code = dump.code || failRow?.kind || (session.verdict === "review" ? "EVIDENCE_PARITY_REVIEW" : "PASS");
    if (code === "PASS") continue;
    const cue = dump.priorityHints?.[0] || failRow?.displayLabel || session.issues[0] || "Inspect structured diagnostic.";
    const cluster = clusterMap.get(code) ?? { code, count: 0, sessions: [], cue };
    cluster.count += 1;
    cluster.sessions.push(dump.title);
    clusterMap.set(code, cluster);
  }
  const clusters = [...clusterMap.values()].sort((a, b) => b.count - a.count);
  const verdict = sessions.some((session) => session.verdict === "review") ? "review" : "pass";
  const currentSignature = clusters.map((cluster) => cluster.code).sort();
  let previousSignature: string[] = [];
  let previousAverageElapsedMs: number | null = null;
  try {
    const baseline = JSON.parse(localStorage.getItem(QA_GREEN_BASELINE_KEY) || "null");
    previousSignature = baseline?.signature ?? [];
    previousAverageElapsedMs = typeof baseline?.averageElapsedMs === "number" ? baseline.averageElapsedMs : null;
  } catch { /* unavailable baseline */ }
  const averageElapsedMs = sessions.length
    ? Math.round(sessions.reduce((sum, session) => sum + session.dump.elapsedMs, 0) / sessions.length)
    : 0;
  const comparison = {
    newIssues: currentSignature.filter((code) => !previousSignature.includes(code)),
    resolvedIssues: previousSignature.filter((code) => !currentSignature.includes(code)),
    unchangedIssues: currentSignature.filter((code) => previousSignature.includes(code)),
    averageElapsedMs,
    previousAverageElapsedMs,
    timingRegression:
      previousAverageElapsedMs != null && averageElapsedMs > previousAverageElapsedMs * 1.2,
  };
  const lead = clusters[0];
  const agentBrief = {
    verdict,
    rootCause: lead?.code ?? null,
    affectedSessions: lead?.sessions ?? [],
    cue: lead?.cue ?? "No actionable failure cluster detected.",
    newIssues: comparison.newIssues,
    nextCommand: lead
      ? "Inspect sessions[0].dump.priorityHints and lastPlaybackDiagnostic; re-run only the affected route."
      : "No fix required; retain as the next green baseline.",
  };
  return {
    kind: "studio-qa-evidence-pack",
    generatedAt: new Date().toISOString(),
    verdict,
    sessionCount: sessions.length,
    agentBrief,
    clusters,
    comparison,
    sessions,
  };
}

export function persistQaGreenBaseline(pack = buildAgentTestingEvidencePack()): boolean {
  if (pack.verdict !== "pass") return false;
  try {
    localStorage.setItem(QA_GREEN_BASELINE_KEY, JSON.stringify({
      atIso: pack.generatedAt,
      signature: pack.clusters.map((cluster) => cluster.code).sort(),
      sessionCount: pack.sessionCount,
      averageElapsedMs: pack.comparison.averageElapsedMs,
    }));
    return true;
  } catch {
    return false;
  }
}

export function downloadAgentTestingEvidencePack(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const pack = buildAgentTestingEvidencePack();
    persistQaGreenBaseline(pack);
    const blob = new Blob([JSON.stringify(pack)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `qa-evidence-pack-${pack.generatedAt.replace(/[:.]/g, "-")}.json`;
    anchor.rel = "noopener";
    anchor.setAttribute("data-studio-agent-testing-ignore", "true");
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}

export function consoleSeparator(phase: "START" | "END", title: string): void {
  const bar = "═".repeat(24);
  const line = `${bar} AGENT TEST ${phase}: ${title} ${bar}`;
  try {
    if (phase === "START") {
      console.log(`%c${line}`, "color:#9ee6c0;font-weight:700");
    } else {
      console.log(`%c${line}`, "color:#ffb3b3;font-weight:700");
    }
  } catch {
    /* ignore */
  }
}
