/**
 * Durable recorded CJM catalog (project + persona) — localStorage + runtime import.
 * Complements download JSON / data/journeys files (browser cannot write the repo).
 */

import type { JourneyDefinition } from "@/app/orchestra/types";
import {
  applyImportedJourneyFile,
  getImportedJourneys,
  removeImportedJourney,
} from "@/app/journey/journeyRuntimeStore";
import type { JourneyFile } from "@/app/journey/journeyFile";
import { isBuiltInOrchestraModeId } from "@/app/orchestra/orchestraModes";
import { healRecordedJourneyNav } from "@/app/recording/recordedJourneyNavHeal";
import type { PersonaId, ProjectId } from "@/projects/types";

const STORAGE_PREFIX = "studio-recorded-cjm";

function storageKey(projectId: string, personaId: string): string {
  return `${STORAGE_PREFIX}:${projectId}:${personaId}`;
}

function healPersistedJourney(
  journey: JourneyDefinition,
  projectId: ProjectId | string
): JourneyDefinition {
  return healRecordedJourneyNav(journey, projectId);
}

export function readPersistedRecordedJourneys(
  projectId: ProjectId | string,
  personaId: PersonaId | string
): JourneyDefinition[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(projectId, personaId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { journeys?: JourneyDefinition[] };
    if (!Array.isArray(parsed.journeys)) return [];
    return parsed.journeys
      .filter(
        (j) => j && typeof j.id === "string" && typeof j.label === "string"
      )
      .map((journey) => healPersistedJourney(journey, projectId));
  } catch {
    return [];
  }
}

export function persistRecordedJourneys(
  projectId: ProjectId | string,
  personaId: PersonaId | string,
  journeys: readonly JourneyDefinition[]
): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(
      storageKey(projectId, personaId),
      JSON.stringify({
        version: 1,
        savedAt: new Date().toISOString(),
        journeys,
      })
    );
  } catch {
    /* ignore quota */
  }
}

/** Merge one recorded journey into durable localStorage for project+persona. */
export function persistRecordedJourneyFile(file: JourneyFile): void {
  const projectId = file.projectId;
  const personaId = file.personaId;
  if (!projectId || !personaId) return;
  const journey = healPersistedJourney(file.journey, projectId);
  const existing = readPersistedRecordedJourneys(projectId, personaId);
  const others = existing.filter((j) => j.id !== journey.id);
  persistRecordedJourneys(projectId, personaId, [...others, journey]);
}

/** Hydrate runtime catalog from localStorage (call on studio boot / persona change). */
export function hydrateRecordedJourneysFromStorage(
  projectId: ProjectId | string,
  personaId: PersonaId | string
): number {
  const journeys = readPersistedRecordedJourneys(projectId, personaId);
  // Rewrite storage when heal stamps correct protoTabs (legacy all-1 journeys).
  persistRecordedJourneys(projectId, personaId, journeys);
  for (const journey of journeys) {
    applyImportedJourneyFile({
      version: 1,
      exportedAt: new Date().toISOString(),
      projectId: projectId as ProjectId,
      personaId: personaId as PersonaId,
      journey,
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
 * Built-in Agentic/Traditional slots are never removed.
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
