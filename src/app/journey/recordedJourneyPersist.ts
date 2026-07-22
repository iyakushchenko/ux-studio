/**
 * Durable recorded CJM catalog (project + persona) — localStorage + runtime import.
 * Complements download JSON / data/journeys files (browser cannot write the repo).
 *
 * v2 storage keeps the raw `.recording.json` session beside each compiled journey
 * so Add as CJM never discards the event log (8.56 failure mode).
 */

import type { JourneyDefinition } from "@/app/orchestra/types";
import {
  applyImportedJourneyFile,
  clearImportedJourneys,
  getImportedJourneys,
  removeImportedJourney,
} from "@/app/journey/journeyRuntimeStore";
import type { JourneyFile } from "@/app/journey/journeyFile";
import { isBuiltInOrchestraModeId } from "@/app/orchestra/orchestraModes";
import { healRecordedJourneyNav } from "@/app/recording/recordedJourneyNavHeal";
import type { RecordingSession } from "@/app/recording/recordingTypes";
import { CJM_PLAYBACK_CONTRACT_VERSION } from "@/app/recording/recordingMetadata";
import { getStudioRelease } from "@/app/shell/studioRelease";
import type { PersonaId, ProjectId } from "@/projects/types";

const STORAGE_PREFIX = "studio-recorded-cjm";
const PROOF_STORAGE_PREFIX = "studio-cjm-playback-proof";

type PersistedCatalogV2 = {
  version: 2;
  savedAt: string;
  journeys: JourneyDefinition[];
  /** journeyId → full REC session */
  recordings?: Record<string, RecordingSession>;
};

function storageKey(projectId: string, personaId: string): string {
  return `${STORAGE_PREFIX}:${projectId}:${personaId}`;
}

function proofStorageKey(projectId: string, personaId: string, journeyId: string): string {
  return `${PROOF_STORAGE_PREFIX}:${projectId}:${personaId}:${journeyId}`;
}

type PlaybackProof = NonNullable<
  NonNullable<RecordingSession["metadata"]>["compatibilityProof"]
>;

function readPlaybackProof(
  projectId: ProjectId | string,
  personaId: PersonaId | string,
  journeyId: string
): PlaybackProof | undefined {
  if (typeof localStorage === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(proofStorageKey(projectId, personaId, journeyId));
    if (!raw) return undefined;
    const proof = JSON.parse(raw) as PlaybackProof;
    return proof?.playbackContract && proof?.studioVersion && proof?.provedAt
      ? proof
      : undefined;
  } catch {
    return undefined;
  }
}

/** Apply an origin-local proof receipt to immutable deployed REC evidence. */
export function withPersistedJourneyPlaybackProof(
  projectId: ProjectId | string,
  personaId: PersonaId | string,
  journeyId: string,
  session: RecordingSession | undefined
): RecordingSession | undefined {
  if (!session) return undefined;
  const proof = readPlaybackProof(projectId, personaId, journeyId);
  if (!proof) return session;
  return {
    ...session,
    metadata: { ...session.metadata, compatibilityProof: proof },
  };
}

function healPersistedJourney(
  journey: JourneyDefinition,
  projectId: ProjectId | string
): JourneyDefinition {
  return healRecordedJourneyNav(journey, projectId);
}

function readCatalogRaw(
  projectId: ProjectId | string,
  personaId: PersonaId | string
): PersistedCatalogV2 | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(projectId, personaId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedCatalogV2 & {
      version?: number;
      journeys?: JourneyDefinition[];
      recordings?: Record<string, RecordingSession>;
    };
    if (!Array.isArray(parsed.journeys)) return null;
    return {
      version: 2,
      savedAt:
        typeof parsed.savedAt === "string"
          ? parsed.savedAt
          : new Date().toISOString(),
      journeys: parsed.journeys,
      recordings:
        parsed.recordings && typeof parsed.recordings === "object"
          ? parsed.recordings
          : {},
    };
  } catch {
    return null;
  }
}

export function readPersistedRecordedJourneys(
  projectId: ProjectId | string,
  personaId: PersonaId | string
): JourneyDefinition[] {
  const catalog = readCatalogRaw(projectId, personaId);
  if (!catalog) return [];
  return catalog.journeys
    .filter(
      (j) => j && typeof j.id === "string" && typeof j.label === "string"
    )
    .map((journey) => healPersistedJourney(journey, projectId));
}

/** Raw REC session persisted with a recorded CJM (Add as CJM), if any. */
export function readPersistedRecordingForJourney(
  projectId: ProjectId | string,
  personaId: PersonaId | string,
  journeyId: string
): RecordingSession | undefined {
  const catalog = readCatalogRaw(projectId, personaId);
  const session = catalog?.recordings?.[journeyId];
  if (!session || !Array.isArray(session.events)) return undefined;
  return withPersistedJourneyPlaybackProof(projectId, personaId, journeyId, session);
}

