import type {
  AgentTestingLogEntry,
  AgentTestingStepOutcome,
  LogAgentTestingStepInput,
} from "@/app/shell/agent-testing/agentTestingTypes";
import type { PlaybackStudioSnapshot } from "@/app/shell/playbackStudioSnapshot";

/** Human labels for common mutating helpers — avoid identical spam. */
const HELPER_ACTION_LABEL: Record<string, string> = {
  TriggerTransport: "transport",
  StepForward: "step-forward",
  StepBack: "step-back",
  JumpToStart: "jump-to-start",
  JumpToEnd: "jump-to-end",
  PlayJourney: "Play journey",
  PauseJourney: "pause",
  SetOrchestraMode: "mode",
  SetJourneyMode: "cjm",
  GoToTab: "go-to-tab",
  GoToScreen: "go-to-screen",
  OpenHub: "hub",
  CloseHub: "close-hub",
  // REC honesty — never confuse with Play journey prove.
  StartRecording: "REC capture live",
  StopRecording: "REC stop",
  PauseRecording: "REC pause",
  ResumeRecording: "REC resume",
  SaveRecordingAsJourney: "REC Add as CJM",
  ClearRecording: "REC clear",
  ArmRecCapture: "REC arm live",
  AssertRecLive: "REC assert live",
  RunRecNewCjmProve: "REC new CJM prove",
  RecNewCjmCapturePath: "REC human-paced path",
  RecNewCjmCaptureClick: "REC capture click",
  RecModalOpen: "REC modal open",
  RecModalPharmacyPick: "REC pharmacy pick",
  RecModalPick: "REC modal pick",
  RecStartScreenSeed: "REC start screen",
  QaModalOpen: "Modal open",
  QaModalClose: "Modal close",
  QaModalPick: "Modal pick",
  RequireFreshQaSession: "QA ALWAYS CLEAR",
  RunFullPlayProve: "Play journey prove",
  RunAgenticFullPlayProve: "Play journey prove (agentic)",
  RunTraditionalFullPlayProve: "Play journey prove (traditional)",
};

export function timeLabelNow(at = Date.now()): string {
  return new Date(at).toLocaleTimeString("en-GB", { hour12: false });
}

