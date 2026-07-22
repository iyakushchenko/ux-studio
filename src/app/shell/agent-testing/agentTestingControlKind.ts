/**
 * Agent CONTROL kinds — not a third sessionKind.
 * Aligns with sessionKind=agent + CJM on/off + transport.
 *
 * - playback — CJM on + auto Play on-air (`isPlaying`)
 * - stepped  — CJM on + Play off (frame-by-frame SF / parked cassette)
 * - manual   — agent QA latch without cassette (CJM off)
 *
 * Do not confuse with sessionKind "manual" (bug-icon free logger).
 */

import type { AgentTestingSessionKind } from "@/app/shell/agent-testing/agentTestingSession";

export type AgentControlKind = "playback" | "stepped" | "manual";

export type DeriveAgentControlKindInput = {
  sessionKind: AgentTestingSessionKind;
  /** True when Studio journeyMode / CJM is on (cassette). */
  cjmOn: boolean;
  /** Auto Play transport — when true with CJM → playback; when false → stepped. */
  isPlaying?: boolean;
};

/** null when not in agent CONTROL (manual logger / observe / idle). */
export function deriveAgentControlKind(
  input: DeriveAgentControlKindInput
): AgentControlKind | null {
  if (input.sessionKind !== "agent") return null;
  if (!input.cjmOn) return "manual";
  if (input.isPlaying) return "playback";
  return "stepped";
}

/** Short suffix for AGENT — CONTROL label. */
export function formatAgentControlKindSuffix(
  kind: AgentControlKind | null | undefined
): string {
  if (kind === "playback") return " · PLAYBACK";
  if (kind === "stepped") return " · STEPPED PLAYBACK";
  if (kind === "manual") return " · MANUAL";
  return "";
}

/** True when sitrep/cjm string means cassette on. */
export function isCjmCassetteOn(cjm: string | null | undefined): boolean {
  if (!cjm) return false;
  const v = cjm.trim().toLowerCase();
  if (!v || v === "off" || v === "hub") return false;
  return true;
}

/**
 * Live Play transport from Studio nav (stable action selector; label changes to Pause on-air).
 * Hang-safe — false when DOM missing.
 */
export function readLiveJourneyIsPlaying(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const btn = document.querySelector(
      'button[data-studio-action="transport-play"], button[aria-label="Play journey"]'
    );
    return btn?.getAttribute("aria-pressed") === "true";
  } catch {
    return false;
  }
}

/**
 * Live director travel (step-forward script / continuous Play) from Studio nav.
 * Hang-safe — false when DOM missing.
 */
export function readLiveJourneyOnAir(): boolean {
  if (typeof document === "undefined") return false;
  try {
    return document.querySelector(".studio-nav-scenario--on-air") != null;
  } catch {
    return false;
  }
}
