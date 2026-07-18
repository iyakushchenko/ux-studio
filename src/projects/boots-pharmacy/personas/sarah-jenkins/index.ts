import type { ProtoPersonaDefinition } from "@/projects/types";
import {
  AGENTIC_CJM_JOURNEY,
  TRADITIONAL_CJM_JOURNEY,
  shouldSkipTraditionalLoginBeat,
} from "@/projects/boots-pharmacy/personas/sarah-jenkins/journeys";

export const SARAH_JENKINS_PERSONA: ProtoPersonaDefinition = {
  id: "sarah-jenkins",
  label: "Sarah Jenkins",
  journeys: [AGENTIC_CJM_JOURNEY, TRADITIONAL_CJM_JOURNEY],
  journeyHooks: {
    shouldSkipBeat: (beat, { headerLoggedIn }) =>
      shouldSkipTraditionalLoginBeat(beat, headerLoggedIn),
  },
};
