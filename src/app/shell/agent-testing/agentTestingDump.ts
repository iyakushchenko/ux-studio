/**
 * Console dump policy (Arch — PP-10):
 * Save last-N dumps to sessionStorage + downloadable JSON on FAIL or PO alarm.
 * Never dump every step (noise / hang risk). Prefer overlay rows + PLAYBACK_DIAG.
 */

import type { AgentTestingLogEntry } from "@/app/shell/agent-testing/agentTestingTypes";
import { getControlPanelLogEntries } from "@/app/shell/controlPanelLog";

export const AGENT_TESTING_DUMP_KEY = "studioAgentTestingDumps";
export const AGENT_TESTING_DUMP_MAX = 5;

export type AgentTestingDumpReason =
  | "fail"
  | "alarm"
  | "cursor"
  | "scroll"
  | "manual";

export type AgentTestingDump = {
  atIso: string;
  reason: AgentTestingDumpReason;
  title: string;
  elapsedMs: number;
  sitrepLine?: string;
  log: Array<{
    time: string;
    label: string;
    outcome: string;
    count?: number;
    durationMs?: number;
  }>;
  playbackDiag?: unknown;
  cursorDiag?: unknown;
  controlPanel?: unknown;
};

function safeJsonParse(raw: string | null): AgentTestingDump[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (d): d is AgentTestingDump =>
        !!d && typeof d === "object" && typeof (d as AgentTestingDump).atIso === "string"
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

export function buildAgentTestingDump(options: {
  reason: AgentTestingDumpReason;
  title: string;
  elapsedMs: number;
  sitrepLine?: string;
  log: AgentTestingLogEntry[];
}): AgentTestingDump {
  let playbackDiag: unknown;
  let cursorDiag: unknown;
  let controlPanel: unknown;
  try {
    playbackDiag =
      typeof window !== "undefined"
        ? window.__studioPlaybackDiag?.() ?? window.__protoPlaybackDiag?.()
        : undefined;
  } catch {
    playbackDiag = { error: "playbackDiag unavailable" };
  }
  try {
    cursorDiag =
      typeof window !== "undefined"
        ? window.__studioCursorDiagnostics?.() ??
          window.__protoCursorDiagnostics?.()
        : undefined;
  } catch {
    cursorDiag = { error: "cursorDiag unavailable" };
  }
  try {
    controlPanel = getControlPanelLogEntries();
  } catch {
    controlPanel = { error: "controlPanel unavailable" };
  }

  return {
    atIso: new Date().toISOString(),
    reason: options.reason,
    title: options.title,
    elapsedMs: options.elapsedMs,
    sitrepLine: options.sitrepLine,
    log: options.log.map((e) => ({
      time: e.timeLabel,
      label: e.label,
      outcome: e.outcome,
      count: e.count,
      durationMs: e.durationMs,
    })),
    playbackDiag,
    cursorDiag,
    controlPanel,
  };
}

/** Download latest (or provided) dump as JSON — hang-safe. */
export function downloadAgentTestingDump(dump?: AgentTestingDump): boolean {
  if (typeof document === "undefined") return false;
  const payload = dump ?? readAgentTestingDumps()[0];
  if (!payload) return false;
  try {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
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
