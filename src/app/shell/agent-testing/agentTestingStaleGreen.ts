/**
 * Stale-green detector (PP-07) — control-panel snapshot vs URL/DOM diverge → amber.
 * Lean: one sitrep log line per distinct mismatch key; no spam.
 */

import { getControlPanelSnapshot } from "@/app/shell/controlPanelLog";
import { parseStudioUrl } from "@/app/shell/studioUrl";

const MEMORY_KEY = "__studioQaStaleGreenMemory";

export type StaleGreenMismatch = {
  field: "screen" | "cjm" | "experience";
  snap: string;
  live: string;
};

type Memory = {
  lastKey: string;
  lastAtMs: number;
  candidateKey: string;
  candidateAtMs: number;
  active: boolean;
};

// URL and the control-room store deliberately update on adjacent frames during
// route/CJM transitions. Do not turn that expected hand-off into an amber QA
// line; only surface a mismatch that survives a short settling window.
const SETTLE_MS = 350;

function memory(): Memory {
  if (typeof window === "undefined") {
    const g = globalThis as typeof globalThis & { [MEMORY_KEY]?: Memory };
    if (!g[MEMORY_KEY]) {
      g[MEMORY_KEY] = {
        lastKey: "",
        lastAtMs: 0,
        candidateKey: "",
        candidateAtMs: 0,
        active: false,
      };
    }
    return g[MEMORY_KEY]!;
  }
  const w = window as Window & { [MEMORY_KEY]?: Memory };
  if (!w[MEMORY_KEY]) {
      w[MEMORY_KEY] = {
        lastKey: "",
        lastAtMs: 0,
        candidateKey: "",
        candidateAtMs: 0,
        active: false,
      };
  }
  return w[MEMORY_KEY]!;
}

function norm(raw: string | null | undefined): string {
  return (raw ?? "").trim().toLowerCase();
}

function urlCjmOn(search: string): boolean {
  try {
    return parseStudioUrl(search).cjm === true;
  } catch {
    return false;
  }
}

/** Compare snap vs live URL — empty when aligned or snap missing. */
export function detectStaleGreenMismatches(
  search =
    typeof window !== "undefined" ? window.location?.search ?? "" : ""
): StaleGreenMismatch[] {
  let snap: ReturnType<typeof getControlPanelSnapshot> = null;
  try {
    snap = getControlPanelSnapshot();
  } catch {
    return [];
  }
  if (!snap) return [];

  const url = parseStudioUrl(search);
  const out: StaleGreenMismatch[] = [];

  const snapScreen = norm(
    typeof snap.screenId === "string"
      ? snap.screenId
      : typeof snap.screen === "string"
        ? snap.screen
        : ""
  );
  const liveScreen = norm(url.screenId ?? undefined);
  if (snapScreen && liveScreen && snapScreen !== liveScreen) {
    out.push({ field: "screen", snap: snapScreen, live: liveScreen });
  }

  if (typeof snap.journeyMode === "boolean") {
    const liveOn = urlCjmOn(search);
    if (snap.journeyMode !== liveOn) {
      out.push({
        field: "cjm",
        snap: snap.journeyMode ? "on" : "off",
        live: liveOn ? "on" : "off",
      });
    }
  }

  const snapExp = norm(
    typeof snap.experience === "string" ? snap.experience : ""
  );
  const liveExp = norm(url.experienceId ?? undefined);
  if (snapExp && liveExp && snapExp !== liveExp) {
    out.push({ field: "experience", snap: snapExp, live: liveExp });
  }

  return out;
}

export function formatStaleGreenKey(mismatches: StaleGreenMismatch[]): string {
  return mismatches.map((m) => `${m.field}:${m.snap}≠${m.live}`).join("|");
}

export function formatStaleGreenLabel(mismatches: StaleGreenMismatch[]): string {
  const bits = mismatches.map((m) => `${m.field} ${m.snap}≠${m.live}`);
  return `stale-green · ${bits.join(" · ")}`;
}

/**
 * Evaluate stale-green. Returns a sitrep log label when a *new* mismatch appears
 * (or reappears after clear). null = aligned or already logged this key.
 */
export function noteStaleGreenIfChanged(
  search?: string
): { amber: boolean; logLabel: string | null; mismatches: StaleGreenMismatch[] } {
  const mismatches = detectStaleGreenMismatches(search);
  const m = memory();
  if (mismatches.length === 0) {
    m.active = false;
    m.lastKey = "";
    m.candidateKey = "";
    m.candidateAtMs = 0;
    return { amber: false, logLabel: null, mismatches };
  }
  const key = formatStaleGreenKey(mismatches);
  const now = Date.now();
  if (key !== m.candidateKey) {
    m.candidateKey = key;
    m.candidateAtMs = now;
    m.active = false;
    return { amber: false, logLabel: null, mismatches };
  }
  if (now - m.candidateAtMs < SETTLE_MS) {
    return { amber: false, logLabel: null, mismatches };
  }
  m.active = true;
  if (key === m.lastKey) {
    return { amber: true, logLabel: null, mismatches };
  }
  m.lastKey = key;
  m.lastAtMs = now;
  return {
    amber: true,
    logLabel: formatStaleGreenLabel(mismatches),
    mismatches,
  };
}

export function isStaleGreenActive(): boolean {
  return memory().active;
}

export function resetStaleGreenForTests(): void {
  const m = memory();
  m.active = false;
  m.lastKey = "";
  m.lastAtMs = 0;
  m.candidateKey = "";
  m.candidateAtMs = 0;
}
