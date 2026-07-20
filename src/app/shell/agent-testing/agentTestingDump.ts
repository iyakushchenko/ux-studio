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
import { readAgentTestingSitrep } from "@/app/shell/agent-testing/agentTestingSitrep";
import { getQaDiagRing } from "@/app/shell/qaDiagGate";

export const AGENT_TESTING_DUMP_KEY = "studioAgentTestingDumps";
export const AGENT_TESTING_DUMP_MAX = 5;
/** Last-N PLAYBACK_DIAG events embedded in dump / alarm payload. */
export const AGENT_TESTING_DUMP_DIAG_EVENTS = 40;
const CONTROL_PANEL_CAP = 30;
const RING_CAP = 80;
const LABEL_CAP = 160;

export type AgentTestingDumpReason =
  | "fail"
  | "alarm"
  | "cursor"
  | "scroll"
  | "manual";

export type AgentTestingDumpGateMode = "manual" | "agent";

export type AgentTestingDump = {
  atIso: string;
  reason: AgentTestingDumpReason;
  /** Explicit machine code — Alarm = ALARM_SEQUENCE_MISMATCH. */
  code?: string;
  title: string;
  /** Who opened the overlay — manual (version chip) vs agent mid-flight. */
  gateMode: AgentTestingDumpGateMode;
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
      lastParkReason: string | null;
    };
    click?: { ok: number; fail: number };
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
    beatId?: string;
    action?: string;
  }>;
  /** Capped QA ring echo (includes user-message). */
  ring?: Array<Record<string, unknown>>;
  /** Last-N control-panel rows (lean). */
  controlPanel?: unknown[];
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
  if (typeof e.ok === "boolean") out.ok = e.ok;
  if (typeof e.selector === "string") out.selector = clip(e.selector, 80);
  return out;
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
}): AgentTestingDump {
  let recentPlaybackDiagEvents: AgentTestingDump["recentPlaybackDiagEvents"];
  let summaries: AgentTestingDump["summaries"];
  let controlPanel: unknown[] | undefined;
  let ring: Array<Record<string, unknown>> | undefined;

  try {
    const bundle = getPlaybackDiagBundle();
    recentPlaybackDiagEvents = bundle.events
      .slice(-AGENT_TESTING_DUMP_DIAG_EVENTS)
      .map(compactDiagEvent)
      .filter((e): e is Record<string, unknown> => !!e);
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
        lastParkReason: bundle.cursor.lastParkReason,
      },
      click: {
        ok: bundle.click.ok,
        fail: bundle.click.fail,
      },
    };
  } catch {
    recentPlaybackDiagEvents = undefined;
    summaries = undefined;
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
      }));
  } catch {
    ring = undefined;
  }

  const sitrep = readAgentTestingSitrep();

  return {
    atIso: new Date().toISOString(),
    reason: options.reason,
    code: options.code ?? reasonDefaultCode(options.reason),
    title: options.title,
    gateMode: options.gateMode ?? "agent",
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
    summaries,
    poSignal: options.poSignal ?? null,
    log: options.log.map((e) => ({
      t: e.timeLabel,
      kind: e.kind,
      label: clip(e.label),
      outcome: e.outcome,
      count: e.count,
      durationMs: e.durationMs,
      beatId: e.beatId,
      action: e.action,
    })),
    ring,
    controlPanel,
  };
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
    a.download = `agent-testing-dump-${payload.reason}-${payload.atIso.replace(/[:.]/g, "-")}.json`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
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
