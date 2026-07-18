import type { ProtoProjectPlayback } from "@/projects/types";
import { scriptFail, scriptOk } from "@/projects/playbackScriptResult";

/** No-op playback — Puma journeys not implemented yet. */
export const PUMA_PLAYBACK: ProtoProjectPlayback = {
  abortAll: () => {},
  runBeatAction: () => {},
  runHomeScript: async () => scriptOk(),
  runAvailScript: async () => scriptFail("puma: availability scripts not implemented"),
  runBookScript: async () => scriptFail("puma: book scripts not implemented"),
  runTabScript: async () => scriptFail("puma: tab scripts not implemented"),
};
