import type { PersonaDefinition } from "@/projects/types";

/**
 * Sourced from newco_rick-mcgown_patient-self-initiated_24-jul-2026.json
 * (X-Suite persona export). Name/role only — the export's richer fields
 * (about, JTBD, thinking/seeing/hearing/doing, pains/gains, happy-path)
 * have no home in `PersonaDefinition` yet; not modeled here.
 *
 * No CJMs by design (PO, 2026-07-24) — an empty `journeys` list is the
 * existing global "no CJMs yet" state, which already surfaces the
 * standard Create CJM affordance in the nav (StudioNavJourneyMenu).
 */
export const RICK_MCGOWN_PERSONA: PersonaDefinition = {
  id: "rick-mcgown",
  label: "Rick McGown",
  shortLabel: "Rick M.",
  journeys: [],
};
