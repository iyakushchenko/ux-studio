/**
 * Live "online with agent" presence — last-seen heartbeat for QA CONTROL.
 *
 * Agents SHOULD call `__studioAgentTestingOverlay.pauseForAgentLeave()` /
 * `resumeForAgentReturn()` when leaving/returning the QA session.
 *
 * HARD guard rail: when last touch exceeds `QA_AGENT_AUTO_PAUSE_MS`, the
 * overlay heartbeat auto-pauses capture + Play (same leave path, no
 * DIAGNOSTIC_ACK_STOP / QA_PAUSE_HALT latch). Return via
 * `resumeForAgentReturn` / touch unpauses + reads Message latch.
 *
 * **Prove latch:** `__studioRunFullPlayProve` / continuous Play prove **and**
 * `withMcpTestSession` smokes (step-forward / retreat / play) arm
 * `beginQaProveMode()` so the 8s stale heartbeat does **not** auto-pause /
 * abort mid-prove. Cleared in `endQaProveMode()` (finally).
 * Director on-air + live type-in also skip stale auto-pause (manual stepped watch).
 *
 * Label XOR (PO): either **ONLINE** (recently touched) **or**
 * **Last seen Xs ago** when stale — never both. Green diode = present only.
 */

const MEMORY_KEY = "__studioQaPresenceMemory";
const PROVE_LATCH_KEY = "__studioQaProveModeLatch";
const HEARTBEAT_MS = 2_000;
/** Agent counts as present when last touch ≤ this age (align resume-card stale). */
export const QA_AGENT_PRESENT_MS = 8_000;
/**
 * Auto-pause capture + Play when last touch exceeds this age.
 * Same window as present TTL so green ONLINE never pairs with a live session.
 * Skipped while prove-mode latch is armed (full Play prove).
 */
export const QA_AGENT_AUTO_PAUSE_MS = QA_AGENT_PRESENT_MS;

type Memory = {
  online: boolean;
  lastSeenAt: number;
  linkedAt: number;
  timer: ReturnType<typeof setInterval> | null;
  onTick: ((ageMs: number) => void) | null;
};

type ProveLatch = { active: boolean; startedAt: number };

function proveLatch(): ProveLatch {
  if (typeof window === "undefined") {
    const g = globalThis as typeof globalThis & { [PROVE_LATCH_KEY]?: ProveLatch };
    if (!g[PROVE_LATCH_KEY]) g[PROVE_LATCH_KEY] = { active: false, startedAt: 0 };
    return g[PROVE_LATCH_KEY]!;
  }
  const w = window as Window & { [PROVE_LATCH_KEY]?: ProveLatch };
  if (!w[PROVE_LATCH_KEY]) w[PROVE_LATCH_KEY] = { active: false, startedAt: 0 };
  return w[PROVE_LATCH_KEY]!;
}

/** Arm during full Play prove / MCP smokes — skips stale auto-pause until end. */
export function beginQaProveMode(source = "full-play-prove"): void {
  const latch = proveLatch();
  latch.active = true;
  latch.startedAt = Date.now();
  touchQaAgentPresence(source);
  void source;
}

/** Clear prove latch (always call in finally). */
export function endQaProveMode(): void {
  const latch = proveLatch();
  latch.active = false;
  latch.startedAt = 0;
}

export function isQaProveModeActive(): boolean {
  return proveLatch().active;
}

function memory(): Memory {
  if (typeof window === "undefined") {
    const g = globalThis as typeof globalThis & { [MEMORY_KEY]?: Memory };
    if (!g[MEMORY_KEY]) {
      g[MEMORY_KEY] = {
        online: false,
        lastSeenAt: 0,
        linkedAt: 0,
        timer: null,
        onTick: null,
      };
    }
    return g[MEMORY_KEY]!;
  }
  const w = window as Window & { [MEMORY_KEY]?: Memory };
  if (!w[MEMORY_KEY]) {
    w[MEMORY_KEY] = {
      online: false,
      lastSeenAt: 0,
      linkedAt: 0,
      timer: null,
      onTick: null,
    };
  }
  return w[MEMORY_KEY]!;
}

export function touchQaAgentPresence(source = "touch"): void {
  const m = memory();
  const now = Date.now();
  if (!m.online) m.linkedAt = now;
  m.online = true;
  m.lastSeenAt = now;
  void source;
}

export function clearQaAgentPresence(): void {
  const m = memory();
  m.online = false;
  m.lastSeenAt = 0;
  m.linkedAt = 0;
  if (m.timer != null) {
    clearInterval(m.timer);
    m.timer = null;
  }
  m.onTick = null;
}

/**
 * Start heartbeat while agent CONTROL is live (idempotent).
 * Re-arming replaces `onTick` so auto-pause + MCP chrome stay wired after HMR.
 */
export function armQaAgentPresenceHeartbeat(
  onTick?: (ageMs: number) => void
): void {
  const m = memory();
  touchQaAgentPresence("arm");
  if (onTick) m.onTick = onTick;
  if (m.timer != null) return;
  m.timer = setInterval(() => {
    // Keep ticking while session is linked — stale age drives auto-pause + Last seen.
    if (!m.online || !m.lastSeenAt) return;
    const age = Date.now() - m.lastSeenAt;
    try {
      m.onTick?.(age);
    } catch {
      /* hang-safe */
    }
  }, HEARTBEAT_MS);
}

/** True when last touch is past the auto-pause TTL (guard rail). */
export function isQaAgentPresenceStaleForAutoPause(
  ageMs = peekQaAgentPresence().ageMs
): boolean {
  // Full Play prove owns the session — do not abort from 8s heartbeat.
  if (isQaProveModeActive()) return false;
  const m = memory();
  if (!m.online || !m.lastSeenAt) return false;
  return ageMs > QA_AGENT_AUTO_PAUSE_MS;
}

export function peekQaAgentPresence(): {
  /** True only when agent session is linked AND recently touched. */
  online: boolean;
  lastSeenAt: number;
  linkedAt: number;
  ageMs: number;
  /** `ONLINE` | `Last seen Ns ago` | `` — never combine. */
  label: string;
} {
  const m = memory();
  const now = Date.now();
  const ageMs = m.lastSeenAt ? Math.max(0, now - m.lastSeenAt) : 0;
  const ageSec = Math.round(ageMs / 1000);
  const present = Boolean(
    m.online && m.lastSeenAt > 0 && ageMs <= QA_AGENT_PRESENT_MS
  );
  let label = "";
  if (present) {
    label = "ONLINE";
  } else if (m.lastSeenAt > 0) {
    label = `Last seen ${ageSec}s ago`;
  }
  return {
    online: present,
    lastSeenAt: m.lastSeenAt,
    linkedAt: m.linkedAt,
    ageMs,
    label,
  };
}

export function formatPresenceSuffix(presenceLabel: string): string {
  const t = presenceLabel.trim();
  return t ? ` · ${t}` : "";
}
