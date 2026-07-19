/**
 * Studio chrome mode XOR — REC ↔ CJM ↔ AIR.
 *
 * Rules (PO-locked):
 * - CJM on → REC disabled (cannot enter Rec mode)
 * - REC on → CJM off / disabled (playback panel XOR + switch gate)
 * - AIR / play live → both locked (existing transport freeze)
 */

export type RecModeLockReason = "air-active" | "journey-mode";

export type StudioModeXorInput = {
  isOnAir: boolean;
  isPlaying: boolean;
  journeyMode: boolean;
};

/** REC switch locked (disabled + forced off) when AIR/play or CJM is on. */
export function isRecModeLocked(input: StudioModeXorInput): boolean {
  return resolveRecModeLockReason(input) != null;
}

export function resolveRecModeLockReason(
  input: StudioModeXorInput
): RecModeLockReason | null {
  if (input.isOnAir || input.isPlaying) return "air-active";
  if (input.journeyMode) return "journey-mode";
  return null;
}

/** CJM switch locked when transport/AIR freeze or Rec mode is active. */
export function isJourneyModeSwitchDisabled(input: {
  transportLocked: boolean;
  recMode: boolean;
}): boolean {
  return input.transportLocked || input.recMode;
}

export function recModeLockTitle(reason: RecModeLockReason | null): string {
  if (reason === "journey-mode") {
    return "REC unavailable while CJM is on";
  }
  if (reason === "air-active") {
    return "REC unavailable while AIR / playback is live";
  }
  return "";
}
