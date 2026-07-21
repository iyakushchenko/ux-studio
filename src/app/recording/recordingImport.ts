/**
 * REC Import — resolve a dropped JSON file into a staged recording session.
 *
 * Accepts:
 * - `.recording.json` (raw REC session)
 * - `.journey.json` with embedded `recording` (saved CJM Download)
 *
 * After a successful resolve, callers stage the session so Download / Replay / + unlock.
 */

import { deserializeJourneyFile } from "@/app/journey/journeyFile";
import { deserializeRecordingSession } from "@/app/recording/recordingSession";
import type { RecordingSession } from "@/app/recording/recordingTypes";

export type ImportRecordingResolve = {
  session: RecordingSession;
  /** Prefer journey label when Import came from `.journey.json`. */
  suggestedLabel?: string;
  source: "recording" | "journey-recording";
};

function looksLikeJourneyFile(parsed: Record<string, unknown>): boolean {
  return (
    parsed.journey != null &&
    typeof parsed.journey === "object" &&
    !Array.isArray(parsed.journey)
  );
}

/**
 * Parse Import file text → recording session ready to `stageRecordingSession`.
 * Throws with a short, UI-safe message on unsupported shapes.
 */
export function resolveRecordingSessionFromImportJson(
  raw: string
): ImportRecordingResolve {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Import JSON is not valid");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Import JSON must be an object");
  }
  const obj = parsed as Record<string, unknown>;

  if (looksLikeJourneyFile(obj)) {
    const file = deserializeJourneyFile(raw);
    if (!file.recording) {
      throw new Error(
        "Journey has no embedded recording — use a recorded CJM Download or a .recording.json"
      );
    }
    const session = deserializeRecordingSession(
      JSON.stringify(file.recording)
    );
    return {
      session,
      suggestedLabel: file.journey.label,
      source: "journey-recording",
    };
  }

  return {
    session: deserializeRecordingSession(raw),
    source: "recording",
  };
}
