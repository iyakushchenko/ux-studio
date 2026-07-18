import type { ProtoProjectPlayback } from "@/projects/types";

/** No-op playback — Puma journeys not implemented yet. */
export const PUMA_PLAYBACK: ProtoProjectPlayback = {
  abortAll: () => {},
  runBeatAction: () => {},
  runHomeScript: async () => {},
  runAvailScript: async () => false,
  runBookScript: async () => false,
  runTabScript: async () => false,
};
