import type { OrchestraModeOption, OrchestraModeId } from "@/app/orchestra/types";

export const ORCHESTRA_DEFAULT_MODE: OrchestraModeId = "agentic-cjm";

export const ORCHESTRA_MODE_OPTIONS: OrchestraModeOption[] = [
  { id: "agentic-cjm", label: "Agentic CJM" },
  { id: "traditional-cjm", label: "Traditional CJM" },
];

/**
 * Canonical URL `experience=` — journey path only (not CJM on/off).
 * Internal journey slots remain `OrchestraModeId` (`agentic-cjm` / `traditional-cjm`).
 */
export type StudioExperienceId = "agentic" | "traditional";

const MODE_STORAGE_KEY = "proto-orchestra-mode";

/**
 * URL / storage aliases → canonical OrchestraModeId.
 * Bare `traditional` / `agentic` must not win — they zero journey beats and
 * hide the cassette playback panel (REC-only RecordingModeSlot).
 */
export function normalizeOrchestraModeId(
  raw: string | null | undefined
): OrchestraModeId | undefined {
  if (raw == null) return undefined;
  const t = raw.trim().toLowerCase();
  if (!t) return undefined;
  if (t === "agentic-cjm" || t === "agentic" || t === "chat-experience") {
    return "agentic-cjm";
  }
  if (t === "traditional-cjm" || t === "traditional") {
    return "traditional-cjm";
  }
  return undefined;
}

export function normalizeStudioExperienceId(
  raw: string | null | undefined
): StudioExperienceId | undefined {
  if (raw == null) return undefined;
  const t = raw.trim().toLowerCase();
  if (t === "agentic") return "agentic";
  if (t === "traditional") return "traditional";
  // Allow accidental compound paste on the experience key.
  if (t === "agentic-cjm" || t === "chat-experience") return "agentic";
  if (t === "traditional-cjm") return "traditional";
  return undefined;
}

/** URL `cjm=` — on/off (also 1/0, true/false). */
export function normalizeStudioCjmFlag(
  raw: string | null | undefined
): boolean | undefined {
  if (raw == null) return undefined;
  const t = raw.trim().toLowerCase();
  if (!t) return undefined;
  if (t === "on" || t === "1" || t === "true" || t === "yes") return true;
  if (t === "off" || t === "0" || t === "false" || t === "no") return false;
  return undefined;
}

export function orchestraModeToExperienceId(
  modeId: OrchestraModeId
): StudioExperienceId {
  return modeId === "traditional-cjm" ? "traditional" : "agentic";
}

export function experienceToOrchestraModeId(
  experienceId: StudioExperienceId
): OrchestraModeId {
  return experienceId === "traditional" ? "traditional-cjm" : "agentic-cjm";
}

export function isOrchestraModeId(
  value: string | null | undefined
): value is OrchestraModeId {
  return normalizeOrchestraModeId(value) != null;
}

export function readStoredOrchestraMode(): OrchestraModeId {
  try {
    const raw = sessionStorage.getItem(MODE_STORAGE_KEY);
    return normalizeOrchestraModeId(raw) ?? ORCHESTRA_DEFAULT_MODE;
  } catch {
    /* ignore */
  }
  return ORCHESTRA_DEFAULT_MODE;
}

export function storeOrchestraMode(modeId: OrchestraModeId): void {
  try {
    sessionStorage.setItem(MODE_STORAGE_KEY, modeId);
  } catch {
    /* ignore */
  }
}
