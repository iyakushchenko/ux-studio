import type { JourneyDefinition } from "@/app/orchestra/types";
import type { RecordingSession } from "@/app/recording/recordingTypes";
import recAgentic from "@/projects/boots-pharmacy/personas/sarah-jenkins/cjm/recorded/rec-agentic-mru4b15c-jnhv.journey.json";
import recTradBrowseGuest from "@/projects/boots-pharmacy/personas/sarah-jenkins/cjm/recorded/rec-trad-mruuwtqo-l27x.journey.json";
import recTradPdpGuest from "@/projects/boots-pharmacy/personas/sarah-jenkins/cjm/recorded/rec-trad-mruuynro-z5zh.journey.json";
import recTradPharmacyGuest from "@/projects/boots-pharmacy/personas/sarah-jenkins/cjm/recorded/rec-trad-mruv143o-0s2s.journey.json";
import recTradScheduleGuest from "@/projects/boots-pharmacy/personas/sarah-jenkins/cjm/recorded/rec-trad-mruv3902-qm13.journey.json";
import recTradReserveGuest from "@/projects/boots-pharmacy/personas/sarah-jenkins/cjm/recorded/rec-trad-mruv5uu0-7r3u.journey.json";
import recTradBrowseGuestRepeat from "@/projects/boots-pharmacy/personas/sarah-jenkins/cjm/recorded/rec-trad-mruv7ic8-u3rn.journey.json";
import recTradPdpSignedIn from "@/projects/boots-pharmacy/personas/sarah-jenkins/cjm/recorded/rec-trad-mruv8prq-zqri.journey.json";
import recTradPharmacySignedIn from "@/projects/boots-pharmacy/personas/sarah-jenkins/cjm/recorded/rec-trad-mruval6f-43ky.journey.json";
import recTradScheduleSignedIn from "@/projects/boots-pharmacy/personas/sarah-jenkins/cjm/recorded/rec-trad-mruvcsxm-u3nn.journey.json";
import recTradReserveSignedIn from "@/projects/boots-pharmacy/personas/sarah-jenkins/cjm/recorded/rec-trad-mruvf81h-7bh0.journey.json";
export {
  AGENTIC_CJM_JOURNEY,
  TRADITIONAL_CJM_JOURNEY,
  TRADITIONAL_LOGIN_BEAT_ID,
  TRADITIONAL_LOCATION_BEAT_ID,
  shouldSkipTraditionalAccountBeat,
  shouldSkipTraditionalLoginBeat,
} from "@/projects/boots-pharmacy/personas/sarah-jenkins/cjm/builtInJourneys";
import {
  AGENTIC_CJM_JOURNEY,
  TRADITIONAL_CJM_JOURNEY,
} from "@/projects/boots-pharmacy/personas/sarah-jenkins/cjm/builtInJourneys";

type DeployedJourneyFile = {
  journey: JourneyDefinition;
  recording?: RecordingSession;
};

const RECORDED_CJM_FILES = [
  recAgentic,
  recTradBrowseGuest,
  recTradPdpGuest,
  recTradPharmacyGuest,
  recTradScheduleGuest,
  recTradReserveGuest,
  recTradBrowseGuestRepeat,
  recTradPdpSignedIn,
  recTradPharmacySignedIn,
  recTradScheduleSignedIn,
  recTradReserveSignedIn,
] as unknown as DeployedJourneyFile[];

/** Authoritative deployed catalog for Boots Pharmacy / Sarah Jenkins. */
export const SARAH_JENKINS_CJMS: JourneyDefinition[] = [
  AGENTIC_CJM_JOURNEY,
  TRADITIONAL_CJM_JOURNEY,
  ...RECORDED_CJM_FILES.map((file) => file.journey),
];

/** Raw evidence travels with promoted CJMs; clean deployments need no localStorage. */
export const SARAH_JENKINS_CJM_RECORDINGS: Readonly<Record<string, RecordingSession>> =
  Object.fromEntries(
    RECORDED_CJM_FILES.flatMap((file) =>
      file.recording ? [[file.journey.id, file.recording] as const] : []
    )
  );

/** Every file-backed CJM is immutable in the browser; REC drafts remain local. */
export const SARAH_JENKINS_DEPLOYED_CJM_IDS = new Set(
  SARAH_JENKINS_CJMS.map((journey) => journey.id)
);
