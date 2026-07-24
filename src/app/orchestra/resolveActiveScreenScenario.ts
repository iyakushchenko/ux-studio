import {
  getProtoScenarioById,
  getProtoScenarioForChildIndex,
  type ScenarioScreenConfig,
} from "@/app/scenario/scenarioEngine";
import { getJourneyForMode } from "@/app/orchestra/journeyUtils";
import type { OrchestraModeId, JourneyDefinition } from "@/app/orchestra/types";

export function resolveActiveScreenScenario(options: {
  hubOpen: boolean;
  modeId: OrchestraModeId;
  beatIndex: number;
  currentTabIndex: number;
  /** Screen childIndex from PROJECT_SCREENS — enables browse-mode chat disclosure. */
  currentChildIndex?: number | null;
  /** CJM off — stepped scenarios reveal full content on the active screen. */
  browseMode?: boolean;
  journeys: JourneyDefinition[];
  scenarioScreens: readonly ScenarioScreenConfig[];
  studioTabToIndex: (tab: number) => number;
}): ScenarioScreenConfig | undefined {
  const {
    hubOpen,
    modeId,
    beatIndex,
    currentTabIndex,
    currentChildIndex,
    browseMode,
    journeys,
    scenarioScreens,
    studioTabToIndex,
  } = options;

  if (hubOpen) return undefined;

  const journey = getJourneyForMode(journeys, modeId);
  const beat = journey?.beats[beatIndex];
  if (beat?.kind === "screen-frames" && beat.scenarioId) {
    if (
      beat.protoTab == null ||
      currentTabIndex === studioTabToIndex(beat.protoTab)
    ) {
      const resolved = getProtoScenarioById(scenarioScreens, beat.scenarioId);
      if (resolved) return resolved;
    }
  }

  // Avail overlay beats open ON chat — keep site-pilot-chat scenario alive so
  // the thread is not torn down (active→false → visibleCount 0 / bridge wipe).
  if (
    beat?.kind === "overlay" &&
    Boolean(beat.availScript) &&
    currentChildIndex != null
  ) {
    const underlay = getProtoScenarioForChildIndex(
      scenarioScreens,
      currentChildIndex
    );
    if (underlay?.id === "site-pilot-chat") return underlay;
  }

  if (browseMode && currentChildIndex != null) {
    return getProtoScenarioForChildIndex(scenarioScreens, currentChildIndex);
  }

  return undefined;
}

export function orchestraShowControls(options: {
  hubOpen: boolean;
  modeId: OrchestraModeId;
  journeys: JourneyDefinition[];
}): boolean {
  const { hubOpen } = options;

  // Previously required the *current* journey to already have beats, which
  // hid the persona selector and StudioNavJourneyMenu entirely for any
  // persona with zero CJMs — even though StudioNavJourneyMenu already has
  // its own "no CJMs yet, Create CJM" empty state built in. That state can
  // never render if this gate hides the whole controls block first. Nav
  // controls now show whenever a project has pages open (not hub),
  // regardless of whether the current persona has any journeys yet —
  // global shell behavior, not per-project (PO, 2026-07-24).
  return !hubOpen;
}