/** Attach a successful playback proof without rewriting recording provenance. */
export function markPersistedJourneyPlaybackProven(
  projectId: ProjectId | string,
  personaId: PersonaId | string,
  journeyId: string
): boolean {
  const catalog = readCatalogRaw(projectId, personaId);
  const session = catalog?.recordings?.[journeyId];
  const proof: PlaybackProof = {
    playbackContract: CJM_PLAYBACK_CONTRACT_VERSION,
    studioVersion: getStudioRelease().version,
    provedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(
      proofStorageKey(projectId, personaId, journeyId),
      JSON.stringify(proof)
    );
  } catch {
    return false;
  }
  if (catalog && session) {
    const updated: RecordingSession = {
      ...session,
      metadata: { ...session.metadata, compatibilityProof: proof },
    };
    persistRecordedJourneys(projectId, personaId, catalog.journeys, { [journeyId]: updated });
  }
  window.dispatchEvent(new CustomEvent("studio:cjm-compatibility-proof", { detail: { journeyId } }));
  return true;
}

export function persistRecordedJourneys(
  projectId: ProjectId | string,
  personaId: PersonaId | string,
  journeys: readonly JourneyDefinition[],
  recordings?: Record<string, RecordingSession>
): void {
  if (typeof localStorage === "undefined") return;
  try {
    const prev = readCatalogRaw(projectId, personaId);
    const nextRecordings: Record<string, RecordingSession> = {
      ...(prev?.recordings ?? {}),
      ...(recordings ?? {}),
    };
    // Drop recordings for journeys that were removed.
    const keep = new Set(journeys.map((j) => j.id));
    for (const id of Object.keys(nextRecordings)) {
      if (!keep.has(id)) delete nextRecordings[id];
    }
    const payload: PersistedCatalogV2 = {
      version: 2,
      savedAt: new Date().toISOString(),
      journeys: [...journeys],
      recordings: nextRecordings,
    };
    localStorage.setItem(storageKey(projectId, personaId), JSON.stringify(payload));
  } catch {
    /* ignore quota */
  }
}

/** Merge one recorded journey (+ optional raw REC) into durable localStorage. */
export function persistRecordedJourneyFile(file: JourneyFile): void {
  const projectId = file.projectId;
  const personaId = file.personaId;
  if (!projectId || !personaId) return;
  const journey = healPersistedJourney(file.journey, projectId);
  const existing = readPersistedRecordedJourneys(projectId, personaId);
  const others = existing.filter((j) => j.id !== journey.id);
  const recordings: Record<string, RecordingSession> = {};
  if (file.recording) {
    recordings[journey.id] = file.recording;
  }
  persistRecordedJourneys(projectId, personaId, [...others, journey], recordings);
}

/** Hydrate runtime catalog from localStorage (call on studio boot / persona change). */
export function hydrateRecordedJourneysFromStorage(
  projectId: ProjectId | string,
  personaId: PersonaId | string
): number {
  const journeys = readPersistedRecordedJourneys(projectId, personaId);
  // Runtime imports are a view of the active owner only. Never leak a prior
  // project's/persona's local catalog across a Studio selection change.
  clearImportedJourneys();
  // Rewrite storage when heal stamps correct protoTabs (legacy all-1 journeys).
  persistRecordedJourneys(projectId, personaId, journeys);
  for (const journey of journeys) {
    applyImportedJourneyFile({
      version: 1,
      exportedAt: new Date().toISOString(),
      projectId: projectId as ProjectId,
      personaId: personaId as PersonaId,
      journey,
      recording: readPersistedRecordingForJourney(
        projectId,
        personaId,
        journey.id
      ),
    });
  }
  return journeys.length;
}

/** Snapshot currently imported journeys that are not built-in slots. */
export function listRuntimeRecordedJourneys(): JourneyDefinition[] {
  return getImportedJourneys().filter(
    (j) => j.id !== "agentic-cjm" && j.id !== "traditional-cjm"
  );
}

/**
 * Delete a user-recorded CJM from localStorage + runtime catalog.
 * Built-in slots are never removed. The UI additionally protects every
 * file-backed project/persona catalog entry.
 */
export function removePersistedRecordedJourney(
  projectId: ProjectId | string,
  personaId: PersonaId | string,
  journeyId: string
): boolean {
  if (isBuiltInOrchestraModeId(journeyId)) return false;
  const existing = readPersistedRecordedJourneys(projectId, personaId);
  const next = existing.filter((j) => j.id !== journeyId);
  const removedFromStorage = next.length !== existing.length;
  if (removedFromStorage) {
    persistRecordedJourneys(projectId, personaId, next);
  }
  const removedFromRuntime = removeImportedJourney(journeyId);
  return removedFromStorage || removedFromRuntime;
}

/** True when the selected mode is a deletable recorded CJM (not built-in). */
export function isDeletableRecordedJourneyId(
  journeyId: string | null | undefined
): boolean {
  if (!journeyId || isBuiltInOrchestraModeId(journeyId)) return false;
  return (
    listRuntimeRecordedJourneys().some((j) => j.id === journeyId) ||
    /^rec-[a-z0-9]/i.test(journeyId)
  );
}