export function formatElapsed(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatDurationMs(ms: number | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return "";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Plain-language presentation only. Raw labels remain intact in the QA dump. */
export function humanizeQaLogLabel(label: string): string {
  const titleId = (value: string) =>
    value
      .trim()
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  const screen = /^Screen →\s*(\S+)/i.exec(label)?.[1];
  if (screen) return `Opened · ${titleId(screen)}`;
  const modalOpen = /^Modal open ·\s*([^·]+)/i.exec(label)?.[1];
  if (modalOpen) return `Opened dialog · ${titleId(modalOpen)}`;
  const modalClose = /^Modal close ·\s*([^·]+)/i.exec(label)?.[1];
  if (modalClose) return `Closed dialog · ${titleId(modalClose)}`;
  if (label === "Journey reset to start") return "Returned to journey start";
  if (label === "Play finished — back at journey start") return "Play completed · returned to journey start";
  const click = /^Click:\s*(.+)$/i.exec(label)?.[1]?.trim();
  if (click) {
    if (/^(?:\d{1,2}(?::\d{2})?|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2})$/i.test(click)) {
      return `Selected · ${click}`;
    }
    return `Activated · ${click}`;
  }
  if (/^Bubble\s+q\d+\s+pull-up/i.test(label)) return "Chat message appeared";
  if (/^Bubble\s+r\d+\s+pull-up/i.test(label)) return "Chat reply appeared";
  if (/^Bubble\s+r\d+\s+thinking→reply/i.test(label)) return "Thinking changed to reply";
  if (/^Bubble\s+\S+\s+settle/i.test(label)) return "Chat message settled";
  if (/^Cursor stayed at last click/i.test(label)) return "Cursor stayed at last action";
  if (/^prove PASS ·\s*([^·]+)\s*· peak\s*(\d+)\/(\d+)\s*· play-end at start/i.test(label)) {
    const match = /^prove PASS ·\s*([^·]+)\s*· peak\s*(\d+)\/(\d+)/i.exec(label);
    return match ? `PASS · Completed ${match[2]}/${match[3]} · returned to journey start` : label;
  }
  if (/^Save Log · paused \+ downloaded/i.test(label)) {
    return label.replace(/^Save Log · paused \+ downloaded/i, "Log saved · QA paused after saving");
  }
  return label;
}

/** Routine engine choreography stays in raw evidence, not the primary human log. */
export function isRoutineTechnicalLogEntry(entry: AgentTestingLogEntry): boolean {
  if (entry.outcome === "fail" || entry.outcome === "notice" || entry.outcome === "pass") return false;
  return (
    /^Cursor → (?:hand|arrow|carriage)/i.test(entry.label) ||
    /^Cursor stayed at last click/i.test(entry.label) ||
    /^Camera:/i.test(entry.label) ||
    /^Chat pin bottom/i.test(entry.label) ||
    /^Bubble\s+\S+\s+settle/i.test(entry.label) ||
    entry.label === "Journey reset to start" ||
    /^page refresh · session restored$/i.test(entry.label)
  );
}

export function inferOutcomeFromText(text: string): AgentTestingStepOutcome {
  const t = text.toLowerCase();
  if (/\bno\s+(?:errors?|failures?)\b|\berrors?\s*:\s*\[\s*\]/.test(t)) {
    return "ok";
  }
  // Explicit prove / finale green only — never paint routine "ok" as success.
  if (
    /\bresult\s*·\s*pass\b/.test(t) ||
    /\bprove\s+pass\b/.test(t) ||
    /\bprove\s+green\b/.test(t) ||
    /\bself-?test\s+pass\b/.test(t)
  ) {
    return "pass";
  }
  if (
    /\bfail\b/.test(t) ||
    /\berror\b/.test(t) ||
    /\bhard fail\b/.test(t) ||
    t.includes("cursor issue detected") ||
    t.includes("scroll issue detected")
  ) {
    if (t.includes("notice") || t.includes("warn")) {
      return "notice";
    }
    if (
      t.includes("cursor issue") ||
      t.includes("scroll issue") ||
      t.includes("soft")
    ) {
      return "notice";
    }
    return "fail";
  }
  if (
    t.includes("notice") ||
    t.includes("unexpected") ||
    t.includes("warn") ||
    t.includes("stale") ||
    t.includes("scroll_issue")
  ) {
    return "notice";
  }
  return "ok";
}

export function humanizeHelperSuffix(suffix: string): string {
  return HELPER_ACTION_LABEL[suffix] ?? suffix.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

export function formatHelperStepLabel(
  suffix: string,
  snap?: PlaybackStudioSnapshot | null
): string {
  const action = humanizeHelperSuffix(suffix);
  const parts = [action];
  if (snap?.beatId) parts.push(snap.beatId);
  else if (snap?.beatLabel) parts.push(snap.beatLabel);
  if (snap?.touchpointKey) parts.push(snap.touchpointKey);
  else if (snap?.screenId) parts.push(snap.screenId);
  if (snap?.scenarioProgress) parts.push(snap.scenarioProgress);
  return parts.join(" · ");
}

export function buildLogEntryFromPlain(line: string): AgentTestingLogEntry {
  const atMs = Date.now();
  const trimmed = line.trim();
  const helperMatch = /^helper:\s*__(?:studio|proto)(.+)$/i.exec(trimmed);
  if (helperMatch) {
    const suffix = helperMatch[1];
    return {
      atMs,
      timeLabel: timeLabelNow(atMs),
      label: humanizeHelperSuffix(suffix),
      outcome: "ok",
      kind: "helper",
      action: humanizeHelperSuffix(suffix),
      count: 1,
    };
  }
  return {
    atMs,
    timeLabel: timeLabelNow(atMs),
    label: trimmed,
    outcome: inferOutcomeFromText(trimmed),
    kind: "info",
    count: 1,
  };
}

export function buildLogEntryFromStep(
  input: LogAgentTestingStepInput
): AgentTestingLogEntry {
  const atMs = Date.now();
  const raw = input.raw?.trim();
  const label =
    input.label?.trim() ||
    [input.action, input.beatId, input.touchpointKey].filter(Boolean).join(" · ") ||
    raw ||
    "step";
  return {
    atMs,
    timeLabel: timeLabelNow(atMs),
    label,
    outcome: input.outcome ?? (raw ? inferOutcomeFromText(raw) : "ok"),
    kind: input.kind ?? "step",
    durationMs: input.durationMs,
    beatId: input.beatId,
    touchpointKey: input.touchpointKey,
    action: input.action,
    count: 1,
  };
}

/** Merge identical consecutive helper/info/system/playback-diag rows into one counted line.
 * Never coalesce clicks/nav — dense click paths must stay 1:1 visible. */
export function coalesceLogEntry(
  prev: AgentTestingLogEntry | undefined,
  next: AgentTestingLogEntry
): AgentTestingLogEntry | null {
  if (!prev) return null;
  if (prev.kind !== next.kind) return null;
  if (prev.label !== next.label) return null;
  if (prev.outcome !== next.outcome) return null;
  if (
    prev.kind !== "helper" &&
    prev.kind !== "info" &&
    prev.kind !== "init" &&
    prev.kind !== "system" &&
    prev.kind !== "playback-diag"
  ) {
    return null;
  }
  const durationMs =
    prev.durationMs != null || next.durationMs != null
      ? (prev.durationMs ?? 0) +
        (next.durationMs ?? clampStepDurationMs(next.atMs - prev.atMs))
      : clampStepDurationMs(next.atMs - prev.atMs);
  return {
    ...prev,
    count: (prev.count ?? 1) + 1,
    durationMs,
    atMs: next.atMs,
    timeLabel: next.timeLabel,
  };
}

/** Cap absurd deltas from mixed Date.now / performance.now clocks. */
export function clampStepDurationMs(delta: number): number {
  if (!Number.isFinite(delta) || delta < 0) return 0;
  // 10 minutes max between steps — larger = clock mix bug
  return Math.min(delta, 10 * 60 * 1000);
}

export function formatLogRowText(entry: AgentTestingLogEntry): string {
  const count =
    entry.count && entry.count > 1 ? ` ×${entry.count}` : "";
  const dur = formatDurationMs(entry.durationMs);
  const durPart = dur && entry.durationKind !== "since-previous" ? ` (${dur})` : "";
  return `${entry.timeLabel}  ${humanizeQaLogLabel(entry.label)}${count}${durPart}`;
}
