import type { ProjectPlayback } from "@/projects/types";
import { scriptFail, scriptOk } from "@/projects/playbackScriptResult";

/** No-op playback — NewCo is a static dry-run replica, no CJM scripts. */
export const NEWCO_PLAYBACK: ProjectPlayback = {
  abortAll: () => {},
  runBeatAction: () => {},
  runHomeScript: async () => scriptOk(),
  runAvailScript: async () => scriptFail("newco: availability scripts not implemented"),
  runBookScript: async () => scriptFail("newco: book scripts not implemented"),
  runTabScript: async () => scriptFail("newco: tab scripts not implemented"),
};
