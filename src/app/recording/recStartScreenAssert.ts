/**
 * HARD: first compiled beat must be the screen where ● Start was pressed.
 */

import type { JourneyDefinition } from "@/app/orchestra/types";
import { normalizeRecordedScreenKey } from "@/app/recording/recordedJourneyNavHeal";
import type { RecordingSession } from "@/app/recording/recordingTypes";

export type RecStartScreenAssert = {
  ok: boolean;
  startScreenId: string | null;
  firstBeatId: string | null;
  reason?: string;
};

/** Prefer stamped metadata, else first screen event / snapshot. */
export function resolveRecordingStartScreenId(
  session: RecordingSession
): string | null {
  const stamped = session.metadata?.startScreenId?.trim();
  if (stamped) return normalizeRecordedScreenKey(stamped);

  for (const event of session.events) {
    if (event.kind === "screen" && event.screenId?.trim()) {
      return normalizeRecordedScreenKey(event.screenId);
    }
  }
  for (const event of session.events) {
    const snap = event.snapshot?.screenId?.trim();
    if (snap) return normalizeRecordedScreenKey(snap);
  }
  return null;
}

/**
 * FAIL if first beat id ≠ screen at ● Start.
 * First beat must be the landing screen (e.g. `plp`), not `plp-book-now-camera`.
 */
export function assertFirstBeatMatchesStartScreen(
  session: RecordingSession,
  journey: JourneyDefinition
): RecStartScreenAssert {
  const startScreenId = resolveRecordingStartScreenId(session);
  const first = journey.beats[0];
  const firstBeatId = first?.id ?? null;

  if (!startScreenId) {
    return {
      ok: false,
      startScreenId: null,
      firstBeatId,
      reason:
        "start screen unknown — seedRecordingStartScreen did not stamp screen at ● Start",
    };
  }
  if (!first) {
    return {
      ok: false,
      startScreenId,
      firstBeatId: null,
      reason: "compiled journey has no beats",
    };
  }

  const firstNorm = normalizeRecordedScreenKey(first.id);
  if (firstNorm !== startScreenId) {
    return {
      ok: false,
      startScreenId,
      firstBeatId,
      reason: `first beat "${firstBeatId}" ≠ start screen "${startScreenId}"`,
    };
  }
  return { ok: true, startScreenId, firstBeatId };
}
