import type { JourneyDefinition } from "@/app/orchestra/types";
import type { RecordingSession } from "@/app/recording/recordingTypes";
import type { PersonaId, ProjectId } from "@/projects/types";

export const JOURNEY_FILE_VERSION = 1 as const;

export type JourneyFile = {
  version: typeof JOURNEY_FILE_VERSION;
  exportedAt: string;
  projectId?: ProjectId;
  personaId?: PersonaId;
  journey: JourneyDefinition;
  /**
   * Full REC session (event log) when this CJM was compiled via Add as CJM.
   * Optional — built-in / hand-authored journeys omit it.
   */
  recording?: RecordingSession;
};

export type JourneyBundleFile = {
  version: typeof JOURNEY_FILE_VERSION;
  exportedAt: string;
  projectId?: ProjectId;
  personaId?: PersonaId;
  journeys: JourneyDefinition[];
};

const BEAT_KINDS = new Set(["screen-frames", "tab-landing", "overlay"]);

function assertJourneyDefinition(journey: unknown): JourneyDefinition {
  if (!journey || typeof journey !== "object") {
    throw new Error("Invalid journey payload");
  }
  const record = journey as JourneyDefinition;
  if (!record.id || typeof record.id !== "string") {
    throw new Error("Journey id is required");
  }
  if (!record.label || typeof record.label !== "string") {
    throw new Error("Journey label is required");
  }
  if (!Array.isArray(record.beats)) {
    throw new Error("Journey beats must be an array");
  }
  for (const beat of record.beats) {
    if (!beat?.id || !beat?.label || !BEAT_KINDS.has(beat.kind)) {
      throw new Error(`Invalid beat in journey ${record.id}`);
    }
  }
  return record;
}

export function serializeJourneyFile(options: {
  journey: JourneyDefinition;
  projectId?: ProjectId;
  personaId?: PersonaId;
  recording?: RecordingSession;
}): string {
  const payload: JourneyFile = {
    version: JOURNEY_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    projectId: options.projectId,
    personaId: options.personaId,
    journey: options.journey,
    ...(options.recording ? { recording: options.recording } : {}),
  };
  return JSON.stringify(payload, null, 2);
}

/** Control-room Download for a saved CJM picker entry → `.journey.json`. */
export function buildSavedJourneyDownload(options: {
  journey: JourneyDefinition | null | undefined;
  projectId?: ProjectId;
  personaId?: PersonaId;
  /** When present, embed the raw REC session so the event log is not lost. */
  recording?: RecordingSession;
}): { json: string; filename: string } | null {
  const journey = options.journey;
  if (!journey) return null;
  const json = serializeJourneyFile({
    journey,
    projectId: options.projectId,
    personaId: options.personaId,
    recording: options.recording,
  });
  const safeId = journey.id.replace(/[^a-z0-9_-]+/gi, "-");
  return { json, filename: `${safeId}.journey.json` };
}

export function serializeJourneyBundleFile(options: {
  journeys: JourneyDefinition[];
  projectId?: ProjectId;
  personaId?: PersonaId;
}): string {
  const payload: JourneyBundleFile = {
    version: JOURNEY_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    projectId: options.projectId,
    personaId: options.personaId,
    journeys: options.journeys,
  };
  return JSON.stringify(payload, null, 2);
}

export function deserializeJourneyFile(raw: string): JourneyFile {
  const parsed = JSON.parse(raw) as JourneyFile;
  if (parsed.version !== JOURNEY_FILE_VERSION) {
    throw new Error(`Unsupported journey file version: ${parsed.version}`);
  }
  return {
    ...parsed,
    journey: assertJourneyDefinition(parsed.journey),
  };
}

export function deserializeJourneyBundleFile(raw: string): JourneyBundleFile {
  const parsed = JSON.parse(raw) as JourneyBundleFile;
  if (parsed.version !== JOURNEY_FILE_VERSION) {
    throw new Error(`Unsupported journey file version: ${parsed.version}`);
  }
  if (!Array.isArray(parsed.journeys)) {
    throw new Error("Journey bundle must include journeys array");
  }
  return {
    ...parsed,
    journeys: parsed.journeys.map((journey) => assertJourneyDefinition(journey)),
  };
}

export function summarizeJourney(journey: JourneyDefinition): {
  id: string;
  label: string;
  beatCount: number;
  beatIds: string[];
} {
  return {
    id: journey.id,
    label: journey.label,
    beatCount: journey.beats.length,
    beatIds: journey.beats.map((beat) => beat.id),
  };
}
