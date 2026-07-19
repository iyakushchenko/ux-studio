import type { ProtoJourneyDefinition } from "@/app/orchestra/types";
import type { ProtoJourneyBundleFile, ProtoJourneyFile } from "@/app/journey/protoJourneyFile";

let importedJourneys: ProtoJourneyDefinition[] = [];
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

export function getImportedJourneys(): readonly ProtoJourneyDefinition[] {
  return importedJourneys;
}

/** Merge imported journeys over persona defaults (same id replaces, new ids append). */
export function resolveRuntimeJourneys(
  baseJourneys: readonly ProtoJourneyDefinition[]
): ProtoJourneyDefinition[] {
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

export function applyImportedJourneyFile(file: ProtoJourneyFile): ProtoJourneyDefinition[] {
  const others = importedJourneys.filter(
    (journey) => journey.id !== file.journey.id
  );
  importedJourneys = [...others, file.journey];
  notify();
  return importedJourneys;
}

export function applyImportedJourneyBundle(
  bundle: ProtoJourneyBundleFile
): ProtoJourneyDefinition[] {
  importedJourneys = [...bundle.journeys];
  notify();
  return importedJourneys;
}

export function clearImportedJourneys(): void {
  if (importedJourneys.length === 0) return;
  importedJourneys = [];
  notify();
}

export function resetImportedJourneysForTests(): void {
  importedJourneys = [];
  snapshotVersion = 0;
  listeners.clear();
}
