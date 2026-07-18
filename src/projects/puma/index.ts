import type { ProtoProjectDefinition } from "@/projects/types";
import { formatProjectId } from "@/projects/formatProjectId";
import { EXAMPLE_SHOPPER_PERSONA } from "@/projects/puma/personas/example-shopper";
import { PUMA_PLAYBACK } from "@/projects/puma/playback";

export const PUMA_PROJECT: ProtoProjectDefinition = {
  id: formatProjectId("puma"),
  brand: "puma",
  label: "Puma",
  personas: [EXAMPLE_SHOPPER_PERSONA],
  defaultPersonaId: EXAMPLE_SHOPPER_PERSONA.id,
  playback: PUMA_PLAYBACK,
};

export * as pumaContent from "@/projects/puma/content";
