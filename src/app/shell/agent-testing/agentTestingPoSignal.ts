/**
 * Live PO mid-flight signals (primary path).
 *
 * Alarm / Cursor / Scroll set a latch MCP agents poll each beat.
 * Dump JSON is secondary (persistence / postmortem).
 *
 *   window.__studioAgentTestingTakeover   // peek (null | signal)
 *   window.__studioConsumePoSignal()      // consume + clear
 *   window.__studioPeekPoSignal()         // alias peek
 *   CustomEvent "studio-agent-testing-po-signal"
 */

import { getPlaybackDiagBundle } from "@/app/shell/playbackDiag";
import { readAgentTestingSitrep } from "@/app/shell/agent-testing/agentTestingSitrep";
import type { AgentTestingTimelineKey } from "@/app/shell/agent-testing/agentTestingTypes";

export const PO_SIGNAL_EVENT = "studio-agent-testing-po-signal";

export type AgentTestingPoSignalType =
  | "alarm"
  | "cursor"
  | "scroll"
  | "user-message"
  | "pause"
  | "diagnostic"
  | "mcp";

export type AgentTestingPoSignalCode =
  | "ALARM_SEQUENCE_MISMATCH"
  | "DIAGNOSTIC_ACK_STOP"
  | "PLAYBACK_DIAGNOSTIC_OPEN"
  | "USER_MESSAGE_RECEIVED"
  | "QA_PAUSE_HALT"
  | "MCP_PHASE_CHANGE"
  | "CONTROL_ROOM_ALARM_RED"
  | "CURSOR_WEIRD_FLAG"
  | "CURSOR_UNEXPECTED_DWELL"
  | "CURSOR_HIDDEN_DURING_TYPEIN"
  | "SCROLL_ISSUE_REPORTED"
  | "SCROLL_PATH_DEVIATION"
  | "SCROLL_INTO_VIEW_FAIL"
  | "SCROLL_ANOMALY";

export type AgentTestingPoSignal = {
  type: AgentTestingPoSignalType;
  code: AgentTestingPoSignalCode | string;
  at: number;
  atIso: string;
  note?: string;
  beat?: string | null;
  counter?: string | null;
  screen?: string | null;
  sitrepLine?: string;
  timeline?: Array<{ key: string; outcome: string }>;
  /** Compact PLAYBACK_DIAG slice — enough to branch mid-smoke without dump download. */
  diagSnapshot?: {
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
    recentEvents?: Array<{
      kind: string;
      detail?: string;
      beatId?: string | null;
      clickOk?: boolean;
      typeOk?: boolean;
    }>;
  };
};

const RECENT_DIAG_N = 24;

let latched: AgentTestingPoSignal | null = null;

function buildDiagSnapshot(): AgentTestingPoSignal["diagSnapshot"] {
  try {
    const bundle = getPlaybackDiagBundle();
    const recent = bundle.events.slice(-RECENT_DIAG_N).map((e) => ({
      kind: e.kind,
      detail: e.detail,
      beatId: e.beatId,
      clickOk: e.clickOk,
      typeOk: e.typeOk,
    }));
    return {
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
      recentEvents: recent,
    };
  } catch {
    return undefined;
  }
}

export function latchPoSignal(options: {
  type: AgentTestingPoSignalType;
  code: AgentTestingPoSignalCode | string;
  note?: string;
  sitrepLine?: string;
  timeline?: AgentTestingTimelineKey[];
}): AgentTestingPoSignal {
  const sitrep = readAgentTestingSitrep();
  const signal: AgentTestingPoSignal = {
    type: options.type,
    code: options.code,
    at: Date.now(),
    atIso: new Date().toISOString(),
    note: options.note?.trim() || undefined,
    beat: sitrep.beat ?? null,
    counter: sitrep.counter ?? null,
    screen: sitrep.screenId ?? null,
    sitrepLine: options.sitrepLine ?? sitrep.line,
    timeline: (options.timeline ?? []).map((t) => ({
      key: t.key,
      outcome: String(t.outcome),
    })),
    diagSnapshot: buildDiagSnapshot(),
  };
  latched = signal;
  try {
    if (typeof window !== "undefined") {
      window.__studioAgentTestingTakeover = signal;
      window.dispatchEvent(
        new CustomEvent(PO_SIGNAL_EVENT, { detail: signal })
      );
    }
  } catch {
    /* hang-safe */
  }
  try {
    console.warn(
      "[AGENT_TESTING] PO signal latched",
      signal.code,
      "→ window.__studioConsumePoSignal()",
      {
        type: signal.type,
        beat: signal.beat,
        screen: signal.screen,
        counter: signal.counter,
      }
    );
  } catch {
    /* ignore */
  }
  return signal;
}

/** Peek without clearing — also mirrored on `window.__studioAgentTestingTakeover`. */
export function peekPoSignal(): AgentTestingPoSignal | null {
  return latched;
}

/** Consume + clear. Returns the signal (or null if none). */
export function consumePoSignal(): AgentTestingPoSignal | null {
  const next = latched;
  latched = null;
  try {
    if (typeof window !== "undefined") {
      window.__studioAgentTestingTakeover = null;
    }
  } catch {
    /* ignore */
  }
  if (next) {
    try {
      console.info(
        "[AGENT_TESTING] PO signal consumed",
        next.code,
        next.type
      );
    } catch {
      /* ignore */
    }
  }
  return next;
}

export function clearPoSignal(): void {
  latched = null;
  try {
    if (typeof window !== "undefined") {
      window.__studioAgentTestingTakeover = null;
    }
  } catch {
    /* ignore */
  }
}

export function installPoSignalWindowApis(): void {
  if (typeof window === "undefined") return;
  window.__studioPeekPoSignal = peekPoSignal;
  window.__studioConsumePoSignal = consumePoSignal;
  window.__protoPeekPoSignal = peekPoSignal;
  window.__protoConsumePoSignal = consumePoSignal;
  if (window.__studioAgentTestingTakeover === undefined) {
    window.__studioAgentTestingTakeover = null;
  }
}

export function uninstallPoSignalWindowApis(): void {
  clearPoSignal();
  if (typeof window === "undefined") return;
  delete window.__studioPeekPoSignal;
  delete window.__studioConsumePoSignal;
  delete window.__protoPeekPoSignal;
  delete window.__protoConsumePoSignal;
  delete window.__studioAgentTestingTakeover;
}

declare global {
  interface Window {
    /** Live PO mid-flight latch (peek). Null when idle. */
    __studioAgentTestingTakeover?: AgentTestingPoSignal | null;
    __studioPeekPoSignal?: () => AgentTestingPoSignal | null;
    __studioConsumePoSignal?: () => AgentTestingPoSignal | null;
    __protoPeekPoSignal?: () => AgentTestingPoSignal | null;
    __protoConsumePoSignal?: () => AgentTestingPoSignal | null;
  }
}
