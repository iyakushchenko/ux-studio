/**
 * Heal / resolve recorded CJM beat → protoTab from screen ids.
 * REC snapshots used to stamp beat.protoTab (stale) instead of the live nav tab;
 * compile then produced all-protoTab-1 journeys where Step Forward looked dead.
 */

import type { JourneyBeat, JourneyDefinition } from "@/app/orchestra/types";
import { PROJECT_SCREENS as BOOTS_SCREENS } from "@/projects/boots-pharmacy/screens/screens";

type ScreenRow = { screenId: string };

/** Project screen catalogs used for REC→CJM protoTab heal (data-only imports). */
const SCREENS_BY_PROJECT: Record<string, ReadonlyArray<ScreenRow>> = {
  "boots-pharmacy": BOOTS_SCREENS,
};

/** `chat-2` → `chat`; `book-step-2` stays. */
export function normalizeRecordedScreenKey(raw: string): string {
  const cleaned = raw.trim().toLowerCase();
  // Duplicate screen revisits: chat-2, chat-3 (not book-step-2).
  const revisit = cleaned.match(/^(.*)-(\d+)$/);
  if (revisit && Number(revisit[2]) >= 2 && !revisit[1].includes("step")) {
    return revisit[1];
  }
  return cleaned;
}

export function listProjectScreenIds(
  projectId: string | undefined
): ReadonlyArray<ScreenRow> {
  if (!projectId) return [];
  return SCREENS_BY_PROJECT[projectId] ?? [];
}

/** Display tab (1…N) for a project screen id, or undefined if unknown. */
export function screenIdToProtoTab(
  projectId: string | undefined,
  screenId: string | undefined
): number | undefined {
  if (!projectId || !screenId) return undefined;
  const key = normalizeRecordedScreenKey(screenId);
  const screens = listProjectScreenIds(projectId);
  const idx = screens.findIndex((screen) => screen.screenId === key);
  return idx >= 0 ? idx + 1 : undefined;
}

/**
 * When beat id/label matches a known screen, stamp the correct protoTab.
 * Does not invent director scripts — nav-only heal so SF can change screens.
 */
export function healRecordedJourneyNav(
  journey: JourneyDefinition,
  projectId?: string
): JourneyDefinition {
  if (!projectId || journey.beats.length === 0) return journey;

  let changed = false;
  const beats: JourneyBeat[] = journey.beats.map((beat) => {
    const fromId = screenIdToProtoTab(projectId, beat.id);
    const fromLabel = screenIdToProtoTab(projectId, beat.label);
    const protoTab = fromId ?? fromLabel;
    if (protoTab == null || beat.protoTab === protoTab) return beat;
    changed = true;
    return { ...beat, protoTab };
  });

  return changed ? { ...journey, beats } : journey;
}
