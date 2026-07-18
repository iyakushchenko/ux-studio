import type { JourneyBeat, ProtoJourneyDefinition, ProtoOrchestraModeId } from "@/app/orchestra/types";

export function getJourneyForMode(
  journeys: ProtoJourneyDefinition[],
  modeId: ProtoOrchestraModeId
): ProtoJourneyDefinition | undefined {
  return journeys.find((journey) => journey.id === modeId);
}

export function stepBeatIndex(
  index: number,
  beats: JourneyBeat[],
  shouldSkip: (beat: JourneyBeat | undefined) => boolean,
  direction: 1 | -1
): number {
  let next = index + direction;
  while (next >= 0 && next < beats.length && shouldSkip(beats[next])) {
    next += direction;
  }
  return next;
}

export function lastPlayableBeatIndex(
  beats: JourneyBeat[],
  shouldSkip: (beat: JourneyBeat | undefined) => boolean
): number {
  for (let i = beats.length - 1; i >= 0; i--) {
    if (!shouldSkip(beats[i])) return i;
  }
  return 0;
}

export function firstPlayableBeatIndex(
  beats: JourneyBeat[],
  shouldSkip: (beat: JourneyBeat | undefined) => boolean
): number {
  for (let i = 0; i < beats.length; i++) {
    if (!shouldSkip(beats[i])) return i;
  }
  return 0;
}

/** First beat + index after applying persona skip hooks (journey restart / mode pick). */
export function resolveJourneyStartBeat(
  journey: ProtoJourneyDefinition | undefined,
  shouldSkip: (beat: JourneyBeat | undefined) => boolean
): { beatIndex: number; beat: JourneyBeat | undefined } {
  const beats = journey?.beats ?? [];
  const beatIndex = firstPlayableBeatIndex(beats, shouldSkip);
  return { beatIndex, beat: beats[beatIndex] };
}
