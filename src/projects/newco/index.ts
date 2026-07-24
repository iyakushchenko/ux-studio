import type { ProjectDefinition } from "@/projects/types";
import { formatProjectId } from "@/projects/formatProjectId";
import { RICK_MCGOWN_PERSONA } from "@/projects/newco/personas/rick-mcgown";
import { NEWCO_PLAYBACK } from "@/projects/newco/playback";
import { NewCoProjectView } from "@/projects/newco/wire/NewCoProjectView";

export const NEWCO_PROJECT: ProjectDefinition = {
  id: formatProjectId("newco"),
  brand: "newco",
  label: "NewCo",
  content: {
    PROJECT_SCREENS: [{ label: "Home", childIndex: 1, screenId: "home" }],
    HUB_LABEL: "Hub",
    SCENARIO_SCREENS: [],
    studioTabToIndex: (tab: number) => Math.max(0, Math.min(0, tab - 1)),
  },
  personas: [RICK_MCGOWN_PERSONA],
  defaultPersonaId: RICK_MCGOWN_PERSONA.id,
  playback: NEWCO_PLAYBACK,
  wireComponent: NewCoProjectView,
};

export * as newcoContent from "@/projects/newco/content";
