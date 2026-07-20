/**
 * After RESULT · PASS/FAIL, seal the visible QA chat so housekeeping
 * (clear-stale / playback-diag auto-dismiss) cannot undermine the finale.
 */

const MEMORY_KEY = "__studioQaFinaleSealMemory";

type Memory = { sealed: boolean; atMs: number };

function memory(): Memory {
  if (typeof window === "undefined") {
    const g = globalThis as typeof globalThis & { [MEMORY_KEY]?: Memory };
    if (!g[MEMORY_KEY]) g[MEMORY_KEY] = { sealed: false, atMs: 0 };
    return g[MEMORY_KEY]!;
  }
  const w = window as Window & { [MEMORY_KEY]?: Memory };
  if (!w[MEMORY_KEY]) w[MEMORY_KEY] = { sealed: false, atMs: 0 };
  return w[MEMORY_KEY]!;
}

export function isAgentTestingFinaleSealed(): boolean {
  return memory().sealed;
}

export function sealAgentTestingFinale(): void {
  const m = memory();
  m.sealed = true;
  m.atMs = Date.now();
}

export function clearAgentTestingFinaleSeal(): void {
  const m = memory();
  m.sealed = false;
  m.atMs = 0;
}

/** Quiet housekeeping sources — never spam visible chat / ring as rows after RESULT. */
export function isQuietDiagDismissSource(source: string): boolean {
  const s = source.trim().toLowerCase();
  return (
    s === "session-finale" ||
    s === "prove-wave-end" ||
    s === "qa-stop" ||
    s === "qa-stop-force" ||
    s === "force-clear" ||
    s === "qa-overlay-start" ||
    s.includes("finale")
  );
}
