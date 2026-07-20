import type { JourneyDefinition } from "@/app/orchestra/types";
import type { JourneyBundleFile, JourneyFile } from "@/app/journey/journeyFile";

let importedJourneys: JourneyDefinition[] = [];
let snapshotVersion = 0;
const listeners = new Set<() => void>();

function notify(): void {
  snapshotVersion += 1;
  listeners.forEach((listener) => listener());
}

export function subscribeImportedJourneys(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getImportedJourneysSnapshot(): number {
  return snapshotVersion;
}

export function getImportedJourneys(): readonly JourneyDefinition[] {
  return importedJourneys;
}

/** Merge imported journeys over persona defaults (same id replaces, new ids append). */
export function resolveRuntimeJourneys(
  baseJourneys: readonly JourneyDefinition[]
): JourneyDefinition[] {
  if (importedJourneys.length === 0) {
    return [...baseJourneys];
  }
  const imports = new Map(importedJourneys.map((journey) => [journey.id, journey]));
  const seen = new Set<string>();
  const merged = baseJourneys.map((journey) => {
    seen.add(journey.id);
    return imports.get(journey.id) ?? journey;
  });
  for (const journey of importedJourneys) {
    if (!seen.has(journey.id)) {
      merged.push(journey);
    }
  }
  return merged;
}

export function applyImportedJourneyFile(file: JourneyFile): JourneyDefinition[] {
  const others = importedJourneys.filter(
    (journey) => journey.id !== file.journey.id
  );
  importedJourneys = [...others, file.journey];
  notify();
  return importedJourneys;
}

export function applyImportedJourneyBundle(
  bundle: JourneyBundleFile
): JourneyDefinition[] {
  importedJourneys = [...bundle.journeys];
  notify();
  return importedJourneys;
}

export function clearImportedJourneys(): void {
  if (importedJourneys.length === 0) return;
  importedJourneys = [];
  notify();
}

/** Remove one imported / recorded journey from the runtime catalog. */
export function removeImportedJourney(journeyId: string): boolean {
  const next = importedJourneys.filter((journey) => journey.id !== journeyId);
  if (next.length === importedJourneys.length) return false;
  importedJourneys = next;
  notify();
  return true;
}

export function resetImportedJourneysForTests(): void {
  importedJourneys = [];
  snapshotVersion = 0;
  listeners.clear();
}
