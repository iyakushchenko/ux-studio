/**
 * QA Message bridge RTT — type→Send→latch→agent consume.
 * PENDING timeout floors use measured RTT so slow bridges are not brittle.
 */

const MEMORY_KEY = "__studioQaMessageRttMemory";

type Memory = {
  lastSentAt: number | null;
  lastConsumedAt: number | null;
  lastRttMs: number | null;
  samples: number[];
  maxSamples: number;
};

function memory(): Memory {
  if (typeof window === "undefined") {
    const g = globalThis as typeof globalThis & { [MEMORY_KEY]?: Memory };
    if (!g[MEMORY_KEY]) {
      g[MEMORY_KEY] = {
        lastSentAt: null,
        lastConsumedAt: null,
        lastRttMs: null,
        samples: [],
        maxSamples: 12,
      };
    }
    return g[MEMORY_KEY]!;
  }
  const w = window as Window & { [MEMORY_KEY]?: Memory };
  if (!w[MEMORY_KEY]) {
    w[MEMORY_KEY] = {
      lastSentAt: null,
      lastConsumedAt: null,
      lastRttMs: null,
      samples: [],
      maxSamples: 12,
    };
  }
  return w[MEMORY_KEY]!;
}

export function noteQaMessageSent(atMs = Date.now()): void {
  const m = memory();
  m.lastSentAt = atMs;
}

/** Returns RTT ms when a pending send was open; null otherwise. */
export function noteQaMessageConsumed(atMs = Date.now()): number | null {
  const m = memory();
  if (m.lastSentAt == null) {
    m.lastConsumedAt = atMs;
    return null;
  }
  const rtt = Math.max(0, atMs - m.lastSentAt);
  m.lastConsumedAt = atMs;
  m.lastRttMs = rtt;
  m.samples.push(rtt);
  if (m.samples.length > m.maxSamples) m.samples.shift();
  m.lastSentAt = null;
  return rtt;
}

export function getQaMessageRttMs(): number | null {
  return memory().lastRttMs;
}

export function getQaMessageRttP50Ms(): number | null {
  const s = [...memory().samples].sort((a, b) => a - b);
  if (s.length === 0) return null;
  return s[Math.floor(s.length / 2)]!;
}

export function getQaMessageRttStats(): {
  lastRttMs: number | null;
  p50Ms: number | null;
  maxMs: number | null;
  samples: number[];
} {
  const m = memory();
  const s = m.samples;
  return {
    lastRttMs: m.lastRttMs,
    p50Ms: getQaMessageRttP50Ms(),
    maxMs: s.length ? Math.max(...s) : null,
    samples: [...s],
  };
}

/**
 * PENDING / handshake wait floor — account for bridge latency.
 * Override still wins via window.__studioQaPendingTimeoutMs when set.
 */
export function messageAwarePendingFloorMs(baseMs: number): number {
  const p50 = getQaMessageRttP50Ms() ?? getQaMessageRttMs() ?? 0;
  // 3× RTT + 8s typing slack, never below base, never above 3 min.
  const floor = Math.round(p50 * 3 + 8_000);
  return Math.min(180_000, Math.max(baseMs, floor));
}

export function resetQaMessageRttForTests(): void {
  const m = memory();
  m.lastSentAt = null;
  m.lastConsumedAt = null;
  m.lastRttMs = null;
  m.samples = [];
}
