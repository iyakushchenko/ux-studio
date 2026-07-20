/**
 * Live "online with agent" presence — last-seen heartbeat for QA CONTROL.
 */

const MEMORY_KEY = "__studioQaPresenceMemory";
const HEARTBEAT_MS = 2_000;

type Memory = {
  online: boolean;
  lastSeenAt: number;
  linkedAt: number;
  timer: ReturnType<typeof setInterval> | null;
};

function memory(): Memory {
  if (typeof window === "undefined") {
    const g = globalThis as typeof globalThis & { [MEMORY_KEY]?: Memory };
    if (!g[MEMORY_KEY]) {
      g[MEMORY_KEY] = {
        online: false,
        lastSeenAt: 0,
        linkedAt: 0,
        timer: null,
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
}

/** Start heartbeat while agent CONTROL is live (idempotent). */
export function armQaAgentPresenceHeartbeat(
  onTick?: (ageMs: number) => void
): void {
  const m = memory();
  touchQaAgentPresence("arm");
  if (m.timer != null) return;
  m.timer = setInterval(() => {
    if (!m.online) return;
    const age = Date.now() - m.lastSeenAt;
    try {
      onTick?.(age);
    } catch {
      /* hang-safe */
    }
  }, HEARTBEAT_MS);
}

export function peekQaAgentPresence(): {
  online: boolean;
  lastSeenAt: number;
  linkedAt: number;
  ageMs: number;
  label: string;
} {
  const m = memory();
  const now = Date.now();
  const ageMs = m.lastSeenAt ? Math.max(0, now - m.lastSeenAt) : 0;
  const ageSec = Math.round(ageMs / 1000);
  const label = !m.online
    ? ""
    : ageSec <= 3
      ? "ONLINE · linked"
      : `ONLINE · seen ${ageSec}s ago`;
  return {
    online: m.online,
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
